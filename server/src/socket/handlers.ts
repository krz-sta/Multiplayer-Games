import { Server } from 'socket.io';

const connectedUsers = new Map<string, string>();
const roomReadyState = new Map<string, Set<string>>();

const sendRoomUsers = (io: Server, roomName: string) => {
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room) {
        const users = Array.from(room).map(socketId => {
            const clientSocket = io.sockets.sockets.get(socketId);
            return {
                socketId,
                userId: clientSocket?.data.userId,
                username: clientSocket?.data.username
            };
        });
        io.to(roomName).emit('room_users', users);
    }
};

export function registerSocketHandlers(io: Server) {
    io.on('connection', (socket) => {
        socket.on('register', (userId) => {
            connectedUsers.set(userId, socket.id);
            socket.data.userId = userId;
        });

        socket.on('join_room', (data) => {
            const { roomName, username } = data;
            const room = io.sockets.adapter.rooms.get(roomName);

            if (room && room.size >= 2 && !room.has(socket.id)) {
                socket.emit('room_error', 'Room is full (max 2 players).');
                return;
            }

            socket.join(roomName);
            socket.data.username = username;

            io.to(roomName).emit('receive_message', {
                room: roomName, username: 'System', text: `${username} joined the game.`
            });

            sendRoomUsers(io, roomName);

            if (roomReadyState.has(roomName)) {
                io.to(roomName).emit('update_ready_count', roomReadyState.get(roomName)!.size);
            }
        });

        socket.on('kick_player', (data) => {
            const { roomName, targetSocketId } = data;
            const targetSocket = io.sockets.sockets.get(targetSocketId);

            if (targetSocket) {
                targetSocket.leave(roomName);
                targetSocket.emit('kicked_from_room');
                io.to(roomName).emit('receive_message', {
                    room: roomName, username: 'System', text: `${targetSocket.data.username} was kicked from the room.`
                });
                sendRoomUsers(io, roomName);

                if (roomReadyState.has(roomName)) {
                    roomReadyState.get(roomName)!.delete(targetSocketId);
                    io.to(roomName).emit('update_ready_count', roomReadyState.get(roomName)!.size);
                }
            }
        });

        socket.on('player_ready', (roomName) => {
            if (!roomReadyState.has(roomName)) roomReadyState.set(roomName, new Set());

            const readySet = roomReadyState.get(roomName)!;
            readySet.add(socket.id);

            io.to(roomName).emit('update_ready_count', readySet.size);

            if (readySet.size === 2) {
                const clients = Array.from(io.sockets.adapter.rooms.get(roomName) || []);
                const starterIndex = Math.random() < 0.5 ? 0 : 1;

                io.to(clients[starterIndex]!).emit('game_start', { symbol: 'X', isTurn: true });
                io.to(clients[1 - starterIndex]!).emit('game_start', { symbol: 'O', isTurn: false });

                readySet.clear();
            }
        });

        socket.on('send_message', (data) => io.to(data.room).emit('receive_message', data));
        socket.on('make_move', (data) => socket.to(data.room).emit('update_board', data));

        socket.on('invite_friend', (data) => {
            const receiverSocketId = connectedUsers.get(data.receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receive_invite', { room: data.room, senderName: data.senderName });
                socket.emit('invite_sent', { success: true, message: 'Invite sent!' });
            } else {
                socket.emit('invite_sent', { success: false, message: 'Player is not online.' });
            }
        });

        socket.on('invite_by_username', (data) => {
            const { username: targetUsername, room, senderName } = data;

            let targetSocketId: string | null = null;
            for (const [, clientSocket] of io.sockets.sockets) {
                if (clientSocket.data.username === targetUsername && clientSocket.id !== socket.id) {
                    targetSocketId = clientSocket.id;
                    break;
                }
            }

            if (targetSocketId) {
                io.to(targetSocketId).emit('receive_invite', { room, senderName });
                socket.emit('invite_sent', { success: true, message: `Invite sent to ${targetUsername}!` });
            } else {
                socket.emit('invite_sent', { success: false, message: `Player "${targetUsername}" is not online or has not joined a game yet.` });
            }
        });

        socket.on('disconnecting', () => {
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    io.to(room).emit('receive_message', {
                        room, username: 'System', text: `${socket.data.username || 'Player'} left the room.`
                    });
                    setTimeout(() => sendRoomUsers(io, room), 100);
                }
            }
        });

        socket.on('disconnect', () => {
            for (const [userId, socketId] of connectedUsers.entries()) {
                if (socketId === socket.id) {
                    connectedUsers.delete(userId);
                    break;
                }
            }

            for (const [roomName, readySet] of roomReadyState.entries()) {
                readySet.delete(socket.id);
                if (readySet.size === 0) {
                    roomReadyState.delete(roomName);
                }
            }
        });
    });

    setInterval(() => {
        for (const roomName of roomReadyState.keys()) {
            const room = io.sockets.adapter.rooms.get(roomName);
            if (!room || room.size === 0) {
                roomReadyState.delete(roomName);
            }
        }
    }, 60_000);
}
