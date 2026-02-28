import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';

interface IncomingInvite {
    senderName: string;
    room: string;
}

export function useSocket(userId: string) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [incomingInvite, setIncomingInvite] = useState<IncomingInvite | null>(null);

    useEffect(() => {
        const newSocket = io(API_URL, {
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('register', userId);
        });

        const handleReceiveGameInvite = (data: IncomingInvite) => {
            setIncomingInvite({ senderName: data.senderName, room: data.room });
        };
        newSocket.on('receive_invite', handleReceiveGameInvite);

        return () => {
            newSocket.off('receive_invite', handleReceiveGameInvite);
            newSocket.disconnect();
        };
    }, [userId]);

    const dismissInvite = () => setIncomingInvite(null);

    return { socket, incomingInvite, dismissInvite };
}
