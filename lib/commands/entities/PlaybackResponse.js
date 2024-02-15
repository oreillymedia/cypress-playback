const { arrayBufferToBase64, base64ToArrayBuffer } = require('../functions/arrayBufferFns');

const jsonStringableTypes = ['string', 'number', 'boolean'];

function getResponseBodyType(body) {
  const bodyType = typeof body;
  if (bodyType === 'object') {
    if (
      Number.isFinite(body?.byteLength)
    ) {
      return 'ArrayBuffer';
    }
    return 'json';
  } else if (jsonStringableTypes.includes(bodyType)) {
    return bodyType;
  }
  /* c8 ignore next*/
  throw new Error(`Unsupported body type: ${bodyType}`);
}

function serializeResponseBody(body, bodyType) {
  if (bodyType === null) {
    return undefined;
  }
  if (bodyType === 'ArrayBuffer') {
    return arrayBufferToBase64(new Uint8Array(body));
  } else if (bodyType === 'json') {
    return JSON.stringify(body);
  } else if (jsonStringableTypes.includes(bodyType)) {
    return body;
  }
  /* c8 ignore next*/
  throw new Error(`Cannot serialize unknown body type: ${bodyType}`);
}

function deserializeResponseBody(body, bodyType) {
  if (bodyType === null) {
    return undefined;
  }
  if (bodyType === 'ArrayBuffer') {
    return base64ToArrayBuffer(body);
  } else if (bodyType === 'json') {
    return JSON.parse(body);
  } else if (jsonStringableTypes.includes(bodyType)) {
    return body;
  }
  /* c8 ignore next*/
  throw new Error(`Cannot deserialize unknown body type: ${bodyType}`);
}

class PlaybackResponse {
  /**
   * @type {number}
   */
  #statusCode = 0;
  /**
   * @type {string}
   */
  #statusMessage = null;
  /**
   * @type {any}
   */
  #body = null;
  /**
   * @type {string}
   */
  #bodyType = null;
  /**
   * @type {{[key: string]: string}}
   */
  #headers = null;
  /**
   * @type {number}
   */

  get statusCode() { return this.#statusCode; }

  get statusMessage() { return this.#statusMessage; }

  get body() { return this.#body; }

  get headers() { return this.#headers; }
  /* c8 ignore next */
  set headers(value) { this.#headers = value; }

  /**
   * @param {number} statusCode
   * @param {string} statusMessage
   * @param {any} body
   * @param {{[key: string]: string}} headers
   */
  constructor(...args) {
    switch (args.length) {
      case 1: {
        this.deserialize(args[0]);
        break;
      }
      case 4: {
        const [statusCode, statusMessage, body, headers] = args;
        this.#statusCode = statusCode;
        this.#statusMessage = statusMessage;
        this.#body = body;
        this.#headers = headers;
        if (body) {
          this.#bodyType = getResponseBodyType(body);
        }
        break;
      }
      default: {
        throw new RangeError(`Invalid number of arguments: ${args.length}`);
      }
    }
  }

  serialize() {
    return {
      statusCode: this.#statusCode,
      statusMessage: this.#statusMessage,
      body: serializeResponseBody(this.#body, this.#bodyType),
      bodyType: this.#bodyType,
      headers: this.#headers,
    };
  }

  deserialize({
    statusCode,
    statusMessage,
    body,
    bodyType,
    headers
  }) {
    this.#statusCode = statusCode;
    this.#statusMessage = statusMessage;
    this.#body = deserializeResponseBody(body, bodyType);
    this.#bodyType = bodyType;
    this.#headers = headers;
  }
}

module.exports = {
  PlaybackResponse
};
