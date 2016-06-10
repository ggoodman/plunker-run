'use strict';

const Schema = require('../schema');


module.exports = {
    validate: {
        params: {
            previewId: Schema.previewId.required(),
            pathname: Schema.pathname.default('').optional(),
        },
        payload: Schema.preview.required()
    },
    pre: [{
        method: 'cache.get(params.previewId)',
        assign: 'cached',
    }],
    cors: true,
    handler: function(request, reply) {
        const cached = request.pre.cached;
        
        if (cached) {
            cached.update(request.payload.files);
        } else {
            const preview = request.server.methods.previews.fromEntries(request.params.previewId, request.payload.files);
            
            request.server.methods.cache.put(preview);
        }
        
        return reply.redirect(request.path);
    }
};