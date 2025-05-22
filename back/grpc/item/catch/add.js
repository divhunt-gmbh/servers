import serversGRPC from '#servers/grpc/addon.js';

serversGRPC.ItemOn('add', function(item)
{
    item.Fn('start');
});