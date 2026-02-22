import { useState } from "react"

function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const endpoint = isLogin ? 'login' : 'signup';

        try {
            const response = await fetch(`http://localhost:3001/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = '/';
            } else {
                setError('Invalid credentials');
            }
        } catch (error) {
            setError('Connection error')
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <form onSubmit={handleLogin} className="m-5 bg-white border-4 border-blue-400 p-8 rounded-2xl w-full max-w-md flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-center">
                    {isLogin ? "Log in" : "Register"}
                </h2>
                
                {error && <p className="text-red-500 font-bold text-center">{error}</p>}

                <label className="flex flex-col">
                    <span className="text-sm font-medium">{isLogin ? "Username:" : "Set a username:"}</span>
                    <input
                        type="text"
                        placeholder="username"
                        className="p-2 rounded mt-1 text-black border-4 border-blue-300 outline-none"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </label>
                
                <label className="flex flex-col">
                    <span className="text-sm font-medium">{isLogin ? "Password:" : "Set a password:"}</span>
                    <input
                        type="password"
                        placeholder="••••••••"
                        className="p-2 rounded mt-1 text-black border-4 border-blue-300 outline-none"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>

                <button
                    className="bg-blue-500 text-white py-2 rounded font-bold hover:bg-blue-600 cursor-pointer"
                    type="submit"
                >
                    {isLogin ? "Sign in" : "Create an account"}
                </button>   
                {isLogin ? (<div className="text-center">
                    <p>Don't have an account?</p>
                    <p><span onClick={() => setIsLogin(!isLogin)} className="cursor-pointer font-bold text-blue-500 hover:underline">Register</span> or <span className="cursor-pointer font-bold text-blue-500 hover:underline">continue without an account</span></p>
                </div>)
                : <div className="text-center mt-6">
                    <p><span onClick={() => setIsLogin(!isLogin)} className="cursor-pointer font-bold text-blue-500 hover:underline">Back to logging in</span></p>
                </div>}
            </form>
        </div>
    )
}

export default AuthPage