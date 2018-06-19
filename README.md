# react-app-rewire-build-dev



Source code files used by `webpack-dev-server` is rendered in watch mode at user specified directory through override create-react-app webpack configs without ejecting.


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
