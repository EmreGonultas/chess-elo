import express from 'express';
import { run, get } from './db';
import { v4 as uuidv4 } from 'uuid';
import { calculateEloChanges } from './elo';

const router = express.Router();

interface UserRow {
    id: string;
    username: string;
    elo: number;
}

/**
 * Complete a match and update ELO ratings
 * POST /api/match/complete
 * Body: { whiteId, blackId, result: 'white' | 'black' | 'draw', moves?, pgn? }
 */
router.post('/complete', async (req, res) => {
    try {
        const { whiteId, blackId, result, moves, pgn } = req.body;

        // Validate input
        if (!whiteId || !blackId || !result) {
            return res.status(400).json({ error: 'Missing required fields: whiteId, blackId, result' });
        }

        if (!['white', 'black', 'draw'].includes(result)) {
            return res.status(400).json({ error: 'Invalid result. Must be: white, black, or draw' });
        }

        // Get current ratings
        const whitePlayer = await get('SELECT id, username, elo FROM users WHERE id = ?', [whiteId]) as UserRow;
        const blackPlayer = await get('SELECT id, username, elo FROM users WHERE id = ?', [blackId]) as UserRow;

        if (!whitePlayer || !blackPlayer) {
            return res.status(404).json({ error: 'One or both players not found' });
        }

        // Calculate ELO changes
        const eloChanges = calculateEloChanges(whitePlayer.elo, blackPlayer.elo, result);

        // Update player ratings
        await run('UPDATE users SET elo = ? WHERE id = ?', [eloChanges.whiteNewRating, whiteId]);
        await run('UPDATE users SET elo = ? WHERE id = ?', [eloChanges.blackNewRating, blackId]);

        // Store match record
        const matchId = uuidv4();
        const winnerId = result === 'draw' ? null : (result === 'white' ? whiteId : blackId);
        const movesJson = moves ? JSON.stringify(moves) : null;

        await run(
            `INSERT INTO matches (id, white_id, black_id, winner_id, moves, pgn, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [matchId, whiteId, blackId, winnerId, movesJson, pgn || null, 'completed']
        );

        res.json({
            success: true,
            matchId,
            white: {
                id: whiteId,
                username: whitePlayer.username,
                oldRating: whitePlayer.elo,
                newRating: eloChanges.whiteNewRating,
                change: eloChanges.whiteChange
            },
            black: {
                id: blackId,
                username: blackPlayer.username,
                oldRating: blackPlayer.elo,
                newRating: eloChanges.blackNewRating,
                change: eloChanges.blackChange
            },
            result
        });
    } catch (error) {
        console.error('Match completion error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * TESTING: Simulate a match between two users
 * POST /api/match/simulate
 * Body: { player1Username, player2Username, winner: 'player1' | 'player2' | 'draw' }
 */
router.post('/simulate', async (req, res) => {
    try {
        const { player1Username, player2Username, winner } = req.body;

        if (!player1Username || !player2Username || !winner) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get players
        const player1 = await get('SELECT id, username, elo FROM users WHERE username = ?', [player1Username]) as UserRow;
        const player2 = await get('SELECT id, username, elo FROM users WHERE username = ?', [player2Username]) as UserRow;

        if (!player1 || !player2) {
            return res.status(404).json({ error: 'One or both players not found' });
        }

        // Determine result
        let result: 'white' | 'black' | 'draw';
        if (winner === 'draw') {
            result = 'draw';
        } else if (winner === 'player1') {
            result = 'white'; // player1 = white
        } else {
            result = 'black'; // player2 = white
        }

        // Use the complete endpoint logic
        const completeResult = await fetch('http://localhost:3000/api/match/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                whiteId: player1.id,
                blackId: player2.id,
                result
            })
        }).then(r => r.json());

        res.json(completeResult);
    } catch (error) {
        console.error('Simulate match error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
