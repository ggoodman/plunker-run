'use strict';

const Boom = require('boom');
const Hoek = require('hoek');
const Joi = require('joi');
const Redis = require('redis');
const _ = require('lodash');


const internals = {};


exports.register = register;
exports.register.attributes = {
    name: 'redis',
    version: '1.0.0',
    dependencies: [
    ],
};


function register(server, options, next) {
    const results = Joi.validate(options.config.run.db, internals.schema);
    Hoek.assert(!results.error, results.error);
    const config = results.value;

    const client = Redis.createClient(config.uri, _.defaults(config.options, {
        retry_strategy: retryStrategy,
    }));

    client.on('error', onError);
    client.once('ready', onReady);

    const connTimeout = setTimeout(onTimeout, 60 * 1000);

    // TODO: Cleanly exit redis on server restart


    function onError(error) {
        server.log(['error', 'redis'], {
            error: error.message,
            error_code: error.code,
            message: 'Redis error',
        });
    }
    
    function onTimeout() {
        client.removeListener('ready', onReady);
        client.quit();

        server.log(['error', 'init'], {
            error: 'Timed out connecting to redis',
            error_code: 'ETIMEDOUT',
            message: `Error starting ${exports.register.attributes.name}@${exports.register.attributes.version}.`
        });

        return next(Boom.serverUnavailable('Cache server unavailable'));
    }

    function onReady() {
        clearTimeout(connTimeout);

        server.expose('client', client);
        server.expose('library', Redis);

        server.log(['info', 'init'], `Started ${exports.register.attributes.name}@${exports.register.attributes.version}.`);

        return next();
    }
}

internals.schema = Joi.object({
    uri: Joi.string().uri({ scheme: ['redis'] }).required(),
    options: Joi.object().optional(),
});


function retryStrategy(options) {
    if (options.total_retry_time > 1000 * 10) {
        return Boom.serverUnavailable('Error completing cache operation');
    }

    if (options.times_connected > 5) {
        return Boom.serverUnavailable('Error completing cache operation');
    }

    // reconnect after
    return Math.max(options.attempt * 100, 3000);
}