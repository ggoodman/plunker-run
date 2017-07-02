'use strict';

const Babel = require('babel-core');
const Path = require('path');
const Tripwire = require('tripwire');

const TRIPWIRE_TIMEOUT = 2000;

// Pre-load presets.
require('babel-preset-env');
require('babel-preset-react');
require('babel-preset-stage-0');
require('babel-preset-stage-1');
require('babel-preset-stage-2');
require('babel-preset-stage-3');

require('babel-plugin-transform-es2015-modules-systemjs');

module.exports = compile;

console.log('Started babel worker');


startTripwire();


function compile(previewId, entries, pathname, sourcename, cb) {
    const babelRc = entries['.babelrc'];
    const source = entries[sourcename];
    const response = {
        dependencies: [ sourcename ],
        logs: [],
    };
    let options = {};
    
    if (Path.extname(sourcename) === '.jsx') {
        options.presets = ['env', 'react'];
    }
    
    if (babelRc) {
        try {
            options = JSON.parse(babelRc);
            
            response.dependencies.push('.babelrc');
        } catch (e) {
            response.logs.push({
                renderer: 'babel',
                level: 'warning',
                pathname: '.babelrc',
                message: e.message,
            });
        }
    }
    
    options.ast = false;
    options.highlightCode = false;
    options.sourceMaps = false;
    
        
    try {
        const result = Babel.transform(source, options);
        
        response.entry = {
            pathname,
            content: result.code,
            encoding: 'utf8',
        };
        
        cb(null, response);
    } catch (err) {
        cb(err);
    }
}

function startTripwire() {
    process.on('uncaughtException', e => {
        console.error(e.message || e);
    });
    
    Tripwire.resetTripwire(TRIPWIRE_TIMEOUT);
    
    setInterval(() => Tripwire.resetTripwire(TRIPWIRE_TIMEOUT), TRIPWIRE_TIMEOUT / 2);
}
