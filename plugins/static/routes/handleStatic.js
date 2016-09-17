var Path = require('path');

module.exports = function (pathname) {
    return {
        auth: false,
        handler: {
            file: Path.join(__dirname, '..', 'assets', pathname),
        },
    };
};