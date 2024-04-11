"use strict";

const core = require('@lumjs/core');
const {B,S,isObj,isNil,notNil} = core.types;

const webcore = require('@lumjs/web-core');
const parser = webcore.parser;

const {STANDARD_HTTP,PLACEHOLDERS,MIME} = require('./defs');
const {getMimeType} = require('./utils');
const Placeholder = require('./placeholder');

const CT = 'Content-Type';
const AT = 'Accept';
const PATH_SEP = /\/+/g;

function notObservable()
{
  console.log("MethodCall is not observable", {instance: this, arguments});
}

function aHead(headers)
{
  return Array.from(headers.entries());
}

/**
 * A class representing an individual web-service API method call.
 * 
 * Is basically a wrapper around the Fetch API and other related
 * web standards (FormData, URL, URLSearchParams, etc.)
 * 
 * Each method in a top-level `webservice` instance will have
 * a corresponding `methodcall` instance powering it.
 * 
 * Generally not constructed manually, but by using a `builder`.
 * 
 * @implements {module:@lumjs/web-service.observable}
 * @exports module:@lumjs/web-service/methodcall
 * 
 * @prop {string} name - Unique name of API method call.
 * @prop {string} http - HTTP Method type for Request.
 * @prop {string} path - The URL path for the API method.
 * @prop {object} options - Options specific to this API method call.
 * 
 * Generally any options not specified explicitly in a method call
 * will fall back on defaults set in the parent Webservice instance.
 * 
 * @prop {?module:@lumjs/web-service/webservice} ws - Parent Webservice.
 * Will be `null` until the `setWS()` method is called.
 * 
 */
class WebserviceMethodCall
{
  /**
   * Build an API method call handler object.
   * 
   * You should probably use a Builder rather than constructing
   * instances manually, but hey your mile may vary.
   * 
   * @param {string} name  - Sets `name` property.
   * @param {*} urlPath    - Sets `path` property.
   * @param {*} httpMethod - Sets `http` property.
   *   Will be forced to uppercase automatically.
   * @param {*} options    - Sets `options` property.
   * 
   */
  constructor (name, urlPath, httpMethod='GET', options={})
  {
    this.name = name;
    this.http = httpMethod.toUpperCase();
    this.path = urlPath;
    this.options = options;
    this.ws = null;

    // This will be overwritten by the makeObservable() call.
    this.trigger = notObservable;
  }

  /**
   * Set the parent `Webservice` instance.
   * 
   * Will automatically call `this.makeObservable(true)` after setting
   * the `ws` property.
   * 
   * @protected
   * @param {module:@lumjs/web-service/webservice} ws - Parent instance.
   * @returns {object} `this`
   */
  setWS(ws)
  {
    if (!(ws instanceof Webservice))
    {
      throw new TypeError("Invalid Webservice instance");
    }
    this.ws = ws;
    return this.makeObservable(true);
  }

  makeObservable(redo=false)
  {
    const obsOpts = this.getNestedOptions('observable');
    core.observable(this, obsOpts, redo);
    return this;
  }

  /**
   * Get a singular option.
   * 
   * - First looks in `this.options`.
   * - Then looks in `this.ws._options`.
   * - If neither are found falls back on `defVal` argument.
   * 
   * @param {string} name - Option name/key to get.
   * @param {*} [defVal] Default fallback value.
   * 
   * @returns {mixed} The option value.
   */
  getOption(name, defVal)
  {
    if (this.options[name] !== undefined)
    {
      return this.options[name];
    }
    else if (this.ws && this.ws._options[name] !== undefined)
    {
      return this.ws._options[name];
    }
    return defVal;
  }

