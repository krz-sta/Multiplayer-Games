import { useState, useEffect } from "react";

function FriendsList({ user }: any) {
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    const [searchUsername, setSearchUsername] = useState('');

    const fetchFriends = async () => {
        try {
            const res = await fetch(`http://localhost:3001/friends/${user.id}`);
            let data = await res.json();

            setRequests(data.requests || []);
            setFriends(data.friends || []);
            setSentRequests(data.sent || []);
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    useEffect(() => {
        if (user?.id) fetchFriends();
    }, [user?.id]);

    const handleAccept = async (relationId: string) => {
        try {
            await fetch('http://localhost:3001/friends/accept', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ relation_id: relationId })
            });
            fetchFriends();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemove = async (relationId: number) => {
        try {
            await fetch('http://localhost:3001/friends/remove', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ relation_id: relationId})
            });
            fetchFriends();
        } catch (error) {
            console.error(error)
        }
    }

    const handleSearch = async (username: string) => {
        try {
            await fetch('http://localhost:3001/friends/requestusername', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender_id: user.id, receiver_username: username })
            });
            fetchFriends();
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <> 
            <div className="flex flex-col flex-1">
                <div className="p-6 flex-1/5">
                    <h2 className="text-xl font-bold mb-2">Add friends:</h2>
                    <div className="flex justify-between mb-5">
                        <input 
                            type="text" 
                            placeholder="Search by username"
                            value={searchUsername}
                            onChange={(e) => setSearchUsername(e.target.value)}
                            className="text-black bg-gray-100 px-2 py-1 rounded-xl w-full mr-2.5"
                        />
                        <button onClick={() => handleSearch(searchUsername)}className="bg-blue-500 rounded-xl px-4 py-1 rounded font-bold text-white">Send</button>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">Sent requests:</h3>
                        {sentRequests.length === 0 ? (
                            <p className="text-center">You have no pending requests sent.</p>
                        ) : (
                        <ul className="overflow-auto">
                            {sentRequests.map(sentReq => (
                                <li key={sentReq.id} className="flex rounded-xl justify-between bg-gray-100 px-3 py-1 mb-1">
                                    <span>{sentReq.profiles?.username}</span>
                                    <button className="text-red-400 hover:text-red-300" onClick={() => handleRemove(sentReq.id)}>Cancel</button>
                                </li>                      
                            ))}
                        </ul>
                        )}                  
                    </div>
                </div>
                
                <div className="p-6 flex-1/5">
                    <h2 className="text-xl font-bold mb-2">Friend requests:</h2>
                    {requests.length === 0 ? (
                        <p className="text-center">No new requests.</p>
                    ) : ( 
                        <ul className="">
                            {requests.map(req => (
                                <li key={req.id} className="flex justify-between items-center bg-gray-100 rounded-xl px-3 py-1 mb-1">
                                    <span>{req.profiles?.username}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAccept(req.id)} className="text-green-400 hover:text-green-300">Accept</button>
                                        <button onClick={() => handleRemove(req.id)}className="text-red-400 hover:text-red-300">Decline</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-6 flex-3/5">
                    <h2 className="text-xl font-bold mb-2">Friends:</h2>
                    {friends.length === 0 ? (
                        <p className="text-center">You have no added friends.</p>
                    ) : (
                        <ul className="">
                            {friends.map(friend => {
                                const friendName = friend.sender_id === user.id 
                                    ? friend.receiver?.username 
                                    : friend.sender?.username;

                                return (
                                    <li key={friend.id} className="flex justify-between items-center bg-gray-100 rounded-xl px-3 py-1 mb-1">
                                        <span>{friendName}</span>
                                        {/*<span className="text-sm font-semibold text-green-400">Online</span>*/}
                                        <button onClick={() => handleRemove(friend.id)} className="text-red-400 hover:text-red-300">
                                            Remove friend
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}

export default FriendsList;