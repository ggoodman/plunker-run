'use strict';

const Crypto = require('crypto');
const Fs = require('fs');
const Path = require('path');


module.exports = function (server, pathname) {
    const resolvedPath = Path.resolve(Path.join(__dirname, '..', 'assets', pathname));
    const content = Fs.readFileSync(resolvedPath, 'binary');
    const etag = Crypto.createHash('md5').update(content).digest('hex');
    const type = server.mime.path(resolvedPath).type || 'application/octet-stream';

    return {
        handler,
        auth: false,
        cache: {
            privacy: 'public',
            expiresIn: 60 * 60,
        },
    };


    function handler(request, reply) {
        const response = reply.entity({ etag });

        if (!response) {
            return reply(content)
                .etag(etag)
                .type(type);
        }
    }
};