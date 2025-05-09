import servers from '#servers/addon.js';

servers.ItemOn('add', function(item)
{
    switch(item.Get('type').toLowerCase())
    {
        case 'http':
            item.Fn('start.HTTP');
            break;
        case 'grpc':
            item.Fn('start.gRPC');
            break;
        default:
            console.log('Server type does not exist.');
    }
});