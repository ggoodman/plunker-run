'use strict';

const Bluebird = require('bluebird');
const _ = require('lodash');


module.exports = Preview;


Preview.fromEntries = function (id, entries) {
    return new Preview(id, entries);
};

function Preview(id, entries) {
    this.etag = new Date().toISOString();
    this.id = id;
    this.entries = _.mapValues(entries, (entry, pathname) => ({
        pathname,
        content: new Buffer(entry.content, entry.encoding || 'utf8'),
        // encoding: entry.encoding || 'utf8',
    }));
}

Preview.prototype.get = function (pathname) {
    return this.entries[pathname];
};

Preview.prototype.has = function (pathname) {
    return !!this.get(pathname);
};

