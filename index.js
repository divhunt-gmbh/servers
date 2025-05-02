console.log('Hi there!');

import servers from '#servers/load.js';

const httpServer = servers.Item({
    type: 'http',
    port: 3000,
    onStart: (server) => 
    {

    },
    onRequest: (request, response) => 
    {

    }
})