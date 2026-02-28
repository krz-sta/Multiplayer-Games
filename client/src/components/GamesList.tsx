import { useState } from "react";
import toast from 'react-hot-toast';
import { useAuth } from "../context/AuthContext";
import { useFriends } from "../hooks/useFriends";
import { useGameRoom } from "../hooks/useGameRoom";
import { gameRegistry } from "../games/registry";
import type { Socket } from 'socket.io-client';

interface GamesListProps {
    socket: Socket;
    currentRoom: string;
    setCurrentRoom: (room: string) => void;
    selectedGame: string | null;
    setSelectedGame: (game: string | null) => void;
}

function GamesList({ socket, currentRoom, setCurrentRoom, selectedGame, setSelectedGame }: GamesListProps) {
    const { user } = useAuth();
    const [searchUsername, setSearchUsername] = useState('');
    const { friends } = useFriends(user!.id);

    const {
        messages, currentMessage, setCurrentMessage, playersInRoom,
        board, mySymbol, isMyTurn, winner, gameActive,
        isReady, readyCount, isHost, chatEndRef,
        handleCellClick, sendMessage, handleReady, handleKick, handleGameInvite, handleInviteByUsername, resetGame,
    } = useGameRoom({
        socket,
        roomName: currentRoom,
        username: user!.user_metadata?.username || 'Player',
        userId: user!.id,
        onKicked: () => {
            toast.error("You have been kicked from the room.");
            setSelectedGame(null);
            setCurrentRoom(`room_${user!.id}`);
        },
        onRoomError: (msg: string) => {
            toast.error(msg);
            setSelectedGame(null);
        },
    });

    if (selectedGame === 'tictactoe') {
        return (
            <div className="flex flex-1 h-full overflow-hidden">

                <div className="w-80 border-r border-slate-700/50 p-4 flex flex-col overflow-y-auto bg-slate-800/30">
                    <button
                        onClick={() => setSelectedGame(null)}
                        className="mb-4 bg-slate-700/50 border border-slate-600/50 text-slate-300 px-4 py-2 rounded-xl w-fit hover:bg-slate-700 font-semibold transition-all active:scale-95"
                    >
                        ← Back
                    </button>


                    <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2">Players in lobby</h2>
                    <ul className="mb-6 bg-slate-900/30 rounded-xl p-2 border border-slate-700/30">
                        {playersInRoom.map(p => (
                            <li key={p.socketId} className="flex justify-between items-center px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-all">
                                <span className={p.userId === user!.id ? 'font-bold text-indigo-400' : 'text-slate-300'}>
                                    {p.username} {currentRoom === `room_${p.userId}` && (
                                        <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded ml-1">Host</span>
                                    )}
                                </span>
                                {isHost && p.userId !== user!.id && (
                                    <button
                                        onClick={() => handleKick(p.socketId)}
                                        className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-lg font-bold hover:bg-red-500/30 transition-all"
                                    >
                                        Kick
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>


                    <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2">Invite by username</h2>
                    <div className="flex gap-2 mb-6">
                        <input
                            type="text" placeholder="Username..." value={searchUsername}
                            onChange={(e) => setSearchUsername(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && searchUsername.trim()) { handleInviteByUsername(searchUsername); setSearchUsername(''); } }}
                            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        <button
                            onClick={() => { if (searchUsername.trim()) { handleInviteByUsername(searchUsername); setSearchUsername(''); } }}
                            className="bg-indigo-500 text-white px-3 py-2 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all active:scale-95"
                        >
                            Send
                        </button>
                    </div>


                    <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2">Invite a friend</h2>
                    <div className="flex-1">
                        {friends.length === 0 ? (
                            <p className="text-center text-slate-500 text-sm py-4">No friends added yet.</p>
                        ) : (
                            <ul className="space-y-1">
                                {friends.map(friend => {
                                    const friendName = friend.sender_id === user!.id ? friend.receiver?.username : friend.sender?.username;
                                    const friendId = friend.sender_id === user!.id ? friend.receiver_id : friend.sender_id;
                                    return (
                                        <li key={friend.id} className="flex justify-between items-center bg-slate-900/30 rounded-xl px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {friendName?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-white">{friendName}</span>
                                            </div>
                                            <button
                                                className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-all"
                                                onClick={() => handleGameInvite(friendId)}
                                            >
                                                Invite
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>


                <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">

                    {!gameActive && !winner && (
                        <div className="flex flex-col items-center flex-none mb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Ready to play?</h2>
                            <button
                                onClick={handleReady}
                                disabled={isReady}
                                className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all text-xl active:scale-95 ${isReady
                                    ? 'bg-slate-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/25 hover:shadow-green-500/40'
                                    }`}
                            >
                                {isReady ? `Waiting... (${readyCount}/2)` : `Start Game (${readyCount}/2)`}
                            </button>
                        </div>
                    )}


                    {(gameActive || winner) && (
                        <div className="flex flex-col items-center flex-none mb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">
                                {winner
                                    ? (winner === 'Draw' ? '🤝 Draw!' : `🎉 Winner: ${winner}!`)
                                    : (isMyTurn ? '🎯 Your turn' : "⏳ Opponent's turn")}
                            </h2>
                            {mySymbol && !winner && (
                                <p className="text-sm text-slate-400 mb-4">
                                    Playing as: <span className={`font-bold ${mySymbol === 'X' ? 'text-indigo-400' : 'text-rose-400'}`}>{mySymbol}</span>
                                </p>
                            )}

                            <div className="grid grid-cols-3 gap-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-3 rounded-2xl shadow-2xl">
                                {board.map((cell, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleCellClick(index)}
                                        className={`w-24 h-24 bg-slate-900/50 rounded-xl flex items-center justify-center text-5xl font-black shadow-inner transition-all duration-150
                                            ${!cell && isMyTurn && !winner ? 'cursor-pointer hover:bg-slate-700/50 hover:scale-105' : 'cursor-default'}
                                            ${cell === 'X' ? 'text-indigo-400' : 'text-rose-400'}
                                            ${cell ? 'animate-[popIn_0.2s_ease-out]' : ''}`}
                                    >
                                        {cell}
                                    </div>
                                ))}
                            </div>

                            {winner && (
                                <button
                                    onClick={handleReady}
                                    disabled={isReady}
                                    className={`mt-6 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${isReady
                                        ? 'bg-slate-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/25'
                                        }`}
                                >
                                    {isReady ? `Waiting for opponent (${readyCount}/2)...` : `Play again (${readyCount}/2)`}
                                </button>
                            )}
                        </div>
                    )}


                    <div className="flex flex-col flex-1 w-full max-w-2xl mt-auto">
                        <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2">Chat</h2>
                        <div className="flex-1 bg-slate-800/30 rounded-2xl border border-slate-700/30 mb-3 p-4 overflow-y-auto min-h-[150px] max-h-[250px]">
                            {messages.map((msg, index) => (
                                <div key={index} className="mb-2">
                                    <span className={`font-bold text-sm ${msg.username === 'System' ? 'text-emerald-400' :
                                        msg.username === user!.user_metadata?.username ? 'text-indigo-400' : 'text-rose-400'
                                        }`}>
                                        {msg.username}:
                                    </span>
                                    <span className={`ml-2 text-sm ${msg.username === 'System' ? 'text-emerald-300/70 italic' : 'text-slate-300'}`}>
                                        {msg.text}
                                    </span>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Type a message..."
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="p-8 flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">Available games</h2>
            <p className="text-slate-400 mb-6">Choose a game to play with friends</p>
            <div className="flex gap-6 flex-wrap">
                {gameRegistry.map(game => (
                    <div
                        key={game.id}
                        onClick={() => { resetGame(); setSelectedGame(game.id); }}
                        className="w-48 h-48 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-105 transition-all duration-200 gap-3 p-4 group"
                    >
                        <span className="text-4xl group-hover:scale-110 transition-transform">{game.icon}</span>
                        <span className="font-bold text-lg text-white text-center">{game.name}</span>
                        <span className="text-xs text-slate-400 text-center leading-tight">{game.description}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GamesList;