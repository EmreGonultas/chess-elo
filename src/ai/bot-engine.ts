import { Chess, Move } from 'chess.js';

type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

// Opening book: Map of position FEN -> best move
const OPENING_BOOK = new Map<string, string>([
    // Starting position
    ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e2e4'],

    // After 1.e4
    ['rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 'e7e5'],
    ['rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 'c7c5'], // Sicilian

    // Italian Game line
    ['rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', 'g1f3'],
    ['rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2', 'b8c6'],
    ['r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', 'f1c4'],

    // Queen's Gambit
    ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'd2d4'],
    ['rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1', 'd7d5'],
    ['rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2', 'c2c4'],

    // Sicilian Defense
    ['rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2', 'g1f3'],
    ['rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2', 'd7d6'],

    // French Defense
    ['rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'd2d4'],
]);

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
    p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000
};

// Piece-square tables (bonus for piece placement)
const PAWN_TABLE = [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0
];

const KNIGHT_TABLE = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
];

const BISHOP_TABLE = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20
];

export class BotEngine {
    private difficulty: DifficultyLevel;

    constructor(difficulty: DifficultyLevel) {
        this.difficulty = difficulty;
    }

    setDifficulty(difficulty: DifficultyLevel) {
        this.difficulty = difficulty;
    }

    /**
     * Get the best move for the current position
     */
    getBestMove(chess: Chess): Move | null {
        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) return null;

        // Check opening book for levels 4-5
        if (this.difficulty >= 4) {
            const fen = chess.fen();
            const bookMove = OPENING_BOOK.get(fen);
            if (bookMove) {
                const move = moves.find(m => m.from + m.to === bookMove);
                if (move) return move;
            }
        }

