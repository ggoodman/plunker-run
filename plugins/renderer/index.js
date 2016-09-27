'use strict';


exports.register = function(server, options, next) {
    server.bind({
        config: options.config,
        server: server
    });

    server.method({
        name: 'renderer.render',
        method: require('./methods/render'),
        options: {
            callback: false,
        },
    });

    server.log(['info', 'init'], `Started ${exports.register.attributes.name}@${exports.register.attributes.version}.`);

    next();
};


exports.register.attributes = {
    name: 'renderer',
    version: '1.0.0',
    dependencies: [
        'dogear',
    ]
};