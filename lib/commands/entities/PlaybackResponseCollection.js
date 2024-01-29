const { getInterceptedResponseId } = require('../functions/getInterceptedResponseId');
const { PlaybackResponse } = require('./PlaybackResponse');

class PlaybackResponseCollection {
  /**
   * @type {string}
   */
  #id = null;
  /**
   * @type {number}
   */
  #hits = 0;
  /**
   * @type {Array<PlaybackResponse>}
   */
  #responses = [];

  #url = '';

  get id() { return this.#id; }

  get hits() { return this.#hits; }

  get responses() { return this.#responses; }

  /**
   * @param {CypressInterceptedRequest} interceptedRequest
   * @param {ResponseMatchingIgnores} ignores
   */
  constructor(...args) {
    switch (args.length) {
      case 1: {
        this.deserialize(args[0]);
        break;
      }
      case 2: {
        const [interceptedRequest, ignores] = args;
        if (interceptedRequest) {
          this.#id = getInterceptedResponseId(interceptedRequest, ignores);
          this.#url = interceptedRequest.url;
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

  /**
   * @param {number} statusCode
   * @param {string} statusMessage
   * @param {any} body
   * @param {{[key: string]: string}} headers
   */
  addResponse(statusCode, statusMessage, body, headers) {
    this.#responses.push(new PlaybackResponse(statusCode, statusMessage, body, headers));
  }

  /**
   * @returns {PlaybackResponse}
   */
  getNextResponse() {
    if (this.#hits > this.#responses.length - 1) {
      throw new Error(`No more recorded responses found for request with URL: ${this.#url}. Hits ${this.#hits}`);
    }

    const response = this.#responses[this.#hits];

    this.addHit();

    return response;
  }

  serialize() {
    return {
      id: this.#id,
      url: this.#url,
      responses: this.#responses.map((response) => response.serialize()),
    };
  }

  deserialize({
    id,
    url,
    responses
  }) {
    this.#id = id;
    this.#url = url;
    responses.forEach((responseData) => {
      const response = new PlaybackResponse(responseData);
      this.#responses.push(response);
    });
  }
}

module.exports = {
  PlaybackResponseCollection
};
