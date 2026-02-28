import FriendsList from "./FriendsList";
import GamesList from "./GamesList"
import Header from "./Header"
import { useState } from "react"
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";

function MainPage() {
    const { user } = useAuth();
    const { socket, incomingInvite, dismissInvite } = useSocket(user!.id);
    const [activeTab, setActiveTab] = useState('games');
    const [currentRoom, setCurrentRoom] = useState(`room_${user!.id}`);
    const [selectedGame, setSelectedGame] = useState<string | null>(null);

    if (!socket) return (
        <div className="h-screen flex items-center justify-center bg-slate-900">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    const acceptInvite = () => {
        if (incomingInvite) {
            setCurrentRoom(incomingInvite.room);
            setSelectedGame('tictactoe');
            setActiveTab('games');
            dismissInvite();
        }
    };

    return (
        <>
            {incomingInvite && (
                <div className="fixed bottom-5 right-5 bg-slate-800/90 backdrop-blur-xl border border-indigo-500/50 p-5 rounded-2xl shadow-2xl shadow-indigo-500/10 z-50 animate-[slideUp_0.3s_ease-out]">
                    <p className="font-bold text-white mb-3">
                        <span className="text-indigo-400">{incomingInvite.senderName}</span> invited you to a game.
                    </p>
                    <div className="flex gap-2 justify-end">
                        <button onClick={acceptInvite} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all active:scale-95 shadow-lg shadow-green-500/25">Accept</button>
                        <button onClick={dismissInvite} className="bg-slate-700 text-slate-300 px-4 py-1.5 rounded-lg font-bold hover:bg-slate-600 transition-all active:scale-95">Decline</button>
                    </div>
                </div>
            )}

            <div className="h-screen flex flex-col bg-slate-900">
                <Header setActiveTab={setActiveTab} />
                {activeTab === 'games' ? (
                    <GamesList
                        socket={socket}
                        currentRoom={currentRoom}
                        setCurrentRoom={setCurrentRoom}
                        selectedGame={selectedGame}
                        setSelectedGame={setSelectedGame}
                    />
                ) : null}
                {activeTab === 'friends' ? <FriendsList /> : null}
            </div>
        </>
    )
}

export default MainPage