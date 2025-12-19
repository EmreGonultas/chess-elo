import express from 'express';
import { query } from './db';

const router = express.Router();

interface LeaderboardEntry {
    id: string;
    username: string;
    elo: number;
    rank?: number;
}

// Get top players by ELO
router.get('/top', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;

        // Exclude test accounts from leaderboard
        // const excludedUsernames = ['anan', 'anan3', 'anan4'];
        // const placeholders = excludedUsernames.map(() => '?').join(',');

        const players = await query(
            `SELECT id, username, elo
             FROM users
             WHERE is_banned = FALSE
             ORDER BY elo DESC
             LIMIT ?`,
            [limit]
        ) as LeaderboardEntry[];

        // Add rank numbers
        const leaderboard = players.map((player, index) => ({
            ...player,
            rank: index + 1
        }));

        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

export default router;
