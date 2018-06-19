const WriteFilePlugin = require( "./write-file");
const path = require('path');

module.exports = function reactAppRewireBuildDev(config, env, options = {}) {
  options.outputPath = path.join(process.cwd(), options.outputPath || '/');
  config.plugins = (config.plugins || []).concat([
    new WriteFilePlugin(options)
  ]);
  return config;
}


