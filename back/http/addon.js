import divhunt from '#framework/load.js';

const serversHTTP = divhunt.Addon('servers.http', (addon) =>
{
    addon.Field('id', ['string']);
    addon.Field('instance', ['object']);
    addon.Field('port', ['number', 3000]);

    addon.Field('onStart', ['function']);
    addon.Field('onRequest', ['function']);
    addon.Field('onError', ['function']);
    addon.Field('onComplete', ['function']);
});

export default serversHTTP;