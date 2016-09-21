'use strict';

const Boom = require('boom');
const _ = require('lodash');


module.exports = put;


function put(preview, cb) {
    const server = this.server;
    const redis = server.plugins.redis;
    const trnx = redis.client.multi();

    trnx
        .hmset(preview.id, _.mapValues(preview.entries, JSON.stringify))
        .expire(preview.id, 60 * 5)
        .exec((error, replies) => {
            if (error) {
                server.log(['error', 'redis'], {
                    error: error.message,
                    error_code: error.code,
                    message: 'Error storing preview',
                });

                return cb(Boom.wrap(error, 502, 'Error storing preview'));
            }

            return cb(null, preview);
        });
}
