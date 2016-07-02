'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const Farm = require('worker-farm');
const Static = require('./staticRenderer');
const _ = require('lodash');

const compile = Farm({
    maxCallsPerWorker: 100,
    maxConcurrentCallsPerWorker: 1,
    maxConcurrentWorkers: 2,
    maxCallTime: 1000 * 10,
    maxRetries: 0,
    autoStart: true,
}, require.resolve('./babelWorker'));


const REQUEST_MATCH = /\.js$/;
const SOURCE_EXT = ['.jsx', '.es6.js'];


module.exports = {
    name: 'babel',
    getRenderer,
};


function getRenderer(preview, pathname) {
    const babelRc = preview.get('.babelrc');
    let entry = preview.get(pathname);
    
    if (entry && REQUEST_MATCH.test(pathname) && babelRc) {
        return render;
    }
    
    if (preview.get(pathname)) {
        // Requested file exists. Don't compile
        return;
    }
    
    for (const ext of SOURCE_EXT) {
        const sourcename = pathname.replace(REQUEST_MATCH, ext);
        
        entry = REQUEST_MATCH.test(pathname)
            ?   preview.get(sourcename)
            :   undefined;
        
        if (entry) {
            return render;
        }
    }
    
    return;


    function render(request) {
        const ifNoneMatch = request.headers['if-none-match'];
        const etagRx = new RegExp(`^"${entry.etag}\-${exports.name}-(gzip|deflate)"`);
        
        // if (etagRx.test(ifNoneMatch)) {
        //     return Bluebird.resolve({
        //         encoding: 'utf-8',
        //         etag: entry.etag + '-' + exports.name,
        //         headers: {
        //             'Content-Type': 'application/javascript',
        //         },
        //         payload: '',
        //     });
        // }
        
        return new Bluebird((resolve, reject) => {
            const entries = _.reduce(preview.entries, (acc, entry, pathname) => 
                (entry.encoding === 'utf-8' || entry.encoding === 'utf8')
                    ?   _.set(acc, [pathname], entry.content.toString(entry.encoding))
                    :   acc
            , {});
            // const compile = require('./babelWorker');
            
            compile(preview.id, entries, pathname, entry.pathname, onWorkerResponse);
            
            
            function onWorkerResponse(err, result) {
                if (err) {
                    if (err.type === 'SyntaxError') {
                        preview.log({
                            renderer: 'babel',
                            level: 'error',
                            pathname: entry.pathname,
                            row: err.loc.line,
                            column: err.loc.column,
                            message: err.message,
                            context: err.codeFrame,
                        });
                    }
                    
                    return reject(Boom.wrap(err, 400));
                }
                
                _.forEach(result.logs, log => preview.log(log));
                
                const dynamicEntry = preview.addDynamicEntry(pathname, result.entry, result.dependencies);
                
                return resolve(Static.renderStatic(request, dynamicEntry));
            }
        });
    }
}
