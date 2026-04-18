// Shared polyfills (also loaded via `node --require` from Android Gradle — see scripts/metro-polyfill.cjs)
require('./scripts/metro-polyfill.cjs');

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
