'use strict';

const Bluebird = require('bluebird');
const LRUCache = require('lru-cache');
const _ = require('lodash');


exports.register = function(server, options, next) {
    server.bind({
        config: options.config,
        server: server
    });
    
    server.expose('lru', new LRUCache({
        max: 100,
        maxAge: 1000 * 60 * 5,
    }));
    
    server.method({
        name: 'cache.get',
        method: require('./methods/get'),
        options: {
            callback: false,
        },
    });
    
    server.method({
        name: 'cache.put',
        method: require('./methods/put'),
        options: {
            callback: false,
        },
    });
    
    server.log(['info', 'init'], 'Started ' + exports.register.attributes.name + '.');

    next();
};


exports.register.attributes = {
    name: 'cache',
    version: '1.0.0',
    dependencies: [
    ]
};