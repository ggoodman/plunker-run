'use strict';

const Os = require('os');
const Package = require('./package.json');


exports.register = function(server, options, next) {
    server.log(['info', 'init'], `Registering: ${Package.name}`);

    server.app.config = options.config;

    server.bind({
        config: options.config,
        server: server
    });

    server.register([
        {
            register: require('hapi-qs'),
            options: {
                qsOptions: {
                    allowDots: false,
                }
            },
        },
        {
            register: require('vision'),
        },
        {
            register: require('dogear'),
            options: {
                statsdConfig: {
                    host: process.env.STATSD_HOST || 'localhost',
                    port: process.env.STATSD_PORT || 8125,
                    globalTags: `plunker_run_hostname:${process.env.STATSD_HOST_TAG || Os.hostname()}`,
                    prefix: `${Package.name}.`,
                    errorHandler: (error) => {
                        server.log(['error'], {
                            error: error.message,
                            error_code: error.code,
                            message: 'Error publishing metrics',
                        });
                    },
                },
            },
        },
        {
            register: require('good'),
            options: {
                ops: {
                    interval: 15000
                },
                reporters: {
                    console: [{
                        module: 'good-squeeze',
                        name: 'Squeeze',
                        args: [{ error: '*', log: '*', ops: '*', request: '*', response: '*' }]
                    }, {
                        module: 'good-squeeze',
                        name: 'SafeJson',
                        args: [
                            null,
                            { separator: '\n' },
                        ],
                    }, 'stdout'],
                },
            },
        },
        {
            register: require('./plugins/cache'),
            options: options,
        },
        {
            register: require('./plugins/healthz'),
            options: options,
        },
        {
            register: require('./plugins/renderer'),
            options: options,
        },
        {
            register: require('./plugins/previews'),
            options: options,
        },
        {
            register: require('./plugins/redis'),
            options: options,
        },
        {
            register: require('./plugins/static'),
            options: options,
        },
    ], err => {
        if (err) {
            server.log(['error', 'init'], `Failed to start ${exports.register.attributes.name}@${exports.register.attributes.version}: ${err.message}.`);

            return next(err);
        }

        server.log(['info', 'init'], `Started ${exports.register.attributes.name}@${exports.register.attributes.version}.`);

        next(err);
    });
};

exports.register.attributes = {
    name: Package.name,
    version: Package.version,
    dependencies: [],
};