  /**
   * Get an object representing nested options.
   * 
   * @param {string} name - Nested options name/key to get.
   * 
   * @param {object} [opts] Extra option sources.
   * @param {object} [opts.defaults] Default options to fall back on.
   * @param {object} [opts.override] Options that override all else.
   * 
   * @returns {object} A new object instance will be created.
   * 
   * It will compose the following sources in order,
   * where latter sources will override earlier ones.
   * 
   * - `opts.defaults`
   * - `this.ws._options[name]`
   * - `this.options[name]`
   * - `opts.override`
   * 
   */
  getNestedOptions(name, opts={})
  {
    const sources = [opts.defaults];

    if (this.ws && isObj(this.ws._options[name]))
    {
      sources.push(this.ws._options[name]);
    }

    if (isObj(this.options[name]))
    {
      sources.push(this.options[name]);
    }

    if (isObj(opts.override))
    {
      sources.push(opts.override);
    }

    return Object.assign({}, ...sources);
  }

  /**
   * Build `Headers` for the `Request`.
   * 
   * Uses {@link module:@lumjs/web-service/methodcall#getNestedOptions}
   * to look up the `headers` nested options, and composes in some
   * additional headers by default.
   * 
   * @param {?object} [localHeaders] Headers that override all others.
   * 
   * If this is already a `Headers` instance, it will be returned directly
   * with no further modifications.
   * 
   * Any other `object` will be used as `opts.override` for the the 
   * `headers` nested options.
   * 
   * The default `Content-Type` and `Accept` headers may be specified
   * via the `contentType` and `acceptType` options respectively, which
   * if found will be added via the `opts.defaults` when getting the 
   * `headers` nested options.
   * 
   * @returns {Headers}
   */
  buildHeaders(localHeaders)
  {
    if (localHeaders instanceof Headers)
    { // Already a headers instance.
      return localHeaders;
    }

    const defaults = {};
    const ctype = this.contentType;
    let   atype = this.acceptType;

    if (atype === true)
    { // true = use contentType
      atype = ctype;
    }

    if (typeof ctype === S && ctype.trim() !== '')
    {
      defaults[CT] = ctype;
    }

    if (typeof atype === S && atype.trim() !== '')
    {
      defaults[AT] = atype;
    }

    const compHeaders = this.getNestedOptions('headers',
    {
      defaults,
      override: localHeaders,
    });

    return new Headers(compHeaders);
  }

  get httpMethods()
  {
    if (this.ws)
    {
      return this.ws._httpMethods;
    }
    else
    {
      return STANDARD_HTTP;
    }
  }

  /**
   * Getter for the full (raw) URL method path.
   * 
   * Takes `this.path` and prepends `this.ws._options.basePath` to it.
   * Then normalizes slashes to ensure `/some//path` becomes `/some/path`.
   * 
   * This does **NOT** expand placeholder variables.
   * Use `parseURL()` for variable expansion.
   * 
   * @returns {string} 
   */
  get fullPath()
  {
    let fullPath = '';

    if (this.ws && this.ws._options.basePath)
    { // Start with the base path.
      fullPath = this.ws._options.basePath;
    }

    fullPath += '/' + this.path;

    return fullPath.replaceAll(PATH_SEP, '/'); // Normalize slashes.
  }

  /**
   * Get the request URL including the service base path (if set).
   * 
   * This expands placeholder variables using the passed `data`.
   * 
   * @param {*} data - Data
   * 
   * If this is an `object` it will be used as the source of parameters.
   * Anything else is ignored.
   * 
   * @param {boolean} [removeUsed=false] Remove used parameters from `data` ?
   * 
   * If `data` is an object and this is `true` then if a URL parameter is found
   * and used, any properties used as placeholder variables will be removed
   * from the object.
   * 
   * @returns {URL}
   * 
   * @throws {Error} If placeholders were found in the URL, but corresponding
   * properties were not found in the `data`.
   */
  parseURL(data, removeUsed=false)
  {
    const rawPath = this.fullPath;
    const placeholder = this.getPlaceholders(rawPath);

    //console.debug("parseURL", {rawPath, placeholder, data});

    if (!placeholder || !isObj(data))
    { // Nothing to process further.
      return new URL(rawPath, location.origin);
    }

    const missing = [];
    const parsedPath = rawPath.replaceAll(placeholder.pattern, function()
    {
      const param = arguments[placeholder.param];
      if (data[param] !== undefined)
      {
        const value = data[param];
        if (removeUsed) 
        {
          delete data[param];
        }
        return value;
      }
      else
      {
        missing.push(param);
        return '';
      }
    });

    if (missing.length > 0)
    {
      console.error({missing, data, rawPath});
      throw new Error("Missing URL parameters");
    }

    return new URL(parsedPath, location.origin);
  }

