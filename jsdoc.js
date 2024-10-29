"use strict";

const docRules = require('@lumjs/build/jsdoc-rules');
const ourRules = docRules.docsReadme.clone(); 
module.exports = ourRules;
