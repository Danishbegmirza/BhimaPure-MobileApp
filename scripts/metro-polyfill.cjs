/**
 * Preloaded via `node --require` from android/app/build.gradle so it runs before
 * `@react-native/metro-config` (RN CLI calls getDefaultConfig() before metro.config.js).
 *
 * Metro / RN 0.84 expect modern JS APIs that older Node (e.g. system `node` on PATH) may lack.
 * For full compatibility use Node >= 20 (see package.json engines).
 */
const os = require('os');
if (typeof os.availableParallelism !== 'function') {
  os.availableParallelism = () => os.cpus().length;
}
if (typeof Array.prototype.toReversed !== 'function') {
  Array.prototype.toReversed = function toReversed() {
    return [...this].reverse();
  };
}

if (typeof String.prototype.replaceAll !== 'function') {
  String.prototype.replaceAll = function replaceAll(search, replacement) {
    const str = String(this);
    const rep = String(replacement);
    if (typeof search === 'string') {
      if (search === '') return str;
      return str.split(search).join(rep);
    }
    if (search instanceof RegExp) {
      if (!search.global) {
        throw new TypeError('String.prototype.replaceAll called with a non-global RegExp');
      }
      return str.replace(search, rep);
    }
    throw new TypeError('Invalid search value for replaceAll');
  };
}