  /**
   * Getter for `contentType` option.
   * @returns {?string}
   */
  get contentType()
  {
    return this.getOption('contentType', null);
  }

  /**
   * Getter for `acceptType` option.
   * 
   * The option can be a `string` just like `contentType`.
   * It can also be a boolean, where the boolean value `true`
   * means use the same value as `contentType` (which includes
   * auto-detected values when building the Request.)
   * 
   * If it is `false` or `null`, no explicit `Accept` header will be set.
   * 
   * @returns {?(string|bool)}
   */
  get acceptType()
  {
    return this.getOption('acceptType', null);
  }

  /**
   * Get the placeholder rule.
   * 
   * First looks for an explicit `placeholders` option.
   * 
   * If no explicit rule was found, we'll try to determine one of the
   * default placeholder styles to use by testing the `path` with
   * each of the default rules, and seeing if matches are found.
   * The first rule found that matches will be used.
   * 
   * If no rules are set and auto-detection fails, this will return
   * `null` and no URL placeholder substitution will be supported at all.
   * 
   * @param {string} [path] A path to test.
   * 
   * Only used if no explicit `placeholders` rule was set.
   * If this is not specified, we'll use `this.fullPath`.
   * 
   * @returns {?module:@lumjs/web-service/placeholder}
   */
  getPlaceholders(path)
  {
    const placeholder = this.getOption('placeholders');
    if (placeholder instanceof Placeholder)
    { // Found an explicitly specified placeholder rule.
      return placeholder;
    }

    // Wasn't explicitly specified, so lets see if we can find it.

    if (typeof path !== S)
    { // Get the full path and use it.
      path = this.fullPath;
    }

    for (const pid in PLACEHOLDERS)
    {
      const placeholder = PLACEHOLDERS[pid];
      const matches = path.match(placeholder.pattern);
      if (Array.isArray(matches) && matches.length > 0)
      { // A match was found.
        return placeholder;
      }
    }

    // Nothing matched? No placeholders in use?
    return null;
  }

  /**
   * Nested options for serializing data to JSON.
   * 
   * @typedef {object} module:@lumjs/web-service/methodcall.ToJson
   * 
   * @prop {?function} replacer `replacer` argument.
   * Defaults to `null` if not found in any options.
   * 
   * @prop {?(string|number)} space `space` argument.
   * Defaults to `null` if not found in any options.
   */

  /**
   * Getter for `toJSON` nested options.
   * @returns {module:@lumjs/web-service/methodcall.ToJson}
   */
  get jsonStringifyOpts()
  {
    return this.getNestedOptions('toJSON',
    {
      defaults: {replacer: null, space: null},
    });
  }

  /**
   * Getter for `removePlaceholdersFromData` option.
   * 
   * This option is used by the `makeRequest()` method as
   * the `removeUsed` argument of the `parseURL()` method.
   * 
   * If the option is not explicitly set in either the
   * `Webservice` options or the `MethodCall` options, 
   * then it will default to `true`.
   * 
   * @returns {boolean}
   */
  get removePlaceholdersFromData()
  {
    return this.getOption('removePlaceholdersFromData', true);
  }

