import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Header({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4">
            <div className="flex justify-between items-center">
                <h1 className="font-extrabold text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Multiplayer Games
                </h1>


                <nav className="hidden md:flex gap-2 items-center">
                    <button
                        onClick={() => setActiveTab('games')}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                    >
                        🎮 Play
                    </button>
                    {!user?.user_metadata.is_guest && (
                        <button
                            onClick={() => setActiveTab('friends')}
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                        >
                            👥 Friends
                        </button>
                    )}
                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                        Log out
                    </button>
                    <div className="ml-2 bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
                        {user?.user_metadata.username}
                    </div>
                </nav>


                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden text-slate-300 hover:text-white p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>
            </div>


            {mobileOpen && (
                <div className="md:hidden mt-4 flex flex-col gap-2 bg-slate-800 rounded-xl p-3 border border-slate-700/50">
                    <button onClick={() => { setActiveTab('games'); setMobileOpen(false); }} className="text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">🎮 Play</button>
                    {!user?.user_metadata.is_guest && (
                        <button onClick={() => { setActiveTab('friends'); setMobileOpen(false); }} className="text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">👥 Friends</button>
                    )}
                    <button onClick={logout} className="text-left px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">Log out</button>
                    <div className="px-3 py-2 text-sm text-slate-500">Logged in as <span className="font-bold text-indigo-400">{user?.user_metadata.username}</span></div>
                </div>
            )}
        </header>
    );
}

export default Header;