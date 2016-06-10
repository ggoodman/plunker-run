'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const Crypto = require('crypto');
const Path = require('path');
const Sass = require('node-sass');
const Wreck = require('wreck');


const REQUEST_MATCH = /\.css$/;
const SOURCE_EXT = ['.sass', '.scss'];


module.exports = {
    name: 'sass',
    getRenderer,
};


function getRenderer(preview, pathname) {
    let sourcename;
    let entry;
    
    for (const ext of SOURCE_EXT) {
        sourcename = pathname.replace(REQUEST_MATCH, ext);
        entry = REQUEST_MATCH.test(pathname)
            ?   preview.get(sourcename)
            :   undefined;
        
        if (entry) {
            return render;
        }
    }
    
    return;
    
    
    function render(request) {
        const code = entry.content.toString('utf8');
        // const ifNoneMatch = request.headers['if-none-match'];
        // const etagRx = new RegExp(`^"${entry.etag}\-${exports.name}-(gzip|deflate)"`);
        
        // if (etagRx.test(ifNoneMatch)) {
        //     return Bluebird.resolve({
        //         encoding: 'utf-8',
        //         etag: entry.etag + '-' + exports.name,
        //         headers: {
        //             'Content-Type': 'text/css',
        //         },
        //         payload: '',
        //     });
        // }
        
        return new Bluebird((resolve, reject) => {
            return Sass.render({
                file: `/${sourcename}`,
                data: code,
                importer,
                indentedSyntax: !!sourcename.match(/\.sass$/),
            }, (err, result) => {
                if (err) {
                    return reject(err);
                }
                
                return resolve(result.css);
            });
            
            
            function importer(url, prev, done) {
                console.log('importer', url, prev);
                const isUrl = url.match(/^https?:\/\//);
                
                if (isUrl) {
                    return Wreck.get(url, { redirects: 3 }, (err, res, body) => {
                        if (err) return done(err);
                        if (res.statusCode >= 400) {
                            return done(Boom.create(res.statusCode));
                        }
                        
                        const file = url;
                        const contents = body.toString('utf8');
                        
                        return done({ file, contents });
                    });
                }
                
                const importPathname = Path.resolve(Path.dirname(prev), url);
                const imported = preview.get(importPathname.split('/').filter(Boolean).join('/'));
                
                if (!imported) {
                    return done(Boom.notFound(`Import failed for '${importPathname}': Not found`));
                }
                
                        
                const file = importPathname;
                const contents = imported.content.toString('utf8');
                
                return done({ file, contents });
            }
        })
            .catch(e => {
                const lines = code.split('\n');
                
                preview.log({
                    renderer: 'sass',
                    level: 'error',
                    pathname: entry.pathname,
                    row: e.line - 1, // Sass rows are 1-based
                    column: e.column - 1, // Sass columns are 1-based
                    message: e.message,
                    context: lines.slice(Math.max(0, e.line - 1), Math.min(lines.length - 1, e.line + 1)),
                });
                
                throw Boom.wrap(e, 400);
            })
            .then(buildReply);
    }
    
    function buildReply(payload) {
        return {
            encoding: 'utf-8',
            etag: Crypto.createHash('md5').update(payload).digest('hex'),
            headers: {
                'Content-Type': 'text/css',
            },
            payload,
        };
    }
}