  /**
   * Getter for `autoDecodeJSON` option.
   * 
   * Determines if `send()` method will decode JSON response data
   * automatically or not.
   * 
   * If not explicitly set, defaults to `true`.
   * 
   * @returns {boolean}
   */
  get autoDecodeJSON()
  {
    return this.getOption('autoDecodeJSON', true);
  }

  /**
   * Getter for `autoDecodeXML` option.
   * 
   * Determines if `send()` method will decode XML response data
   * automatically or not.
   * 
   * If not explicitly set, defaults to `false`.
   * 
   * @returns {boolean}
   */
  get autoDecodeXML()
  {
    return this.getOption('autoDecodeXML', false);
  }

  /**
   * Getter for `autoDecodeHTML` option.
   * 
   * Determines if `send()` method will decode HTML response data
   * automatically or not.
   * 
   * If not explicitly set, defaults to `false`.
   * 
   * @returns {boolean}
   */
  get autoDecodeHTML()
  {
    return this.getOption('autoDecodeHTML', false);
  }

  /**
   * Getter for `autoDecodeXHTML` option.
   * 
   * Determines if `send()` method will decode XHTML response data
   * automatically or not. Depends on other options to determine
   * in what format the XHTML documents will be decoded.
   * 
   * - If `autoDecodeHTML` is `true` then XHTML will be decoded as HTML.
   * - Otherwise if `autoDecodeXML` is `true`, XHTML will be decoded as XML.
   * - If neither are true this will be ignored entirely.
   * 
   * If not explicitly set, defaults to `null`, which for the purposes of
   * the `send()` method is the same as setting this to the value of the
   * `autoDecodeHTML()` method.
   * 
   * @returns {?boolean}
   */
  get autoDecodeXHTML()
  {
    return this.getOption('autoDecodeXHTML', null);
  }

  get parseXMLOpts()
  {
    return this.getNestedOptions('parseXMLOpts');
  }

  get parseHTMLOpts()
  {
    return this.getNestedOptions('parseHTMLOpts');
  }

  /**
   * Set up body data and headers.
   * 
   * @param {?(string|object)} [data] Data for request body.
   * 
   * If this is a `string` it is always used _as-is_.
   * 
   * If this is an `object`, then depending on the `Content-Type`
   * (either explicitly set in the headers, or detected with `getMimeType()`)
   * the data may need to be serialized.
   * 
   * The following `Content-Type` formats will attempt to serialize objects:
   * 
   * - `MIME.JSON`  → Uses `JSON.stringify()`; for advanced options see:
   *   {@link module:@lumjs/web-service/methodcall#jsonStringifyOpts}
   * - `MIME.XML`   → Uses `XMLSerializer#serializeToString()`;
   * - `MIME.HTML`  → Uses `.outerHTML` property;
   *   Works with either `Element` or `Document` objects.
   * - `MIME.XHTML` → Same as `MIME.HTML`;
   * 
   * Any of those `Content-Type` serialization attempts will throw various
   * errors if the data is not valid.
   * 
   * With any other `Content-Type` values, the object will be used _as-is_,
   * so make sure it is something that the `fetch()` API supports
   * (such as `Blob`, `File`, `FormData`, etc.)
   * 
   * @param {?object} [headers] Headers for request.
   * 
   * If this is a `Headers` object it is used directly.
   * If it is a plain `Object` we pass it `buildHeaders()`
   * to build an actual `Headers` object.
   * 
   * Assuming there is no `Content-Type` header set and there
   * is valid `data` passed, this will use `getMimeType()` to
   * determine the `Content-Type` header to set.
   * 
   * @returns {object} A plain object with two properties.
   * 
   * - `data` contains the `data` _after_ any processing/serialization.
   * - `headers` containers the `headers` after any processing.
   * 
   */
  setupBody(data, headers)
  {
    headers = this.buildHeaders(headers);

    let contentType = headers.get(CT);

    if (!contentType && notNil(data))
    {
      const jsonObjects = this.getOption('jsonObjects', true);
      contentType = getMimeType(data, jsonObjects);

      if (typeof contentType === S && contentType.trim() !== '')
      {
        headers.set(CT, contentType);
      }
    }

    if (isObj(data))
    { // Some object data types must be serialized into strings first.
      if (contentType === MIME.JSON)
      {
        const jsonOpts = this.jsonStringifyOpts;
        data = JSON.stringify(data, jsonOpts.replacer, jsonOpts.space);
      }
      else if (contentType === MIME.XML)
      {
        const xmls = new XMLSerializer();
        data = xmls.serializeToString(data);
      }
      else if (contentType === MIME.HTML || contentType === MIME.XHTML)
      {
        if (data instanceof Document)
        {
          data = document.documentElement.outerHTML;
        }
        else if (data instanceof Element)
        {
          data = data.outerHTML;
        }
        else
        {
          throw new TypeError("Invalid HTML Document or Element");
        }
      }
    }

    return {data, headers};
  }

