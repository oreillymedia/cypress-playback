function getPropertyPathSegment(key) {
  // Use bracket notation if there is any whitespace in the key.
  const bracketNotation = !/^\w+$/.test(key);
  return {
    bracketNotation,
    segment: bracketNotation ? `[${JSON.stringify(key)}]` : key
  };
}

/**
 * Returns the stringified version of the body with any ignored properties
 * removed.
 * @param {string|{}} body
 * @param {string[]} removedProperties
 * @returns {string}
 */
function stringifyBody(body, removedProperties) {
  if (typeof body === 'string') {
    return body;
  }

  const toRemove = new Set(removedProperties);
  const objectPaths = new Map();

  return JSON.stringify(
    body,
    function (key, value) {
      if (!key) {
        // No key = the root object.
        return value;
      }

      const { bracketNotation, segment } = getPropertyPathSegment(key);
      const basePath = objectPaths.get(this) ?? '';
      const path = basePath
        + (basePath && !bracketNotation ? '.' : '')
        + segment;

      if (toRemove.has(path)) {
        return undefined;
      }

      if (typeof value === 'object') {
        objectPaths.set(value, path);
      }

      return value;
    }
  );
}

module.exports = {
  stringifyBody
};
