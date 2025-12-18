/**
 * Game Room - Manages individual chess matches
 * Handles game state, move validation, and game lifecycle
 */

import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';

export interface Player {
    userId: string;
    username: string;
    elo: number;
    socketId: string;
}

export interface MoveResult {
    fen: string;
    turn: 'w' | 'b';
    isGameOver: boolean;
    winner: 'white' | 'black' | 'draw' | null;
    reason?: 'checkmate' | 'stalemate' | 'draw' | 'resignation' | 'timeout';
}

export class GameRoom {
    public readonly id: string;
    public readonly white: Player;
    public readonly black: Player;
    public readonly chess: Chess;
    public readonly startedAt: Date;
    public status: 'waiting' | 'active' | 'completed';
    public moveHistory: any[] = [];

    // Timer properties
    public readonly timeControl: number; // milliseconds (300000 = 5min, 600000 = 10min)
    public whiteTime: number; // remaining ms for white
    public blackTime: number; // remaining ms for black
    public lastMoveTime?: Date;
    public casual: boolean; // Flag for casual (non-ranked) games

    constructor(player1: Player, player2: Player, timeControl: number = 600000, casual: boolean = false) {
        this.id = uuidv4();
        this.startedAt = new Date();
        this.status = 'waiting';
        this.chess = new Chess();
        this.timeControl = timeControl;
        this.whiteTime = timeControl;
        this.blackTime = timeControl;
        this.casual = casual;

        // Randomly assign colors (50/50 chance)
        if (Math.random() > 0.5) {
            this.white = player1;
            this.black = player2;
        } else {
            this.white = player2;
            this.black = player1;
        }

        const gameType = casual ? 'Casual' : 'Ranked';
        console.log(`${gameType} Game ${this.id} created: ${this.white.username} (White) vs ${this.black.username} (Black) - ${timeControl / 60000} min`);
    }

    /**
     * Start the game
     */
    start(): void {
        this.status = 'active';
        this.lastMoveTime = new Date();
        console.log(`Game ${this.id} started`);
    }

    /**
     * Get player's color
     */
    getPlayerColor(userId: string): 'w' | 'b' | null {
        if (this.white.userId === userId) return 'w';
        if (this.black.userId === userId) return 'b';
        return null;
    }

    /**
     * Get opponent of a player
     */
    getOpponent(userId: string): Player | null {
        if (this.white.userId === userId) return this.black;
        if (this.black.userId === userId) return this.white;
        return null;
    }

    /**
     * Update time after a move
     */
    updateTime(): void {
        if (!this.lastMoveTime || this.status !== 'active') return;

        const now = new Date();
        const elapsed = now.getTime() - this.lastMoveTime.getTime();

        // Deduct time from the player who just moved (previous turn)
        const previousTurn = this.chess.turn() === 'w' ? 'b' : 'w';
        if (previousTurn === 'w') {
            this.whiteTime = Math.max(0, this.whiteTime - elapsed);
        } else {
            this.blackTime = Math.max(0, this.blackTime - elapsed);
        }

        this.lastMoveTime = now;
    }

    /**
     * Get current time remaining for both players
     */
    getTimeState(): { whiteTime: number; blackTime: number } {
        // Calculate current time if game is active
        if (this.status === 'active' && this.lastMoveTime) {
            const now = new Date();
            const elapsed = now.getTime() - this.lastMoveTime.getTime();
            const currentTurn = this.chess.turn();

            return {
                whiteTime: currentTurn === 'w' ? Math.max(0, this.whiteTime - elapsed) : this.whiteTime,
                blackTime: currentTurn === 'b' ? Math.max(0, this.blackTime - elapsed) : this.blackTime
            };
        }

        return {
            whiteTime: this.whiteTime,
            blackTime: this.blackTime
        };
    }

    /**
     * Make a move (with validation)
     */
    makeMove(userId: string, from: string, to: string, promotion?: string): MoveResult {
        // Validate game is active
        if (this.status !== 'active') {
            throw new Error('Game is not active');
        }

        // Validate it's the player's turn
        const playerColor = this.getPlayerColor(userId);
        if (!playerColor) {
            throw new Error('Player not in this game');
        }

        if (this.chess.turn() !== playerColor) {
            throw new Error('Not your turn');
        }

        // Update time before move
        this.updateTime();

        // Attempt the move
        const move = this.chess.move({ from, to, promotion: promotion || 'q' });
        if (!move) {
            throw new Error('Invalid move');
        }

        // Store move in history
        this.moveHistory.push(move);

        // Check if game is over
        const isGameOver = this.chess.isGameOver();
        let winner: 'white' | 'black' | 'draw' | null = null;
        let reason: MoveResult['reason'] = undefined;

        if (isGameOver) {
            this.status = 'completed';

            if (this.chess.isCheckmate()) {
                winner = this.chess.turn() === 'w' ? 'black' : 'white';
                reason = 'checkmate';
            } else if (this.chess.isStalemate()) {
                winner = 'draw';
                reason = 'stalemate';
            } else if (this.chess.isDraw()) {
                winner = 'draw';
                reason = 'draw';
            }

            console.log(`Game ${this.id} ended: ${winner} by ${reason}`);
        }

        return {
            fen: this.chess.fen(),
            turn: this.chess.turn(),
            isGameOver,
            winner,
            reason
        };
    }

    /**
     * Handle timeout (player ran out of time)
     */
    handleTimeout(color: 'w' | 'b'): MoveResult {
        this.status = 'completed';
        const winner = color === 'w' ? 'black' : 'white';

        console.log(`Game ${this.id}: ${color === 'w' ? 'White' : 'Black'} ran out of time. Winner: ${winner}`);

        return {
            fen: this.chess.fen(),
            turn: this.chess.turn(),
            isGameOver: true,
            winner,
            reason: 'timeout'
        };
    }

    /**
     * Handle resignation
     */
    resign(userId: string): MoveResult {
        const playerColor = this.getPlayerColor(userId);
        if (!playerColor) {
            throw new Error('Player not in this game');
        }

        this.status = 'completed';
        const winner = playerColor === 'w' ? 'black' : 'white';

        console.log(`Game ${this.id}: ${userId} resigned. Winner: ${winner}`);

        return {
            fen: this.chess.fen(),
            turn: this.chess.turn(),
            isGameOver: true,
            winner,
            reason: 'resignation'
        };
    }

    /**
     * Get PGN (Portable Game Notation) for database storage
     */
    getPGN(): string {
        return this.chess.pgn();
    }

    /**
     * Get current FEN
     */
    getFEN(): string {
        return this.chess.fen();
    }
}
