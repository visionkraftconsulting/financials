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
    vm: require.resolve('vm-browserify'),
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser.js')
  };
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  ]);
  config.resolve.alias = {
    ...config.resolve.alias,
    '@xverse/connect': path.resolve(__dirname, 'src/emptyXverseConnect.js'),
    'process/browser': require.resolve('process/browser.js')
  };
  return config;
};