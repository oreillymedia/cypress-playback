function getMatcherAsString(matcher) {
  if (typeof matcher === 'string') {
    return matcher;
  } else if (matcher instanceof RegExp) {
    return matcher.toString();
  } else if (typeof matcher === 'object') {
    return JSON.stringify(matcher);
  }
  throw new Error(`Unsupported matcher type: ${typeof matcher}`);
}

module.exports = {
  getMatcherAsString
};