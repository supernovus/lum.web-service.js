"use strict";

const core = require('@lumjs/core');
const {isObj,def,B,F} = core.types;

const Webservice = require('./webservice');
const MethodCall = require('./methodcall');
const Placeholder = require('./placeholder');
const {defineHTTP} = require('./utils');
const DEFS = require('./defs');
const {STANDARD_HTTP} = DEFS;

function wrapHTTP(target, httpMeth)
{
  const methName = httpMeth.toLowerCase();
  if (target[methName] === undefined)
  { // Add a wrapper method.
    def(target, methName, function(name, path, options)
    {
      return this.add(name, path, httpMeth, options);
    });
  }
  else
  { 
    console.error("HTTP method already defined", {httpMeth, target});
  }
}

/**
 * A class to create Webservice instances using a Builder pattern.
 * 
 * As is the nature of the builder pattern, almost all of the public
 * instance methods in this class return the instance itself.
 * 
 * The one important exception being the `build()` method which is
 * always the last one to be called as it is what builds the actual
 * Webservice instance.
 * 
 * @exports module:@lumjs/web-service/builder
 */
class WebserviceBuilder 
{
  /**
   * Build a new Builder instance.
   * 
   * @param {object} [options] Options (mostly for the `Webservice`).
   * 
   * This object will be _directly modified_ by the Builder instance!
   * It must **NOT** be locked/frozen and should never be used by anything
   * other than this instance.
   * 
   * @param {boolean} [options.customWrappers=false] Default `options.wrap`
   * value for {@link module:@lumjs/web-service/builder#http http()} method.
   * 
   * One of the only options specific to the Builder instance, this will 
   * set an internal option, then be removed from the options used to create
   * the `Webservice` instance.
   * 
   */
  constructor(options={})
  {
    if (!isObj(options.httpMethods))
    { // Add a place to define new HTTP methods.
      options.httpMethods = {};
    }

    if (typeof options.customWrappers === B)
    {
      this._wrapCustom = options.customWrappers;
      delete options.customWrappers;
    }
    else
    {
      this._wrapCustom = false;
    }

    this._options = options;
    this._methods = [];
    this._wsClass = Webservice;
  }

  /**
   * Set a web service id.
   * 
   * @param {string} id - A simple identifier for the web service.
   * 
   * If you have multiple web services in an app, each one should have
   * a unique `id` value.
   * 
   * @returns {object} `this`
   */
  id(id)
  {
    this._options.id = id;
    return this;
  }

  /**
   * Use a custom `Webservice` class.
   * 
   * @param {function} wsClass - The class constructor.
   * 
   * **MUST** be a subclass of {@link module:@lumjs/web-service/webservice}
   * 
   * @returns {object} `this`
   * 
   * @throws {TypeError} If `wsClass` is not a `function` 
   * or if `Webservice` is not in its prototype chain.
   * 
   */
  useClass(wsClass)
  {
    if (typeof wsClass === F && Webservice.isPrototypeOf(wsClass))
    {
      this._wsClass = wsClass;
    }
    else
    {
      console.error({wsClass});
      throw new TypeError("Invalid Webservice sub-class");
    }
    return this;
  }

  /**
   * Set the URL variable placeholder rule.
   * 
   * @param {module:@lumjs/web-service/placeholder} placeholder - Rule to use.
   * 
   * You can use one of the constants in the `DEFS` to make this easier:
   * 
   * ```js
   * const wsb = require('@lumjs/web-service').make();
   * const DEF = wsb.DEFS; // A convenient shortcut to `defs` module.
   * builder.useVars(DEF.PLACEHOLDERS.BRACES);
   * ```
   * 
   * @returns {object} `this`
   * @throws {TypeError} If `placeholder` was invalid.
   * @see {@link module:@lumjs/web-service/defs.PLACEHOLDERS}
   */
  useVars(placeholder)
  {
    if (!(placeholder instanceof Placeholder))
    {
      throw new TypeError("Invalid Placeholder instance");
    }
    this._options.placeholders = placeholder;
    return this;
  }

  /**
   * Set the base URL path of the web service.
   * 
   * All method call paths will be prepended by this.
   * 
   * @param {string} basePath - Base path.
   * @returns {object} `this`
   */
  path(basePath)
  {
    this._options.basePath = basePath;
    return this;
  }

  /**
   * Set the `contentType` option (sets `Content-Type` request header).
   * 
   * If you don't set this explicitly, we'll use content detection to
   * try to determine what kind of content to send.
   * 
   * @param {string} type - See
   * {@link module:@lumjs/web-service/methodcall#contentType} for details.
   * 
   * @returns {object} `this`
   */
  content(type)
  {
    this._options.contentType = type;
    return this;
  }

