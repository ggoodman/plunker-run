'use strict';

const Joi = require('joi');

const PATHNAME_REGEX = /^\/?[._$@a-zA-Z0-9][\w-]*(?:\.[\w-]+)*(?:\/[._$@a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/;


module.exports = Joi.string().regex(PATHNAME_REGEX).allow('');
module.exports.regex = PATHNAME_REGEX;