'use strict';



exports.register = function(server, options, next) {
    server.bind({
        config: options.config,
        server: server,
    });

    server.route({
        method: 'GET',
        path: '/favicon.ico',
        config: require('./routes/handleStatic')(server, 'favicon.ico')
    });

    server.route({
        method: 'GET',
        path: '/robots.txt',
        config: require('./routes/handleStatic')(server, 'robots.txt')
    });

    // server.route({
    //     method: 'GET',
    //     path: '/sw.js',
    //     config: require('./routes/handleStatic')(server, 'sw.js')
    // });

    // server.route({
    //     method: 'GET',
    //     path: '/sw.html',
    //     config: require('./routes/handleStatic')(server, 'sw.html')
    // });

    server.route({
        method: 'GET',
        path: '/preview.html',
        config: require('./routes/handleStatic')(server, 'preview.html')
    });

    server.log(['info', 'init'], `Started ${exports.register.attributes.name}@${exports.register.attributes.version}.`);

    next();
};


exports.register.attributes = {
    'name': 'static',
    'version': '0.0.1',
    'dependencies': [
    ]
};
