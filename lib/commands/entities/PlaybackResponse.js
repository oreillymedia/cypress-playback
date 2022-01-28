const { getInterceptedResponseId: getInterceptedResponseId } = require('../functions/getInterceptedResponseId');
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
   * @type {string}
   */
  #id = null;
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
  #hits = 0;

  get id() { return this.#id; }
  get statusCode() { return this.#statusCode; }
  get statusMessage() { return this.#statusMessage; }
  get body() { return this.#body; }
  get headers() { return this.#headers; }
  get hits() { return this.#hits; }

  /**
   * @param {number} statusCode
   * @param {string} statusMessage
   * @param {any} body
   * @param {{[key: string]: string}} headers
   * @param {CypressInterceptedRequest} interceptedRequest
   * @param {InterceptedResponseAttributes[]} ignoredAttributes
   */
  constructor(...args) {
    switch (args.length) {
      case 1: {
        this.deserialize(args[0]);
        break;
      }
      case 6: {
        const [statusCode, statusMessage, body, headers, interceptedRequest, ignoredAttributes] = args;
        this.#statusCode = statusCode;
        this.#statusMessage = statusMessage;
        this.#body = body;
        this.#headers = headers;
        if (body) {
          this.#bodyType = getResponseBodyType(body);
        }
        if (interceptedRequest) {
          this.#id = getInterceptedResponseId(interceptedRequest, ignoredAttributes);
        }
        break;
      }
      default: {
        throw new RangeError(`Invalid number of arguments: ${args.length}`);
      }
    }
  }

  addHit() {
    this.#hits += 1;
  }

  serialize() {
    return {
      id: this.#id,
      statusCode: this.#statusCode,
      statusMessage: this.#statusMessage,
      body: serializeResponseBody(this.#body, this.#bodyType),
      bodyType: this.#bodyType,
      headers: this.#headers,
    };
  }

  deserialize({
    id,
    statusCode,
    statusMessage,
    body,
    bodyType,
    headers
  }) {
    this.#id = id;
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
