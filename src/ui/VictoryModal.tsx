import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles } from 'lucide-react';

interface VictoryModalProps {
    winner: 'white' | 'black' | 'draw';
    playerColor: 'w' | 'b';
    onNewGame: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ winner, playerColor, onNewGame }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setTimeout(() => setShow(true), 100);
    }, []);

    const getMessage = () => {
        if (winner === 'draw') return 'Draw!';
        return winner === 'white' ? 'White Wins!' : 'Black Wins!';
    };

    const getEmoji = () => {
        if (winner === 'draw') return '🤝';
        // Check if player won
        const playerWon = (playerColor === 'w' && winner === 'white') || (playerColor === 'b' && winner === 'black');
        return playerWon ? '🎉' : '😔';
    };

    // Determine if player won
    const playerWon = winner !== 'draw' && (
        (playerColor === 'w' && winner === 'white') ||
        (playerColor === 'b' && winner === 'black')
    );

    const getBorderColor = () => {
        if (winner === 'draw') return 'border-gray-400';
        return playerWon ? 'border-green-500' : 'border-red-500';
    };

    const getTextColor = () => {
        if (winner === 'draw') return 'text-gray-300';
        return playerWon ? 'text-green-400' : 'text-red-400';
    };

    const getIconColor = () => {
        if (winner === 'draw') return 'text-gray-400';
        return playerWon ? 'text-green-400' : 'text-red-400';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className={`
                bg-gradient-to-br from-slate-800 to-slate-900 
                border-4 ${winner === 'white' ? 'border-yellow-400' : winner === 'black' ? 'border-purple-400' : 'border-gray-400'}
                rounded-2xl shadow-2xl p-8 text-center
                transform transition-all duration-500
                ${show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
            `}>
                {/* Animated confetti effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-10%',
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        >
                            <Sparkles
                                className={winner === 'white' ? 'text-yellow-400' : winner === 'black' ? 'text-purple-400' : 'text-gray-400'}
                                size={16 + Math.random() * 16}
                            />
                        </div>
                    ))}
                </div>

                {/* Trophy icon */}
                <div className="mb-6 relative">
                    <div className="text-8xl animate-bounce">
                        {getEmoji()}
                    </div>
                    <Trophy
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse ${winner === 'white' ? 'text-yellow-400' : winner === 'black' ? 'text-purple-400' : 'text-gray-400'
                            }`}
                        size={80}
                        strokeWidth={1}
                    />
                </div>

                {/* Victory message */}
                <h2 className={`
                    text-5xl font-bold mb-4 animate-pulse
                    ${winner === 'white' ? 'text-yellow-400' : winner === 'black' ? 'text-purple-400' : 'text-gray-300'}
                `}>
                    {getMessage()}
                </h2>

                <p className="text-slate-300 text-lg mb-8">
                    {winner === 'draw'
                        ? 'Well played by both sides!'
                        : `Checkmate! ${winner === 'white' ? 'White' : 'Black'} is victorious!`
                    }
                </p>

                {/* New game button */}
                <button
                    onClick={onNewGame}
                    className="
                        bg-gradient-to-r from-blue-600 to-blue-500 
                        hover:from-blue-500 hover:to-blue-400
                        text-white font-bold py-4 px-8 rounded-lg
                        transform hover:scale-105 transition-all duration-200
                        shadow-lg hover:shadow-xl
                    "
                >
                    Play Again
                </button>
            </div>
        </div>
    );
};
