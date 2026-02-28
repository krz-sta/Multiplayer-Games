import { Router, type Request, type Response } from 'express';
import { supabase, createAnonClient } from '../config/supabase.js';

const router = Router();

router.post('/signup', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
        return res.status(400).json({ error: 'Username must be between 3 and 20 characters.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
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

router.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password must be provided in order to log in.' });
    }

    const fakeEmail = `${username.toLowerCase()}@game.local`;

    try {
        const anonClient = createAnonClient();
        const { data, error } = await anonClient.auth.signInWithPassword({
            email: fakeEmail,
            password: password
        });

        if (error) throw error;

        res.status(200).json({
            message: 'Logged in successfully.',
            user: data.user,
            token: data.session.access_token
        });
    } catch (error: any) {
        console.error('Error: ', error)
        res.status(401).json({ status: 'error', message: 'Invalid credentials.', details: error.message });
    }
});

router.get('/me', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) return res.status(401).json({ authenticated: false });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ authenticated: false });

    res.status(200).json({ authenticated: true, user });
});

router.post('/logout', async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Logged out successfully.' });
});

router.post('/guest', async (req: Request, res: Response) => {
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

        const anonClient = createAnonClient();
        const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({ email: fakeEmail, password: password });

        if (loginError) throw loginError;

        res.status(201).json({
            message: 'Logged in as guest.',
            user: loginData.user,
            token: loginData.session.access_token
        });
    } catch (error: any) {
        console.error('Error: ', error);
        res.status(500).json({ error: 'Guest login failed.' });
    }
});

export default router;
