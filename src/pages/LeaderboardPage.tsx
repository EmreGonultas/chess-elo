import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { getRankInfo } from '../utils/rank-utils';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardPlayer {
    id: string;
    username: string;
    elo: number;
    rank: number;
}

export default function LeaderboardPage() {
    const { user } = useAuth();
    const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/leaderboard/top?limit=100`);
            setPlayers(response.data);
            setError('');
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
            setError('Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const getMedalIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-yellow-400" />;
            case 2:
                return <Medal className="w-6 h-6 text-slate-400" />;
            case 3:
                return <Award className="w-6 h-6 text-amber-600" />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                        Global Leaderboard
                    </h1>
                    <p className="text-slate-400">Top players ranked by ELO</p>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-900/20 border border-red-500 text-red-400 px-6 py-4 rounded-lg">
                        {error}
                    </div>
                ) : (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-800/50 border-b border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">Rank</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">Player</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">Tier</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">ELO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((player) => {
                                        const rankInfo = getRankInfo(player.elo);
                                        const isCurrentUser = user?.id === player.id;

                                        return (
                                            <tr
                                                key={player.id}
                                                className={`border-b border-slate-800 hover:bg-slate-800/30 transition-colors ${isCurrentUser ? 'bg-blue-500/10 border-blue-500/30' : ''
                                                    }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {getMedalIcon(player.rank)}
                                                        <span className={`font-bold ${player.rank <= 3 ? 'text-xl' : 'text-lg'}`}>
                                                            #{player.rank}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold">
                                                            {player.username}
                                                        </span>
                                                        {isCurrentUser && (
                                                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                                                YOU
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={rankInfo.asset}
                                                            alt={rankInfo.name}
                                                            className="w-8 h-8 object-contain"
                                                        />
                                                        <span className={`font-bold ${rankInfo.textColor}`}>
                                                            {rankInfo.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-lg font-mono font-bold text-emerald-400">
                                                        {player.elo}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {players.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                No players found. Be the first to climb the ranks!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