  /**
   * Set the `acceptType` option (sets `Accept` request header).
   * 
   * @param {(string|boolean)} type - See
   * {@link module:@lumjs/web-service/methodcall#acceptType} for details.
   * 
   * @returns {object} `this`
   */
  accept(type)
  {
    this._options.acceptType = type;
    return this;
  }

  /**
   * Add a custom HTTP Method type definition.
   * 
   * @param {string} name - Name for the custom HTTP Method type.
   * @param {(object|string)} [options] Options to define behaviours.
   * 
   * If this is a `string` it will be used as `options.template`.
   * 
   * @param {string} [options.template] `template` argument for `defineHTTP()`
   * @param {object} [options.rules]    `rules` argument for `defineHTTP()`
   * @param {boolean} [options.wrap]    Add a wrapper method to the Builder?
   * 
   * In addition to adding the custom HTTP Method to the web service
   * we are building, if this option is `true`, a wrapper method 
   * will be added to the builder itself, which is simply a lowercase 
   * version of the `name`, and calls `add()` with the `httpMethod`
   * argument filled in with the uppercase `name`.
   * 
   * So if you add a method called `UNDELETE` there would be a new
   * `builder.undelete(name, path, options)` method available.
   * 
   * If this is not specified, the default value will be the 
   * `options.customWrappers` passed to the Builder's constructor,
   * or `false` if that was not specified.
   * 
   * @returns {object} `this`
   * @throws {TypeError} If `options` was not an `object` or a `string`.
   * 
   * @see {@link module:@lumjs/web-service/utils.defineHTTP} for details
   * on how the `template` and `rules` parameters work.
   */
  http(name, options={})
  {
    name = name.toUpperCase(); // Ensure the rule name is in uppercase.

    if (typeof options === S)
    {
      options = {template: options};
    }

    if (!isObj(options))
    {
      console.error({name, options});
      throw new TypeError("Invalid options");
    }

    const httpRules = defineHTTP(options.template, options.rules);
    this._options.httpMethods[name] = httpRules;

    const wrapIt = options.wrap ?? this._wrapCustom;

    if (wrapIt)
    {
      wrapHTTP(this, name);
    }

    return this;
  }

  /**
   * Add a new web-service API method call.
   * 
   * You can call this directly, or use one of the wrapper methods such
   * as `get()`, `post()`, etc.
   *
   * @param {string} name - Unique name/identifier of the method call.
   * @param {string} urlPath - URL Path for the API request.
   * @param {string} [httpMethod='GET'] HTTP method to use for request.
   * @param {object} [options] Advanced options.
   * 
   * @returns {object} `this`
   */
  add(name, urlPath, httpMethod, options)
  {
    const mc = new MethodCall(name, urlPath, httpMethod, options);
    this._methods.push(mc);
    return this;
  }

  /**
   * Set a web-service option.
   * @param {string} opt - Option name.
   * @param {*} value - Value for option.
   * @returns {object} `this`
   */
  set(opt, value)
  {
    this._options[opt] = value;
    return this;
  }

  /**
   * Build the actual `Webservice` instance.
   * 
   * This should obviously only be done once you have fully
   * defined the web service using the rest of builder methods.
   * 
   * This creates the instance, then will add all of the defined API calls
   * to the instance, and setting the `ws` property in each `MethodCall`.
   * 
   * @returns {object} The newly created instance.
   * 
   * Will be an instance of {@link module:@lumjs/web-service/webservice},
   * or a sub-class of it if the builder instance called the
   * {@link module:@lumjs/web-service/builder#useClass} method.
   * 
   */
  build()
  {
    const ws = new this._wsClass(this._options);
    for (const methodCall of this._methods)
    {
      methodCall.setWS(ws);
      ws._addCall(methodCall);
    }
    return ws;
  }

  /**
   * An instance getter for the default definitions.
   * @returns {module:@lumjs/web-service/defs}
   */
  get DEFS()
  {
    return DEFS;
  }
}

/**
 * A static property pointing to the default definitions.
 * @name module:@lumjs/web-service/builder.DEFS
 * @type {module:@lumjs/web-service/defs}
 */
def(WebserviceBuilder, 'DEFS', DEFS);

// Now add a wrapper for all standard HTTP methods.
for (const methName in STANDARD_HTTP)
{
  wrapHTTP(WebserviceBuilder.prototype, methName);
}

module.exports = WebserviceBuilder;

/**
 * Add an API call using the `GET` HTTP method.
 * @name module:@lumjs/web-service/builder.get
 * 
 */