import divhunt from '#framework/load.js';
import serversGRPC from '#servers/grpc/addon.js';

serversGRPC.Fn('item.stream', function(item, stream)
{
    stream.id = divhunt.GenerateUID();

    /* Request Method */

    stream.request = function(name, data, id = null)
    {
        id = id ? id : divhunt.GenerateUID();

        stream.write({
            data: JSON.stringify({type: 'request', name, data, id})
        });

        item.Get('onStreamRequest') && item.Get('onStreamRequest')(stream, {type: 'request', name, data, id});

        return item.Fn('resolve', id);
    };

    /* Respond Method */

    stream.respond = function(data, message, code, id = null)
    {
        id = id ? id : divhunt.GenerateUID();

        stream.write({
            data: JSON.stringify({type: 'respond', data, message, code, id})
        });

        item.Get('onStreamRespond') && item.Get('onStreamRespond')(stream, {type: 'respond', data, message, code, id});
    };
   
    /* Data Event */

    stream.on('data', (response) => 
    {
        const payload = JSON.parse(response.data);

        if(payload.type === 'respond')
        {
            item.Fn('resolve', payload.id, payload);
        }

        item.Get('onStreamData') && item.Get('onStreamData').call(item, stream, payload);
    })

    /* Other Events */

    stream.on('close', () => 
    {
        item.Get('onStreamClose') && item.Get('onStreamClose')(stream);
    })

    stream.on('error', (error) => 
    {
        item.Get('onStreamError') && item.Get('onStreamError')(stream, error);
    })

    stream.on('end', () => 
    {
        item.Get('onStreamEnd') && item.Get('onStreamEnd')(stream);
    })

    /* Other */

    item.Get('onStreamConnect') && item.Get('onStreamConnect')(stream);
});