'use strict';

const Joi = require('joi');
const _ = require('lodash');


module.exports = {
    validate: {
        params: {
            previewId: Joi.string().alphanum().required(),
            pathname: Joi.string().regex(/^\/?[._$@a-zA-Z0-9][\w-]*(?:\.[\w-]+)*(?:\/[._$@a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/).allow('').default('').optional(),
        },
        payload: Joi.object().keys({
            sessid: Joi.string().optional(),
            files: Joi.object().pattern(
                /^\/?[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*(?:\/[a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/,
                Joi.object().keys({
                    content: Joi.string().allow('').required(),
                    encoding: Joi.string().allow('utf8').default('utf8').optional(),
                })
            ).min(1).required(),
        }).required()
    },
    pre: [{
        method: 'previews.fromEntries(params.previewId, payload.files)',
        assign: 'preview',
    }, {
        method: 'cache.put(pre.preview)',
        assign: 'cached',
    }, {
        method: 'renderer.render',
        assign: 'rendered',
    }],
    handler: function(request, reply) {
        const rendered = request.pre.rendered;
        const statusCode = rendered.statusCode || 200;
        const response = reply(rendered.payload)
            .code(statusCode);
        
        if (statusCode === 200) {
            response
                .etag(request.pre.preview.timestamp)
                .header("X-XSS-Protection", 0) // Since we send code over the wire
                .encoding(rendered.encoding);
        }

        _.forEach(rendered.headers, function(val, key) {
            response.header(key, val);
        });

        // var previewId = request.params.previewId;
        // var size = parseInt(request.headers['content-length'], 10);

        // request.visitor.event('previews', 'refresh', previewId, size);
    }
};