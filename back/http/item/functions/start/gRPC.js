import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import divhunt from '#framework/load.js';
import servers from '../../../addon.js';

servers.Fn('item.start.gRPC', function(item)
{
    const { port } = item.Get(['port']);
    const connectedClients = new Map();

    this.methods.init = async () =>
    {
        const grpcModule = await import('@grpc/grpc-js');
        const protoLoaderModule = await import('@grpc/proto-loader');

        const grpc = grpcModule.default || grpcModule;
        const protoLoader = protoLoaderModule.default || protoLoaderModule;

        const protoPath = join(dirname(fileURLToPath(import.meta.url)), '/../../../discovery.proto')
        
        const definition = protoLoader.loadSync(protoPath, 
        {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true
        })

        const discoveryPackage = grpc.loadPackageDefinition(definition).discovery
        
        const options = {
            'grpc.max_send_message_length': 1024 * 1024 * 100,
            'grpc.max_receive_message_length': 1024 * 1024 * 100
        }

        const server = new grpc.Server(options)
        
        server.addService(discoveryPackage.DiscoveryService.service, 
        {
            register: this.methods.register,
            listClients: this.methods.listClients,
            executeRemote: this.methods.executeRemote,
            broadcastRemote: this.methods.broadcastRemote
        })
        
        server.bindAsync('0.0.0.0:' + port, grpc.ServerCredentials.createInsecure(), (error) => 
        {
            if(error) 
            {
                item.Get('onError') && item.Get('onError')('Central Server bind failed: ' + error.message);
                return;
            }
            
            item.Set('instance', server);
            item.Get('onStart') && item.Get('onStart')(server);
            
            divhunt.Emit('servers.central.start', server);
        })
    }
    
    this.methods.register = (call, callback) =>
    {
        const request = call.request;
        const id = request.id;
        const endpoint = request.endpoint;
        
        connectedClients.set(id, {
            id,
            endpoint,
            connected: true,
            lastSeen: Date.now()
        });
        
        divhunt.Emit('servers.central.client.register', {id, endpoint});
        
        callback(null, {
            success: true,
            message: 'Registered successfully'
        });
    }
    
    this.methods.listClients = (call, callback) =>
    {
        const clients = [];
        
        for (const [id, client] of connectedClients.entries())
        {
            clients.push({
                id: client.id,
                endpoint: client.endpoint
            });
        }
        
        callback(null, {
            clients: clients
        });
    }
    
    this.methods.executeRemote = async (call, callback) =>
    {
        const request = call.request;
        const targetId = request.targetId;
        const functionName = request.function;
        const dataStr = request.data;
        const sourceId = request.sourceId;
        
        if (sourceId === targetId)
        {
            return callback(null, {
                success: false,
                message: 'Source and target clients cannot be the same to prevent infinite loops'
            });
        }
        
        const targetClient = connectedClients.get(targetId);
        
        if (!targetClient)
        {
            return callback(null, {
                success: false,
                message: `Client ${targetId} not found`
            });
        }
        
        try
        {
            const grpcModule = await import('@grpc/grpc-js');
            const protoLoaderModule = await import('@grpc/proto-loader');
            
            const grpc = grpcModule.default || grpcModule;
            const protoLoader = protoLoaderModule.default || protoLoaderModule;
            
            const protoPath = join(dirname(fileURLToPath(import.meta.url)), '/../../../service.proto');
            
            const definition = protoLoader.loadSync(protoPath, {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true
            });
            
            const universalPackage = grpc.loadPackageDefinition(definition).universal;
            
            const client = new universalPackage.UniversalService(
                targetClient.endpoint, 
                grpc.credentials.createInsecure(),
                {
                    'grpc.max_send_message_length': 1024 * 1024 * 100,
                    'grpc.max_receive_message_length': 1024 * 1024 * 100
                }
            );
            
            client.execute({
                function: functionName,
                data: dataStr
            }, (error, response) => 
            {
                if (error)
                {
                    return callback(null, {
                        success: false,
                        message: `Error executing function: ${error.message}`
                    });
                }
                
                callback(null, {
                    success: true,
                    data: response.data,
                    code: response.code,
                    message: response.message
                });
            });
        }
        catch (error)
        {
            callback(null, {
                success: false,
                message: `Error connecting to client: ${error.message}`
            });
        }
    }
    
    this.methods.broadcastRemote = async (call, callback) =>
    {
        const request = call.request;
        const functionName = request.function;
        const dataStr = request.data;
        const sourceId = request.sourceId;
        const excludeIds = request.excludeIds || [];
        
        if (!sourceId)
        {
            return callback(null, {
                success: false,
                message: 'Source ID is required'
            });
        }
        
        const promises = [];
        
        for (const [id, client] of connectedClients.entries())
        {
            if (id === sourceId || excludeIds.includes(id))
            {
                continue;
            }
            
            const promise = new Promise(async (resolve) => 
            {
                try
                {
                    const grpcModule = await import('@grpc/grpc-js');
                    const protoLoaderModule = await import('@grpc/proto-loader');
                    
                    const grpc = grpcModule.default || grpcModule;
                    const protoLoader = protoLoaderModule.default || protoLoaderModule;
                    
                    const protoPath = join(dirname(fileURLToPath(import.meta.url)), '/../../../service.proto');
                    
                    const definition = protoLoader.loadSync(protoPath, {
                        keepCase: true,
                        longs: String,
                        enums: String,
                        defaults: true,
                        oneofs: true
                    });
                    
                    const universalPackage = grpc.loadPackageDefinition(definition).universal;
                    
                    const grpcClient = new universalPackage.UniversalService(
                        client.endpoint, 
                        grpc.credentials.createInsecure(),
                        {
                            'grpc.max_send_message_length': 1024 * 1024 * 100,
                            'grpc.max_receive_message_length': 1024 * 1024 * 100
                        }
                    );
                    
                    grpcClient.execute({
                        function: functionName,
                        data: dataStr
                    }, (error, response) => 
                    {
                        if (error)
                        {
                            resolve({
                                id: client.id,
                                success: false,
                                message: error.message
                            });
                            return;
                        }
                        
                        resolve({
                            id: client.id,
                            success: true,
                            data: response.data,
                            code: response.code,
                            message: response.message
                        });
                    });
                }
                catch (error)
                {
                    resolve({
                        id: client.id,
                        success: false,
                        message: error.message
                    });
                }
            });
            
            promises.push(promise);
        }
        
        const results = await Promise.all(promises);
        
        callback(null, {
            results: results
        });
    }
    
    this.methods.init();
});