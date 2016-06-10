'use strict';

const Crypto = require('crypto');
const EventEmitter = require('events').EventEmitter;
const Stream = require('stream');
const Util = require('util');
const _ = require('lodash');


module.exports = Preview;


Util.inherits(Preview, EventEmitter);

Preview.fromEntries = function (id, entries) {
    return new Preview(id, entries);
};

function Preview(id, entries) {
    EventEmitter.call(this);
    
    this.etag = new Date().toISOString();
    this.id = id;
    this.entries = {};
    this.logQueue = [];
    this.intervals = [];
    
    this.update(entries);
    
    this.on('data', data => this.logQueue.push(data));
}

Preview.prototype.destroy = function () {
    this.intervals.forEach(clearInterval);
};

Preview.prototype.get = function (pathname) {
    return this.entries[pathname];
};

Preview.prototype.getLogStream = function () {
    const stream = new Stream.PassThrough();
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
    return this.emit('data', data);
};

Preview.prototype.update = function (entries) {
    this.entries = _.mapValues(entries, (entry, pathname) => ({
        pathname,
        content: new Buffer(entry.content, entry.encoding || 'utf8'),
        encoding: entry.encoding || 'utf8',
        etag: Crypto.createHash('md5').update(entry.content, entry.encoding || 'utf8').digest('hex'),
    }));
    
    this.logQueue.length = 0;
    
    return this;
};