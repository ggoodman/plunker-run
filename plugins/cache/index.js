'use strict';


exports.register = function(server, options, next) {
    server.bind({
        config: options.config,
        server: server
    });

    server.method({
        name: 'cache.get',
        method: require('./methods/get'),
        options: {
            callback: true,
        },
    });

    server.method({
        name: 'cache.put',
        method: require('./methods/put'),
        options: {
            callback: true,
        },
    });

    server.log(['info', 'init'], `Started ${exports.register.attributes.name}@${exports.register.attributes.version}.`);

    next();
};


exports.register.attributes = {
    name: 'cache',
    version: '1.0.0',
    dependencies: [
        'redis',
    ]
};