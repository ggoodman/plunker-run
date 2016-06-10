'use strict';

const Bluebird = require('bluebird');
const Less = require('less');


const REQUEST_MATCH = /\.css$/;
const SOURCE_EXT = '.less';


module.exports = {
    name: 'less',
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
        const code = entry.content.toString('utf8');
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
        
        return Bluebird.try(() => Less.render(code))
            .catch(e => {
                preview.log({
                    renderer: 'less',
                    level: 'error',
                    pathname: entry.pathname,
                    row: e.line,
                    column: e.column,
                    message: e.message,
                    context: e.extract.join('\n'),
                });
                
                throw e;
            })
            .get('css')
            .then(buildReply);
    }
    
    function buildReply(payload) {
        return {
            encoding: 'utf-8',
            etag: entry.etag + '-' + exports.name,
            headers: {
                'ETag': preview.etag,
                'Content-Type': 'text/css',
            },
            payload,
        };
    }
}
