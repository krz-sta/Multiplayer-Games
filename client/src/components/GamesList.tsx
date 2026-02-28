import { useState, useEffect } from "react";

function GamesList({ user, socket, currentRoom, setCurrentRoom, selectedGame, setSelectedGame }: any) {
    const [searchUsername, setSearchUsername] = useState('');
    const [friends, setFriends] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [playersInRoom, setPlayersInRoom] = useState<any[]>([]);

    const [board, setBoard] = useState<string[]>(Array(9).fill(null));
    const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
    const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
    const [winner, setWinner] = useState<string | null>(null);
    
    const [gameActive, setGameActive] = useState<boolean>(false);
    const [isReady, setIsReady] = useState<boolean>(false);
    const [readyCount, setReadyCount] = useState<number>(0);

    const isHost = currentRoom === `room_${user.id}`;

    const fetchFriends = async () => {
        try {
            const res = await fetch(`http://localhost:3001/friends/${user.id}`);
            let data = await res.json();
            setFriends(data.friends || []);
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    const handleGameInvite = (friendId: string) => {
        socket.emit('invite_friend', {
            receiverId: friendId,
            room: currentRoom,
            senderName: user.user_metadata?.username
        });
    };

    const handleKick = (socketId: string) => {
        socket.emit('kick_player', { roomName: currentRoom, targetSocketId: socketId });
    };

    const checkWinner = (currentBoard: (string | null)[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]            
        ];
        for (let line of lines) {
            const [a, b, c] = line;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                setWinner(currentBoard[a]);
                setGameActive(false);
                return;
            }
        }
        if (!currentBoard.includes(null)) {
            setWinner('Remis');
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

        socket.emit('make_move', { room: currentRoom, index: index, symbol: mySymbol });
    };

    const sendMessage = () => {
        if (currentMessage.trim() !== '' && socket) {
            socket.emit('send_message', {
                room: currentRoom,
                username: user.user_metadata?.username || 'Unknown',
                text: currentMessage    
            });
            setCurrentMessage('');
        }
    };

    const handleReady = () => {
        setIsReady(true);
        socket.emit('player_ready', currentRoom);
    };

    useEffect(() => {
        if (user?.id) fetchFriends();
    }, [user?.id]);

    useEffect(() => {
        if (selectedGame === 'tictactoe') {
            setGameActive(false);
            setIsReady(false);
            setReadyCount(0);
            setWinner(null);
            setBoard(Array(9).fill(null));
            setMessages([]);
        }
    }, [selectedGame]);

    useEffect(() => {
        if (selectedGame && socket && currentRoom) {
            socket.emit('join_room', { roomName: currentRoom, username: user.user_metadata?.username || 'Gracz' });

            const handleReceiveMsg = (msg: any) => setMessages((prev) => [...prev, msg]);
            const handleUpdateBoard = (data: { index: number, symbol: string }) => {
                setBoard(prev => {
                    const newBoard = [...prev];
                    newBoard[data.index] = data.symbol;
                    checkWinner(newBoard);
                    return newBoard;
                });
                setIsMyTurn(true);
            };

            const handleRoomError = (msg: string) => {
                alert(msg);
                setSelectedGame(null);
            };

            const handleReadyCount = (count: number) => setReadyCount(count);

            const handleGameStart = (data: { symbol: 'X'|'O', isTurn: boolean }) => {
                setGameActive(true);
                setMySymbol(data.symbol);
                setIsMyTurn(data.isTurn);
                setBoard(Array(9).fill(null));
                setWinner(null);
                setIsReady(false);
                setReadyCount(0);
            };

            const handleRoomUsers = (users: any[]) => setPlayersInRoom(users);

            const handleKicked = () => {
                alert("Zostałeś wyrzucony z pokoju.");
                setSelectedGame(null);
                setCurrentRoom(`room_${user.id}`); // Wróć do własnego pokoju
            };

            socket.on('receive_message', handleReceiveMsg);
            socket.on('update_board', handleUpdateBoard);
            socket.on('room_error', handleRoomError);
            socket.on('update_ready_count', handleReadyCount);
            socket.on('game_start', handleGameStart);
            socket.on('room_users', handleRoomUsers);
            socket.on('kicked_from_room', handleKicked);

            return () => {
                socket.off('receive_message', handleReceiveMsg);
                socket.off('update_board', handleUpdateBoard);
                socket.off('room_error', handleRoomError);
                socket.off('update_ready_count', handleReadyCount);
                socket.off('game_start', handleGameStart);
                socket.off('room_users', handleRoomUsers);
                socket.off('kicked_from_room', handleKicked);
            };
        }
    }, [selectedGame, socket, currentRoom]);


    if (selectedGame === 'tictactoe') {
        return (
            <div className="flex flex-1 h-full">
                <div className="flex-1 border-r border-gray-300 p-4 flex flex-col overflow-y-auto">
                    <button onClick={() => setSelectedGame(null)} className="mb-4 bg-gray-200 px-3 py-1 rounded-xl w-fit hover:bg-gray-300 font-bold">
                        Back
                    </button>

                    <h2 className="font-bold text-lg mb-2">Obecni w lobby:</h2>
                    <ul className="mb-5 bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
                        {playersInRoom.map(p => (
                            <li key={p.socketId} className="flex justify-between items-center px-2 py-1 mb-1 border-b last:border-0">
                                <span className={p.userId === user.id ? 'font-bold text-blue-500' : ''}>
                                    {p.username} {currentRoom === `room_${p.userId}` && '(Host)'}
                                </span>
                                {isHost && p.userId !== user.id && (
                                    <button 
                                        onClick={() => handleKick(p.socketId)}
                                        className="bg-red-500 text-white text-xs px-2 py-1 rounded-lg font-bold hover:bg-red-600"
                                    >
                                        Kick
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                    
                    <h2 className="font-bold text-lg mb-4">Invite by username:</h2>
                    <div className="flex justify-between mb-5">
                        <input 
                            type="text" placeholder="Username..." value={searchUsername}
                            onChange={(e) => setSearchUsername(e.target.value)}
                            className="text-black bg-gray-100 px-2 py-1 rounded-xl w-full mr-2.5"
                        />
                        <button className="bg-blue-500 rounded-xl px-4 py-1 font-bold text-white hover:bg-blue-600">Send</button>
                    </div>

                    <h2 className="font-bold text-lg mb-2">Invite a friend:</h2>
                    <div>
                        {friends.length === 0 ? (
                            <p className="text-center text-gray-500">You have no added friends.</p>
                        ) : (
                            <ul>
                                {friends.map(friend => {
                                    const friendName = friend.sender_id === user.id ? friend.receiver?.username : friend.sender?.username;
                                    const friendId = friend.sender_id === user.id ? friend.receiver_id : friend.sender_id;
                                    return (
                                        <li key={friend.id} className="flex justify-between items-center bg-gray-100 rounded-xl px-3 py-2 mb-2">
                                            <span className="font-semibold">{friendName}</span>
                                            <button className="bg-green-500 text-white px-3 py-1 rounded-xl font-bold hover:bg-green-600" onClick={() => handleGameInvite(friendId)}>
                                                Invite
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="flex-[3] p-4 flex flex-col items-center justify-center">
                    {!gameActive && !winner && (
                        <div className="flex flex-col items-center flex-none mb-8">
                            <h2 className="text-2xl font-bold mb-4">Gotowość do gry</h2>
                            <button 
                                onClick={handleReady} 
                                disabled={isReady}
                                className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all text-xl ${isReady ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                            >
                                {isReady ? `Oczekiwanie... (${readyCount}/2)` : `Start Game (${readyCount}/2)`}
                            </button>
                        </div>
                    )}

                    {(gameActive || winner) && (
                        <div className="flex flex-col items-center flex-none mb-8">
                            <h2 className="text-2xl font-bold mb-4">
                                {winner 
                                    ? (winner === 'Remis' ? 'Koniec: Remis!' : `Wygrywa: ${winner}!`) 
                                    : (isMyTurn ? 'Twoja kolej' : 'Kolej przeciwnika')}
                                {mySymbol && !winner && <span className="text-sm text-gray-500 block text-center mt-1">Grasz jako: {mySymbol}</span>}
                            </h2>
                            
                            <div className="grid grid-cols-3 gap-2 bg-gray-300 p-3 rounded-2xl shadow-inner">
                                {board.map((cell, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleCellClick(index)}
                                        className={`w-24 h-24 bg-white rounded-xl flex items-center justify-center text-6xl font-black shadow-md transition-all 
                                            ${!cell && isMyTurn && !winner ? 'cursor-pointer hover:bg-gray-100 hover:scale-105' : 'cursor-default'}
                                            ${cell === 'X' ? 'text-blue-500' : 'text-red-500'}`}
                                    >
                                        {cell}
                                    </div>
                                ))}
                            </div>
                            
                            {winner && (
                                <button 
                                    onClick={handleReady}
                                    disabled={isReady}
                                    className={`mt-6 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${isReady ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                                >
                                    {isReady ? `Czekam na przeciwnika (${readyCount}/2)...` : `Zagraj ponownie (${readyCount}/2)`}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col flex-1 w-full max-w-2xl mt-auto">
                        <h2 className="font-bold text-xl mb-2">Chat:</h2>
                        <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 mb-4 p-4 overflow-y-auto shadow-inner min-h-[150px] max-h-[250px]">
                            {messages.map((msg, index) => (
                                <div key={index} className="mb-2">
                                    <span className={`font-bold ${
                                        msg.username === 'System' ? 'text-green-500' : 
                                        msg.username === user.user_metadata?.username ? 'text-blue-500' : 'text-red-500'
                                    }`}>
                                        {msg.username}: 
                                    </span>
                                    <span className={`ml-2 ${msg.username === 'System' ? 'text-green-700 italic' : 'text-gray-800'}`}>
                                        {msg.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" className="flex-1 border-2 border-gray-200 rounded-xl px-4 focus:outline-none focus:border-blue-400" 
                                placeholder="Napisz wiadomość..." value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button onClick={sendMessage} className="bg-blue-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-600 shadow-md">
                                Wyślij
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 flex-1">
            <h2 className="text-2xl font-bold mb-6">Available games:</h2>
            <div className="flex gap-6">
                <div onClick={() => setSelectedGame('tictactoe')} className="w-40 h-40 bg-white border-2 border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:shadow-xl transition-all">
                    <span className="font-bold text-lg">Tic-Tac-Toe</span>
                </div>
            </div>
        </div>
    );   
}

export default GamesList;