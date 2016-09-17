/* global MessageChannel,Response,self,caches,fetch */

self.addEventListener('install', onInstall);
self.addEventListener('activate', onActivate);
self.addEventListener('fetch', onFetch);
self.addEventListener('message', onMessage);


function onActivate(event) {
    // console.log('activate', event);
    event.waitUntil(self.clients.claim());
}

function onInstall(event) {
    // console.log('install', event);
    event.waitUntil(self.skipWaiting());
}

function onFetch(event) {
    var time = 'Fetch ' + event.request.url;
    console.time(time);
    
    var response$ = self.clients.matchAll({
        includeUncontrolled: true,
    })
        .then(filterToClientId)
        .then(mapRequestToClient)
        .catch(serveWithCacheAndFetch)
        .then(function (res) { console.timeEnd(time); return res; });
    
    return event.respondWith(response$);
    
        
    function serveWithCacheAndFetch(e) {
        console.log('Serving with cache and fetch', e, event.request.url);
        return caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        });
    }
    
    function filterToClientId(clientList) {
        for(var i = 0 ; i < clientList.length ; i++) {
            var client = clientList[i];
            
            if (client.url === 'https://run.plunker.co/sw.html') {
                return client;
            }
        }
        
        return Promise.reject(new Error('Unable to obtain Client'));
    }
    
    function mapRequestToClient(client) {
        var time = 'Request ' + event.request.url;
        console.time(time);
        
        return new Promise(function (resolve, reject) {
            var channel = new MessageChannel();
            var timeout = setTimeout(function () {
                channel.port1.close();
                channel.port2.close();
                
                reject(new Error('Response timed out'));
            }, 3000);
            
            channel.port1.onmessage = function (event) {
                clearTimeout(timeout);
                
                channel.port1.close();
                
                if (!event.data || !event.data.type) {
                    return reject(new Error('Unexpected messagechannel response'));
                }
                
                switch (event.data.type) {
                    case 'error': return reject(new Error(event.data.error));
                    case 'response': return resolve(new Response(event.data.body, {
                        status: event.data.status || 200,
                        statusText: event.data.statusText || 'OK',
                        headers: event.data.headers || {},
                    }));
                    default: return reject(new Error('Unexpected messagechannel message type: `' + event.data.type + '`'));
                }
            };
            
            client.postMessage({
                type: 'fetch',
                url: event.request.url
            }, [channel.port2]);
        })
        .then(function (res) { console.timeEnd(time); return res; });
    }
}

function onMessage(event) {
    console.log('sw.js@message', event);
}