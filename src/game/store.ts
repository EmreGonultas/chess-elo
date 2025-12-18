import { create } from 'zustand';
import { Chess } from 'chess.js';
import type { Color } from 'chess.js';
import type { GameState, GameStatus, DifficultyLevel } from './types';

interface StoreState extends GameState {
    chess: Chess;
    playerColor: Color;
    difficulty: DifficultyLevel;
    isAiThinking: boolean;

    // Actions
    initGame: () => void;
    setPlayerColor: (color: Color) => void;
    setDifficulty: (level: DifficultyLevel) => void;
    makeMove: (from: string, to: string, promotion?: string) => boolean;
    undo: () => void;
    reset: () => void;
    setAiThinking: (thinking: boolean) => void;
    gameLoopTick: () => void; // Call after every move to check end conditions
}

export const useGameStore = create<StoreState>((set, get) => {
    const chess = new Chess();

    const updateState = () => {
        const isGameOver = chess.isGameOver();
        let status: GameStatus = 'playing';
        let winner: Color | null = null;
        // Keep existing error if not cleared explicitly, or clear it?
        // Let's not clear it in updateState, but init/reset should.

        if (isGameOver) {
            if (chess.isCheckmate()) {
                status = 'checkmate';
                winner = chess.turn() === 'w' ? 'b' : 'w';
            } else if (chess.isStalemate()) {
                status = 'stalemate';
            } else {
                status = 'draw';
            }
        }

        return {
            fen: chess.fen(),
            turn: chess.turn(),
            status,
            winner,
            history: chess.history({ verbose: true }),
            lastMove: chess.history({ verbose: true }).pop() || null,
            check: chess.inCheck(),
        };
    };

    return {
        chess,
        fen: chess.fen(),
        turn: chess.turn(),
        status: 'init',
        winner: null,
        history: [],
        lastMove: null,
        check: false,
        playerColor: 'w',
        difficulty: 3,
        isAiThinking: false,
        lastError: null,

        initGame: () => {
            chess.reset();
            set({ ...updateState(), status: 'playing', lastError: null, playerColor: 'w' });
        },

        setPlayerColor: (color) => set({ playerColor: color }),

        setDifficulty: (level) => set({ difficulty: level }),

        makeMove: (from, to, promotion = 'q') => {
            const { chess, status } = get();
            console.log('store.makeMove called:', { from, to, promotion, status });

            // Clear previous error on new attempt
            set({ lastError: null });

            if (status !== 'playing') {
                console.warn('makeMove rejected: status is', status);
                set({ lastError: `Game not playing (Status: ${status})` });
                return false;
            }

            try {
                // Attempt 1: Try without promotion first (for normal moves)
                let move = null;
                try {
                    move = chess.move({ from, to });
                } catch (e) {
                    // Ignore, try with promotion next
                }

                // If first attempt failed, and we have a promotion value, try with it
                if (!move && promotion) {
                    try {
                        move = chess.move({ from, to, promotion });
                    } catch (e: any) {
                        // Capture this error as the "real" one if both failed
                        console.error('Promotion move failed:', e);
                    }
                }

                if (move) {
                    console.log('Move successful in chess.js:', move);
                    set(updateState());
                    return true;
                } else {
                    console.warn('chess.move returned null/false');
                    set({ lastError: 'Move invalid (chess.js reject)' });
                }
            } catch (e: any) {
                console.error('chess.move threw exception:', e);
                set({ lastError: `Exception: ${e.message}` });
                return false;
            }
            return false;
        },

        undo: () => {
            const { chess, playerColor, isAiThinking } = get();
            if (isAiThinking) return;

            const currentTurn = chess.turn();

            if (currentTurn === playerColor && chess.history().length >= 2) {
                chess.undo();
                chess.undo();
            }
            else {
                chess.undo();
            }

            set(updateState());
        },

        reset: () => {
            const { chess } = get();
            chess.reset();
            set({ ...updateState(), status: 'playing', isAiThinking: false, lastError: null });
        },

        setAiThinking: (thinking) => set({ isAiThinking: thinking }),

        gameLoopTick: () => {
            set(updateState());
        }
    };
});