        switch (this.difficulty) {
            case 1:
                return this.getRandomMove(moves);
            case 2:
                return this.getEasyMove(moves);
            case 3:
                return this.getMediumMove(chess, moves);
            case 4:
                return this.getHardMove(chess, moves);
            case 5:
                return this.getExpertMove(chess, moves);
            default:
                return this.getRandomMove(moves);
        }
    }

    /**
     * Difficulty 1: Completely random
     */
    private getRandomMove(moves: Move[]): Move {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    /**
     * Difficulty 2: Prefers captures
     */
    private getEasyMove(moves: Move[]): Move {
        const captures = moves.filter(m => m.captured);

        // 70% chance to capture if available
        if (captures.length > 0 && Math.random() < 0.7) {
            return captures[Math.floor(Math.random() * captures.length)];
        }

        return this.getRandomMove(moves);
    }

    /**
     * Difficulty 3: Smart captures and tactical awareness
     */
    private getMediumMove(chess: Chess, moves: Move[]): Move {
        const scoredMoves = moves.map(move => {
            let score = this.evaluateMove(chess, move);

            // Bonus for checks
            chess.move(move);
            if (chess.inCheck()) score += 50;
            chess.undo();

            return { move, score };
        });

        scoredMoves.sort((a, b) => b.score - a.score);

        // Pick from top 3 moves randomly
        const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
        const selected = topMoves[Math.floor(Math.random() * topMoves.length)];
        return selected.move;
    }

    /**
     * Difficulty 4: Position evaluation with tactics
     */
    /**
     * Difficulty 4: Position evaluation with tactics (Depth 2 Minimax)
     * Now looks 2 moves ahead to avoid 1-move blunders
     */
    private getHardMove(chess: Chess, moves: Move[]): Move {
        let bestMove = moves[0];
        let bestScore = -Infinity;

        for (const move of moves) {
            chess.move(move);
            // Depth 1 here means total depth 2 (1 move made + 1 lookahead)
            // We pass false for isMaximizing because it's opponent's turn
            const score = -this.minimax(chess, 1, -Infinity, Infinity, false);
            chess.undo();

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    /**
     * Difficulty 5: Deep minimax with alpha-beta pruning
     */
    private getExpertMove(chess: Chess, moves: Move[]): Move {
        let bestMove = moves[0];
        let bestScore = -Infinity;

        for (const move of moves) {
            chess.move(move);
            const score = -this.minimax(chess, 3, -Infinity, Infinity, false); // 4-ply depth
            chess.undo();

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    /**
     * Minimax algorithm with alpha-beta pruning
     */
    /**
     * Minimax algorithm with alpha-beta pruning
     */
    private minimax(
        chess: Chess,
        depth: number,
        alpha: number,
        beta: number,
        isMaximizing: boolean
    ): number {
        if (depth === 0 || chess.isGameOver()) {
            return this.evaluatePosition(chess);
        }

        let moves = chess.moves({ verbose: true });

        // OPTIMIZATION: Move Ordering
        // Sort moves to check "likely best" moves first. This improves alpha-beta pruning efficiency.
        moves.sort((a, b) => this.scoreMoveForOrdering(a) - this.scoreMoveForOrdering(b));

        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of moves) {
                chess.move(move);
                const score = this.minimax(chess, depth - 1, alpha, beta, false);
                chess.undo();
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of moves) {
                chess.move(move);
                const score = this.minimax(chess, depth - 1, alpha, beta, true);
                chess.undo();
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return minScore;
        }
    }

    /**
     * Score a move for sorting/ordering purposes only (High score = check first)
     */
    private scoreMoveForOrdering(move: Move): number {
        let score = 0;

        // 1. Captures (MVV-LVA approx)
        if (move.captured) {
            score += 10 * PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece];
        }

        // 2. Promotions
        if (move.promotion) {
            score += 5 * PIECE_VALUES[move.promotion];
        }

        // 3. Checks (using SAN to avoid expensive move/undo)
        if (move.san.includes('+') || move.san.includes('#')) {
            score += 50;
        }

        return -score; // Return negative so sorting (a - b) puts high scores first
    }

    /**
     * Detect tactical patterns
     */
    private detectTacticalPatterns(chess: Chess, move: Move): number {
        let bonus = 0;

        // Check bonus
        if (chess.inCheck()) {
            bonus += 40;
        }

        // Fork detection: Does this move attack 2+ valuable pieces?
        const attacked = this.getAttackedPieces(chess, move.to);
        if (attacked.length >= 2) {
            bonus += 80; // Fork bonus!
        }

        // Capture with check
        if (move.captured && chess.inCheck()) {
            bonus += 60;
        }

        return bonus;
    }

    /**
     * Get pieces attacked from a square
     */
    private getAttackedPieces(chess: Chess, square: string): string[] {
        const attacked: string[] = [];
        const board = chess.board();

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && piece.color !== chess.turn()) {
                    const targetSquare = String.fromCharCode(97 + j) + (8 - i);
                    if (chess.isAttacked(targetSquare as any, chess.turn() as 'w' | 'b')) {
                        attacked.push(targetSquare);
                    }
                }
            }
        }

        return attacked;
    }

    /**
     * Evaluate a single move
     */
    private evaluateMove(chess: Chess, move: Move): number {
        let score = 0;

        // Capture value
        if (move.captured) {
            score += PIECE_VALUES[move.captured] * 10;
        }

        // Penalize hanging pieces
        chess.move(move);
        const attacked = chess.isAttacked(move.to, chess.turn() as 'w' | 'b');
        chess.undo();

        if (attacked) {
            score -= PIECE_VALUES[move.piece] * 5;
        }

        return score;
    }

    /**
     * Evaluate the current board position
     */
    private evaluatePosition(chess: Chess): number {
        if (chess.isCheckmate()) {
            return chess.turn() === 'w' ? -10000 : 10000;
        }
        if (chess.isStalemate() || chess.isDraw()) {
            return 0;
        }

        let score = 0;
        const board = chess.board();

        // Material and positional evaluation
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece) {
                    const value = PIECE_VALUES[piece.type];
                    const posBonus = this.getPieceSquareBonus(piece.type, i, j, piece.color);

                    if (piece.color === 'w') {
                        score += value + posBonus;
                    } else {
                        score -= value + posBonus;
                    }
                }
            }
        }

        // Mobility bonus
        const mobility = chess.moves().length;
        score += mobility * 5;

        return score;
    }

    /**
     * Get positional bonus based on piece-square tables
     */
    private getPieceSquareBonus(type: string, row: number, col: number, color: string): number {
        const index = color === 'w' ? row * 8 + col : (7 - row) * 8 + col;

        switch (type) {
            case 'p':
                return PAWN_TABLE[index];
            case 'n':
                return KNIGHT_TABLE[index];
            case 'b':
                return BISHOP_TABLE[index];
            default:
                return 0;
        }
    }
}
