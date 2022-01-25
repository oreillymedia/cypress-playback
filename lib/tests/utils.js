function resetModule(moduleName) {
  if (typeof moduleName === 'string') {
    return delete require.cache[moduleName];
  } else if (moduleName instanceof RegExp) {
    const key = Object.keys(require.cache).find(key => key.match(moduleName));
    return delete require.cache[key];
  }
  throw new Error('Unsupported moduleName type');
}

module.exports = {
  resetModule
};