'use strict';

const Bluebird = require('bluebird');
const LRUCache = require('lru-cache');
const _ = require('lodash');


exports.register = function(server, options, next) {
    server.bind({
        config: options.config,
        server: server
    });
    
    server.method({
        name: 'previews.fromEntries',
        method: require('./methods/fromEntries'),
        options: {
            callback: false,
        },
    });
    
    server.route({
        method: 'GET',
        path: '/{previewId}/{pathname*}',
        config: require('./routes/handleServePreview'),
    });
    
    server.route({
        method: 'POST',
        path: '/{previewId}/{pathname*}',
        config: require('./routes/handleUpdatePreview'),
    });
    
    server.ext({
        type: 'onPreResponse',
        method: require('./ext/onPreResponse'),
    });
    
    server.views({
        engines: { ejs: require('ejs') },
        relativeTo: __dirname,
        path: 'views',
    });
    
    server.log(['info', 'init'], 'Started ' + exports.register.attributes.name + '.');

    next();
};


exports.register.attributes = {
    name: 'previews',
    version: '1.0.0',
    dependencies: [
        'hapi-qs',
        'cache',
        'renderer',
    ]
};