import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import divhunt from '#framework/load.js';
import servers from '#servers/addon.js';

servers.Fn('item.start.grpc', function(item)
{
    const { port, instance } = item.Get(['port', 'instance']);

    if(instance)
    {
        item.Get('onError') && item.Get('onError')('gRPC Server already started.');
        return;
    }

    this.methods.init = () =>
    {
        const protoPath = join(dirname(fileURLToPath(import.meta.url)), '/../../../service.proto')
        
        const definition = protoLoader.loadSync(protoPath, 
        {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true
        })

        const universalPackage = grpc.loadPackageDefinition(definition).universal
        
        const options = {
            'grpc.max_send_message_length': 1024 * 1024 * 100,
            'grpc.max_receive_message_length': 1024 * 1024 * 100
        }

        const server = new grpc.Server(options)
            
        server.addService(universalPackage.UniversalService.service, 
        {
            execute: this.methods.execute
        })
        
        server.bindAsync('0.0.0.0:' + port, grpc.ServerCredentials.createInsecure(), (error) => 
        {
            if(error) 
            {
                item.Get('onError') && item.Get('onError')('gRPC Server bind failed: ' + error.message);
                return;
            }
            
            item.Set('instance', server);

            item.Get('onStart') && item.Get('onStart')(server);
            
            divhunt.Emit('servers.grpc.start', server);
        })
    }

    this.methods.execute = async (call, callback) =>
    {
        const grpc = this.methods.data(call);
        
        divhunt.Emit('servers.grpc.request.before', grpc);
        await divhunt.Middleware('servers.grpc.request.before', grpc);
        
        if(item.Get('onRequest'))
        {
            await Promise.resolve(item.Get('onRequest')(call, grpc));
        }
        
        divhunt.Emit('servers.grpc.request.after', grpc);
        await divhunt.Middleware('servers.grpc.request.after', grpc);
        
        this.methods.respond(grpc, callback);
    }
    
    this.methods.respond = (grpc, callback) =>
    {
        grpc.duration = (performance.now() - grpc.duration).toFixed(2);
        
        if(grpc.error)
        {
            item.Get('onError') && item.Get('onError')(grpc.error, grpc);
            return callback(new Error(grpc.error));
        }
        
        callback(null, {
            data: JSON.stringify(grpc.response.data), 
            code: grpc.response.code, 
            message: grpc.response.message
        });
        
        item.Get('onComplete') && item.Get('onComplete')(grpc);
    }
    
    this.methods.data = (call) =>
    {
        return {
            id: item.Get('id'),
            call,
            function: call.request.function,
            data: JSON.parse(call.request.data),
            items: {},
            variables: {},
            duration: performance.now(),
            response: {
                data: null,
                message: 'Request processed.',
                code: 200
            }
        };
    }
    
    this.methods.init();
});