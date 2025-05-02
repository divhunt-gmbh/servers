import divhunt from '#framework/load.js';

const servers = divhunt.Addon('servers', (addon) =>
{
    addon.Field('id', ['string']);
    addon.Field('instance', ['object']);
    addon.Field('type', ['string', 'http']);
    addon.Field('port', ['number', 3000]);

    addon.Field('onStart', ['function']);
    addon.Field('onRequest', ['function']);
});

export default servers;
