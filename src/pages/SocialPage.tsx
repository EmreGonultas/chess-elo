import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { ChallengeModal, ChallengeReceivedModal } from '../components/ChallengeModals';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

interface Friend {
    id: string;
    username: string;
    elo: number;
    created_at: string;
    isOnline?: boolean;
}

interface PendingRequest {
    request_id: string;
    id: string;
    username: string;
    elo: number;
    created_at: string;
}

export default function SocialPage() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showToast, ToastComponent } = useToast();
    const navigate = useNavigate();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [friendUsername, setFriendUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; friendId: string; username: string }>({
        isOpen: false,
        friendId: '',
        username: ''
    });
    const [challengeModal, setChallengeModal] = useState<{ isOpen: boolean; friendId: string; friendUsername: string }>({
        isOpen: false,
        friendId: '',
        friendUsername: ''
    });
    const [challengeReceivedModal, setChallengeReceivedModal] = useState<{
        isOpen: boolean;
        challengeId: string;
        challengerId: string;
        challengerName: string;
        timeControl: number;
    }>({
        isOpen: false,
        challengeId: '',
        challengerId: '',
        challengerName: '',
        timeControl: 0
    });

    useEffect(() => {
        fetchFriends();
        fetchPendingRequests();
    }, []);

    useEffect(() => {
        // Socket listeners for real-time updates
        if (socket) {
            const handleFriendRequestReceived = () => {
                console.log('🔔 Friend request received!');
                fetchPendingRequests();
                showToast('New friend request!', 'info');
            };

            const handleFriendRequestAccepted = ({ username }: { username: string }) => {
                console.log('✅ Friend request accepted by:', username);
                fetchFriends();
                showToast(`${username} accepted your friend request!`, 'success');
            };

            const handleChallengeReceived = (data: { challengeId: string; challengerId: string; challengerName: string; timeControl: number }) => {
                console.log('⚔️ Challenge received from:', data.challengerName);
                setChallengeReceivedModal({
                    isOpen: true,
                    challengeId: data.challengeId,
                    challengerId: data.challengerId,
                    challengerName: data.challengerName,
                    timeControl: data.timeControl
                });
            };

            const handleGameStart = (data: any) => {
                console.log('✅ Game starting, ID:', data.gameId);
                console.log('Game data received:', data);

                // Determine player color
                const playerColor = data.white.userId === user?.id ? 'white' : 'black';

                // Navigate to game page with full gameState including timeControl
                navigate('/game', {
                    state: {
                        gameState: {
                            gameId: data.gameId,
                            playerColor,
                            timeControl: data.timeControl, // Include timeControl!
                            opponent: playerColor === 'white' ? {
                                username: data.black.username,
                                elo: data.black.elo
                            } : {
                                username: data.white.username,
                                elo: data.white.elo
                            },
                            whitePlayer: {
                                username: data.white.username,
                                elo: data.white.elo
                            },
                            blackPlayer: {
                                username: data.black.username,
                                elo: data.black.elo
                            }
                        }
                    }
                });

                console.log('🚀 About to navigate to /multiplayer-game with state:', {
                    gameId: data.gameId,
                    playerColor,
                    timeControl: data.timeControl
                });

                setChallengeReceivedModal({ isOpen: false, challengeId: '', challengerId: '', challengerName: '', timeControl: 0 });
            };

            const handleChallengeDeclined = ({ message }: { message: string }) => {
                showToast(message, 'info');
            };

            const handleFriendStatusChanged = ({ friendId, isOnline }: { friendId: string, isOnline: boolean }) => {
                console.log(`🔄 Friend ${friendId} is now ${isOnline ? 'online 🟢' : 'offline ⚫'}`);
                setFriends(prev => prev.map(f =>
                    f.id === friendId ? { ...f, isOnline } : f
                ));
            };

            socket.on('friend_request_received', handleFriendRequestReceived);
            socket.on('friend_request_accepted', handleFriendRequestAccepted);
            socket.on('challenge_received', handleChallengeReceived);
            socket.on('game_start', handleGameStart);
            socket.on('challenge_declined', handleChallengeDeclined);
            socket.on('friend_status_changed', handleFriendStatusChanged);

            return () => {
                socket.off('friend_request_received', handleFriendRequestReceived);
                socket.off('friend_request_accepted', handleFriendRequestAccepted);
                socket.off('challenge_received', handleChallengeReceived);
                socket.off('game_start', handleGameStart);
                socket.off('challenge_declined', handleChallengeDeclined);
                socket.off('friend_status_changed', handleFriendStatusChanged);
            };
        }
    }, [socket, user, showToast, navigate]);

    const fetchFriends = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriends(res.data);
        } catch (error) {
            console.error('Failed to fetch friends:', error);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/friends/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingRequests(res.data);
        } catch (error) {
            console.error('Failed to fetch pending requests:', error);
        }
    };

    const handleAddFriend = async () => {
        if (!friendUsername.trim()) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/friends/request`,
                { username: friendUsername },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFriendUsername('');
            showToast(`Friend request sent to ${friendUsername}!`, 'success');
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to send friend request', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/friends/accept`,
                { requestId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchFriends();
            fetchPendingRequests();
            showToast('Friend request accepted!', 'success');
        } catch (error) {
            showToast('Failed to accept friend request', 'error');
        }
    };

    const handleDeclineRequest = async (requestId: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/friends/decline`,
                { requestId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchPendingRequests();
            showToast('Friend request declined', 'info');
        } catch (error) {
            showToast('Failed to decline friend request', 'error');
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/friends/${friendId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFriends();
            showToast('Friend removed', 'info');
            setConfirmModal({ isOpen: false, friendId: '', username: '' });
        } catch (error) {
            showToast('Failed to remove friend', 'error');
        }
    };

    const handleSendChallenge = (timeControl: 5 | 10) => {
        if (!socket || !user) return;

        socket.emit('send_challenge', {
            friendId: challengeModal.friendId,
            challengerName: user.username,
            timeControl: timeControl * 60000
        });

        showToast(`Challenge sent to ${challengeModal.friendUsername}!`, 'success');
        setChallengeModal({ isOpen: false, friendId: '', friendUsername: '' });
    };

    const handleAcceptChallenge = () => {
        if (!socket || !user) return;

        console.log('🎯 Accepting challenge from:', challengeReceivedModal.challengerName);
        console.log('🎯 Challenge data:', {
            challengeId: challengeReceivedModal.challengeId,
            challengerId: challengeReceivedModal.challengerId,
            timeControl: challengeReceivedModal.timeControl
        });

        socket.emit('accept_challenge', {
            challengeId: challengeReceivedModal.challengeId,
            challengerId: challengeReceivedModal.challengerId,
            challengerName: challengeReceivedModal.challengerName,
            accepterName: user.username,
            timeControl: challengeReceivedModal.timeControl
        });

        console.log('✅ accept_challenge event emitted');

        setChallengeReceivedModal({ isOpen: false, challengeId: '', challengerId: '', challengerName: '', timeControl: 0 });
    };

    const handleDeclineChallenge = () => {
        if (!socket || !user) return;

        socket.emit('decline_challenge', {
            challengerId: challengeReceivedModal.challengerId,
            declinerName: user.username
        });

        showToast('Challenge declined', 'info');
        setChallengeReceivedModal({ isOpen: false, challengeId: '', challengerId: '', challengerName: '', timeControl: 0 });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Social
                    </h1>
                    <p className="text-slate-400 mt-2">Connect with friends and play casual matches</p>
                </header>

                {/* Add Friend Section */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">➕ Add Friend</h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={friendUsername}
                            onChange={(e) => setFriendUsername(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
                            placeholder="Enter username..."
                            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={handleAddFriend}
                            disabled={loading || !friendUsername.trim()}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Sending...' : 'Send Request'}
                        </button>
                    </div>
                </div>

                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">📬 Pending Requests ({pendingRequests.length})</h2>
                        <div className="space-y-3">
                            {pendingRequests.map((req) => (
                                <div key={req.request_id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl">👤</div>
                                        <div>
                                            <div className="font-bold text-lg">{req.username}</div>
                                            <div className="text-sm text-slate-400">{req.elo} ELO</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAcceptRequest(req.request_id)}
                                            className="px-5 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors"
                                        >
                                            ✓ Accept
                                        </button>
                                        <button
                                            onClick={() => handleDeclineRequest(req.request_id)}
                                            className="px-5 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
                                        >
                                            ✗ Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Friends List */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">👥 Friends ({friends.length})</h2>

                    {friends.length === 0 ? (
                        <div className="text-slate-400 text-center py-12">
                            <div className="text-5xl mb-4">🤝</div>
                            <p className="text-lg">No friends yet!</p>
                            <p className="text-sm mt-2">Add friends to play casual matches together</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {friends.map((friend) => (
                                <div key={friend.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-750 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {/* Online status indicator */}
                                        <div
                                            className={`w-3 h-3 rounded-full ${friend.isOnline ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-500'
                                                }`}
                                            title={friend.isOnline ? 'Online' : 'Offline'}
                                        />

                                        <div className="text-3xl">👤</div>
                                        <div>
                                            <div className="font-bold text-lg">{friend.username}</div>
                                            <div className="text-sm text-slate-400">{friend.elo} ELO</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setChallengeModal({
                                                isOpen: true,
                                                friendId: friend.id,
                                                friendUsername: friend.username
                                            })}
                                            disabled={!friend.isOnline}
                                            className={`px-5 py-2 rounded-lg font-semibold transition-all ${friend.isOnline
                                                ? 'bg-purple-600 hover:bg-purple-500 hover:scale-105 cursor-pointer'
                                                : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                                                }`}
                                            title={!friend.isOnline ? 'Friend is offline' : 'Challenge to a casual game'}
                                        >
                                            ⚔️ Challenge
                                        </button>
                                        <button
                                            onClick={() => setConfirmModal({
                                                isOpen: true,
                                                friendId: friend.id,
                                                username: friend.username
                                            })}
                                            className="px-4 py-2 text-red-400 hover:bg-red-950 rounded-lg transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {ToastComponent}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Remove Friend?"
                message={`Are you sure you want to remove ${confirmModal.username} from your friends list?`}
                onConfirm={() => handleRemoveFriend(confirmModal.friendId)}
                onCancel={() => setConfirmModal({ isOpen: false, friendId: '', username: '' })}
            />
            <ChallengeModal
                isOpen={challengeModal.isOpen}
                friendUsername={challengeModal.friendUsername}
                onChallenge={handleSendChallenge}
                onCancel={() => setChallengeModal({ isOpen: false, friendId: '', friendUsername: '' })}
            />
            <ChallengeReceivedModal
                isOpen={challengeReceivedModal.isOpen}
                challengerName={challengeReceivedModal.challengerName}
                timeControl={challengeReceivedModal.timeControl}
                onAccept={handleAcceptChallenge}
                onDecline={handleDeclineChallenge}
            />
        </div>
    );
}
