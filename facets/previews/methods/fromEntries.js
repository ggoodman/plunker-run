'use strict';

const Preview = require('../lib/preview');

module.exports = fromEntries;


function fromEntries(previewId, entries) {
    const cached = this.server.methods.cache.get(previewId);
    
    return cached
        ?   cached.update(entries)
        :   Preview.fromEntries(previewId, entries);
}