const { getRequestMatcherId } = require('../functions/getRequestMatcherId');
const { getMatcherAsString } = require('../functions/getMatcherAsString');
const { PlaybackResponse } = require('./PlaybackResponse');

class PlaybackRequestMatcher {
  /**
   * @type {string}
   */
  #id = null;
  /**
   * @type {string}
   */
  #method = null;
  /**
   * @type {string}
   */
  #matcher = null;
  /**
   * @type {number}
   */
  #minTimes = 1;
  /**
   * @type {InterceptedResponseAttributes[]}
   */
  #ignoredAttributes = [];
  /**
   * @type {Map<string, PlaybackResponse>}
   */
  #responses = new Map();

  /**
   * The number of requests that were intercepted by this matcher but which have
   * not yet resolved.
   * @type {number}
   */
  #inflight = 0;

  /**
   * If the PlaybackRequest was deserialized (i.e. - restored from disk) it will
   * be considered stale until its matcher matches an outbound request. Stale
   * requests are filtered out when the PlaybackRequestMap is serialized.
   * Requests that are not deserialized are not considered stale.
   * @type {boolean}
   */
  stale = false;

  get id() { return this.#id; }
  get method() { return this.#method; }
  get matcher() { return this.#matcher; }
  get minTimes() { return this.#minTimes; }
  /**
   * Which attributes of an intercepted response should be ignored when
   * generating an id for the response.
   */
  get ignoredAttributes() { return this.#ignoredAttributes; }

  constructor(
    ...args
  ) {
    switch (args.length) {
      case 1: {
        this.deserialize(args[0]);
        break;
      }
      case 2:
      case 3: {
        const [method, matcher, options = {}] = args;
        if (typeof method !== 'string' || !matcher) {
          throw new Error('Invalid arguments');
        }
        this.#id = getRequestMatcherId(method, matcher, options);
        this.#method = method;
        this.#matcher = getMatcherAsString(matcher);
        this.#minTimes = options.minTimes ?? 1;
        /* c8 ignore next*/
        this.#ignoredAttributes = options.recording?.matchingIgnores ?? [];
        break;
      }
      default: {
        throw new RangeError(`Unsupported number of arguments: ${args.length}`);
      }
    }
  }

  notifyRequestStarted() {
    this.#inflight++;
    this.stale = false;
  }

  notifyRequestCompleted() {
    if (this.#inflight <= 0) {
      throw new Error('No requests inflight.');
    }
    this.#inflight--;
  }

  addResponse(
    statusCode,
    statusMessage,
    body,
    headers,
    interceptedRequest
  ) {
    let response = new PlaybackResponse(
      statusCode,
      statusMessage,
      body,
      headers,
      interceptedRequest,
      this.#ignoredAttributes
    );
    if (this.#responses.has(response.id)) {
      response = this.#responses.get(response.id);
    } else {
      this.#responses.set(response.id, response);
    }
    response.addHit();
  }

  getResponse(responseId) {
    const response = this.#responses.get(responseId);
    if (response) {
      response.addHit();
    }
    return response;
  }

  isPending() {
    let hits = 0;
    if (this.stale) {
      return false;
    }
    if (this.#inflight > 0) {
      return true;
    }
    for (const response of this.#responses.values()) {
      hits += response.hits;
    }
    return hits < this.#minTimes;
  }

  serialize() {
    return {
      id: this.#id,
      method: this.#method,
      matcher: this.#matcher,
      minTimes: this.#minTimes,
      ignoredAttributes: this.#ignoredAttributes,
      responses: Array.from(this.#responses.values())
        .filter(response => response.hits > 0)
        .map(response => response.serialize())
    };
  }

  deserialize(data) {
    this.#id = data.id;
    this.#method = data.method;
    this.#matcher = data.matcher;
    this.#minTimes = data.minTimes;
    this.#ignoredAttributes = data.ignoredAttributes;
    // Assume that a request being deserialized is stale.
    this.stale = true;
    data.responses.forEach(entry => {
      const response = new PlaybackResponse(entry);
      this.#responses.set(response.id, response);
    });
  }
}

module.exports = {
  PlaybackRequestMatcher
};
