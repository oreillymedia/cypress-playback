const md5 = require('blueimp-md5');

const { getMatcherAsString } = require('./getMatcherAsString');

/**
 * NOTE: Any changes to the values that are used to generate the id must be
 * accompanied by bumping the SERIALIZE_VERSION, as ids in existing playback
 * data will no longer match.
 * @param {RequestMethod} method
 * @param {any} matcher
 * @param {RequestMatcherOptions} options
 * @returns {string}
 */
function getRequestMatcherId(method, matcher, options) {
  const id = md5([
    method,
    getMatcherAsString(matcher),
    JSON.stringify(options)
  ].join('::'));
  return id;
}

module.exports = {
  getRequestMatcherId
};
