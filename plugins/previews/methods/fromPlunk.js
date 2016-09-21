'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const Preview = require('../lib/preview');
const Wreck = require('wreck');
const _ = require('lodash');

module.exports = fromPlunk;


function fromPlunk(plunkId, cb) {
    const config = this.config;
    const server = this.server;
    const cacheGet = Bluebird.promisify(server.methods.cache.get);
    const cachePut = Bluebird.promisify(server.methods.cache.put);
    const slug = 'plunks/' + plunkId;

    return loadPreview(plunkId)
        .asCallback(cb);


    function loadPreview() {
        const preview = cacheGet(slug);

        return preview
            .then(preview =>
                preview
                    ?   preview
                    :   createPreviewFromPlunk(plunkId)
            );
    }

    function createPreviewFromPlunk() {
        return fetchPlunk(plunkId)
            .then(mapTree)
            .then(entries => Preview.fromEntries(slug, entries))
            .tap(cachePut);
    }

    function fetchPlunk() {
        return new Bluebird((resolve, reject) => {
            Wreck.get(`${config.api.uri}/plunks/${plunkId}`, {
                timeout: 3000,
                json: true,
            }, onResponse);


            function onResponse(err, response, payload) {
                if (err) return reject(err);

                switch (response.statusCode) {
                    case 200: return resolve(payload);
                    case 404: return reject(Boom.notFound());
                    default: return reject(Boom.badGateway());
                }
            }
        });
    }

    function mapTree(plunk) {
        return _.mapValues(plunk.files, (entry, pathname) => {
            return {
                pathname,
                content: entry.content,
                encoding: 'utf8',
            };
        });
    }
}