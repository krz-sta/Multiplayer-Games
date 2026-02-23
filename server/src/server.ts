import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';
import cookieParser from 'cookie-parser';
import type { AuthError } from '@supabase/supabase-js';

dotenv.config();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3001;

app.post('/auth/signup', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    console.log(req.body);

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

        if (authError) {
            throw authError;
        }

        const { error: profileError } = await supabase 
            .from('profiles')
            .insert({
                id: authData.user.id,
                username: username
            });
    
        if (profileError) {
                await supabase.auth.admin.deleteUser(authData.user.id);
                throw profileError;
            };

        res.status(201).json({
            message: 'Player registered.',
            user: authData.user
        });

    } catch (error: any) {
        console.error('Error: ', error);
        res.status(400).json({
            status: 'error',
            message: 'User creation error.',
            details: error.message
        });
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

        if (error) {
            throw error;
        }

        res.cookie('session-token', data.session.access_token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        });

        res.status(200).json({
            message: 'Logged in successfully.',
            user: data.user
        });
    } catch (error: any) {
        console.error('Error: ', error)
        res.status(401).json({
            status: 'error',
            message: 'Invalid credentials.',
            details: error.message
        });
    }
});

app.get('/auth/me', async (req: Request, res: Response) => {
    console.log('auth/me');
    const token = req.cookies['session-token'];

    if (!token) {
        return res.status(401).json({ authenticated: false });
    }

    const { data: { user }, error} = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ authenticated: false });
    }

    res.status(200).json({ authenticated: true, user });
});

app.post('/auth/logout', async (req: Request, res: Response) => {
    const token = req.cookies['session-token'];

    if (token) {
        try {
            await supabase.auth.admin.signOut(token);
        } catch (error) {
            console.error('Error: ', error);
        }
    }

    res.clearCookie('session-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    });
    
    res.status(200).json({ message: 'Logged out successfully. '});
});

app.post('/auth/guest', async (req: Request, res: Response) => {
    try {
        const randomNum = Math.floor(Math.random() * 100000);
        const username = `Guest_${randomNum}`;
        const password = `GuestPass${randomNum}!`;
        const fakeEmail = `${username.toLowerCase()}@game.local`;

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: fakeEmail,
            password: password,
            email_confirm: true,
            user_metadata: { username, is_guest: true }
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

        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: fakeEmail,
            password: password
        });

        if (loginError) throw loginError;

        res.cookie('session-token', loginData.session.access_token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        });

        res.status(201).json({
            message: 'Logged in as guest.',
            user: loginData.user
        });

    } catch (error: any) {
        console.error('Error: ', error);
        res.status(500).json({ error: 'Error' });
    }
});

app.get('/friends/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params
    
    try {
        const { data: pendingRequests, error: reqError } = await supabase
            .from('friendships')
            .select('id, profiles!sender_id(id, username)')
            .eq('receiver_id', userId)
            .eq('status', 'pending');

        if (reqError) throw reqError;

        const { data: friends, error: friendsError  } = await supabase
            .from('friendships')
            .select('id, sender_id, receiver_id, sender:profiles!sender_id(username), receiver:profiles!receiver_id(username)')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .eq('status', 'accepted');

        if (friendsError) throw friendsError;

        res.status(200).json({ requests: pendingRequests, friends: friends});
    } catch (error: any) {
        console.error("Error: ", error)
        res.status(400).json({ error: error.message });
    }
});

app.post('/friends/request', async (req: Request, res: Response) => {
    const { sender_id, receiver_id } = req.body;

    try {
        const { data, error } = await supabase
            .from('friendships')
            .insert({ sender_id, receiver_id, status: 'pending' });

        if (error) throw error;

        res.status(201).json({ message: 'Request sent.' });
    } catch (error: any) {
        console.error("Error: ", error)
        res.status(400).json({message: error.message});
    }
});

app.patch('/friends/accept', async (req: Request, res: Response) => {
    const { friendship_id } = req.body;

    try {
        const { error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendship_id);

        if (error) throw error;
        res.status(200).json({ message: 'Request accepted.' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
});