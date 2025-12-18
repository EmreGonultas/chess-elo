import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../game/store';

export const GameInfo: React.FC = () => {
    const { history, status, turn, winner, isAiThinking } = useGameStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const getStatusText = () => {
        if (status === 'playing') {
            if (isAiThinking) return 'AI is thinking...';
            return `${turn === 'w' ? 'White' : 'Black'}'s Turn`;
        }
        if (status === 'checkmate') return `Checkmate! ${winner === 'w' ? 'White' : 'Black'} wins!`;
        if (status === 'draw') return 'Draw';
        if (status === 'stalemate') return 'Stalemate';
        return status;
    };

    // Format history into pairs
    const movePairs = [];
    for (let i = 0; i < history.length; i += 2) {
        movePairs.push({
            num: Math.floor(i / 2) + 1,
            white: history[i],
            black: history[i + 1] || null
        });
    }

    return (
        <div className="bg-slate-800 text-white p-4 rounded-lg shadow-lg flex flex-col h-full max-h-[600px]">
            <h2 className="text-xl font-bold mb-4 border-b border-slate-600 pb-2">Game Status</h2>

            <div className="mb-4 p-3 bg-slate-700 rounded text-center font-semibold text-lg text-amber-400">
                {getStatusText()}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" ref={scrollRef}>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-slate-400 border-b border-slate-600">
                            <th className="py-2 w-12">#</th>
                            <th className="py-2">White</th>
                            <th className="py-2">Black</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movePairs.map((pair) => (
                            <tr key={pair.num} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                <td className="py-1 text-slate-500">{pair.num}.</td>
                                <td className="py-1 font-mono text-slate-200">{pair.white.san}</td>
                                <td className="py-1 font-mono text-slate-200">{pair.black ? pair.black.san : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {history.length === 0 && (
                    <div className="text-slate-500 text-center mt-4 italic">No moves yet</div>
                )}
            </div>
        </div>
    );
};
