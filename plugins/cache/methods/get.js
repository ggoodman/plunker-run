'use strict';

module.exports = get;


function get(key) {
    const server = this.server;
    const lru = server.plugins.cache.lru;
    
    return lru.get(key);
}
