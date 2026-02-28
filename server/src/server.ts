import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3001;


app.post('/auth/signup', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.'});
    }

    try {
        const fakeEmail = `${username.toLowerCase()}@game.local`;

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: fakeEmail,
            password: password,
            email_confirm: true,
            user_metadata: { username }
        });

        if (authError) throw authError;

        const { error: profileError } = await supabase 
            .from('profiles')
            .insert({
                id: authData.user.id,
                username: username
            });
    
        if (profileError) {
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw profileError;
        }

        res.status(201).json({ message: 'Player registered.', user: authData.user });
    } catch (error: any) {
        console.error('Error: ', error);
        res.status(400).json({ status: 'error', message: 'User creation error.', details: error.message });
    }
});

app.post('/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password must be provided in order to log in.'});
    }

    const fakeEmail = `${username.toLowerCase()}@game.local`;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: fakeEmail,
            password: password
        });

        if (error) throw error;

        res.cookie('session-token', data.session.access_token, {
            httpOnly: true, secure: false, sameSite: 'lax'
        });

        res.status(200).json({ message: 'Logged in successfully.', user: data.user });
    } catch (error: any) {
        console.error('Error: ', error)
        res.status(401).json({ status: 'error', message: 'Invalid credentials.', details: error.message });
    }
});

app.get('/auth/me', async (req: Request, res: Response) => {
    const token = req.cookies['session-token'];

    if (!token) return res.status(401).json({ authenticated: false });

    const { data: { user }, error} = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ authenticated: false });

    res.status(200).json({ authenticated: true, user });
});

app.post('/auth/logout', async (req: Request, res: Response) => {
    const token = req.cookies['session-token'];
    if (token) {
        try { await supabase.auth.admin.signOut(token); } 
        catch (error: any) { console.error('Error: ', error); }
    }
    res.clearCookie('session-token', { httpOnly: true, secure: false, sameSite: 'lax' });
    res.status(200).json({ message: 'Logged out successfully.'});
});

app.post('/auth/guest', async (req: Request, res: Response) => {
    try {
        const randomNum = Math.floor(Math.random() * 100000);
        const username = `Guest_${randomNum}`;
        const password = `GuestPass${randomNum}!`;
        const fakeEmail = `${username.toLowerCase()}@game.local`;

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: fakeEmail, password: password, email_confirm: true, user_metadata: { username, is_guest: true }
        });

        if (authError) throw authError;

        const { error: profileError } = await supabase.from('profiles').insert({ id: authData.user.id, username: username });
    
        if (profileError) {
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw profileError;
        }

        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email: fakeEmail, password: password });

        if (loginError) throw loginError;

        res.cookie('session-token', loginData.session.access_token, { httpOnly: true, secure: false, sameSite: 'lax' });
        res.status(201).json({ message: 'Logged in as guest.', user: loginData.user });
    } catch (error: any) {
        console.error('Error: ', error);
        res.status(500).json({ error: 'Error' });
    }
});

app.get('/friends/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const { data: pendingRequests, error: reqError } = await supabase
            .from('friendships').select('id, profiles!sender_id(id, username)')
            .eq('receiver_id', userId).eq('status', 'pending');
        if (reqError) throw reqError;

        const { data: friends, error: friendsError } = await supabase
            .from('friendships').select('id, sender_id, receiver_id, sender:profiles!sender_id(username), receiver:profiles!receiver_id(username)')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).eq('status', 'accepted');
        if (friendsError) throw friendsError;

        const { data: sentRequests, error: sentRequestsError } = await supabase
            .from('friendships').select('id, profiles!receiver_id(id, username)')
            .eq('sender_id', userId).eq('status', 'pending');
        if (sentRequestsError) throw sentRequestsError;

        res.status(200).json({ requests: pendingRequests, friends: friends, sent: sentRequests });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/friends/request', async (req: Request, res: Response) => {
    const { sender_id, receiver_id } = req.body;
    try {
        const { error } = await supabase.from('friendships').insert({ sender_id, receiver_id, status: 'pending' });
        if (error) throw error;
        res.status(201).json({ message: 'Request sent.' });
    } catch (error: any) {
        res.status(400).json({message: error.message});
    }
});

app.post('/friends/requestusername', async (req: Request, res: Response) => {
    const { sender_id, receiver_username } = req.body;
    try {
        const { data: userData, error: userError } = await supabase.from('profiles').select('id').eq('username', receiver_username).single();
        if (userError) throw userError;
        if (!userData) throw new Error("Username not found.");

        const { error: requestError } = await supabase.from('friendships').insert({ sender_id, receiver_id: userData.id, status: 'pending'});
        if (requestError) throw requestError;

        res.status(201).json({ message: 'Request sent.'});
    } catch (error: any) {
        res.status(400).json({message: error.message});
    }
});

app.patch('/friends/accept', async (req: Request, res: Response) => {
    const { relation_id } = req.body;
    try {
        const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', relation_id);
        if (error) throw error;
        res.status(200).json({ message: 'Request accepted.' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/friends/remove', async (req: Request, res: Response) => {
    const { relation_id } = req.body;
    try {
        const { error } = await supabase.from('friendships').delete().eq('id', relation_id);
        if (error) throw error;
        res.status(200).json({ message: 'Relation removed.' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

const connectedUsers = new Map();
const roomReadyState = new Map();

const sendRoomUsers = (roomName: string) => {
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

io.on('connection', (socket) => {
    socket.on('register', (userId) => {
        connectedUsers.set(userId, socket.id);
        socket.data.userId = userId;
    });

    socket.on('join_room', (data) => {
        const { roomName, username } = data;
        const room = io.sockets.adapter.rooms.get(roomName);
        
        if (room && room.size >= 2 && !room.has(socket.id)) {
            socket.emit('room_error', 'Pokój jest pełny (max 2 graczy).');
            return;
        }

        socket.join(roomName);
        socket.data.username = username; 
        
        io.to(roomName).emit('receive_message', { 
            room: roomName, username: 'System', text: `${username} dołączył do gry.` 
        });
        
        sendRoomUsers(roomName);

        if (roomReadyState.has(roomName)) {
            io.to(roomName).emit('update_ready_count', roomReadyState.get(roomName).size);
        }
    });

    socket.on('kick_player', (data) => {
        const { roomName, targetSocketId } = data;
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        
        if (targetSocket) {
            targetSocket.leave(roomName);
            targetSocket.emit('kicked_from_room');
            io.to(roomName).emit('receive_message', { 
                room: roomName, username: 'System', text: `${targetSocket.data.username} został wyrzucony z pokoju.` 
            });
            sendRoomUsers(roomName);
            
            if (roomReadyState.has(roomName)) {
                roomReadyState.get(roomName).delete(targetSocketId);
                io.to(roomName).emit('update_ready_count', roomReadyState.get(roomName).size);
            }
        }
    });

    socket.on('player_ready', (roomName) => {
        if (!roomReadyState.has(roomName)) roomReadyState.set(roomName, new Set());
        
        const readySet = roomReadyState.get(roomName);
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
        }
    });

    socket.on('disconnecting', () => {
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                io.to(room).emit('receive_message', { 
                    room, username: 'System', text: `${socket.data.username || 'Gracz'} opuścił pokój.` 
                });
                setTimeout(() => sendRoomUsers(room), 100); 
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
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});