import serversGRPC from '#servers/grpc/addon.js';

const promises = {};

serversGRPC.Fn('item.resolve', function(item, id, payload = null) 
{
    if(payload !== null) 
    {
        if(id in promises) 
        {
            payload.time = (performance.now() - promises[id].time).toFixed(2)

            promises[id].resolve(payload);
            delete promises[id];
        }
        return;
    }

    setTimeout(() => 
    {
        if(id in promises) 
        {
            promises[id].reject('Request timed out after 5 seconds. No response received.');
            delete(promises[id]);
        }
    }, 5000);

    return new Promise((resolve, reject) => 
    {
        promises[id] = { resolve, reject, time: performance.now() };
    });
});