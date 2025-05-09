import http from 'http';

import divhunt from '#framework/load.js';
import servers from '#servers/addon.js';

servers.Fn('item.start.http', function(item)
{
    const { port, instance } = item.Get(['port', 'instance']);

    if(instance)
    {
        item.Get('onError') && item.Get('onError')('HTTP Server already started.');
        return;
    }

    this.methods.init = () => 
    {   
        const httpServer = http.createServer(async (request, response) =>
        {
            const http = this.methods.data(request);

            try
            {
                divhunt.Emit('servers.http.request.before', http);
                await divhunt.Middleware('servers.http.request.before', http);

                if(item.Get('onRequest'))
                {
                    await Promise.resolve(item.Get('onRequest')(request, http));
                }
            
                divhunt.Emit('servers.http.request.after', http);
                await divhunt.Middleware('servers.http.request.after', http);

                this.methods.respond(http, response);
            }
            catch(error)
            {
                http.error = error.message || 'Internal server error';
                
                item.Get('onError') && item.Get('onError')(http.error, http);
                
                this.methods.respond(http, response);
            }
        });
        
        httpServer.on('error', (error) =>
        {
            item.Get('onError') && item.Get('onError')('HTTP Server error: ' + error.message);
        });
        
        httpServer.listen(port, () =>
        {
            item.Set('instance', httpServer);

            item.Get('onStart') && item.Get('onStart')(httpServer);
    
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

        http.duration = (performance.now() - http.duration).toFixed(2);
        
        if(http.error)
        {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ message: http.error, code: 500, duration: http.duration }));
            return;
        }
        
        if(type)
        {
            const content = http.response.type === 'JSON' ? { data: http.response.data, message: http.response.message, code: http.response.code, duration: http.duration } : http.response.content;
                
            response.writeHead(http.response.code, { 'Content-Type': type.contentType });
            response.end(type.formatter(content));
        }
        else
        {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ message: 'Resource not found', code: 404, duration: http.duration }));
        }
        
        item.Get('onComplete') && item.Get('onComplete')(http);
    };

    this.methods.data = (request) => 
    {
        return {
            id: item.Get('id'),
            request,
            data: servers.Fn('data.http', request),
            items: {},
            variables: {},
            duration: performance.now(),
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