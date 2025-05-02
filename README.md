# addon-servers

A server management addon for the DivHunt framework that simplifies HTTP server creation and management.

## Usage

Import the servers module:

```javascript
import servers from '#servers/load.js';
```

Create an HTTP server:

```javascript
const httpServer = servers.Item({
    type: 'http',
    port: 3000,
    onStart: (server) => {
        // Logic to run when server starts
    },
    onRequest: (request, response) => {
        // Handle incoming requests
    }
});
```

## Configuration

The server item accepts the following configuration fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| instance | object | - | Server instance object |
| type | string | 'http' | Server type |
| port | number | 3000 | Port number |
| onStart | function | - | Callback when server starts |
| onRequest | function | - | Callback for handling requests |

## Features

- HTTP server management
- Request and response handling
- Server lifecycle hooks
- Extendable architecture

## Additional Servers

The addon appears to support other server types like gRPC (commented out in the load.js file).