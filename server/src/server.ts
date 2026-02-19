import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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
            console.error('Authentication error: ', authError.message);
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
                console.error('Profile insert error: ', profileError.message);
                throw profileError;
            };

        res.status(201).json({
            message: 'Player registered.',
            user: authData.user
        });

    } catch (error: any) {
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
            console.error('Log in error: ', error.message);
            throw error;
        }

        res.status(200).json({
            message: 'Logged in successfully.',
            session: data.session,
            user: data.user
        });
    } catch (error: any) {
        res.status(401).json({
            status: 'error',
            message: 'Invalid credentials.',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
});