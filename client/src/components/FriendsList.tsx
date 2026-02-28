import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useFriends } from "../hooks/useFriends";

function FriendsList() {
    const { user } = useAuth();
    const { friends, requests, sentRequests, acceptRequest, removeRelation, sendRequest } = useFriends(user!.id);
    const [searchUsername, setSearchUsername] = useState('');

    return (
        <div className="flex flex-col flex-1 p-6 gap-6 overflow-y-auto">

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Add friends</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={searchUsername}
                        onChange={(e) => setSearchUsername(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchUsername && sendRequest(searchUsername, user!.id)}
                        className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <button
                        onClick={() => searchUsername && sendRequest(searchUsername, user!.id)}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl font-bold hover:from-indigo-600 hover:to-purple-600 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        Send
                    </button>
                </div>

                {sentRequests.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Pending sent</h3>
                        <ul className="space-y-1">
                            {sentRequests.map(sentReq => (
                                <li key={sentReq.id} className="flex justify-between items-center bg-slate-900/30 px-4 py-2 rounded-xl">
                                    <span className="text-slate-300">{sentReq.profiles?.username}</span>
                                    <button className="text-sm text-red-400 hover:text-red-300 transition-colors" onClick={() => removeRelation(sentReq.id)}>Cancel</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>


            {requests.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">
                        Friend requests
                        <span className="ml-2 bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
                    </h2>
                    <ul className="space-y-2">
                        {requests.map(req => (
                            <li key={req.id} className="flex justify-between items-center bg-slate-900/30 px-4 py-3 rounded-xl">
                                <span className="font-medium text-white">{req.profiles?.username}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => acceptRequest(req.id)}
                                        className="text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1 rounded-lg font-semibold transition-all"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => removeRelation(req.id)}
                                        className="text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded-lg font-semibold transition-all"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}


            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex-1">
                <h2 className="text-lg font-bold text-white mb-4">
                    Friends
                    <span className="ml-2 text-slate-500 text-sm font-normal">({friends.length})</span>
                </h2>
                {friends.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No friends added yet. Search for a username above!</p>
                ) : (
                    <ul className="space-y-2">
                        {friends.map(friend => {
                            const friendName = friend.sender_id === user!.id
                                ? friend.receiver?.username
                                : friend.sender?.username;

                            return (
                                <li key={friend.id} className="flex justify-between items-center bg-slate-900/30 px-4 py-3 rounded-xl group hover:bg-slate-900/50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            {friendName?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-white">{friendName}</span>
                                    </div>
                                    <button
                                        onClick={() => removeRelation(friend.id)}
                                        className="text-sm text-red-400/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        Remove
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default FriendsList;