'use strict';

const Crypto = require('crypto');
const EventEmitter = require('events').EventEmitter;
const Stream = require('stream');
const Util = require('util');
const _ = require('lodash');


module.exports = Preview;


Util.inherits(Preview, EventEmitter);


Preview.createEntry = function (pathname, options) {
    const encoding = options.encoding || 'utf8';
    const content = new Buffer(options.content, encoding);
    const etag = Crypto.createHash('md5').update(content, encoding).digest('hex');
    const dependencies = options.dependencies;

    return {
        pathname,
        content,
        encoding,
        etag,
        dependencies,
    };
};

Preview.fromEntries = function (id, entries) {
    return new Preview(id, entries);
};


function Preview(id, entries) {
    EventEmitter.call(this);

    this.etag = Date.now();
    this.id = id;
    this.entries = {};
    this.logQueue = [];
    this.intervals = [];

    _.forEach(entries, (options, pathname) => this.addEntry(pathname, options));

    // this.on('data', data => this.logQueue.push(data));
}

Preview.prototype.addDynamicEntry = function (pathname, options, dependencies) {
    return this.addEntry(pathname, _.extend({ dependencies }, options));
};

Preview.prototype.addEntry = function (pathname, options) {
    const entry = Preview.createEntry(pathname, options);

    this.entries[pathname] = entry;

    return entry;
};

Preview.prototype.destroy = function () {
    this.intervals.forEach(clearInterval);
};

Preview.prototype.get = function (pathname) {
    return this.entries[pathname];
};

Preview.prototype.getLogStream = function () {
    const stream = new Stream.PassThrough();
    return stream;
    // DISABLED TEMPORARILY
    const interval = setInterval(() => write(Date.now(), 'ping'), 1000 * 10);

    process.nextTick(() => {
        this.logQueue.forEach(log => write(log));
        this.on('data', write);
    });

    this.intervals.push(interval);

    write(Date.now(), 'ping');

    stream.on('end', () => {
        clearInterval(interval);
        this.removeListener('data', write);
    });

    stream.on('error', () => {
        clearInterval(interval);
        this.removeListener('data', write);
    });

    return stream;


    function write(data, event) {
        if (event) stream.write(`event: ${event}\n`, 'utf8');
        if (data) stream.write(`data: ${JSON.stringify(data)}\n`, 'utf8');
        if (data || event) stream.write('\n', 'utf8');
    }
};

Preview.prototype.has = function (pathname) {
    return !!this.get(pathname);
};

Preview.prototype.log = function (data) {
    // return this.emit('data', data);
};

Preview.prototype.update = function (entries) {
    const oldEntries = _.clone(this.entries);

    this.logQueue.length = 0;
    this.etag = Date.now();
    this.dynamicEntries = {};
    this.entries = _.mapValues(entries, (entry, pathname) => this.addEntry(pathname, entry));

    // Check if any of the dynamicEntries can be migrated
    _.forEach(oldEntries, (entry, pathname) => {
        const dependencies = entry.dependencies;

        if (!Array.isArray(dependencies) || !entry.dependencies.length) {
            return;
        }

        let canMigrate = true;

        for (let i = 0; i < dependencies.length; i++) {
            const dependencyPathname = dependencies[i];
            const oldDependencyEntry = oldEntries[dependencyPathname];
            const newDependencyEntry = this.entries[dependencyPathname];

            if (!oldDependencyEntry || !newDependencyEntry) {
                canMigrate = false;
                break;
            }

            if (oldDependencyEntry.content.compare(newDependencyEntry.content)) {
                canMigrate = false;
                break;
            }
        }

        if (canMigrate) {
            this.addDynamicEntry(pathname, entry, dependencies);
        }
    });

    return this;
};
