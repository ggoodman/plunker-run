'use strict';

const Preview = require('../lib/preview');


module.exports = fromEntries;


function fromEntries(previewId, entries) {
    return Preview.fromEntries(previewId, entries);
}