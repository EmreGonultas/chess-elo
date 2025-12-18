interface ChallengeModalProps {
    isOpen: boolean;
    friendUsername: string;
    onChallenge: (timeControl: 5 | 10) => void;
    onCancel: () => void;
}

export function ChallengeModal({ isOpen, friendUsername, onChallenge, onCancel }: ChallengeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <h3 className="text-2xl font-bold mb-2">⚔️ Challenge {friendUsername}</h3>
                <p className="text-slate-300 mb-6">Select time control for casual match</p>

                <div className="space-y-3 mb-6">
                    <button
                        onClick={() => onChallenge(5)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                    >
                        🔥 5 Minutes
                    </button>
                    <button
                        onClick={() => onChallenge(10)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                    >
                        ⚡ 10 Minutes
                    </button>
                </div>

                <button
                    onClick={onCancel}
                    className="w-full px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

interface ChallengeReceivedModalProps {
    isOpen: boolean;
    challengerName: string;
    timeControl: number;
    onAccept: () => void;
    onDecline: () => void;
}

export function ChallengeReceivedModal({ isOpen, challengerName, timeControl, onAccept, onDecline }: ChallengeReceivedModalProps) {
    if (!isOpen) return null;

    const minutes = timeControl / 60000;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-slate-800 border-2 border-yellow-500 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-bounce-in">
                <div className="text-center mb-4">
                    <div className="text-6xl mb-3">⚔️</div>
                    <h3 className="text-2xl font-bold text-yellow-400">Challenge Received!</h3>
                </div>

                <p className="text-slate-200 text-center mb-6 text-lg">
                    <span className="font-bold text-white">{challengerName}</span> has challenged you to a{' '}
                    <span className="font-bold text-cyan-400">{minutes} minute</span> casual match!
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onDecline}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-colors"
                    >
                        ✗ Decline
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors"
                    >
                        ✓ Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
