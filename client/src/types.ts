export interface User {
    id: string;
    user_metadata: {
        username: string;
        is_guest?: boolean;
    };
}

export interface Friend {
    id: number;
    sender_id: string;
    receiver_id: string;
    sender?: { username: string };
    receiver?: { username: string };
}

export interface FriendRequest {
    id: number;
    profiles?: { id: string; username: string };
}

export interface ChatMessage {
    username: string;
    text: string;
    room?: string;
}

export interface RoomPlayer {
    socketId: string;
    userId: string;
    username: string;
}
