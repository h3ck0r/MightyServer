const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

let players = {};

server.on('connection', (socket) => {

    const playerId = Date.now().toString();
    players[playerId] = { x: 0, y: 0, z: 0, rx: 0, ry: 0 };

    socket.playerId = playerId;

    socket.send(JSON.stringify({ type: "init", id: playerId, players }));

    broadcast(JSON.stringify({ type: "new_player", id: playerId, position: players[playerId] }), socket);

    socket.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === "move" && data.id && data.position) {
                if (players[data.id]) {
                    players[data.id] = {
                        x: data.position.x,
                        y: data.position.y,
                        z: data.position.z,
                        rx: data.position.rx,
                        ry: data.position.ry,
                    };
                    broadcast(JSON.stringify({ type: "update", id: data.id, position: players[data.id] }), socket);
                }
            }
        } catch (error) {
            console.error("Error parsing message:", error);
        }
    });

    socket.on('close', () => {
        console.log(`Player ${socket.playerId} disconnected`);
        delete players[socket.playerId];

        broadcast(JSON.stringify({ type: "remove", id: socket.playerId }));
    });

    function broadcast(msg, sender = null) {
        server.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client !== sender) {
                client.send(msg);
            }
        });
    }
});
