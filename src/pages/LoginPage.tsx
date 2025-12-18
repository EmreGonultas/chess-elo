import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Attempt real login
            const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
            login(res.data.token, res.data.user);
            navigate('/ranked');
        } catch (err: any) {
            console.error(err);
            // If server is down or fails, fallback to mock for demo (optional, but good for UX stability during dev)
            // For now, let's show error or just simple mock if connection refused?
            if (err.code === "ERR_NETWORK") {
                setError("Server unreachable. Please run 'npm run server'.");
            } else {
                setError(err.response?.data?.error || 'Login failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors z-20 group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </button>

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                            Chess ELO
                        </h1>
                        <p className="text-slate-400">Ranked Competitive Play</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                                placeholder="Enter your handle"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Authenticating...' : 'Enter Arena'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/register')}
                            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            Don't have an account? Sign up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
