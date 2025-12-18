import React from 'react';
import { useGameStore } from '../game/store';
import { Undo2, Settings2, Play } from 'lucide-react';

export const Controls: React.FC = () => {
    const {
        initGame,
        undo,
        difficulty,
        setDifficulty,
        playerColor,
        setPlayerColor,
        isAiThinking,
        history
    } = useGameStore();

    return (
        <div className="bg-slate-800 text-white p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 border-b border-slate-600 pb-2 flex items-center gap-2">
                <Settings2 size={20} /> Controls
            </h2>

            <div className="space-y-4">
                {/* New Game Button */}
                <button
                    onClick={initGame}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                >
                    <Play size={18} /> New Game
                </button>

                {/* Undo Button */}
                <button
                    onClick={undo}
                    disabled={isAiThinking}
                    className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Undo2 size={18} /> Undo Move
                </button>

                {/* Difficulty Slider */}
                <div className="bg-slate-700/50 p-3 rounded">
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                        Bot Difficulty: <span className="text-white font-bold">Level {difficulty}</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={difficulty}
                        onChange={(e) => setDifficulty(Number(e.target.value) as any)}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Lv1</span>
                        <span>Lv2</span>
                        <span>Lv3</span>
                        <span>Lv4</span>
                        <span>Lv5</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        {difficulty === 1 && "Random moves"}
                        {difficulty === 2 && "Prefers captures"}
                        {difficulty === 3 && "Tactical play"}
                        {difficulty === 4 && "Position evaluation"}
                        {difficulty === 5 && "Expert (Minimax)"}
                    </p>
                </div>

                {/* Play as... */}
                <div className="bg-slate-700/50 p-3 rounded">
                    <label className="block text-sm font-medium mb-2 text-slate-300">Play as:</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPlayerColor('w')}
                            disabled={history.length > 0}
                            className={`flex-1 py-1 rounded border transition-colors ${playerColor === 'w'
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent border-slate-500 text-slate-400 hover:border-slate-400'
                                } ${history.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            White
                        </button>
                        <button
                            onClick={() => setPlayerColor('b')}
                            disabled={history.length > 0}
                            className={`flex-1 py-1 rounded border transition-colors ${playerColor === 'b'
                                ? 'bg-black text-white border-black'
                                : 'bg-transparent border-slate-500 text-slate-400 hover:border-slate-400'
                                } ${history.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Black
                        </button>
                    </div>
                    {history.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                            Cannot change color during game
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
