import FriendsList from "./FriendsList";
import GamesList from "./GamesList"
import Header from "./Header"
import { useState, useEffect } from "react"
import { io, Socket } from 'socket.io-client';

function MainPage({ user }: any) {
    const [activeTab, setActiveTab] = useState('games');
    const [socket, setSocket] = useState<Socket | null>(null);

    const [incomingInvite, setIncomingInvite] = useState<{senderName: string, room: string} | null>(null);
    const [currentRoom, setCurrentRoom] = useState(`room_${user.id}`);
    const [selectedGame, setSelectedGame] = useState<string | null>(null);

    useEffect(() => {
        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('register', user.id);
        });

        const handleReceiveGameInvite = (data: any) => {
            setIncomingInvite({ senderName: data.senderName, room: data.room });
        };
        newSocket.on('receive_invite', handleReceiveGameInvite);

        return () => {
            newSocket.off('receive_invite', handleReceiveGameInvite);
            newSocket.disconnect();
        }
    }, [user.id]);

    if (!socket) return <div>Connecting...</div>;

    const acceptInvite = () => {
        if (incomingInvite) {
            setCurrentRoom(incomingInvite.room);
            setSelectedGame('tictactoe');
            setActiveTab('games');
            setIncomingInvite(null);
        }
    };

    return (
        <>
            {incomingInvite && (
                <div className="fixed bottom-5 right-5 bg-white border-2 border-blue-500 p-4 rounded-xl shadow-2xl z-50">
                    <p className="font-bold mb-3">
                        {incomingInvite.senderName} invited you to a game.
                    </p>
                    <div className="flex gap-2 justify-end">
                        <button onClick={acceptInvite} className="bg-green-500 text-white px-3 py-1 rounded font-bold hover:bg-green-600">Accept</button>
                        <button onClick={() => setIncomingInvite(null)} className="bg-red-500 text-white px-3 py-1 rounded font-bold hover:bg-red-600">Decline</button>
                    </div>
                </div>
            )}

            <div className="h-screen flex flex-col">
                <Header user={user} activeTab={activeTab} setActiveTab={setActiveTab}/>
                {activeTab === 'games' ? (
                    <GamesList 
                        user={user} 
                        socket={socket}
                        currentRoom={currentRoom}
                        setCurrentRoom={setCurrentRoom}
                        selectedGame={selectedGame}
                        setSelectedGame={setSelectedGame}
                    />
                ) : ''}
                {activeTab === 'friends' ? <FriendsList user={user} socket={socket}/> : ''}
            </div>
        </>
    )
}

export default MainPage