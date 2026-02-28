import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/:userId', async (req: Request, res: Response) => {
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

router.post('/request', async (req: Request, res: Response) => {
    const { sender_id, receiver_id } = req.body;
    try {
        const { error } = await supabase.from('friendships').insert({ sender_id, receiver_id, status: 'pending' });
        if (error) throw error;
        res.status(201).json({ message: 'Request sent.' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

router.post('/requestusername', async (req: Request, res: Response) => {
    const { sender_id, receiver_username } = req.body;
    try {
        const { data: userData, error: userError } = await supabase.from('profiles').select('id').eq('username', receiver_username).single();
        if (userError) throw userError;
        if (!userData) throw new Error("Username not found.");

        const { error: requestError } = await supabase.from('friendships').insert({ sender_id, receiver_id: userData.id, status: 'pending' });
        if (requestError) throw requestError;

        res.status(201).json({ message: 'Request sent.' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

router.patch('/accept', async (req: Request, res: Response) => {
    const { relation_id } = req.body;
    try {
        const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', relation_id);
        if (error) throw error;
        res.status(200).json({ message: 'Request accepted.' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/remove', async (req: Request, res: Response) => {
    const { relation_id } = req.body;
    try {
        const { error } = await supabase.from('friendships').delete().eq('id', relation_id);
        if (error) throw error;
        res.status(200).json({ message: 'Relation removed.' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
