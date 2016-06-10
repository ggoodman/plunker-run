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
    
    return loadPreview(plunkId);
    
    
    function loadPreview(plunkId) {
        const slug = 'plunks/' + plunkId;
        const preview = server.methods.cache.get(slug);
        
        return preview
            ?   cb(null, preview)
            :   fetchPlunk(plunkId)
                    .then(mapTree)
                    .then(entries => Preview.fromEntries(slug, entries))
                    .tap(preview => {
                        server.methods.cache.put(preview);
                    })
                    .asCallback(cb);
    }
    
    function fetchPlunk(plunkId) {
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