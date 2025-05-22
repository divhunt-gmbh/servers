import serversGRPC from '#servers/grpc/addon.js';

serversGRPC.Fn('item.find.stream', function(item, service)
{
    // We need to implement here logic which stream to get
    // In case there are many
    
    return Object.values(item.Get('streams')).find((stream) => stream.service === service);
});