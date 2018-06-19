const  reactAppRewireBuildDev = require('../src');

/* config-overrides.js */
module.exports = function override(config, env) {
  return reactAppRewireBuildDev(config, env, { outputPath : '../server/build', basename :'' , log : false });
}