  /**
   * Build a `Request` object for our method call.
   * 
   * @param {object} [options] Options to build the request with.
   * 
   * @param {object} [options.vars] URL Placeholder variable values.
   * 
   * Will be passed as the `data` argument of the `parseURL()` method.
   * 
   * If this is not explictly set then the `options` object will be used,
   * and the `removeUsed` argument will be `true`.
   * 
   * @param {(string|object)} [options.body] Request Body data
   * 
   * This is used to attach a Request Body for most HTTP Methods.
   * It will be passed as the `data` argument to the the `setupBody()` 
   * method for further processing.
   * 
   * On any HTTP Method that _requires_ a request body, if this is not set
   * then the `options` argument itself will be used to build the body.
   * 
   * On any HTTP Method with an _optional_ request body, this must be set 
   * explicitly if you want to add a body to the request.
   * 
   * On any HTTP Method that _forbids_ a body, setting this is an error.
   * 
   * @param {object} [options.query] Query String data
   * 
   * This will be used to set a _query string_ (aka `SearchParams`) on the
   * request URL.
   * 
   * When passing an `object` each property name/key will represent the
   * query parameter you want to set. Then the property values supported are:
   * 
   * - `Array`       → set the same parameter multiple times.
   * - `null`        → delete the parameter if it was set.
   * - Anything else → use as a string value.
   * 
   * On any HTTP method that _requires_ a request body, this must be set
   * explicitly in the `options` to specify a query string.
   * 
   * On any other HTTP Method, if this is not set then the `options` argument
   * itself may be used to populate the query string.
   * 
   * @param {object} [options.headers] Headers for request.
   * 
   * This will be passed to `buildHeaders()` for further processing.
   * 
   * If there is a Request Body to be generated, this will be passed as the
   * `headers` argument of the `setupBody()` method.
   * 
   * @returns {Request}
   */
  makeRequest(options={})
  {
    const knownMeths = this.httpMethods;
    const methOpts = knownMeths[this.http];
    if (!isObj(methOpts))
    {
      console.error({arguments, methodCall: this, knownMeths});
      throw new Error("Unknown HTTP method: "+this.http);
    }

    const headers = this.buildHeaders(options.headers);
    const urlData = options.vars ?? options;
    const bodyData 
      = notNil(options.body)
      ? options.body 
      : (methOpts.requestBody ? options : null);
    const queryData 
      = isObj(options.query)
      ? options.query 
      : (methOpts.requestBody ? null : options);

    if (methOpts.requestBody === false && notNil(bodyData))
    {
      throw new RangeError("Request body forbidden for "+this.http);
    }

    const url = this.parseURL(urlData, (urlData === options));
    const reqOpts = this.getNestedOptions('request',
    {
      override:
      {
        method: this.http,
        headers,
      },
    });

    if (notNil(bodyData))
    { // Build a request body.
      reqOpts.body = this.setupBody(bodyData, headers).data;
    }

    if (isObj(queryData))
    {
      const query = url.searchParams;
      for (const key in queryData)
      {
        const val = queryData[key];
        if (Array.isArray(val))
        { // An Array specifies multiple headers.
          for (const subval of val)
          {
            query.append(key, subval);
          }
        }
        else if (val === null)
        { // A null value species to delete a header.
          query.delete(key);
        }
        else
        { // Anything else we set a single header.
          query.set(key, val);
        }
      }
    }

    console.debug("makeRequest", 
    {
      url, 
      reqOpts,
      methOpts,
      headers,
      urlData,
      bodyData,
      queryData,
    });

    return new Request(url, reqOpts);
  }

