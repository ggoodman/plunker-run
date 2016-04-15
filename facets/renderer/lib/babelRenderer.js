'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const Farm = require('worker-farm');
const _ = require('lodash');

const compile = Farm({
    maxCallsPerWorker: 20,
    maxConcurrentCallsPerWorker: 1,
    maxCallTime: 1000 * 10,
    maxRetries: 0,
    autoStart: true,
}, require.resolve('./babelWorker'));


const REQUEST_MATCH = /\.js/;
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


    function render() {
        return new Bluebird((resolve, reject) => {
            const entries = _.reduce(preview.entries, (acc, entry, pathname) => 
                (entry.encoding === 'utf-8' || entry.encoding === 'utf8')
                    ?   _.set(acc, [pathname], entry.content.toString(entry.encoding))
                    :   acc
            , {});
            // const compile = require('./babelWorker');
            
            compile(preview.id, entries, entry.pathname, onWorkerResponse);
            
            
            function onWorkerResponse(err, result) {
                if (err) {
                    return reject(Boom.wrap(err, 400));
                }
                
                return resolve({
                    encoding: 'utf-8',
                    headers: {
                        'ETag': preview.etag,
                        'Content-Type': 'text/javascript',
                    },
                    payload: result.code,
                });
            }
        });
    }
}
