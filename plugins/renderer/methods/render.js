'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const _ = require('lodash');

module.exports = render;

const renderers = [
    require('../lib/babelRenderer'),
    require('../lib/typescriptRenderer'),
    require('../lib/base64Renderer'),
    require('../lib/staticRenderer'),
    require('../lib/npmcdnRenderer'),
    require('../lib/lessRenderer'),
    require('../lib/markdownRenderer'),
    require('../lib/coffeeRenderer'),
    require('../lib/jadeRenderer'),
    require('../lib/sassRenderer'),
    require('../lib/stylusRenderer'),
];



function render(request, reply) {
    const pathname = request.params.pathname;
    const preview = request.pre.preview;
    const candidates = pathname
        ?   [pathname]
        :   ['index.html', 'README.html', 'demo.html'];

    if (!preview) {
        return Bluebird.reject(Boom.notFound());
    }


    for (let candidate of candidates) {
        const found = findRenderer(preview, candidate);

        if (found) {
            const start = Date.now();

            return Bluebird.try(() => found.render(request, reply))
                .tap(() => {
                    request.server.statsd.increment(`renderer.${found.name}.success.count`);
                    request.server.statsd.increment(`renderer.success.count`, [`renderer:${found.name}`]);
                })
                .catch((error) => {
                    request.server.statsd.increment(`renderer.${found.name}.error.count`);
                    request.server.statsd.increment(`renderer.error.count`, [`renderer:${found.name}`]);

                    throw error;
                })
                .finally(() => {
                    request.server.statsd.increment(`renderer.${found.name}.count`);
                    request.server.statsd.histogram(`renderer.latency`, Date.now() - start, [`renderer:${found.name}`]);
                    request.server.statsd.histogram(`renderer.${found.name}.latency`, Date.now() - start);
                });
        }
    }

    return Bluebird.reject(Boom.notFound());
}

function findRenderer(preview, pathname) {
    for (let renderer of renderers) {
        const render = renderer.getRenderer(preview, pathname);

        if (render) {
            return { render, name: renderer.name };
        }
    }
}