  /** 
   * Send a request using the Fetch API.
   * 
   * @param {object} [options] Options for `buildRequest()`.
   * 
   * Will be used to build the `Request` object passed to `fetch()`.
   * 
   * @returns {Promise} What this resolves to depends on a few factors.
   * 
   * The various `autoDecode*` options. If one of them was `true` and the
   * response has a matching `Content-Type` header, then this will resolve
   * to an object of the corresponding data type.
   * 
   * In any other case it will be the `Response` object from `fetch()`.
   * 
   * @fires module:@lumjs/web-service/methodcall#response
   * @fires module:@lumjs/web-service/methodcall#data
   * 
   */
  async send(options)
  {
    const request = this.makeRequest(options);

    const doJSON  = this.autoDecodeJSON,
          doXML   = this.autoDecodeXML,
          doHTML  = this.autoDecodeHTML;

    let doXHTML;
    if (doXML || doHTML)
    {
      doXHTML = this.autoDecodeXHTML;
      if (typeof doXHTML !== B)
      {
        doXHTML = doHTML;
      }
    }
    else
    {
      doXHTML = false;
    }

    return fetch(request).then((response) =>
    {
      this.trigger('response', response);

      const ctype = response.headers.get(CT);
      if (ctype !== null)
      { // See if we can do some auto-decoding.
        if (doJSON && ctype === MIME.JSON)
        {
          return response.json();
        }

        const parseXML = (xmlText) => 
        {
          const opts = this.parseXMLOpts;
          opts.type = ctype;
          return parser.parseXML(xmlText, opts);
        }
        
        const parseHTML = (htmlText) =>
          parser.parseHTML(htmlText, this.parseHTMLOpts);

        if (doXML && ctype === MIME.XML)
        {
          return response.text().then(parseXML);
        }

        if (doHTML && ctype === MIME.HTML)
        {
          return response.text().then(parseHTML);
        }

        if (doXHTML && ctype === MIME.XHTML)
        {
          if (doHTML)
          {
            return response.text().then(parseHTML);
          }
          else
          {
            return response.text().then(parseXML);
          }
        }

      }

      return response;
    }).then((data) =>
    {
      if (!(data instanceof Response))
      { // The response has been decoded to a different form.
        this.trigger('data', data);
      }

      return data;

    }); // fetch().then().then()

  } // send()

  /**
   * A `Response` from `send()` has been received.
   * 
   * @event module:@lumjs/web-service/methodcall#response
   * @type {Response}
   */

  /**
   * Data from a `Response` has been decoded into a native format.
   * 
   * This event will only be triggered if auto-decoding is enabled
   * for the `Content-Type` of the `Response` that was received.
   * 
   * @event module:@lumjs/web-service/methodcall#data
   * @type {object}
   * 
   * The exact type of object depends on the format that was decoded.
   * 
   * - JSON:  A plain `object` or an `Array`.
   * - HTML:  An `HTMLDocument`.
   * - XML:   An `XMLDocument`.
   * - XHTML: An `HTMLDocument` or `XMLDocument` depending on options.
   * 
   */

} // WebserviceMethodCall class

module.exports = WebserviceMethodCall;

// Recursive dependency is recursive.
const Webservice = require('./webservice');
