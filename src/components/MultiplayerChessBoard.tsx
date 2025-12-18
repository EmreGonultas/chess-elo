import React, { useState, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
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

interface MultiplayerChessBoardProps {
    position: string;
    onMove: (from: string, to: string, promotion?: string) => void;
    playerColor: 'w' | 'b';
    isMyTurn: boolean;
}

export const MultiplayerChessBoard: React.FC<MultiplayerChessBoardProps> = ({
    position,
    onMove,
    playerColor,
    isMyTurn
}) => {
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [highlightedMoves, setHighlightedMoves] = useState<Square[]>([]);
    const [pendingPromotion, setPendingPromotion] = useState<{ from: Square, to: Square } | null>(null);

    // Calculate board size based on viewport - initialize with safe mobile value
    const [boardSize, setBoardSize] = useState(360);

    useEffect(() => {
        const calculateBoardSize = () => {
            // Get viewport width
            const vw = window.innerWidth;

            // Use 600px fixed board if there's enough space (with 50px padding)
            // Otherwise scale to fit with 5% margin
            if (vw >= 650) {
                // Desktop/large enough: fixed 600px
                setBoardSize(600);
            } else {
                // Mobile/narrow: scale to fit
                setBoardSize(Math.floor(vw * 0.95));
            }
        };

        calculateBoardSize();
        window.addEventListener('resize', calculateBoardSize);
        return () => window.removeEventListener('resize', calculateBoardSize);
    }, []);

    const squareSize = boardSize / 8;

    // Create a new chess instance whenever position changes
    const chess = useMemo(() => {
        const c = new Chess();
        try {
            c.load(position);
        } catch (e) {
            console.error('Failed to load position:', position, e);
        }
        return c;
    }, [position]);

    // Clear selection when position changes (new move was made)
    useEffect(() => {
        setSelectedSquare(null);
        setHighlightedMoves([]);
    }, [position]);

    // Flip board if playing as Black
    const files = playerColor === 'b'
        ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
        : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = playerColor === 'b'
        ? ['1', '2', '3', '4', '5', '6', '7', '8']
        : ['8', '7', '6', '5', '4', '3', '2', '1'];

    const handleSquareClick = (square: Square) => {
        console.log('Square clicked:', square, 'isMyTurn:', isMyTurn);

        // Don't allow moves if it's not my turn
        if (!isMyTurn) {
            console.log('Not my turn, ignoring click');
            return;
        }

        if (pendingPromotion) {
            return;
        }

        if (!selectedSquare) {
            const piece = chess.get(square);
            console.log('Piece at square:', piece);

            if (piece && piece.color === playerColor) {
                setSelectedSquare(square);
                const moves = chess.moves({ square, verbose: true });
                console.log('Valid moves:', moves);
                setHighlightedMoves(moves.map(m => m.to as Square));
            }
        } else {
            // Check if clicking same square (deselect)
            if (square === selectedSquare) {
                setSelectedSquare(null);
                setHighlightedMoves([]);
                return;
            }

            // Check for valid move
            const moves = chess.moves({ square: selectedSquare, verbose: true });
            const moveToSquare = moves.find(m => m.to === square);

            if (moveToSquare) {
                if (moveToSquare.promotion) {
                    setPendingPromotion({ from: selectedSquare, to: square });
                } else {
                    console.log('Making move:', selectedSquare, '->', square);
                    onMove(selectedSquare, square);
                    setSelectedSquare(null);
                    setHighlightedMoves([]);
                }
            } else {
                // Clicked invalid square, check if it's another piece we own
                const piece = chess.get(square);
                if (piece && piece.color === playerColor) {
                    setSelectedSquare(square);
                    const newMoves = chess.moves({ square, verbose: true });
                    setHighlightedMoves(newMoves.map(m => m.to as Square));
                } else {
                    setSelectedSquare(null);
                    setHighlightedMoves([]);
                }
            }
        }
    };

    const handlePromotionSelect = (piece: 'q' | 'r' | 'b' | 'n') => {
        if (pendingPromotion) {
            onMove(pendingPromotion.from, pendingPromotion.to, piece);
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

                        return (
                            <div
                                key={square}
                                onClick={() => handleSquareClick(square)}
                                className={`
                                    flex items-center justify-center cursor-pointer
                                    select-none relative p-2
                                    ${isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'}
                                    ${isSelected ? 'ring-4 ring-inset ring-yellow-400' : ''}
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
