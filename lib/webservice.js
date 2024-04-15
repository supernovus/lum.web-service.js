"use strict";

const core = require('@lumjs/core');
const {def,S,isObj} = core.types;

const defs = require('./defs');
const {STANDARD_HTTP} = defs;

/**
 * A simple class to represent a web service.
 * 
 * @prop {string} _id - A unique name/identifier for this service.
 * 
 * @prop {object} _methodCalls - A map of API method calls.
 * 
 * All property values will be {@link module:@lumjs/web-service/methodcall}
 * instances, and the property names will be the `methodCall.name` value.
 * 
 * @prop {object} _options - Options specific to this web service.
 * 
 * @prop {object} _httpMethods - A list of supported HTTP Method types.
 * 
 * This is compiled from the `STANDARD_HTTP` definitions as well as any
 * custom methods added.
 * 
 * @exports module:@lumjs/web-service/webservice
 */
class Webservice 
{
  /**
   * Build a new Webservice instance.
   * 
   * You should use a `Builder` instead of calling this directly.
   * 
   * @param {object} [options] Options for this instance.
   * The full object will be assigned to `this._options`.
   * 
   * @param {string} [options.id] An explicit value for `this._id`
   * 
   * If this is not specified, then `this._id` will be assigned a unique
   * identifier based on the classname. If you are using a custom sub-class
   * with a name like `DocumentsWS` then the auto-generated id would be
   * `documents` (the default rules will strip `WS` from the end of the name).
   * 
   * If you are not using a custom sub-class then the first auto-generated
   * id would be `webservice` and each subsequent auto-generated id would
   * have a number appended, e.g., `webservice2`, `webservice3`, etc.
   * 
   * I may document the id generation algorithm and advanced options
   * at a later time, but feel free to look at the code for more info.
   * 
   * @param {object} [options.httpMethods] Custom HTTP method definitions.
   * 
   * Each property name will be used as the name of the HTTP method type 
   * (in uppercase as that is the accepted standard) and the value must
   * be a {@link module:@lumjs/web-service/defs.HttpRules} object.
   * 
   * These will be merged with the `STANDARD_HTTP` rules and assigned
   * to `this._httpMethods` for use by `MethodCall` instances.
   * 
   * @see {@link module:@lumjs/web-service/builder}
   */
  constructor(options={})
  {
    this._methodCalls = {};
    this._options = options;
    this._httpMethods = Object.assign({}, 
      STANDARD_HTTP,
      options.httpMethods);

    if (typeof options.id === S)
    { // An explicit id option was specified.
      def(this, '_id', options.id);
    }
    else
    { // Generate a unique id automatically based on the classname.
      const autoIds 
        = (options.autoIdRegistry instanceof core.UniqueObjectIds)
        ? options.autoIdRegistry
        : defs.AUTO_IDS.getInstance();
      autoIds.id(this);
    }
  }

  /**
   * Add a `MethodCall` to this `Webservice` instance.
   * 
   * In addition to adding the `methodCall` to `this._methodCalls`,
   * assuming there is no method or property in `this` using the
   * `methodCall.name`, then it will add a wrapper method.
   * A _nested_ `on()` wrapper method will also be available.
   * 
   * So if you have a `methodCall.name` value of `'listDocs'`,
   * then `this.listDocs` will be added as an _async method_ that calls
   * `methodCall.send(...arguments)`, returning the `Promise` from it.
   * Additionally, `this.listDocs.on` will be added as a wrapper method
   * that calls `methodCall.on(...arguments)`, returning the `methodCall`.
   * 
   * This is generally called by a `Builder` instance rather than directly.
   * 
   * @param {module:@lumjs/web-service/methodcall} methodCall - Call to add.
   * 
   * @throws {TypeError}  - If `methodCall` is not valid.
   * @throws {RangeError} - If `methodCall.name` is already assigned.
   *
   * @see {@link module:@lumjs/web-service/builder}
   */
  _addCall(methodCall)
  {
    if (!(methodCall instanceof MethodCall))
    {
      throw new TypeError("Invalid MethodCall instance");
    }

    if (this._methodCalls[methodCall.name] !== undefined)
    {
      console.error({methodCall});
      throw new RangeError("Duplicate MethodCall name found");
    }

    // Add a reference to the actual object instance.
    this._methodCalls[methodCall.name] = methodCall;

    if (this[methodCall.name] !== undefined)
    {
      console.debug("Reserved name", {methodCall});
      return;
    }

    // Now add a direct method to call the function.
    def(this, methodCall.name, async function()
    {
      return methodCall.send(...arguments);
    });

    // And a shortcut to the `on()` method.
    def(this[methodCall.name], 'on', () => 
      methodCall.on(...arguments));
  }

}

module.exports = Webservice;

// Recursive dependency is recursive.
const MethodCall = require('./methodcall');
