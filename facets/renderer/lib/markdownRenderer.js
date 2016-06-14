'use strict';

const Bluebird = require('bluebird');
const Fs = require('fs');
const Highlight = require('highlight.js');
const Markdown = require('markdown-it');
const Static = require('./staticRenderer');


const REQUEST_MATCH = /\.html$/;
const SOURCE_EXT = ['.md', '.markdown'];
const HIGHLIGHT_CSS = Fs.readFileSync(require.resolve('highlight.js/styles/github.css'), 'utf8');
const MARKDOWN_CSS = Fs.readFileSync(require.resolve('github-markdown-css/github-markdown.css'), 'utf8');


module.exports = {
    name: 'markdown',
    getRenderer,
};


function getRenderer(preview, pathname) {
    let entry;
    let css = MARKDOWN_CSS;
    
    const md = Markdown({
        highlight: function(str, lang) {
            if (lang && Highlight.getLanguage(lang)) {
                try {
                    const html = Highlight.highlight(lang, str).value;
                    
                    css += '\n' + HIGHLIGHT_CSS;
                    
                    return html;
                }
                catch (e) {
                    preview.log({
                        renderer: 'markdown',
                        level: 'warn',
                        pathname: entry.pathname,
                        message: `Highlight failed: ${e.message}`,
                    });
                }
            }
    
            try {
                const html = Highlight.highlightAuto(str).value;
                    
                css = '\n' + HIGHLIGHT_CSS;
                
                return html;
            }
            catch (e) {
                preview.log({
                    renderer: 'markdown',
                    level: 'warn',
                    pathname: entry.pathname,
                    message: `Highlight failed: ${e.message}`,
                });
            }
    
            return ''; // use external default escaping
        }
    });
    
    if (preview.get(pathname)) {
        // Requested file exists. Don't compile
        return;
    }
    
    for (const ext of SOURCE_EXT) {
        const sourcename = pathname.replace(REQUEST_MATCH, ext);
        
        entry = sourcename !== pathname ? preview.get(sourcename) : undefined;
        
        if (entry) return render;
    }

    return;


    function render(request) {
        return Bluebird.resolve(md.render(entry.content.toString('utf8')))
            .then(wrapBody)
            .then(buildReply);
    }
    
    function wrapBody(body) {
        return `
            <!doctype html>
            <html>
                <head>
                    <style type="text/css">
                        ${css}
                    </style>
                </head>
                <body class="markdown-body">
                    ${body}
                </body>
            </html>
        `.trim();
    }

    function buildReply(payload) {
        const dynamicEntry = preview.addDynamicEntry(pathname, { content: payload }, [entry.pathname]);
                
        return Static.renderStatic(dynamicEntry);
    }
}
