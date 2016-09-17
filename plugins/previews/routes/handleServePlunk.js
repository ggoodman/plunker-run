'use strict';

const Schema = require('../schema');
const _ = require('lodash');


module.exports = {
    validate: {
        params: {
            plunkId: Schema.plunkId.required(),
            pathname: Schema.pathname.default('').optional(),
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
            .etag(rendered.etag || request.pre.preview.timestamp)
            .encoding(rendered.encoding || 'utf8')
            .code(statusCode);

        _.forEach(rendered.headers, function(val, key) {
            response.header(key, val);
        });
    }
};