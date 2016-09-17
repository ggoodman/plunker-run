'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const CoffeeScript = require('coffee-script');
const Static = require('./staticRenderer');


const REQUEST_MATCH = /\.js$/;
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
        
        
        function buildReply(payload) {
            const dynamicEntry = preview.addDynamicEntry(pathname, { content: payload }, [entry.pathname]);
                    
            return Static.renderStatic(request, dynamicEntry);
        }
    }
}
