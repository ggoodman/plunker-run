'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const CoffeeScript = require('coffee-script');


const REQUEST_MATCH = /\.js/;
const SOURCE_EXT = '.coffee';


module.exports = {
    name: 'coffee-script',
    getRenderer,
};


function getRenderer(preview, pathname) {
    const sourcename = pathname.replace(REQUEST_MATCH, SOURCE_EXT);
    const entry = sourcename !== pathname
        ?   preview.get(sourcename)
        :   undefined;
    
    return entry
        ?   render
        :   undefined;
    
    
    function render(request) {
        const ifNoneMatch = request.headers['if-none-match'];
        const etagRx = new RegExp(`^"${entry.etag}\-${exports.name}-(gzip|deflate)"`);
        
        if (etagRx.test(ifNoneMatch)) {
            return Bluebird.resolve({
                encoding: 'utf-8',
                etag: entry.etag,
                headers: {
                    'Content-Type': 'text/css',
                },
                payload: '',
            });
        }
        
        return Bluebird.try(() => CoffeeScript.compile(entry.content.toString('utf8')))
            .catch(e => {
                preview.log({
                    renderer: 'coffee-script',
                    level: 'error',
                    pathname: entry.pathname,
                    row: e.location.first_line,
                    column: e.location.first_column,
                    message: e.message,
                    context: e.toString(),
                });
                
                throw Boom.wrap(e, 400);
            })
            .then(buildReply);
    }
    
    function buildReply(payload) {
        return {
            encoding: 'utf-8',
            etag: entry.etag + '-' + exports.name,
            headers: {
                'Content-Type': 'application/javascript',
            },
            payload,
        };
    }
}
