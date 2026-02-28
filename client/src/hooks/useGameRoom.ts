import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import type { ChatMessage, RoomPlayer } from '../types';

interface UseGameRoomOptions {
    socket: Socket;
    roomName: string;
    username: string;
    userId: string;
    onKicked: () => void;
    onRoomError: (msg: string) => void;
}

export function useGameRoom({ socket, roomName, username, userId, onKicked, onRoomError }: UseGameRoomOptions) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [playersInRoom, setPlayersInRoom] = useState<RoomPlayer[]>([]);

    const [board, setBoard] = useState<string[]>(Array(9).fill(null));
    const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [gameActive, setGameActive] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [readyCount, setReadyCount] = useState(0);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const isHost = roomName === `room_${userId}`;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const checkWinner = (currentBoard: (string | null)[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (const line of lines) {
            const [a, b, c] = line;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                setWinner(currentBoard[a]);
                setGameActive(false);
                return;
            }
        }
        if (!currentBoard.includes(null)) {
            setWinner('Draw');
            setGameActive(false);
        }
    };

    const handleCellClick = (index: number) => {
        if (!isMyTurn || board[index] || winner || !mySymbol) return;

        const newBoard = [...board];
        newBoard[index] = mySymbol;
        setBoard(newBoard);
        setIsMyTurn(false);
        checkWinner(newBoard);

        socket.emit('make_move', { room: roomName, index, symbol: mySymbol });
    };

    const sendMessage = () => {
        if (currentMessage.trim() !== '' && socket) {
            socket.emit('send_message', {
                room: roomName,
                username: username || 'Unknown',
                text: currentMessage
            });
            setCurrentMessage('');
        }
    };

    const handleReady = () => {
        setIsReady(true);
        socket.emit('player_ready', roomName);
    };

    const handleKick = (socketId: string) => {
        socket.emit('kick_player', { roomName, targetSocketId: socketId });
    };

    const handleGameInvite = (friendId: string) => {
        socket.emit('invite_friend', {
            receiverId: friendId,
            room: roomName,
            senderName: username
        });
    };

    const handleInviteByUsername = (targetUsername: string) => {
        if (!targetUsername.trim()) return;
        socket.emit('invite_by_username', {
            username: targetUsername.trim(),
            room: roomName,
            senderName: username
        });
    };

    const resetGame = () => {
        setGameActive(false);
        setIsReady(false);
        setReadyCount(0);
        setWinner(null);
        setBoard(Array(9).fill(null));
        setMessages([]);
    };

    useEffect(() => {
        socket.emit('join_room', { roomName, username: username || 'Player' });

        const handleReceiveMsg = (msg: ChatMessage) => setMessages(prev => [...prev, msg]);
        const handleUpdateBoard = (data: { index: number; symbol: string }) => {
            setBoard(prev => {
                const newBoard = [...prev];
                newBoard[data.index] = data.symbol;
                checkWinner(newBoard);
                return newBoard;
            });
            setIsMyTurn(true);
        };
        const handleRoomErr = (msg: string) => onRoomError(msg);
        const handleReadyCount = (count: number) => setReadyCount(count);
        const handleGameStart = (data: { symbol: 'X' | 'O'; isTurn: boolean }) => {
            setGameActive(true);
            setMySymbol(data.symbol);
            setIsMyTurn(data.isTurn);
            setBoard(Array(9).fill(null));
            setWinner(null);
            setIsReady(false);
            setReadyCount(0);
        };
        const handleRoomUsers = (users: RoomPlayer[]) => setPlayersInRoom(users);
        const handleKicked = () => onKicked();

        const handleInviteSent = (data: { success: boolean; message: string }) => {
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        };

        socket.on('receive_message', handleReceiveMsg);
        socket.on('update_board', handleUpdateBoard);
        socket.on('room_error', handleRoomErr);
        socket.on('update_ready_count', handleReadyCount);
        socket.on('game_start', handleGameStart);
        socket.on('room_users', handleRoomUsers);
        socket.on('kicked_from_room', handleKicked);
        socket.on('invite_sent', handleInviteSent);

        return () => {
            socket.off('receive_message', handleReceiveMsg);
            socket.off('update_board', handleUpdateBoard);
            socket.off('room_error', handleRoomErr);
            socket.off('update_ready_count', handleReadyCount);
            socket.off('game_start', handleGameStart);
            socket.off('room_users', handleRoomUsers);
            socket.off('kicked_from_room', handleKicked);
            socket.off('invite_sent', handleInviteSent);
        };
    }, [roomName, socket]);

    return {
        messages, currentMessage, setCurrentMessage, playersInRoom,
        board, mySymbol, isMyTurn, winner, gameActive,
        isReady, readyCount, isHost, chatEndRef,
        handleCellClick, sendMessage, handleReady, handleKick, handleGameInvite, handleInviteByUsername, resetGame,
    };
}
