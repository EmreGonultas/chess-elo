// import { Color } from 'chess.js'; // Unused
import type { DifficultyLevel } from '../game/types';

export class StockfishEngine {
    private worker: Worker | null = null;
    // private isReady = false; 
    private onMove: (bestMove: string) => void;

    constructor(onMove: (bestMove: string) => void) {
        this.onMove = onMove;
    }

    init() {
        try {
            // We assume stockfish.js is available at the root (public folder)
            this.worker = new Worker('/stockfish.js');

            this.worker.onmessage = (event) => {
                const line = event.data;
                // console.log('SF:', line); // Debugging

                if (line === 'uciok') {
                    // this.isReady = true;
                } else if (line === 'readyok') {
                    // this.isReady = true;
                } else if (line.startsWith('bestmove')) {
                    // Format: "bestmove e2e4 ponder e7e5"
                    const parts = line.split(' ');
                    const bestMove = parts[1];
                    this.onMove(bestMove);
                }
            };

            this.worker.postMessage('uci');
            // Set to MultiPV 1 to focus on best move
            this.worker.postMessage('setoption name MultiPV value 1');
            this.worker.postMessage('isready');

        } catch (e) {
            console.error('Failed to initialize Stockfish worker:', e);
        }
    }

    evaluate(fen: string, difficulty: DifficultyLevel, depthOverride?: number) {
        if (!this.worker) return;

        this.worker.postMessage('stop'); // Stop any previous search
        this.worker.postMessage(`position fen ${fen}`);

        // Map difficulty to depth or time
        // Difficulty 0-10
        // 0: depth 1
        // 1: depth 2
        // 2: depth 3
        // 3: depth 4 (approx < 1000 elo)
        // 5: depth 6-8
        // 10: depth 18+ or 1-2 sec time

        // Simple mapping:
        let depth = 1;
        let movetime = 0;

        if (difficulty === 1) depth = 1;
        else if (difficulty <= 2) depth = 2;
        else if (difficulty <= 3) depth = 5;
        else if (difficulty === 4) depth = 10;
        else {
            // High difficulty: use time instead of fixed depth for better play
            depth = 18;
            movetime = 1000; // 1 second
        }

        // Override if provided
        if (depthOverride) depth = depthOverride;

        // Send command
        // If we want skill level adjustment (Stockfish "Skill Level" option 0-20), we could set that too.
        // this.worker.postMessage(`setoption name Skill Level value ${difficulty * 2}`);

        if (movetime > 0) {
            this.worker.postMessage(`go movetime ${movetime}`);
        } else {
            this.worker.postMessage(`go depth ${depth}`);
        }
    }

    stop() {
        this.worker?.postMessage('stop');
    }

    quit() {
        this.worker?.postMessage('quit');
        this.worker?.terminate();
        this.worker = null;
    }
}
