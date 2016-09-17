const Bluebird = require('bluebird');
const Boom = require('boom');
const Jade = require('jade');
const Static = require('./staticRenderer');


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
        const code = entry.content.toString('utf8');
        
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
        
        
        function buildReply(payload) {
            const dynamicEntry = preview.addDynamicEntry(pathname, { content: payload }, [entry.pathname]);
                    
            return Static.renderStatic(request, dynamicEntry);
        }
    }
}
