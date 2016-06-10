'use strict';

const Bluebird = require('bluebird');
const Highlight = require('highlight.js');
const Markdown = require('markdown-it');

const md = Markdown({
    highlight: function(str, lang) {
        if (lang && Highlight.getLanguage(lang)) {
            try {
                return Highlight.highlight(lang, str).value;
            }
            catch (__) {}
        }

        try {
            return Highlight.highlightAuto(str).value;
        }
        catch (__) {}

        return ''; // use external default escaping
    }
});


const REQUEST_MATCH = /\.html/;
const SOURCE_EXT = ['.md', '.markdown'];


module.exports = {
    name: 'markdown',
    getRenderer,
};


function getRenderer(preview, pathname) {
    let entry;
    
    for (const ext of SOURCE_EXT) {
        const sourcename = pathname.replace(REQUEST_MATCH, ext);
        
        entry = sourcename !== pathname ? preview.get(sourcename) : undefined;
        
        if (entry) return render;
    }

    return;


    function render(request) {
        const ifNoneMatch = request.headers['if-none-match'];
        const etagRx = new RegExp(`^"${entry.etag}\-${exports.name}-(gzip|deflate)"`);
        
        if (etagRx.test(ifNoneMatch)) {
            return Bluebird.resolve({
                encoding: 'utf-8',
                etag: entry.etag,
                headers: {
                    'Content-Type': 'text/css',
                },
                payload: '',
            });
        }
        
        return Bluebird.resolve(md.render(entry.content.toString('utf8')))
            .then(wrapBody)
            .then(buildReply);
    }
    
    function wrapBody(body) {
        return `
            <!doctype html>
            <html>
                <head>
                    <link rel="stylesheet" href="https://cdn.rawgit.com/sindresorhus/github-markdown-css/v2.2.1/github-markdown.css">
                </head>
                <body class="markdown-body">
                    ${body}
                </body>
            </html>
        `.trim();
    }

    function buildReply(payload) {
        return {
            encoding: 'utf-8',
            etag: entry.etag + '-' + exports.name,
            headers: {
                'ETag': preview.etag,
                'Content-Type': 'text/html',
            },
            payload,
        };
    }
}
