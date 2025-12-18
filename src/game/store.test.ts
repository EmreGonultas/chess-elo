import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './store';

describe('Game Store', () => {
    beforeEach(() => {
        useGameStore.getState().initGame();
    });

    it('should initialize with default state', () => {
        const state = useGameStore.getState();
        expect(state.status).toBe('playing');
        expect(state.turn).toBe('w');
        expect(state.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        expect(state.history).toHaveLength(0);
    });

    it('should make a valid move', () => {
        const state = useGameStore.getState();
        const success = state.makeMove('e2', 'e4');

        expect(success).toBe(true);
        const newState = useGameStore.getState();
        expect(newState.turn).toBe('b');
        expect(newState.history).toHaveLength(1);
        expect(newState.fen).not.toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    it('should reject invalid moves', () => {
        const state = useGameStore.getState();
        const success = state.makeMove('e2', 'e5'); // Invalid for pawn
        expect(success).toBe(false);
        const newState = useGameStore.getState();
        expect(newState.turn).toBe('w');
    });

    it('should handle undo', () => {
        const state = useGameStore.getState();
        state.makeMove('e2', 'e4');
        expect(useGameStore.getState().history).toHaveLength(1);

        state.undo();
        expect(useGameStore.getState().history).toHaveLength(0);
        expect(useGameStore.getState().turn).toBe('w');
    });

    it('should detect checkmate (Fool\'s Mate)', () => {
        const state = useGameStore.getState();
        state.makeMove('f2', 'f3');
        state.makeMove('e7', 'e5');
        state.makeMove('g2', 'g4');
        state.makeMove('d8', 'h4'); // Checkmate

        const finalState = useGameStore.getState();
        expect(finalState.status).toBe('checkmate');
        expect(finalState.winner).toBe('b');
    });
});
