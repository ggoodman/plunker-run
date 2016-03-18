const Bluebird = require('bluebird');
const Less = require('less');


const REQUEST_MATCH = /\.css/;
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
    
    
    function render() {
        return Bluebird.resolve(Less.render(entry.content.toString('utf8')))
            .catch(e => {
                console.error(e);
                throw e;
            })
            .get('css')
            .then(buildReply);
    }
    
    function buildReply(payload) {
        return {
            encoding: 'utf-8',
            headers: {
                'ETag': preview.etag,
                'Content-Type': 'text/css',
            },
            payload,
        };
    }
}
