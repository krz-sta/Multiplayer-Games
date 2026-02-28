import { useState } from "react";
import { API_URL } from "../config";
import toast from 'react-hot-toast';

function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        const endpoint = isLogin ? 'login' : 'signup';

        try {
            const response = await fetch(`${API_URL}/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                window.location.href = '/';
            } else {
                toast.error(data.error || data.message || 'Something went wrong.');
            }
        } catch (error) {
            console.error('Error: ', error);
            toast.error('Connection error. Please try again.');
        }
    };

    const handleGuestLogin = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/guest`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                toast.success('Welcome, guest!');
                window.location.href = '/';
            } else {
                toast.error(data.error || 'Guest login failed.');
            }
        } catch (error) {
            console.error('Error: ', error);
            toast.error('Connection error. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Multiplayer Games
                    </h1>
                    <p className="text-slate-400 mt-2">Play games with friends in real-time</p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                    <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-xl">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${isLogin ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white'}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${!isLogin ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-1 block">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-1 block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 active:scale-[0.98]"
                        >
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </div>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-3 bg-slate-800/50 text-slate-500">or</span></div>
                    </div>

                    <button
                        onClick={handleGuestLogin}
                        className="w-full py-3 border border-slate-600 text-slate-300 font-semibold rounded-xl hover:bg-slate-700/50 hover:border-slate-500 transition-all active:scale-[0.98]"
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;