const md5 = require('blueimp-md5');

const { stringifyBody } = require('./stringifyBody');

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
 * @param {CypressInterceptedRequest} request
 * @param {InterceptedResponseAttributes[] | ResponseMatchingIgnores } ignores
 * @returns {string}
 */
function getInterceptedResponseId(request, ignores) {
  if (typeof ignores !== 'object') {
    throw new Error(`Ignores must be an object. Got: ${typeof ignores}`);
  }
  let ignoredAttributes,
    ignoredBodyProperties,
    ignoredSearchParams;

  if (Array.isArray(ignores)) {
    ignoredAttributes = ignores;
    ignoredBodyProperties = [];
    ignoredSearchParams = [];
  } else {
    ignoredAttributes = ignores.attributes || [];
    ignoredBodyProperties = ignores.bodyProperties || [];
    ignoredSearchParams = ignores.searchParams || [];
  }

  const url = new URL(request.url);
  // Create an array of the request elements that should be included when
  // generating the id.
  //
  // NOTE: Removing any values from from the `requestElements` array or changing
  // the format of the value in the array must be accompanied by bumping the
  // SERIALIZE_VERSION, as ids in existing playback data will no longer match.
  // Add new features or values does not require a version bump.
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
          if (url[attribute]) {
            acc.push(url[attribute]);
          }
          break;
        case 'search': {
          for (const param of ignoredSearchParams) {
            url.searchParams.delete(param);
          }
          const search = url.searchParams.toString();
          if (search){
            acc.push(`?${url.searchParams.toString()}`);
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
          acc.push(stringifyBody(bodyAsString, ignoredBodyProperties));
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
