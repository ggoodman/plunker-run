const Mime = require('mime-types');


module.exports = {
    name: 'static',
    getRenderer,
};


function getRenderer(preview, pathname) {
    const entry = preview.get(pathname);
    
    return entry
        ?   render
        :   undefined;
    
    
    function render() {
        return {
            encoding: 'utf-8',
            headers: {
                'ETag': preview.etag,
                'Content-Type': Mime.lookup(entry.pathname) || 'text/plain',
            },
            payload: entry.content,
        };
    }
}
