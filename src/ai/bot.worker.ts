import { Chess } from 'chess.js';
import { BotEngine } from './bot-engine';
import type { DifficultyLevel } from '../game/types';

// Worker state
let bot: BotEngine | null = null;
let currentDifficulty: DifficultyLevel | null = null;

self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data;

    if (type === 'calculate_move') {
        const { fen, difficulty } = payload;

        // Initialize or update bot if difficulty changes
        if (!bot || currentDifficulty !== difficulty) {
            bot = new BotEngine(difficulty);
            currentDifficulty = difficulty;
        }

        // Create a fresh chess instance for calculation
        // We do this inside the worker to avoid passing complex objects
        const chess = new Chess(fen);

        // Calculate best move
        const bestMove = bot.getBestMove(chess);

        // Send back the result
        self.postMessage({
            type: 'move_ready',
            payload: bestMove ? {
                from: bestMove.from,
                to: bestMove.to,
                promotion: bestMove.promotion
            } : null
        });
    }
};
