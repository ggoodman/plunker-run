'use strict';

module.exports = put;


function put(preview) {
    const server = this.server;
    const lru = server.plugins.cache.lru;
    
    lru.set(preview.id, preview);
    
    return preview;
}
