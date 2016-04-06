'use strict';

const Joi = require('joi');
const _ = require('lodash');


module.exports = {
    validate: {
        params: {
            plunkId: Joi.string().alphanum().required(),
            pathname: Joi.string().regex(/^\/?[._$@a-zA-Z0-9][\w-]*(?:\.[\w-]+)*(?:\/[._$@a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/).allow('').default('').optional(),
        },
    },
    pre: [{
        method: 'previews.fromPlunk(params.plunkId)',
        assign: 'preview',
    }, {
        method: 'renderer.render',
        assign: 'rendered',
    }],
    handler: function(request, reply) {
        const rendered = request.pre.rendered;
        const statusCode = rendered.statusCode || 200;
        const response = reply(rendered.payload)
            .etag(request.pre.preview.timestamp)
            .encoding(rendered.encoding || 'utf8')
            .code(statusCode);
        
        if (statusCode === 200) {
            response
                .header("X-XSS-Protection", 0); // Since we send code over the wire
        }

        _.forEach(rendered.headers, function(val, key) {
            response.header(key, val);
        });

        // var previewId = request.params.previewId;
        // var size = parseInt(request.headers['content-length'], 10);

        // request.visitor.event('previews', 'serve', previewId, size);
    }
};