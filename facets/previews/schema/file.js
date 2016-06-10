'use strict';

const Joi = require('joi');


module.exports = Joi.object().keys({
    content: Joi.string().allow('').required(),
    encoding: Joi.string().allow('utf8').default('utf8').optional(),
});