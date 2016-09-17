'use strict';

const Joi = require('joi');


module.exports = Joi.object().keys({
    sessid: Joi.string().optional(),
    files: Joi.object().pattern(
        require('./pathname').regex,
        require('./file')
    ).min(1).required(),
});