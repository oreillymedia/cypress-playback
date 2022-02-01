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
   * A stringified version of the request matcher value.
   * @type {string}
   */
  #matcher = null;
  /**
   * The minimum number of times the request must be called.
   * @type {number}
   */
  #atLeast = 1;
  /**
   * What elements of a network request are ignored for response matching.
   * @type {InterceptedResponseAttributes[] | ResponseMatchingIgnores}
   */
  #ignores = [];
  /**
   * @type {Map<string, PlaybackResponse>}
   */
  #responses = new Map();
  /**
   * When true, any response matching is ignored if only a single response is
   * recorded for this request matcher.
   * @type {boolean}
   */
  #anyOnce = false;

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
  get anyOnce() { return this.#anyOnce; }
  get toBeCalledAtLeast() { return this.#atLeast; }
  /**
   * Which attributes of an intercepted response should be ignored when
   * generating an id for the response.
   */
  get ignores() { return this.#ignores; }

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
        this.#atLeast = options.toBeCalledAtLeast ?? 1;
        this.#anyOnce = options.matching?.anyOnce ?? false;
        /* c8 ignore next*/
        this.#ignores = options.matching?.ignores ?? [];

        if (this.#anyOnce) {
          if (this.#atLeast > 1) {
            throw new RangeError('"toBeCalledAtLeast" must be 1 if "matching.anyOnce" is true');
          }
          // Object.keys works on both a simple object and an array.
          if (Object.keys(this.#ignores).length) {
            console.warn('"matching.ignores" is unnecessary when "matching.anyOnce" is true');
          }
        }

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
      this.#ignores
    );
    if (this.#responses.has(response.id)) {
      response = this.#responses.get(response.id);
    } else {
      this.#responses.set(response.id, response);
    }
    response.addHit();
    if (response.hits > 1 && this.#anyOnce) {
      throw new Error('Request matcher has "matching.anyOnce" set on it, but has recorded more than one response.');
    }
  }

  getResponse(responseId) {
    let response = this.#responses.get(responseId);
    if (!response && this.#anyOnce && this.#responses.size === 1) {
      // Get the 1st and only response in the map.
      response = this.#responses.values().next().value;
    }
    if (response) {
      response.addHit();
    }
    return response;
  }

  getAllResponses() {
    return Array.from(this.#responses.values());
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
    return hits < this.#atLeast;
  }

  serialize() {
    return {
      id: this.#id,
      method: this.#method,
      matcher: this.#matcher,
      atLeast: this.#atLeast,
      anyOnce: this.#anyOnce,
      ignores: this.#ignores,
      responses: Array.from(this.#responses.values())
        .filter(response => response.hits > 0)
        .map(response => response.serialize())
    };
  }

  deserialize(data) {
    this.#id = data.id;
    this.#method = data.method;
    this.#matcher = data.matcher;
    this.#atLeast = data.atLeast;
    this.#anyOnce = data.anyOnce;
    this.#ignores = data.ignores;
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
