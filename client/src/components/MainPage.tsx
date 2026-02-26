import FriendsList from "./FriendsList";
import GamesList from "./GamesList"
import Header from "./Header"
import { useState } from "react"
import { useEffect } from "react";
import { io, Socket } from 'socket.io-client';


function MainPage({ user }: any) {
    const [activeTab, setActiveTab] = useState('games');
    const [socket, setSocket] = useState<Socket | null>(null);


    useEffect(() => {
        const socket = io('http://localhost:3001');
        setSocket(socket);

        socket.emit('register', user.id)

        return () => {
            socket.disconnect();
        }
    }, []);

    if (!socket) return <div>Connecting...</div>;

    return (
        <>
            <div className="h-screen flex flex-col">
                <Header user={user} activeTab={activeTab} setActiveTab={setActiveTab}/>
                {activeTab === 'games' ? <GamesList user={user} socket={socket}/> : ''}
                {activeTab === 'friends' ? <FriendsList user={user} socket={socket}/> : ''}
            </div>
        </>
    )
}

export default MainPage