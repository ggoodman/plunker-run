const Errors = require('@google/cloud-errors');
const Package = require('./package.json');


exports.register = function(server, options, next) {
    server.log(['info', 'init'], `Registering: ${Package.name}`);

    const errors = Errors({
        projectId: process.env.GCLOUD_PROJECT,
        logLevel: 0, // defaults to logging warnings (2). Available levels: 0-5
        serviceContext: {
            service: Package.name,
            version: Package.version,
        },
    });

    server.app.config = options.config;

    server.bind({
        config: options.config,
        server: server
    });

    server.register([
        {
            register: errors.hapi,
        },
        {
            register: require('hapi-qs'),
            options: {
                qsOptions: {
                    allowDots: false,
                }
            },
        },
        {
            register: require('inert'),
        },
        {
            register: require('vision'),
        },
        {
            register: require('good'),
            options: {
                ops: {
                    interval: 1000
                },
                reporters: {
                    console: [{
                        module: 'good-squeeze',
                        name: 'Squeeze',
                        args: [{ error: '*', log: '*', response: '*' }]
                    }, {
                        module: 'good-console',
                        args: [{ color: false }],
                    }, 'stdout'],
                },
            },
        },
        {
            register: require('./plugins/cache'),
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