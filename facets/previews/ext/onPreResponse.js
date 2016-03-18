'use strict';

module.exports = onPreResponse;


function onPreResponse(request, reply) {
    const response = request.response;
    
    if (!response.isBoom) {
        return reply.continue();
    }
    
    const error = response;
    
    reply.view('error', error.output.payload);
}