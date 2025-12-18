import type { Color, Move } from 'chess.js';

export type GameStatus =
    | 'init'
    | 'playing'
    | 'checkmate'
    | 'stalemate'
    | 'draw' // insufficient material, 50-move rule, threefold repetition
    | 'timeout'
    | 'resigned';

export interface GameState {
    fen: string;
    turn: Color;
    status: GameStatus;
    winner: Color | null;
    history: Move[];
    lastMove: Move | null;
    check: boolean;
    lastError: string | null;
}

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
// 0 = random/very easy
// 1-3 = easy
// 4-6 = medium
// 7-10 = hard/grandmaster

export interface EngineOptions {
    difficulty: DifficultyLevel;
    depth?: number;
    moveTime?: number;
}
