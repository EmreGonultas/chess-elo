import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getRankInfo } from '../utils/rank-utils';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface Match {
    id: string;
    opponent: {
        username: string;
        elo: number;
        eloChange?: number;
    };
    result: 'win' | 'loss' | 'draw';
    myEloChange?: number;
    playedAs: 'white' | 'black';
    date: string;
}

// All ranks info for the modal
const allRanks = [
    { name: 'Paragon', minElo: 2500, asset: '/rank_assets/Paragon.png', textColor: 'animate-rgb-text' },
    { name: 'Ascendant', minElo: 2000, asset: '/rank_assets/Ascendant.png', textColor: 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]' },
    { name: 'Eclipse', minElo: 1500, asset: '/rank_assets/Eclipse.png', textColor: 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.7)]' },
    { name: 'Rift', minElo: 1000, asset: '/rank_assets/Rift.png', textColor: 'text-emerald-400' },
    { name: 'Pulse', minElo: 0, asset: '/rank_assets/Pulse.png', textColor: 'text-blue-400' },
];

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { socket, connected } = useSocket();
    const [inQueue, setInQueue] = useState(false);
    const [queuePosition, setQueuePosition] = useState(0);
    const [activePlayers, setActivePlayers] = useState(0);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [showRankInfo, setShowRankInfo] = useState(false);
    const [timeControl, setTimeControl] = useState<5 | 10>(10);

    const rank = getRankInfo(user?.elo || 800);

    // Refresh user data and fetch match history when mounting
    useEffect(() => {
        refreshUser();
        fetchMatchHistory();
    }, []);

    const fetchMatchHistory = async () => {
        try {
            const res = await axios.get('http://192.168.1.18:3000/api/matches/history');
            setMatches(res.data);
        } catch (error) {
            console.error('Failed to fetch match history:', error);
        } finally {
            setLoadingMatches(false);
        }
    };

    useEffect(() => {
        if (!socket || !connected) return;

        // Request current queue size
        socket.emit('get_queue_size');

        socket.on('queue_joined', (data) => {
            setInQueue(true);
            setQueuePosition(data.position);
            setActivePlayers(data.queueSize || 0);
        });

        socket.on('queue_left', () => {
            setInQueue(false);
            setQueuePosition(0);
        });

        // Listen for global queue updates
        socket.on('queue_update', (data) => {
            setActivePlayers(data.queueSize || 0);
        });

        socket.on('match_found', (data) => {
            console.log('Match found!', data);
            setInQueue(false);

            // Navigate to game page with game state
            navigate('/game', {
                state: {
                    gameState: {
                        gameId: data.gameId,
                        playerColor: data.color,
                        opponent: data.opponent,
                        whitePlayer: data.color === 'white' ? { username: user?.username, elo: user?.elo } : data.opponent,
                        blackPlayer: data.color === 'black' ? { username: user?.username, elo: user?.elo } : data.opponent
                    }
                }
            });
        });

        return () => {
            socket.off('queue_joined');
            socket.off('queue_left');
            socket.off('queue_update');
            socket.off('match_found');
        };
    }, [socket, connected]);

    const handleFindMatch = () => {
        if (!socket || !connected) {
            alert('Not connected to server. Please refresh the page.');
            return;
        }

        if (inQueue) {
            socket.emit('leave_queue', { userId: user?.id });
            setInQueue(false);
        } else {
            const timeControlMs = timeControl * 60000;
            console.log(`🎯 Joining queue with ${timeControl} minutes (${timeControlMs}ms)`);
            socket.emit('join_queue', {
                userId: user?.id,
                username: user?.username,
                elo: user?.elo,
                timeControl: timeControlMs
            });
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Chess ELO <span className="text-slate-500 text-lg font-normal ml-2">/ Dashboard</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="font-bold">{user?.username || 'Unknown Player'}</p>
                            <p className="text-xs text-slate-400">{rank.name} Tier • {user?.elo || 800} ELO</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-800 rounded-full border border-slate-700 overflow-hidden flex items-center justify-center">
                            <img src={rank.asset} alt="Rank" className="w-8 h-8 object-contain" />
                        </div>
                    </div>
                </header>

                {/* User Stats Card */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-8 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-2xl font-bold">Your Stats</h2>
                                <button
                                    onClick={() => setShowRankInfo(true)}
                                    className="w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
                                    title="View all ranks"
                                >
                                    ?
                                </button>
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src={rank.asset}
                                    alt={rank.name}
                                    className="w-48 h-48 object-contain"
                                />
                                <div>
                                    <h3 className={`text-3xl font-bold ${rank.textColor} mb-2`}>
                                        {rank.name}
                                    </h3>
                                    <div className="text-slate-400">Tier {rank.tier}</div>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-emerald-400">
                                {user?.elo || 800} <span className="text-lg text-slate-500">ELO</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-4">Ready to Play?</h3>

                            {/* Time Control Selector */}
                            <div className="flex justify-center gap-2 mb-4">
                                <button
                                    onClick={() => setTimeControl(5)}
                                    disabled={inQueue}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${timeControl === 5
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        } ${inQueue ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    ⚡ 5 min
                                </button>
                                <button
                                    onClick={() => setTimeControl(10)}
                                    disabled={inQueue}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${timeControl === 10
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        } ${inQueue ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    🕐 10 min
                                </button>
                            </div>

                            <button
                                onClick={handleFindMatch}
                                disabled={!connected}
                                className={`
                                    px-8 py-4 rounded-lg font-bold text-lg transition-all
                                    ${inQueue
                                        ? 'bg-red-600 hover:bg-red-500'
                                        : 'bg-green-600 hover:bg-green-500'
                                    }
                                    ${!connected ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                                `}
                            >
                                {inQueue ? 'Cancel Search...' : 'Find Ranked Match →'}
                            </button>

                            {inQueue && (
                                <div className="mt-3 text-sm">
                                    <div className="text-blue-400 animate-pulse">
                                        Searching for opponent... (Position: {queuePosition})
                                    </div>
                                </div>
                            )}

                            {!inQueue && (
                                <div className="mt-3 text-sm text-slate-400">
                                    {connected ? (
                                        <>Estimated Wait: <span className="text-green-400">Instant</span></>
                                    ) : (
                                        <span className="text-red-400">Disconnected - Refresh page</span>
                                    )}
                                </div>
                            )}

                            {/* Active Players Count */}
                            <div className="mt-2 text-xs text-slate-500">
                                🟢 {activePlayers} {activePlayers === 1 ? 'player' : 'players'} in queue
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Matches */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-8">
                    <h2 className="text-2xl font-bold mb-4">Recent Matches</h2>

                    {loadingMatches ? (
                        <div className="text-slate-400 text-center py-8">
                            Loading matches...
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="text-slate-400 text-center py-8">
                            No matches yet. Queue up for your first ranked game!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {matches.map((match) => (
                                <div
                                    key={match.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${match.result === 'win'
                                        ? 'bg-green-950/30 border-green-800/50'
                                        : match.result === 'loss'
                                            ? 'bg-red-950/30 border-red-800/50'
                                            : 'bg-slate-800/50 border-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Result Badge */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${match.result === 'win'
                                            ? 'bg-green-600 text-white'
                                            : match.result === 'loss'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-slate-600 text-white'
                                            }`}>
                                            {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'}
                                        </div>

                                        {/* Opponent Info */}
                                        <div>
                                            <div className="font-bold">{match.opponent.username}</div>
                                            <div className="text-sm text-slate-400">
                                                {match.opponent.elo} ELO • Played as {match.playedAs === 'white' ? '⚪' : '⚫'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ELO Change & Date */}
                                    <div className="text-right">
                                        {match.myEloChange !== undefined && (
                                            <div className={`font-bold text-lg ${match.myEloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {match.myEloChange >= 0 ? '+' : ''}{match.myEloChange}
                                            </div>
                                        )}
                                        <div className="text-slate-400 text-sm">
                                            {formatDate(match.date)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Rank Info Modal */}
            {showRankInfo && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Rank Tiers</h2>
                            <button
                                onClick={() => setShowRankInfo(false)}
                                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-lg font-bold transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            {allRanks.map((r, index) => (
                                <div
                                    key={r.name}
                                    className={`flex items-center gap-4 p-4 rounded-lg border ${rank.name === r.name
                                        ? 'bg-blue-950/30 border-blue-500'
                                        : 'bg-slate-800/50 border-slate-700'
                                        }`}
                                >
                                    <img
                                        src={r.asset}
                                        alt={r.name}
                                        className="w-16 h-16 object-contain"
                                    />
                                    <div className="flex-1">
                                        <h3 className={`text-xl font-bold ${r.textColor}`}>
                                            {r.name}
                                        </h3>
                                        <div className="text-slate-400">
                                            {r.minElo === 0 ? '0 - 999 ELO' :
                                                index === 0 ? `${r.minElo}+ ELO` :
                                                    `${r.minElo} - ${allRanks[index - 1].minElo - 1} ELO`}
                                        </div>
                                    </div>
                                    {rank.name === r.name && (
                                        <div className="text-blue-400 text-sm font-bold">
                                            ← Your Rank
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
