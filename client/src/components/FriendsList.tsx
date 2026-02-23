import { useState, useEffect } from "react";

function FriendsList({ user }: any) {
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchUsername, setSearchUsername] = useState('');

    const fetchFriends = async () => {
        try {
            const res = await fetch(`http://localhost:3001/friends/${user.id}`);
            const data = await res.json();
            setRequests(data.requests || []);
            setFriends(data.friends || []);
            console.log(user.id);
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    useEffect(() => {
        if (user?.id) fetchFriends();
    }, [user?.id]);

    const handleAccept = async (friendshipId: string) => {
        try {
            await fetch('http://localhost:3001/friends/accept', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendship_id: friendshipId })
            });
            fetchFriends();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <> 
            <div className="p-6">
                <h2 className="text-xl font-bold mb-2">Add friends:</h2>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Search by username"
                        value={searchUsername}
                        onChange={(e) => setSearchUsername(e.target.value)}
                        className="text-black px-2 py-1 rounded"
                    />
                    <button className="bg-blue-500 px-4 py-1 rounded font-bold text-white">Send</button>
                </div>
            </div>
            
            <div className="p-6">
                <h2 className="text-xl font-bold mb-2">Friend requests:</h2>
                {requests.length === 0 ? (
                    <p className="text-blue-200/50">No new requests.</p>
                ) : ( 
                    <ul className="px-3 py-1 space-y-2">
                        {requests.map(req => (
                            <li key={req.id} className="flex justify-between items-center">
                                <span>{req.profiles?.username}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAccept(req.id)} className="text-green-400 font-bold hover:text-green-300">✓</button>
                                    <button className="text-red-400 font-bold hover:text-red-300">✕</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="p-6">
                <h2 className="text-xl font-bold mb-2">Friends:</h2>
                {friends.length === 0 ? (
                    <p className="text-blue-200/50">You have no added friends.</p>
                ) : (
                    <ul className="space-y-3">
                        {friends.map(friend => {
                            const friendName = friend.sender_id === user.id 
                                ? friend.receiver?.username 
                                : friend.sender?.username;

                            return (
                                <li key={friend.id} className="flex justify-between items-center px-3 py-1">
                                    <span>{friendName}</span>
                                    <span className="text-sm font-semibold text-green-400">Online</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </>
    );
}

export default FriendsList;