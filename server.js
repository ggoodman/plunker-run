'use strict';

require('@google/cloud-trace').start();

const Config = require('./config');
const Hapi = require('hapi');
const _ = require('lodash');

const server = new Hapi.Server();


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

server.register({
    register: require('./index'),
    options: { config: Config },
}, {
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