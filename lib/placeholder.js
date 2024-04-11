"use strict";

/**
 * A URL path placeholder rule.
 * 
 * Variable parameters may be used in method paths.
 * Different styles of placeholders for the variables are
 * supported. This class specifies the rules for how to
 * parse the URL and find placeholder variables and replace them
 * with the corresponding parameter data.
 * 
 * @exports module:@lumjs/web-service/placeholder
 * 
 * @prop {RegExp} pattern - Pattern to match.
 * 
 * There **MUST** be a capture group which will represent the
 * parameter name that we will look for in the data.
 * 
 * The RegExp **MUST** have the `global` (`g`) flag set!
 * 
 * @prop {number} param - Pattern parameter offset.
 * 
 * This refers to the RegExp capture group offset for the 
 * placeholder parameter name. Remember that `0` is always
 * the full pattern match, so the `param` offset should 
 * always be `1` or higher.
 * 
 */
class WebservicePathPlaceholder
{
  /**
   * Build a placeholder rule.
   * 
   * @param {RegExp} pattern - The pattern to match.
   * @param {number} [param=1] The parameter offset.
   * 
   */
  constructor(pattern, param=1)
  {
    if (!(pattern instanceof RegExp))
    {
      throw new TypeError("Invalid pattern, must be RegExp");
    }

    this.pattern = pattern;
    this.param   = param;
  }
}

module.exports = WebservicePathPlaceholder;
