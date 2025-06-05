const path = require('path');
const webpack = require('webpack');

/**
 * Modify CRA webpack config to polyfill Node core modules for WalletConnect & Torus crypto.
 */
module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    vm: require.resolve('vm-browserify')
  };
  config.resolve.alias = {
    ...config.resolve.alias,
    '@xverse/connect': path.resolve(__dirname, 'src/emptyXverseConnect.js')
  };
  return config;
};