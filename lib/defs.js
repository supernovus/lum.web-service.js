/**
 * Default definitions
 * @module @lumjs/web-service/defs
 */
"use strict";

const Placeholder = require('./placeholder');

/**
 * Default URL Placeholder styles.
 * @alias module:@lumjs/web-service/defs.PLACEHOLDERS
 * @prop {module:@lumjs/web-service/placeholder} COLONS - /path/:placeholder/
 * @prop {module:@lumjs/web-service/placeholder} BRACES - /path/{placeholder}/
 */
const PLACEHOLDERS =
{
  COLONS: new Placeholder(/\:([\w-]+)/g),
  BRACES: new Placeholder(/\{([\w-]+)\}/g),
}

/**
 * HTTP Method Definition Rules
 * @typedef {object} module:@lumjs/web-service/defs.HttpRules
 * 
 * @prop {?boolean} requestBody - Method supports a request body?
 * 
 * `true`  when a request body is mandatory.
 * `false` when a request body is forbidden.
 * `null`  when a request body is optional.
 * 
 * @prop {?boolean} responseBody - Method has a response body?
 * 
 * `true`  when a response body is mandatory.
 * `false` when a response body is forbidden.
 * `null`  when a response body is optional.
 * 
 * @prop {boolean} safe       - Method does not alter state on server.
 * @prop {boolean} idempotent - Identical requests have identical results.
 * @prop {boolean} cacheable  - Responses from this method may be cached?
 * 
 */

/**
 * A set of standard HTTP method definitions.
 * 
 * Does not include `CONNECT` or `TRACE` as I don't think
 * they are useful for web services using the Fetch API.
 * 
 * @alias module:@lumjs/web-service/defs.STANDARD_HTTP
 * 
 * @prop {module:@lumjs/web-service/defs.HttpRules} GET
 * @prop {module:@lumjs/web-service/defs.HttpRules} HEAD
 * @prop {module:@lumjs/web-service/defs.HttpRules} POST
 * @prop {module:@lumjs/web-service/defs.HttpRules} PUT
 * @prop {module:@lumjs/web-service/defs.HttpRules} PATCH
 * @prop {module:@lumjs/web-service/defs.HttpRules} DELETE
 * @prop {module:@lumjs/web-service/defs.HttpRules} OPTIONS
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods}
 */
const STANDARD_HTTP =
{
  GET:
  {
    requestBody:  false,
    responseBody: true,
    safe:         true,
    idempotent:   true,
    cacheable:    true,
  },
  HEAD:
  {
    requestBody:  false,
    responseBody: false,
    safe:         true,
    idempotent:   true,
    cacheable:    true,
  },
  POST:
  {
    requestBody:  true,
    responseBody: true,
    safe:         false,
    idempotent:   false,
    cacheable:    false,
  },
  PUT:
  {
    requestBody:  true,
    responseBody: null,
    safe:         false,
    idempotent:   true,
    cacheable:    false,
  },
  PATCH:
  {
    requestBody:  true,
    responseBody: null,
    safe:         false,
    idempotent:   false,
    cacheable:    false,
  },
  DELETE:
  {
    requestBody:  null,
    responseBody: null,
    safe:         false,
    idempotent:   true,
    cacheable:    false,
  },
  OPTIONS:
  {
    requestBody:  null,
    responseBody: null,
    safe:         true,
    idempotent:   true,
    cacheable:    false,
  },
}

// A default template for utils.defineHTTP()
const TEMPLATE_HTTP =
{
  requestBody:  null,
  responseBody: null,
  safe:         false,
  idempotent:   false,
  cacheable:    false,
}

/**
 * Common MIME-type values for `Content-Type` and `Accepts` headers.
 * 
 * @alias module:@lumjs/web-service/defs.MIME
 * 
 * @prop {string} FORM  - A Multipart `FormData` object.
 * @prop {string} JSON  - JSON data.
 * @prop {string} XML   - XML document (or element).
 * @prop {string} HTML  - HTML document (or element).
 * @prop {string} XHTML - XHTML document (no auto-detection).
 * @prop {string} TEXT  - Plain text; or any unsupported text format.
 * @prop {string} BIN   - Generic (or unsupported) binary data.
 * @prop {string} URL   - A Query String `URLSearchParams` object.
 * 
 */
const MIME =
{
  FORM: 'multipart/form-data',
  JSON: 'application/json',
  XML:  'application/xml',
  HTML: 'text/html',
  XHTML:'application/xhtml+xml',
  TEXT: 'text/plain',
  BIN:  'application/octet-stream',
  URL:  'application/x-www-form-urlencoded',
}

// A default global container for auto-generated ids.
const AUTO_IDS      = {};
const AUTO_ID_STRIP = /WS$/;

module.exports =
{
  PLACEHOLDERS, STANDARD_HTTP, TEMPLATE_HTTP, MIME, 
  AUTO_IDS, AUTO_ID_STRIP,
}
