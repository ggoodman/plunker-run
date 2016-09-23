'use strict';

const Fs = require('fs');
const Errors = require('@google/cloud-errors');
const Package = require('./package.json');
const Trace = require('@google/cloud-trace');
let errors;

// HACK: Working around https://github.com/GoogleCloudPlatform/cloud-trace-nodejs/issues/303
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = Fs.realpathSync(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    Trace.start();

    errors = Errors({
        projectId: process.env.GCLOUD_PROJECT,
        logLevel: 0, // defaults to logging warnings (2). Available levels: 0-5
        serviceContext: {
            service: Package.name,
            version: Package.version,
        },
    });
}

const Config = require('./config');
const Hapi = require('hapi');
const _ = require('lodash');

const server = new Hapi.Server({
    debug: process.env.NODE_ENV !== 'production'
        ?   {
                log: ['info', 'warn', 'error'],
                // request: ['handler', 'received', 'response'],
            }
        :   false,
});


process.on('uncaughtException', function (e) {
    console.error('[UNCAUGHT EXCEPTION] %s', e.message, e.stack);

    process.exit(1);
});


server.connection({
    host: _.get(Config, 'run.connection.host', 'run.plnkr.co'),
    address: _.get(Config, 'run.connection.address', '127.0.0.1'),
    port: _.get(Config, 'run.connection.port', 8080),
    labels: ['run'],
});

const registrations = [{
    register: require('./index'),
    options: { config: Config },
}];

if (errors) {
    registrations.unshift(errors.hapi);
}

server.register(registrations, {
    select: ['run'],
}, err => {
    if (err) {
        server.log(['error', 'init'], `Error registering plugins: ${err.message}.`);

        return stopServer();
    }

    server.start(err => {
        if (err) {
            server.log(['error', 'init'], `Error starting server: ${err.message}.`);

            return stopServer();
        }

        server.connections.forEach(function(connection) {
            server.log(['info', 'init'], 'Server running at: ' + connection.info.uri);
        });
    });


    function stopServer() {
        console.log('stopping the server');
        var next = server ? server.stop.bind(server) : process.nextTick;

        next(function() {
            process.exit(1);
        });
    }
});