import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import axios from 'axios';

interface User {
    id: string;
    username: string;
    elo: number;
    is_admin: number;
    is_banned: number;
    created_at: string;
}

export default function AdminPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load users');
            if (err.response?.status === 403) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBan = async (username: string) => {
        if (!confirm(`Ban user ${username}?`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/admin/ban`,
                { username },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to ban user');
        }
    };

    const handleUnban = async (username: string) => {
        if (!confirm(`Unban user ${username}?`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/admin/unban`,
                { username },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to unban user');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <div className="text-xl">Loading admin panel...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">👑 Admin Panel</h1>
                    <p className="text-slate-400">Manage users and moderation</p>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Username</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">ELO</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Role</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Joined</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-800/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{u.username}</span>
                                            {u.username === user?.username && (
                                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">You</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{u.elo}</td>
                                    <td className="px-6 py-4">
                                        {u.is_banned ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                                🚫 Banned
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                                ✓ Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.is_admin ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                👑 Admin
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-sm">User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {!u.is_admin && (
                                            <>
                                                {u.is_banned ? (
                                                    <button
                                                        onClick={() => handleUnban(u.username)}
                                                        className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm font-medium transition"
                                                    >
                                                        Unban
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBan(u.username)}
                                                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-sm font-medium transition"
                                                    >
                                                        Ban
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 text-sm text-slate-400">
                    Total users: {users.length} | Active: {users.filter(u => !u.is_banned).length} | Banned: {users.filter(u => u.is_banned).length}
                </div>
            </div>
        </div>
    );
}
