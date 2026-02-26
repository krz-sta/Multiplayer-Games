import { useState } from "react";
import { useEffect } from "react";

function GamesList({ user, socket }: any) {
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [searchUsername, setSearchUsername] = useState('');
    const [friends, setFriends] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');

    const myRoom = `room_${user.id}-`;

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
            room: myRoom,
            senderName: user.user_metadata?.username
        });
        console.log('Invite sent.')
    }    

    useEffect(() => {
        if (user?.id) fetchFriends();
    }, [user?.id]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveGameInvite = (data: any) => {
            alert(`Player ${data.senderName} invited you to a game`);
        };

        socket.on('receive_invite', handleReceiveGameInvite);

        return () => {
            socket.off('receive_invite', handleReceiveGameInvite);
        };
    }, [socket]);

    const sendMessage = () => {
        if (currentMessage.trim() !== '' && socket) {
            socket.emit('send_message', {
                room: myRoom,
                username: user.user_metadata.username,
                text: currentMessage    
            });
            console.log(user)
            setCurrentMessage('');
        }
    }

    if (selectedGame === 'tictactoe') {
        return (
            <div className="flex flex-1 h-full">
                <div className="flex-1 border-r border-gray-300 p-4 flex flex-col">
                    <button 
                        onClick={() => setSelectedGame(null)} 
                        className="mb-4 bg-gray-200 px-3 py-1 rounded-xl w-fit hover:bg-gray-300"
                    >
                        Back
                    </button>
                    <h2 className="font-bold text-xl mb-4">Lobby:</h2>
                        {/* players in lobby */}
                    <h2 className="font-bold text-lg mb-4">Invite by username:</h2>
                        <div className="flex justify-between mb-5">
                            <input 
                                type="text" 
                                placeholder="Username..."
                                value={searchUsername}
                                onChange={(e) => setSearchUsername(e.target.value)}
                                className="text-black bg-gray-100 px-2 py-1 rounded-xl w-full mr-2.5"
                            />
                            <button className="bg-blue-500 rounded-xl px-4 py-1 font-bold text-white">Send</button>
                        </div>
                    <h2 className="font-bold text-lg mb-4">Invite a friend:</h2>
                    <div className="">
                        <h2 className="text-xl font-bold mb-2">Friends:</h2>
                        {friends.length === 0 ? (
                            <p className="text-center">You have no added friends.</p>
                        ) : (
                            <ul className="">
                                {friends.map(friend => {
                                    const friendName = friend.sender_id === user.id 
                                        ? friend.receiver?.username 
                                        : friend.sender?.username;

                                    const friendId = friend.sender_id === user.id ? friend.receiver_id : friend.sender_id;
                                    
                                    return (
                                        <li key={friend.id} className="flex justify-between items-center bg-gray-100 rounded-xl px-3 py-1 mb-1">
                                            <span>{friendName}</span>
                                            {/*<span className="text-sm font-semibold text-green-400">Online</span>*/}
                                            <button 
                                                className="text-red-400 hover:text-red-300"
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

                <div className="flex-4 p-4 flex flex-col">
                    <div className="flex justify-center items-center flex-2">
                        <button className="bg-blue-500 w-fit h-fit px-4 py-2 rounded-xl font-bold text-white">Start Game</button>
                    </div>
                    <div className="flex flex-col flex-1">
                        <h2 className="font-bold text-xl mb-4">Chat:</h2>
                        <div className="flex-1 bg-gray-100 rounded-xl mb-4 p-4 overflow-y-auto">
                            {messages.map((msg, index) => (
                                <div key={index} className="mb-1">
                                    <span className="font-bold text-blue-500">{msg.username}: </span>
                                    <span>{msg.text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 border rounded-xl px-2" 
                                placeholder="Type a message..." 
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button onClick={sendMessage} className="bg-blue-500 text-white font-bold px-4 py-2 rounded-xl">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <> 
            <div className="p-6 flex-1">
                <h2 className="text-xl font-bold mb-4">Available games:</h2>
                <div className="flex gap-4">
                    <div 
                        onClick={() => setSelectedGame('tictactoe')}
                        className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors shadow-lg"
                    >
                        <span className="font-bold text-lg">Tic-tac-toe</span>
                    </div>
                </div>
            </div>
        </>
    )   
}

export default GamesList