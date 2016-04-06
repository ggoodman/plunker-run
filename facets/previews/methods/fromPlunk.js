'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const Preview = require('../lib/preview');
const Wreck = require('wreck');
const _ = require('lodash');

module.exports = fromPlunk;


function fromPlunk(plunkId) {
    const config = this.config;
    const server = this.server;
    
    return loadPreview(plunkId);
    
    
    function loadPreview(plunkId) {
        const slug = 'plunks/' + plunkId;
        const preview = server.methods.cache.get(slug);
        
        return preview
            ?   preview
            :   fetchPlunk(plunkId)
                    .then(plunk => fetchTree(plunk.tree_sha))
                    .then(mapTree)
                    .then(entries => Preview.fromEntries(slug, entries))
                    .tap(preview => server.methods.cache.put(slug, preview));
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
    
    
    function fetchTree(treeSha) {
        return new Bluebird((resolve, reject) => {
            Wreck.get(`${config.api.uri}/trees/${treeSha}`, {
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
    
    function mapTree(entries) {
        return _(entries)
            .filter({ type: 'file' })
            .keyBy('pathname')
            .mapValues(entry => {
                return {
                    pathname: entry.pathname,
                    content: entry.content,
                    encoding: entry.charset,
                };
            })
            .value();
    }
}