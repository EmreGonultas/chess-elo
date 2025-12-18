import React, { useState, useEffect } from 'react';
import { useGameStore } from '../game/store';
import type { Square } from 'chess.js';

// Wikipedia Commons chess pieces - professional quality
const PIECE_IMAGES: Record<string, string> = {
    'wp': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    'wn': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    'wb': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    'wr': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    'wq': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    'wk': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    'bp': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    'bn': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    'bb': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    'br': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    'bq': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    'bk': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
};

export const SimpleChessBoard: React.FC = () => {
    const { chess, makeMove, playerColor, history, status } = useGameStore();
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [highlightedMoves, setHighlightedMoves] = useState<Square[]>([]);
    const [pendingPromotion, setPendingPromotion] = useState<{ from: Square, to: Square } | null>(null);

    // Calculate board size based on viewport - initialize with safe mobile value
    const [boardSize, setBoardSize] = useState(360);

    useEffect(() => {
        const calculateBoardSize = () => {
            const vw = window.innerWidth;
            if (vw >= 650) {
                setBoardSize(600);
            } else {
                setBoardSize(Math.floor(vw * 0.95));
            }
        };
        calculateBoardSize();
        window.addEventListener('resize', calculateBoardSize);
        return () => window.removeEventListener('resize', calculateBoardSize);
    }, []);

    const squareSize = boardSize / 8;

    // Flip board if playing as Black
    const files = playerColor === 'b'
        ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
        : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = playerColor === 'b'
        ? ['1', '2', '3', '4', '5', '6', '7', '8']
        : ['8', '7', '6', '5', '4', '3', '2', '1'];

    const lastMove = history.length > 0 ? history[history.length - 1] : null;

    const handleSquareClick = (square: Square) => {
        // Don't allow moves if game is over
        if (status !== 'playing') {
            return;
        }

        if (pendingPromotion) {
            return;
        }

        if (!selectedSquare) {
            const piece = chess.get(square);

            if (piece && piece.color === playerColor) {
                setSelectedSquare(square);
                const moves = chess.moves({ square, verbose: true });
                setHighlightedMoves(moves.map(m => m.to as Square));
            }
        } else {
            // Check for promotion
            const moves = chess.moves({ square: selectedSquare, verbose: true });
            const isPromotion = moves.some(m => m.to === square && m.promotion);

            if (isPromotion) {
                setPendingPromotion({ from: selectedSquare, to: square });
            } else {
                makeMove(selectedSquare, square);
                setSelectedSquare(null);
                setHighlightedMoves([]);
            }
        }
    };

    const handlePromotionSelect = (piece: 'q' | 'r' | 'b' | 'n') => {
        if (pendingPromotion) {
            makeMove(pendingPromotion.from, pendingPromotion.to, piece);
            setPendingPromotion(null);
            setSelectedSquare(null);
            setHighlightedMoves([]);
        }
    };

    const getPieceImage = (square: Square) => {
        const piece = chess.get(square);
        if (!piece) return null;
        const key = piece.color + piece.type;
        return PIECE_IMAGES[key];
    };

    const isLightSquare = (file: string, rank: string) => {
        const fileIndex = files.indexOf(file);
        const rankIndex = ranks.indexOf(rank);
        return (fileIndex + rankIndex) % 2 === 0;
    };

    return (
        <div className="relative mx-auto bg-gray-800 rounded-lg shadow-2xl p-1" style={{ width: `${boardSize + 8}px` }}>
            {/* Promotion Modal Overlay */}
            {pendingPromotion && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 rounded-lg backdrop-blur-sm">
                    <div className="bg-slate-800 p-4 rounded-xl border-2 border-slate-600 shadow-2xl transform scale-100 animate-fadeIn">
                        <h3 className="text-white text-lg font-bold mb-3 text-center">Promote to:</h3>
                        <div className="flex gap-2">
                            {['q', 'r', 'b', 'n'].map((type) => {
                                const pieceKey = playerColor + type;
                                const imgParams = PIECE_IMAGES[pieceKey];

                                return (
                                    <button
                                        key={type}
                                        onClick={() => handlePromotionSelect(type as any)}
                                        className="w-16 h-16 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-500 hover:border-yellow-400 transition-all flex items-center justify-center p-2"
                                    >
                                        <img src={imgParams} alt={type} className="w-full h-full object-contain" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div
                className="overflow-hidden bg-gray-900 rounded"
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(8, ${squareSize}px)`,
                    gridTemplateRows: `repeat(8, ${squareSize}px)`,
                    width: `${boardSize}px`,
                    height: `${boardSize}px`,
                    margin: '0 auto',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden' as const
                }}
            >
                {ranks.map(rank =>
                    files.map(file => {
                        const square = (file + rank) as Square;
                        const pieceImage = getPieceImage(square);
                        const isLight = isLightSquare(file, rank);
                        const isSelected = selectedSquare === square;
                        const isHighlighted = highlightedMoves.includes(square);
                        const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square);

                        return (
                            <div
                                key={square}
                                onClick={() => handleSquareClick(square)}
                                className={`
                                    flex items-center justify-center cursor-pointer
                                    select-none relative p-2
                                    ${isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'}
                                    ${isSelected ? 'ring-4 ring-inset ring-yellow-400' : ''}
                                    ${isLastMoveSquare ? 'bg-opacity-80' : ''}
                                    hover:opacity-90 transition-all
                                `}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '-0.5px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {pieceImage && (
                                    <img
                                        src={pieceImage}
                                        alt=""
                                        className="w-full h-full object-contain"
                                        draggable={false}
                                    />
                                )}
                                {isHighlighted && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className={`
                                            rounded-full 
                                            ${pieceImage ? 'w-16 h-16 border-4 border-green-500 border-opacity-70' : 'w-5 h-5 bg-green-500 bg-opacity-70'}
                                        `} />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
