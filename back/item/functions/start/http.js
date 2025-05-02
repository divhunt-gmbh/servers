import http from 'http';

import divhunt from '#framework/load.js';
import servers from '#servers/addon.js';

servers.Fn('item.start.http', function(item)
{
    const { port, instance } = item.Get(['port', 'instance']);

    if(instance)
    {
        return console.log('HTTP Server already started.');
    }

    this.methods.init = () => 
    {   
        const httpServer = http.createServer(async (request, response) =>
        {
            const http = this.methods.data(request);

            item.Get('onRequest') && item.Get('onRequest')(request, response);
        
            divhunt.Emit('servers.http.request', http);
            await divhunt.Middleware('servers.http.request', http);

            this.methods.respond(http, response);
        });
        
        httpServer.listen(port, () =>
        {
            item.Set('instance', httpServer);

            item.Get('onStart') && item.Get('onStart')(httpServer);
    
            console.log('HTTP server started on port :1', port);
            divhunt.Emit('servers.http.start', httpServer);
        });
    };

    this.methods.respond = (http, response) => 
    {
        const types = {
            JSON: { contentType: 'application/json',       formatter: content => JSON.stringify(content) },
            HTML: { contentType: 'text/html',              formatter: content => content },
            CSS:  { contentType: 'text/css',               formatter: content => content },
            JSS:  { contentType: 'application/javascript', formatter: content => content }
        };
        
        const type = types[http.response.type];
        
        if(type)
        {
            const content = http.response.type === 'JSON' ? { data: http.response.data, message: http.response.message, code: http.response.code } : http.response.content;
                
            response.writeHead(http.response.code, { 'Content-Type': type.contentType });
            response.end(type.formatter(content));
        }
        else
        {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ message: 'Unknown response type', code: 404 }));
        }
    };

    this.methods.data = (request) => 
    {
        return {
            request,
            items: {},
            variables: {},
            response: {
                type: 'JSON',
                data: null,
                message: 'Request not found.',
                code: 404
            }
        };
    };

    this.methods.init();
});