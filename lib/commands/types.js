/**
 * @typedef {'GET'|'POST'|'PUT'|'OPTIONS'|'PATCH'|'DELETE'|'HEAD'} RequestMethod
 *
 * @typedef {Object} CypressRouteMatcher
 *
 * @typedef {string|RegExp|CypressRouteMatcher} CypressRouteMatcher
 *
 * @typedef {['protocol' | 'hostname' | 'port' | 'pathname' | 'search' | 'method' | 'body']} InterceptedResponseAttributes
 *
 * @typedef {Object} CypressInterceptedRequest
 * @property {string} url
 * @property {RequestMethod} method
 * @property {string | {} | any} body
 * @property {{ [key:string]: string }} headers
 * @property {{ [key:string]: string }} query
 *
 * @typedef {Object} CypressInterceptedResponse
 * @property {string} statusCode
 * @property {string} statusMessage
 * @property {{ [key:string]: string }} headers
 * @property {string | {} | ArrayBuffer} body
 *
 * @typedef {Object} RequestMatcherOptions
 * @property {number} minTimes
 * @property {Object} recording
 * @property {InterceptedResponseAttributes} recording.matchingIgnores
 * @property {string} recording.rewriteOrigin
 * @property {string} recording.allowAllStatusCodes
 *
 * @typedef {Object} SerializedPlaybackResponse
 *
 * @typedef {Object} SerializedPlaybackRequest
 * @property {SerializedPlaybackResponse[]} responses
 *
 * @typedef {Object} SerializedPlaybackData
 * @property {number} version
 * @property {SerializedPlaybackRequest[]} matchers
 */
