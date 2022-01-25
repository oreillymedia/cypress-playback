const md5 = require('blueimp-md5');

// Note that if the order of the attributes here is ever changed, that will
// cause any previously created ids to no longer match. Such a reorder should
// be considered a breaking change, as mentioned below.
/**
 * @type {InterceptedResponseAttributes[]}
 */
const defaultResponseAttributes = [
  'protocol',
  'hostname',
  'port',
  'pathname',
  'search',
  'method',
  'body'
];

/**
 * NOTE: Any changes to the values that are used to generate the id must be
 * accompanied by bumping the SERIALIZE_VERSION, as ids in existing playback
 * data will no longer match.
 * @param {CypressInterceptedRequest} request
 * @param {InterceptedResponseAttributes[]} ignoredAttributes
 * @returns {string}
 */
function getInterceptedResponseId(request, ignoredAttributes) {
  const url = new URL(request.url);
  // Create an array of the request elements that should be included when
  // generating the id.
  const requestElements = defaultResponseAttributes.reduce(
    (acc, attribute) => {
      if (ignoredAttributes.includes(attribute)) {
        return acc;
      }
      switch (attribute) {
        case 'protocol':
        case 'hostname':
        case 'port':
        case 'pathname':
        case 'search': {
          if (url[attribute]) {
            acc.push(url[attribute]);
          }
          break;
        }
        case 'method': {
          acc.push(request.method);
          break;
        }
        case 'body': {
          let bodyAsString = request?.body;
          if (bodyAsString == null) {
            throw new Error('Request body must be provided.');
          }

          if (typeof bodyAsString !== 'string') {
            // Form submissions are probably going to cause real problems here.
            bodyAsString = JSON.stringify(request.body);
          }
          acc.push(bodyAsString);
          break;
        }
      }
      return acc;
    },
    []
  );

  return md5(requestElements.join('::'));
}

module.exports = {
  getInterceptedResponseId,
};
