'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const Cache = require('async-cache');
const Path = require('path');
const Sass = require('node-sass');
const Static = require('./staticRenderer');
const Wreck = require('wreck');
const _ = require('lodash');


const REQUEST_MATCH = /\.css$/;
const SOURCE_EXT = ['.sass', '.scss'];

const REMOTE_STYLES = new Cache({
    max: 10,
    maxAge: 1000 * 20,
    load: loadRemote,
});


module.exports = {
    name: 'sass',
    getRenderer,
};


function getRenderer(preview, pathname) {
    let sourcename;
    let entry;

    for (const ext of SOURCE_EXT) {
        sourcename = pathname.replace(REQUEST_MATCH, ext);
        entry = REQUEST_MATCH.test(pathname)
            ?   preview.get(sourcename)
            :   undefined;

        if (entry) {
            return render;
        }
    }

    return;


    function render(request) {
        const code = entry.content.toString('utf8');
        const dependencies = [entry.pathname];

        return new Bluebird((resolve, reject) => {
            return Sass.render({
                file: `/${sourcename}`,
                data: code,
                importer,
                indentedSyntax: !!sourcename.match(/\.sass$/),
            }, (err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(result.css);
            });


            function importer(url, prev, done) {
                const isUrl = url.match(/^https?:\/\//);

                if (isUrl) {
                    return REMOTE_STYLES.get(url, (err, result) => done(err || result));
                }

                const importPathname = Path.resolve(Path.dirname(prev), url);
                const imported = preview.get(importPathname.split('/').filter(Boolean).join('/'));

                if (!imported && url.match(/^node_modules\//)) {
                    return REMOTE_STYLES.get(_.get(request.server.app.config, 'run.uri', 'https://run.plnkr.co') + '/preview/' + request.params.previewId + '/' + url, (err, result) => done(err || result));
                }

                if (!imported) {
                    return done(Boom.notFound(`Import failed for '${importPathname}': Not found`));
                }

                dependencies.push(importPathname);

                const file = importPathname;
                const contents = imported.content.toString('utf8');

                return done({ file, contents });
            }
        })
            .catch(e => {
                const lines = code.split('\n');

                preview.log({
                    renderer: 'sass',
                    level: 'error',
                    pathname: entry.pathname,
                    row: e.line - 1, // Sass rows are 1-based
                    column: e.column - 1, // Sass columns are 1-based
                    message: e.message,
                    context: lines.slice(Math.max(0, e.line - 1), Math.min(lines.length - 1, e.line + 1)),
                });

                throw Boom.wrap(e, 400);
            })
            .then(buildReply);


        function buildReply(payload) {
            const dynamicEntry = preview.addDynamicEntry(pathname, { content: payload }, dependencies);

            return Static.renderStatic(request, dynamicEntry);
        }
    }
}

function loadRemote(url, cb) {
    return Wreck.get(url, { redirects: 3 }, (err, res, body) => {
        if (err) return cb(err);
        if (res.statusCode >= 400) {
            return cb(Boom.create(res.statusCode));
        }

        const file = url;
        const contents = body.toString('utf8');

        return cb(null, { file, contents });
    });
}