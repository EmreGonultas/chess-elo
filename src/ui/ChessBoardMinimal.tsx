import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../game/store';

export const ChessBoardMinimal: React.FC = () => {
    const { fen, makeMove } = useGameStore();
    const [msg, setMsg] = useState('Waiting for interaction...');

    // Try EVERY possible prop name variation
    const handlers = {
        // Standard names
        onPieceDrop: (src: string, tgt: string) => {
            setMsg(`onPieceDrop: ${src} → ${tgt}`);
            console.log('onPieceDrop fired:', src, tgt);
            return makeMove(src, tgt);
        },
        onDrop: (src: string, tgt: string) => {
            setMsg(`onDrop: ${src} → ${tgt}`);
            console.log('onDrop fired:', src, tgt);
            return makeMove(src, tgt);
        },
        onPieceClick: (piece: string) => {
            setMsg(`onPieceClick: ${piece}`);
            console.log('onPieceClick fired:', piece);
        },
        onSquareClick: (square: string) => {
            setMsg(`onSquareClick: ${square}`);
            console.log('onSquareClick fired:', square);
        },
        onClick: (square: string) => {
            setMsg(`onClick: ${square}`);
            console.log('onClick fired:', square);
        },
        onMouseOverSquare: (square: string) => {
            console.log('onMouseOverSquare:', square);
        },
        onSquareRightClick: (square: string) => {
            setMsg(`onSquareRightClick: ${square}`);
            console.log('onSquareRightClick fired:', square);
        },
    };

    const ChessboardAny = Chessboard as any;

    return (
        <div className="w-full max-w-[600px] space-y-4">
            <div className="bg-yellow-500 text-black p-4 rounded font-bold text-center">
                STATUS: {msg}
            </div>

            <div className="aspect-square border-4 border-green-500">
                <ChessboardAny
                    position={fen}
                    {...handlers}
                    boardWidth={600}
                    arePiecesDraggable={true}
                    customBoardStyle={{
                        borderRadius: '4px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                        backgroundColor: 'pink' // To verify it's rendering
                    }}
                />
            </div>

            <div className="text-white bg-blue-900 p-2 text-xs">
                Testing ALL possible event handlers. If yellow box never changes, the library is completely broken.
            </div>
        </div>
    );
};
