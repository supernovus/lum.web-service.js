/**
 * Utility functions
 * @module @lumjs/web-service/utils
 */
"use strict";

const core = require('@lumjs/core');
const {S,isObj} = core.types;

const {STANDARD_HTTP,TEMPLATE_HTTP} = require('./defs');

const DOCTYPE_HTML = /^<!DOCTYPE html/i;

/**
 * Try to determine MIME-type based on the type of data.
 * 
 * Automatically handles:
 * 
 * - `string`:
 *   - JSON object or array documents.
 *   - HTML documents with a valid `<!DOCTYPE...>` declaration.
 *   - Common XML documents.
 *   - Any unrecognized `string` uses `text/plain`.
 * 
 * - `object`:
 *   - `URLSearchParams`
 *   - `FormData`
 *   - `Blob`
 *   - `ReadableStream`
 *   - `ArrayBuffer`
 *   - `DataView`
 *   - `TypedArray`
 *   - `XMLDocument`
 *   - `Document`
 *   - `Element`
 *   - Any other `object` if `opts.jsonObjects` is `true`.
 * 
 * @alias module:@lumjs/web-service/utils.getMimeType
 * 
 * @param {(string|object)} data - Data to determine type of.
 * @param {boolean} [jsonObjects=true] Use `MIME.JSON` for other objects.
 * 
 * @returns {string} Guessed MIME-type.
 * 
 * @throws {TypeError} An invalid `data` value was passed.
 * 
 * This will be thrown if the `data` is anything other than a
 * `string` or an `object`, or if `opts.jsonObjects` is `false`
 * and an unhandled object is passed.
 * 
 */
function getMimeType(data, jsonObjects=true)
{
  if (typeof data === S)
  {
    const str = data.trim();

    if ( (str.startsWith('{') && str.endsWith('}'))
      || (str.startsWith('[') && str.endsWith(']')))
    {
      return MIME.JSON;
    }

    if (str.startsWith('<') && str.endsWith('>'))
    {
      return DOCTYPE_HTML.test(str) ? MIME.HTML : MIME.XML;
    }

    return MIME.TEXT;
  }

  const err = msg => 
  {
    console.error("getTypeFor", {data});
    throw new TypeError(msg);
  }

  if (!isObj(data))
  {
    err("Invalid data type");
  }

  if (data instanceof URLSearchParams)
  {
    return MIME.URL;
  }

  if (data instanceof FormData)
  {
    return MIME.FORM;
  }

  if ( data instanceof Blob 
    || data instanceof ReadableStream
    || ArrayBuffer.isView(data) )
  {
    return MIME.BIN;
  }

  if (data instanceof XMLDocument)
  {
    return MIME.XML;
  }

  if (data instanceof Document)
  {
    return MIME.HTML;
  }

  if (data instanceof Element)
  {
    return (data.ownerDocument instanceof XMLDocument ? MIME.XML : MIME.HTML);
  }

  if (jsonObjects)
  {
    return MIME.JSON;
  }
  else
  {
    err("Unsupported data object");
  }
}

exports.getMimeType = getMimeType;

/**
 * Build a set of rules for a custom HTTP Method.
 * 
 * Both arguments are optional, and you can swap their
 * positions in the argument list.
 * 
 * You probably don't need to use this function manually.
 * Use the `Builder` class which has a simple `http()` method.
 * 
 * @alias module:@lumjs/web-service/utils.defineHTTP
 * 
 * @param {string} [template] Standard HTTP method to use as a template.
 * 
 * If you omit this, then the defaults will be:
 * 
 * ```js
 * {
 *   requestBody:  null,
 *   responseBody: null,
 *   safe:         false,
 *   idempotent:   false,
 *   cacheable:    false,
 * }
 * ```
 * 
 * @param {object} [rules] `HttpRules` properties overriding the template.
 * 
 * You only need to specify the properties you want to override.
 * If you are using the exact same rules as the template, you can omit this.
 * 
 * @returns {module:@lumjs/web-service/defs.HttpRules}
 */
function defineHTTP(template, rules)
{
  if (isObj(template))
  { // Specified the rules first.
    const tmpRules = template;
    template = rules;
    rules = tmpRules;
  }

  const sources = [TEMPLATE_HTTP];

  if (typeof template === S)
  { // Specified a specific template.
    if (isObj(STANDARD_HTTP[template]))
    { // Use the standard HTTP method as a template.
      sources[0] = STANDARD_HTTP[template];
    }
    else
    { // Not a standard HTTP method.
      console.error("Unsupported standard HTTP method", {template, rules});
    }
  }

  if (isObj(rules))
  { // Specific rules that override anything in the template.
    sources.push(rules);
  }

  return Object.assign({}, ...sources);
}

exports.defineHTTP = defineHTTP;
