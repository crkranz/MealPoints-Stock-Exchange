const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
    console.log('New client connected');

    // Notify all connected clients about a new bid/ask
    ws.on('message', message => {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === 'new-order') {
            // Broadcast to all clients
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(parsedMessage.data));
                }
            });
        }
    });

    ws.on('close', () => console.log('Client disconnected'));
});
