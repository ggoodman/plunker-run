'use strict';

const Boom = require('boom');
const Schema = require('../schema');


module.exports = {
    cors: true,
    validate: {
        params: {
            previewId: Schema.previewId.required(),
        },
    },
    pre: [{
        method: 'cache.get(params.previewId)',
        assign: 'preview',
    }],
    handler: function(request, reply) {
        if (!request.pre.preview) {
            return reply(Boom.notFound());
        }

        // const logs = request.pre.preview.getLogStream();
        const response = reply('\n');

        response.code(200)
            .type("text/event-stream")
            // .header("Connection", "keep-alive")
            // .header("Cache-Control", "no-cache")
            // .header("Content-Encoding", "identity");

        // request.on('disconnect', function () {
        //     logs.end();
        // });
    }
};