'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const Static = require('./staticRenderer');


const REQUEST_MATCH = /\.base64(\..+)$/;
const SOURCE_EXT = '$1';


module.exports = {
    name: 'base64',
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
        const content = new Buffer(entry.content, 'base64');
        const dynamicEntry = preview.addDynamicEntry(pathname, { content }, [ entry.pathname ]);

        return Static.renderStatic(request, dynamicEntry);
    }
}
