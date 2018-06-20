const fs = require("fs");
const { createHash } = require("crypto");
const path = require("path");
const _ = require("lodash");
const mkdirp = require("mkdirp");
const chalk = require("chalk");
const filesize = require("filesize");
const moment = require("moment");
const debug = require("simple-node-logger").createSimpleLogger();

function removeFile(filePath) {
  setTimeout(() => {
    if (filePath.indexOf("hot-update") !== -1) {
      fs.unlink(filePath, err => {
        if (err) throw err;
      });
    }
  }, 200);
}

/**
 * When 'webpack' program is used, constructor name is equal to 'NodeOutputFileSystem'.
 * When 'webpack-dev-server' program is used, constructor name is equal to 'MemoryFileSystem'.
 */
const isMemoryFileSystem = outputFileSystem => {
  return outputFileSystem.constructor.name === "MemoryFileSystem";
};

module.exports = function WriteFileWebpackPlugin(userOptions = {}) {
  const options = _.assign(
    {},
    {
      exitOnErrors: true,
      force: false,
      log: false,
      test: null,
      useHashIndex: true,
      outputPath: "/",
      hotReloadPort : "3000"
    },
    userOptions
  );

  if (!_.isBoolean(options.exitOnErrors)) {
    throw new TypeError("options.exitOnErrors value must be of boolean type.");
  }

  if (!_.isBoolean(options.force)) {
    throw new TypeError("options.force value must be of boolean type.");
  }

  if (!_.isBoolean(options.log)) {
    throw new TypeError("options.log value must be of boolean type.");
  }

  if (
    !_.isNull(options.test) &&
    !(_.isRegExp(options.test) || _.isFunction(options.test))
  ) {
    throw new TypeError(
      "options.test value must be an instance of RegExp or Function."
    );
  }

  if (!_.isBoolean(options.useHashIndex)) {
    throw new TypeError("options.useHashIndex value must be of boolean type.");
  }

  const log = (...append) => {
    if (!options.log) {
      return;
    }

    debug.info(
      chalk.dim(
        "[" + moment().format("HH:mm:ss") + "] [write-file-webpack-plugin]"
      ),
      ...append
    );
  };

  const assetSourceHashIndex = {};

  log("options", options);

  const apply = compiler => {
    let outputPath;
    let setupDone;
    let setupStatus;

    const setup = () => {
      if (setupDone) {
        return setupStatus;
      }

      setupDone = true;

      log(
        'compiler.outputFileSystem is "' +
          chalk.cyan(compiler.outputFileSystem.constructor.name) +
          '".'
      );

      if (!isMemoryFileSystem(compiler.outputFileSystem) && !options.force) {
        return false;
      }

      outputPath = options.outputPath;
      if (!outputPath) {
        throw new Error("outputPath is not defined. Define outputPath.");
      }

      log('outputPath is "' + chalk.cyan(outputPath) + '".');

      setupStatus = true;

      return setupStatus;
    };

    // eslint-disable-next-line promise/prefer-await-to-callbacks
    const handleAfterEmit = (compilation, callback) => {
      if (!setup()) {
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        callback();

        return;
      }

      if (options.exitOnErrors && compilation.errors.length) {
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        callback();

        return;
      }

      log(
        'compilation.errors.length is "' +
          chalk.cyan(compilation.errors.length) +
          '".'
      );

      _.forEach(compilation.assets, (asset, assetPath) => {
        const outputFilePath = path.isAbsolute(assetPath)
          ? assetPath
          : path.join(outputPath, assetPath);
        const relativeOutputPath = path.relative(process.cwd(), outputFilePath);
        const targetDefinition =
          "asset: " +
          chalk.cyan("./" + assetPath) +
          "; destination: " +
          chalk.cyan("./" + relativeOutputPath);

        const test = options.test;

        if (test) {
          const skip = _.isRegExp(test)
            ? !test.test(assetPath)
            : !test(assetPath);

          if (skip) {
            log(
              targetDefinition,
              chalk.yellow("[skipped; does not match test]")
            );

            return;
          }
        }

        removeFile(outputFilePath);

        const assetSize = asset.size();
        let assetSource = Array.isArray(asset.source())
          ? asset.source().join("\n")
          : asset.source();

        if (options.useHashIndex) {
          const assetSourceHash = createHash("sha256")
            .update(assetSource)
            .digest("hex");

          if (
            assetSourceHashIndex[relativeOutputPath] &&
            assetSourceHashIndex[relativeOutputPath] === assetSourceHash
          ) {
            log(
              targetDefinition,
              chalk.yellow("[skipped; matched hash index]")
            );

            return;
          }

          assetSourceHashIndex[relativeOutputPath] = assetSourceHash;
        }

        mkdirp.sync(path.dirname(relativeOutputPath));

        try {
          if (options.basename && outputFilePath.indexOf("index.html") !== -1) {
            assetSource = assetSource
              .replace(/href="/g, `href="${options.basename}`)
              .replace(/href='/g, `href='${options.basename}`)
              .replace(/src="/g, `src="${options.basename}`)
              .replace(/src='/g, `src='${options.basename}`);
          }

          if (outputFilePath.indexOf("bundle.js") !== -1) {
            assetSource = assetSource.replace(/window.location.port/g, options.hotReloadPort );
          }

          fs.writeFileSync(relativeOutputPath.split("?")[0], assetSource);
          log(
            targetDefinition,
            chalk.green("[written]"),
            chalk.magenta("(" + filesize(assetSize) + ")")
          );
        } catch (error) {
          log(
            targetDefinition,
            chalk.bold.red("[is not written]"),
            chalk.magenta("(" + filesize(assetSize) + ")")
          );
          log(chalk.bold.bgRed("Exception:"), chalk.bold.red(error.message));
        }
      });
      // eslint-disable-next-line promise/prefer-await-to-callbacks
      callback();
    };

    /**
     * webpack 4+ comes with a new plugin system.
     *
     * Check for hooks in-order to support old plugin system
     */
    if (compiler.hooks) {
      compiler.hooks.afterEmit.tapAsync(
        "write-file-webpack-plugin",
        handleAfterEmit
      );
    } else {
      compiler.plugin("after-emit", handleAfterEmit);
    }
  };

  return {
    apply
  };
};
