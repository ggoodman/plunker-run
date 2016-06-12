const Mime = require('mime-types');


module.exports = {
    name: 'static',
    getRenderer,
    renderStatic,
};


function getRenderer(preview, pathname) {
    const entry = preview.get(pathname);
    
    return entry
        ?   render
        :   undefined;
    
    
    function render() {
        return renderStatic(entry);
    }
}

function renderStatic(entry) {
    return {
        encoding: 'utf-8',
        etag: entry.etag + '-' + exports.name,
        headers: {
            'Content-Type': Mime.lookup(entry.pathname) || 'text/plain',
        },
        payload: entry.content,
    };
}