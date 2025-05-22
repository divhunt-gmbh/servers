# Servers Module

HTTP and gRPC server implementations for the application framework providing multiple communication protocols.

## HTTP Server

REST API server with comprehensive request handling and middleware integration.

### Features

**Request Processing:**
- Automatic data parsing from query parameters and request body
- Type conversion with hints (`:string`, `:number`, `:boolean`, `:array`, `:object`)
- URL parameter extraction from dynamic routes
- JSON body parsing for POST/PUT requests

**Response Formatting:**
- Multiple content types: JSON, HTML, CSS, JavaScript
- Automatic response wrapping with data, message, code, and duration
- Error handling with standardized error responses
- Request timing and performance metrics

**Middleware Integration:**
- Command routing through middleware system
- Request/response lifecycle hooks
- Error catching and logging
- Custom callback support for request handling

### Configuration

```javascript
serversHTTP.Item({
    id: 'main',
    port: 3000,
    onStart: (server) => console.log('HTTP server started'),
    onRequest: (http) => {
        console.log(`${http.request.method} ${http.request.url}`);
    },
    onError: (error) => console.log('Server error:', error),
    onComplete: (http) => {
        console.log(`Request completed in ${http.time}ms`);
    }
});
```

## gRPC Server

High-performance bidirectional streaming server using Protocol Buffers for real-time communication.

### Features

**Streaming Communication:**
- Universal service with single stream method
- Bidirectional streaming for real-time data exchange
- JSON message serialization over Protocol Buffers
- Stream lifecycle management with connection tracking

**Command Integration:**
- Direct command execution through streaming interface
- Promise-based request/response pattern
- Automatic command resolution and timeout handling
- Error propagation and handling

**Stream Management:**
- Connection lifecycle callbacks (connect, data, close, end, error)
- Stream identification and tracking
- Request/response correlation with unique IDs
- Timeout handling for pending requests

### Configuration

```javascript
serversGRPC.Item({
    port: 50000,
    onStart: () => console.log('gRPC server started'),
    onStreamConnect: (stream) => console.log('Stream connected'),
    onStreamData: async (stream, payload) => {
        // Handle incoming command requests
        const response = await executeCommand(payload);
        stream.respond(response.data, response.message, response.code);
    },
    onStreamClose: (stream) => console.log('Stream closed'),
    onStreamError: (stream, error) => console.log('Stream error:', error)
});
```