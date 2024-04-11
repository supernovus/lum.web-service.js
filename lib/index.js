"use strict";

const Builder = require('./builder');

/**
 * The complete web service library package.
 * Provides convenient shortcuts to every module in this package.
 * 
 * @exports module:@lumjs/web-service
 */
module.exports =
{
  /**
   * @see {@link module:@lumjs/web-service/builder}
   */
  Builder,
  /**
   * @see {@link module:@lumjs/web-service/webservice}
   */
  Webservice: require('./webservice'),
  /**
   * @see {@link module:@lumjs/web-service/methodcall}
   */
  MethodCall: require('./methodcall'),
  /**
   * @see {@link module:@lumjs/web-service/placeholder}
   */
  Placeholder: require('./placeholder'),
  /**
   * @see {@link module:@lumjs/web-service/utils}
   */
  utils: require('./utils'),
  /**
   * @see {@link module:@lumjs/web-service/defs}
   */
  DEFS: require('./defs'),

  /**
   * Return a new `Builder` instance.
   * @param {object} [options] Options for `new Builder()` 
   * @returns {module:@lumjs/web-service/builder}
   */
  make(options)
  {
    return new Builder(options);
  }
}

/**
 * Objects using the _observable_ events API (from `@lumjs/core`).
 * 
 * @interface module:@lumjs/web-service.observable
 */

/**
 * Assign an event handler.
 * 
 * @function module:@lumjs/web-service.observable#on
 * @param {string} name - Event name.
 * @param {function} handler - Event handler.
 * 
 * The argument(s) passed to the handler depend on the event.
 * 
 * @returns {object} `this`
 */

/**
 * Remove an event handler.
 * 
 * @function module:@lumjs/web-service.observable#off
 * @param {string} name - Event name.
 * @param {function} [handler] Handler to remove.
 * 
 * If omitted, _all_ handlers for the `name` will be removed.
 * 
 * @returns {object} `this`
 */
