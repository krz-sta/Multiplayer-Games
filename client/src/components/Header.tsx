import { useState } from "react";

function Header({ user }: any) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:3001/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            window.location.href = '/';
        } catch (error) {
            console.error('Error: ', error);
        }
    }

    return (
        <header className="bg-blue-500 text-white px-6 py-4">
            <div className="flex justify-between items-center">
                <h1 className="font-bold text-xl">Multiplayer Games</h1>
                <button 
                    className="md:hidden block text-white focus:outline-none" 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>

                <nav className="hidden md:flex gap-6 items-center">
                    <button className="drop-shadow-sm hover:text-blue-200 transition">Play</button>
                    <button className="drop-shadow-sm hover:text-blue-200 transition">Friends</button>
                    <button 
                        className="drop-shadow-sm hover:text-red-200 transition"
                        onClick={handleLogout}
                    >
                        Log out
                    </button>
                    <div className="bg-blue-600 px-4 py-1 rounded-full font-bold shadow-inner">
                        {user.user_metadata.username}
                    </div>
                </nav>
            </div>

            {isMenuOpen && (
                <nav className="md:hidden flex flex-col gap-4 mt-4 pt-4 border-t border-blue-400">
                    <div className="text-sm text-blue-200 mt-2">
                        Logged in as: <span className="font-bold text-white">{user.user_metadata.username}</span>
                    </div>
                    <button className="text-left">Play</button>
                    <button className="text-left">Friends</button>
                    <button 
                        className="text-left"
                        onClick={handleLogout}
                    >
                        Log out
                    </button>
                </nav>
            )}
        </header>
    )   
}

export default Header