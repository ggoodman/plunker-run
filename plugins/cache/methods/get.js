'use strict';

const Boom = require('boom');
const _ = require('lodash');


module.exports = get;


function get(key, cb) {
    const server = this.server;
    const redis = server.plugins.redis;

    return redis.client.hgetall(key, (error, entries) => {
        if (error) {
            server.log(['error', 'redis'], {
                error: error.message,
                error_code: error.code,
                message: 'Error storing preview',
            });

            return cb(Boom.wrap(error, 502, 'Error storing preview'));
        }

        return entries
            ?   cb(null, server.methods.previews.fromEntries(key, _.mapValues(entries, JSON.parse)))
            :   cb();
    });
}
