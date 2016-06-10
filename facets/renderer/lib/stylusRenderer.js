const Bluebird = require('bluebird');
const Boom = require('boom');
const Stylus = require('stylus');


const REQUEST_MATCH = /\.css$/;
const SOURCE_EXT = '.styl';


module.exports = {
    name: 'stylus',
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
                etag: entry.etag + '-' + exports.name,
                headers: {
                    'Content-Type': 'text/css',
                },
                payload: '',
            });
        }
        
        return new Bluebird((resolve, reject) => {
            return Stylus(code)
                .set('filename', entry.pathname)
                .render((err, css) => {
                    if (err) {
                        return reject(err);
                    }
                    
                    return resolve(css);
                });
        })
            .catch(e => {
                preview.log({
                    renderer: 'stylus',
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
                'Content-Type': 'text/css',
            },
            payload,
        };
    }
}
