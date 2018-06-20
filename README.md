# react-app-rewire-build-dev



Source code files used by `webpack-dev-server` is rendered in watch mode at user specified directory without ejecting create-react-app.


# Why do I need this?

As of now (21/06/2018), `create-react-app` (more precisely `react-scripts`) does not allow development builds to be written to the disk because it uses `webpackDevServer` to serve your build files and folders ([for good reasons](https://github.com/facebook/create-react-app/issues/1070#issuecomment-261812303)). The problem is that in some cases you need to have these files written to the disk i.e:

* Developing browser extensions using React.
* Incorporating your React application into an existing application.
* Serving your React app with a dedicated backend.



## Installation

```sh
yarn add --dev react-app-rewire-build-dev
```

or

```sh
npm install --save-dev  react-app-rewire-build-dev
```


## Usage
In the `config-overrides.js` (refer : [react-app-rewired](https://github.com/timarney/react-app-rewired)) you created for `react-app-rewire-build-dev` add this code:

```
const reactAppRewireBuildDev = require('react-app-rewire-build-dev');

/* config-overrides.js */

const options = {
  outputPath : "<location of watch directory i.e. '../server/build' >",  /***** required *****/
  basename : "<location of subdirectory>" // deploy react-app in a subdirectory /***** optional *****/
}

module.exports = function override(config, env) {
  return reactAppRewireBuildDev(config, env, options);
}
```

## Inspirations
[write-file-webpack-plugin](https://github.com/gajus/write-file-webpack-plugin) by @gajus
