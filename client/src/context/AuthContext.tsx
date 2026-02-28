import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_URL } from '../config';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => void;
    setAuth: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('session-token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.authenticated) {
                        setUser(data.user);
                    } else {
                        localStorage.removeItem('session-token');
                    }
                } else {
                    localStorage.removeItem('session-token');
                }
            } catch (error) {
                console.error("Error validating session:", error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const setAuth = (user: User, token: string) => {
        localStorage.setItem('session-token', token);
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem('session-token');
        setUser(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, setAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
