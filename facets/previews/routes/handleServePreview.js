'use strict';

const Joi = require('joi');
const _ = require('lodash');


module.exports = {
    validate: {
        params: {
            previewId: Joi.string().alphanum().required(),
            pathname: Joi.string().regex(/^\/?[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*(?:\/[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/).allow('').default('').optional(),
        },
    },
    pre: [{
        method: 'cache.get(params.previewId)',
        assign: 'preview',
    }, {
        method: 'renderer.render',
        assign: 'rendered',
    }],
    handler: function(request, reply) {
        var rendered = request.pre.rendered;
        var response = reply(rendered.payload)
            .etag(request.pre.preview.timestamp)
            .header("X-XSS-Protection", 0) // Since we send code over the wire
            .encoding(rendered.encoding);

        _.forEach(rendered.headers, function(val, key) {
            response.header(key, val);
        });

        // var previewId = request.params.previewId;
        // var size = parseInt(request.headers['content-length'], 10);

        // request.visitor.event('previews', 'serve', previewId, size);
    }
};