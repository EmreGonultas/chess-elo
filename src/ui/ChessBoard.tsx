import React, { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../game/store';
import type { Square } from 'chess.js';

export const ChessBoardUI: React.FC = () => {
    const { chess, fen, playerColor, makeMove, status, isAiThinking, turn, history } = useGameStore();
    const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
    const [moveSquares, setMoveSquares] = useState<{ [square: string]: React.CSSProperties }>({});
    const [optionSquares, setOptionSquares] = useState<{ [square: string]: React.CSSProperties }>({});

    useEffect(() => {
        setBoardOrientation(playerColor === 'w' ? 'white' : 'black');
    }, [playerColor]);

    // Clear highlights on turn change or game end
    useEffect(() => {
        setMoveSquares({});
        setOptionSquares({});
    }, [fen, turn, status]);

    // Highlight last move
    useEffect(() => {
        if (history.length > 0) {
            const lastMove = history[history.length - 1];
            setMoveSquares({
                [lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                [lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
            });
        } else {
            setMoveSquares({});
        }
    }, [history]);

    function getMoveOptions(square: Square) {
        if (status !== 'playing' || isAiThinking) return;

        const moves = chess.moves({
            square,
            verbose: true
        });

        if (moves.length === 0) {
            setOptionSquares({});
            return;
        }

        const newSquares: { [square: string]: React.CSSProperties } = {};
        moves.map((move: any) => {
            const targetSquare = move.to as Square;
            const targetPiece = chess.get(targetSquare);
            const sourcePiece = chess.get(square);

            const isCapture = targetPiece && sourcePiece && targetPiece.color !== sourcePiece.color;

            newSquares[move.to] = {
                background:
                    isCapture
                        ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                        : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                borderRadius: '50%'
            };
            return move;
        });

        newSquares[square] = {
            background: 'rgba(255, 255, 0, 0.4)'
        };

        setOptionSquares(newSquares);
    }

    function onPieceDragBegin(_piece: string, sourceSquare: Square) {
        console.log('Drag Begin:', sourceSquare, _piece);
        if (status !== 'playing' || isAiThinking || turn !== playerColor) return;
        getMoveOptions(sourceSquare);
    }

    function onPieceDragEnd() {
        setOptionSquares({});
    }

    function onDrop(sourceSquare: Square, targetSquare: Square, _piece: string) {
        console.log('Drop:', sourceSquare, targetSquare, _piece);
        if (status !== 'playing' || isAiThinking || turn !== playerColor) {
            console.log('Drop rejected: game state');
            return false;
        }

        const moveMade = makeMove(sourceSquare, targetSquare, 'q');
        console.log('Move Result:', moveMade);
        if (!moveMade) {
            setOptionSquares({});
            return false;
        }
        setOptionSquares({});
        return true;
    }

    const onPromotionPieceSelect = (piece?: string, sourceSquare?: Square, targetSquare?: Square) => {
        if (!piece || !sourceSquare || !targetSquare) return false;
        const promotion = piece[1].toLowerCase();
        return makeMove(sourceSquare, targetSquare, promotion);
    };

    // Merge styles
    const customSquareStyles = {
        ...moveSquares,
        ...optionSquares
    };

    // Cast to any because the type definition in this version seems to lack the 'position' prop
    const ChessboardAny = Chessboard as any;

    return (
        <div className="w-full max-w-[600px] aspect-square shadow-xl rounded-lg overflow-hidden border-4 border-slate-700">
            <ChessboardAny
                position={fen}
                onPieceDrop={onDrop}
                onPieceDragBegin={onPieceDragBegin}
                onPieceDragEnd={onPieceDragEnd}
                boardOrientation={boardOrientation}
                arePiecesDraggable={status === 'playing' && !isAiThinking && turn === playerColor}
                onPromotionPieceSelect={onPromotionPieceSelect}
                customSquareStyles={customSquareStyles}
                customDarkSquareStyle={{ backgroundColor: '#779556' }}
                customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                animationDuration={200}
            />
        </div>
    );
};
