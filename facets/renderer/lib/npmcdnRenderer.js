'use strict';

const _ = require('lodash');


const npmRx = /^node_modules\/((?:@[^\/]+\/)?[^\/]+)\/(.*)$/;

module.exports = {
    name: 'npmcdn',
    getRenderer,
};


function getRenderer(preview, pathname) {
    const matches = pathname.match(npmRx);
    
    return matches
        ?   render
        :   undefined;
    
    
    function render(request) {
        const packageJson = preview.get('package.json');
        const dependencies = packageJson
            ?   parseJson(packageJson.content.toString('utf8'))
            :   {};
        const path = getRequestPath(matches[1], matches[2], dependencies);
        const uri = `https://npmcdn.com/${path}`;
        
        return {
            headers: {
                'content-type': 'text/html',
                'location': uri,
            },
            statusCode: 302,
            payload: `redirecting you to <a href="${uri}">${uri}</a>`,
        };
    }
    
    function parseJson(content) {
        try {
            const json = JSON.parse(content);
            
            return _.defaults({}, json.dependencies, json.devDepenencies);
        } catch (e) {
            return {};
        }
    }
    
    function getRequestPath(module, pathname, dependencies) {
        const spec = dependencies[module];
        
        return `${module}${spec ? `@${spec}` : ''}/${pathname}`;
    }
}
