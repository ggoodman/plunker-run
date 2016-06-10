'use strict';

const Babel = require('babel-core');
const Path = require('path');

// Pre-load presets.
require('babel-preset-es2015');
require('babel-preset-react');
require('babel-preset-stage-0');
require('babel-preset-stage-1');
require('babel-preset-stage-2');
require('babel-preset-stage-3');

require('babel-plugin-transform-es2015-modules-systemjs');

module.exports = compile;

console.log('Started babel worker');

function compile(previewId, entries, pathname, cb) {
    const babelRc = entries['.babelrc'];
    const source = entries[pathname];
    let options = {};
    
    if (babelRc) {
        try {
            options = JSON.parse(babelRc);
        } catch (e) {
            
        }
    }
    
    options.ast = false;
    options.highlightCode = false;
    options.sourceMaps = false;
    
        
    try {
        const result = Babel.transform(source, options);
        
        cb(null, result);
    } catch (e) {
        cb(e);
    }
}