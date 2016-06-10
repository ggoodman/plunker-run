const Bluebird = require('bluebird');
const Boom = require('boom');
const Jade = require('jade');


const REQUEST_MATCH = /\.html$/;
const SOURCE_EXT = '.jade';


module.exports = {
    name: 'jade',
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
        const code = entry.content.toString('utf8');
        
        if (etagRx.test(ifNoneMatch)) {
            return Bluebird.resolve({
                encoding: 'utf-8',
                etag: entry.etag,
                headers: {
                    'Content-Type': 'text/html',
                },
                payload: '',
            });
        }
        
        return Bluebird.try(() => {
            const fn = Jade.compile(code, { filename: entry.pathname, compileDebug: true });
            
            return fn();
        })
            .catch(e => {
                preview.log({
                    renderer: 'jade',
                    level: 'error',
                    pathname: entry.pathname,
                    message: e.message,
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
                'Content-Type': 'text/html',
            },
            payload,
        };
    }
}
