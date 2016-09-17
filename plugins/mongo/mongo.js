'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const Hoek = require('hoek');
const Joi = require('joi');
const Mongo = require('mongodb');
const _ = require('lodash');


const internals = {};


exports.register = register;
exports.register.attributes = {
    name: 'mongo',
    version: '1.0.0',
    dependencies: [
    ],
};


function register(server, options, next) {
    const results = Joi.validate(options.config.run.db, internals.schema);
    Hoek.assert(!results.error, results.error);
    const config = results.value;

    Mongo.MongoClient.connect(config.uri, _.defaults(config.options, {
        promiseLibrary: Bluebird,
        server: {
            auto_reconnect: true,
            socketOptions: {
                keepAlive: 1000,
            },
        },
        replset: {
            auto_reconnect: true,
            socketOptions: {
                keepAlive: 1000,
            },
        },
    })).then(
        db => {
            db.on('error', onDbError);
            db.on('fullsetup', onDbFullSetup);
            db.on('timeout', onDbTimeout);

            server.expose('db', db);
            server.expose('READ_TIMEOUT', 250);
            server.expose('WRITE_TIMEOUT', 500);

            server.log(['info', 'init', 'mongo'], `Started ${exports.register.attributes.name}@${exports.register.attributes.version}.`);

            next();
        },
        error => {
            if (error) {
                server.log(['error', 'mongo'], {
                    error: error.message,
                    message: 'Error connecting to the db',
                });

                return next(Boom.wrap(error, 503));
            }
        }
    );


    function onDbError(error) {
        console.log(['error', 'mongo'], {
            error: error.message,
            message: 'Received error event on Mongo Db object',
        });
    }

    function onDbFullSetup() {
        console.log('onDbFullSetup', arguments);
        console.log(['info', 'mongo'], {
            message: 'Fully connected to mongo db',
        });
    }

    function onDbTimeout(error) {
         console.log(['warn', 'mongo'], {
            error: error.message,
            message: 'Received timeout event on Mongo Db object',
        });
    }
}

internals.schema = Joi.object({
    uri: Joi.string().uri({ scheme: ['mongodb'] }).required(),
    options: Joi.object().optional(),
});