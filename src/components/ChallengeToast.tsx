import { useAuth } from '../context/AuthContext';

interface ChallengeToastProps {
    challengerName: string;
    challengerId: string;
    challengeId: string;
    timeControl: number;
    onClose: () => void;
}

export function ChallengeToast({ challengerName, challengerId, challengeId, timeControl, onClose }: ChallengeToastProps) {
    const { user } = useAuth();

    const handleAccept = () => {
        // Emit accept via socket with all required data
        const socket = (window as any).socketInstance;
        const accepterName = user?.username || 'Unknown';

        console.log('📤 Emitting accept_challenge:', {
            challengeId,
            challengerId,
            challengerName,
            accepterName,
            timeControl
        });

        if (socket) {
            socket.emit('accept_challenge', {
                challengeId,
                challengerId,
                challengerName,
                accepterName,
                timeControl
            });
            console.log('✅ accept_challenge emitted, waiting for game_start...');
        } else {
            console.error('❌ No socket instance found!');
        }

        // Don't close toast here - let game_start listener close it after navigation
    };

    const handleDecline = () => {
        const socket = (window as any).socketInstance;
        if (socket) {
            socket.emit('decline_challenge', { challengeId });
        }
        onClose();
    };

    return (
        <div className="fixed top-20 right-4 z-50 bg-slate-800 border-2 border-blue-500 rounded-xl shadow-2xl p-4 min-w-[320px] animate-slide-in">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">🎯 Chess Challenge!</h3>
                    <p className="text-slate-300 text-sm mt-1">
                        <span className="font-semibold text-blue-400">{challengerName}</span> has challenged you!
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                        Time: {timeControl === 0 ? 'Unlimited' : `${timeControl / 60} min`}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors ml-2"
                >
                    ✕
                </button>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleAccept}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    ✓ Accept
                </button>
                <button
                    onClick={handleDecline}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    ✕ Decline
                </button>
            </div>
        </div>
    );
}
