import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import type { Friend, FriendRequest } from '../types';

export function useFriends(userId: string) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

    const fetchFriends = async () => {
        try {
            const res = await fetch(`${API_URL}/friends/${userId}`);
            const data = await res.json();

            setRequests(data.requests || []);
            setFriends(data.friends || []);
            setSentRequests(data.sent || []);
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    useEffect(() => {
        if (userId) fetchFriends();
    }, [userId]);

    const acceptRequest = async (relationId: number) => {
        try {
            await fetch(`${API_URL}/friends/accept`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ relation_id: relationId })
            });
            fetchFriends();
        } catch (error) {
            console.error(error);
        }
    };

    const removeRelation = async (relationId: number) => {
        try {
            await fetch(`${API_URL}/friends/remove`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ relation_id: relationId })
            });
            fetchFriends();
        } catch (error) {
            console.error(error);
        }
    };

    const sendRequest = async (username: string, senderId: string) => {
        try {
            await fetch(`${API_URL}/friends/requestusername`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender_id: senderId, receiver_username: username })
            });
            fetchFriends();
        } catch (error) {
            console.error(error);
        }
    };

    return { friends, requests, sentRequests, acceptRequest, removeRelation, sendRequest };
}
