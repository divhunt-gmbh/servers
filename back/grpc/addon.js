// © 2025 Divhunt GmbH — Licensed under the Divhunt Framework License. See LICENSE for terms.

import divhunt from '#framework/load.js';

const serversGRPC = divhunt.Addon('servers.grpc', (addon) =>
{
    addon.Field('id', ['string']);
    addon.Field('instance', ['object']);
    addon.Field('port', ['number', 50000]);
    addon.Field('host', ['string', '0.0.0.0']);

    addon.Field('onError', ['function']);
    addon.Field('onStart', ['function']);
    
    addon.Field('onStreamConnect', ['function']);
    addon.Field('onStreamError', ['function']);
    addon.Field('onStreamEnd', ['function']);
    addon.Field('onStreamData', ['function']);
    addon.Field('onStreamRequest', ['function']);
    addon.Field('onStreamRespond', ['function']);
});

export default serversGRPC;