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

const BASE_DIR = Path.resolve(Path.join(__dirname, '../../..'));

process.chdir(BASE_DIR);

module.exports = compile;


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
    
    // if (options.presets) {
    //     options.plugins = options.presets.map((val) => {
    //         if (typeof val === "string") {
    //             let presetLoc = require.resolve(`babel-preset-${val}`) || require.resolve(val);
    //             if (presetLoc) {
    //                 return require(presetLoc);
    //             }
    //             else {
    //                 throw new Error(`Couldn't find preset ${JSON.stringify(val)}`);
    //             }
    //         } else if (typeof val === "object") {
    //             return val;
    //         } else {
    //             throw new Error(`Unsupported preset format: ${val}.`);
    //         }
    //     });
    // }
    
    // if (options.plugins) {
    //     options.plugins = options.plugins.map((val) => {
    //         if (typeof val === "string") {
    //             let pluginLoc = require.resolve(`babel-plugin-${val}`) || require.resolve(val);
    //             if (pluginLoc) {
    //                 return require(pluginLoc);
    //             }
    //             else {
    //                 throw new Error(`Couldn't find plugin ${JSON.stringify(val)}`);
    //             }
    //         } else if (typeof val === "object") {
    //             return val;
    //         } else {
    //             throw new Error(`Unsupported plugin format: ${val}.`);
    //         }
    //     });
    // }
    
    // const mountPath = `${BASE_DIR}/${previewId}`;
    // const previewFs = new MemoryFs.Volume();//(_.mapKeys(entries, pathname => Path.join(BASE_DIR, pathname)));
    // const sourcePath = Path.join(mountPath, pathname);
    
    // previewFs.mountSync(mountPath, entries);
    
    // UnionFs
    //     .use(Fs)
    //     .use(previewFs)
    //     .replace(Fs);
        
    try {
        const result = Babel.transform(source, options);
        
        cb(null, result);
    } catch (e) {
        cb(e);
    }
    // return Babel.transformFile(sourcePath, options, onTransformationComplete);
    
    
    // function onTransformationComplete(err, result) {
    //     if (err) {
    //         err.mountPath = mountPath;
    //         err.sourcePath = sourcePath;
    //         err.previewFs = previewFs;
            
    //         return cb(err);
    //     }
        
    //     return cb(null, result);
    // }
}