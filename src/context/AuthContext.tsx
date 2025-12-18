import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface User {
    id: string;
    username: string;
    elo: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    // Fetch fresh user data from server
    const refreshUser = useCallback(async () => {
        if (!token) return;

        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const res = await axios.get('http://192.168.1.18:3000/api/auth/me');
            setUser(res.data);
            console.log('User data refreshed:', res.data);
        } catch (err) {
            console.error("Failed to refresh user:", err);
        }
    }, [token]);

    // Check auth on mount
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const res = await axios.get('http://192.168.1.18:3000/api/auth/me');
                    setUser(res.data);
                } catch (err) {
                    console.error("Failed to restore session:", err);
                    logout();
                }
            }
        };
        initAuth();
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
