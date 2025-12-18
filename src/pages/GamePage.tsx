import { useRef, useEffect } from 'react';
import { useGameStore } from '../game/store';
import { SimpleChessBoard } from '../ui/SimpleChessBoard';
import { Controls } from '../ui/Controls';
import { GameInfo } from '../ui/GameInfo';
import { VictoryModal } from '../ui/VictoryModal';

export default function GamePage() {
  const {
    fen,
    status,
    turn,
    playerColor,
    difficulty,
    makeMove,
    setAiThinking,
    initGame
  } = useGameStore();

  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../ai/bot.worker.ts', import.meta.url), {
      type: 'module'
    });

    // Handle messages from worker
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'move_ready') {
        if (payload) {
          makeMove(payload.from, payload.to, payload.promotion);
        }
        setAiThinking(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [makeMove, setAiThinking]);

  // Trigger Bot Move via Worker
  useEffect(() => {
    if (status === 'playing' && turn !== playerColor && workerRef.current) {
      setAiThinking(true);

      // Delay slightly for UX (so it doesn't respond instantly on easy levels)
      // On hard levels, the calculation time itself provides the delay
      setTimeout(() => {
        workerRef.current?.postMessage({
          type: 'calculate_move',
          payload: {
            fen,
            difficulty
          }
        });
      }, 500);
    }
  }, [fen, status, turn, playerColor, difficulty, setAiThinking]);

  // Init game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-[auto_350px] gap-8">

        {/* Left Column: Board */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Chess ELO
          </div>
          <SimpleChessBoard />


        </div>

        {/* Right Column: Controls & Info */}
        <div className="flex flex-col gap-4 h-full">
          <Controls />
          <div className="flex-1 min-h-[300px]">
            <GameInfo />
          </div>
        </div>

      </div>

      {/* Victory Modal */}
      {(status === 'checkmate' || status === 'stalemate' || status === 'draw') && (
        <VictoryModal
          winner={
            status === 'checkmate'
              ? (turn === 'w' ? 'black' : 'white')
              : 'draw'
          }
          playerColor={playerColor}
          onNewGame={initGame}
        />
      )}
    </div>
  );
}


