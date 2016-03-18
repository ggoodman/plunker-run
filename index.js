const Bluebird = require('bluebird');
const Package = require('./package.json');


exports.register = function(server, options, next) {
    server.log(['info', 'init'], `Registering: ${Package.name}`);
    
    server.app.config = options.config;

    const registration = server.register([{
        register: require('hapi-qs'),
        options: {
            qsOptions: {
                allowDots: false,
            }
        },
    }, {
        register: require('vision'),
        options: options,
    }, {
        register: require('./facets/cache'),
        options: options,
    }, {
        register: require('./facets/renderer'),
        options: options,
    }, {
        register: require('./facets/previews'),
        options: options,
    }]);
    
    return Bluebird.resolve(registration)
        .asCallback(next);
};

exports.register.attributes = {
    name: Package.name,
    version: Package.version,
    dependencies: [],
};