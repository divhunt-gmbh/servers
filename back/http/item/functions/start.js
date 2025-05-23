import http from 'http';
import serversHTTP from '#servers/http/addon.js';
import divhunt from '#framework/load.js';

serversHTTP.Fn('item.start', function(item)
{
    if(item.Get('instance'))
    {
        item.Get('onError') && item.Get('onError')('HTTP Server already started.');
        return;
    }

    this.methods.createHttpObject = async (request) =>
    {
        return {
            id: divhunt.GenerateUID(),
            request,
            data: await serversHTTP.Fn('data', request),
            time: performance.now(),
            error: null,
            response: {
                type: 'JSON',
                data: null,
                message: 'Request processed successfully.',
                code: 200
            }
        };
    };

    this.methods.respond = (http, response) => 
    {
        const types = {
            JSON: { contentType: 'application/json', formatter: content => JSON.stringify(content) },
            HTML: { contentType: 'text/html', formatter: content => String(content) },
            CSS:  { contentType: 'text/css', formatter: content => String(content) },
            JS:   { contentType: 'application/javascript', formatter: content => String(content) }
        };
        
        const type = types[http.response.type] || types.JSON;
        http.time = (performance.now() - http.time).toFixed(2);
        
        if(http.error)
        {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ 
                data: {}, 
                message: http.error, 
                code: 500, 
                time: http.time 
            }));
            return;
        }
        
        const content = http.response.type === 'JSON' ? { 
            data: http.response.data || {}, 
            message: http.response.message, 
            code: http.response.code, 
            duration: http.duration 
        } : http.response.data || '';
                
        response.writeHead(http.response.code, { 'Content-Type': type.contentType });
        response.end(type.formatter(content));
        
        item.Get('onComplete') && item.Get('onComplete')(http);
    };

    this.methods.init = () => 
    {
        const httpServer = http.createServer(async (request, response) =>
        {
            const http = await this.methods.createHttpObject(request);

            try
            {
                if(item.Get('onRequest'))
                {
                    await Promise.resolve(item.Get('onRequest')(http));
                }

                this.methods.respond(http, response);
            }
            catch(error)
            {
                http.error = error.message || 'Internal server error';
                
                item.Get('onError') && item.Get('onError')(http.error);
                
                this.methods.respond(http, response);
            }
        });
        
        httpServer.on('error', (error) =>
        {
            item.Get('onError') && item.Get('onError')(error.message);
        });
        
        httpServer.listen(item.Get('port'), () =>
        {
            item.Set('instance', httpServer);
            item.Get('onStart') && item.Get('onStart')(httpServer);
        });
    };

    this.methods.init();
});