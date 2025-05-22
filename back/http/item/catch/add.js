import serversHTTP from '#servers/http/addon.js';

serversHTTP.ItemOn('add', function(item)
{
    item.Fn('start');
});