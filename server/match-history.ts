/**
 * Match History API
 * Provides endpoints to fetch user's match history
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from './db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/**
 * GET /api/matches/history
 * Get current user's recent match history
 */
router.get('/history', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.id;

        const matches = await query(`
            SELECT 
                m.id,
                m.white_player_id,
                m.black_player_id,
                m.white_player_name,
                m.black_player_name,
                m.result,
                m.winner_id,
                m.pgn,
                m.white_elo_before,
                m.black_elo_before,
                m.white_elo_after,
                m.black_elo_after,
                m.casual,
                m.created_at,
                w.username as white_username,
                w.elo as white_current_elo,
                b.username as black_username,
                b.elo as black_current_elo
            FROM matches m
            LEFT JOIN users w ON m.white_player_id = w.id
            LEFT JOIN users b ON m.black_player_id = b.id
            WHERE m.white_player_id = ? OR m.black_player_id = ?
            ORDER BY m.created_at DESC
            LIMIT 10
        `, [userId, userId]);

        // Format the response
        const formattedMatches = matches.map((match: any) => {
            const isWhite = match.white_player_id === userId;
            const opponentUsername = isWhite ? match.black_username : match.white_username;

            // Try to get ELO and change from stored match data
            let opponentElo = isWhite ? match.black_current_elo : match.white_current_elo;
            let opponentChange: number | null = null;
            let myChange: number | null = null;

            try {
                const matchData = JSON.parse(match.pgn);
                if (matchData.whiteElo && matchData.blackElo) {
                    opponentElo = isWhite ? matchData.blackElo : matchData.whiteElo;
                }
                if (matchData.whiteChange !== undefined && matchData.blackChange !== undefined) {
                    opponentChange = isWhite ? matchData.blackChange : matchData.whiteChange;
                    myChange = isWhite ? matchData.whiteChange : matchData.blackChange;
                }
            } catch (e) {
                // Old format - already using current ELO as fallback
            }

            let result: 'win' | 'loss' | 'draw';
            if (match.winner_id === null) {
                result = 'draw';
            } else if (match.winner_id === userId) {
                result = 'win';
            } else {
                result = 'loss';
            }


            // Parse date - handle both SQLite and PostgreSQL formats
            let dateStr = match.created_at;

            // PostgreSQL returns Date object, SQLite returns string
            if (dateStr instanceof Date) {
                dateStr = dateStr.toISOString();
            } else if (typeof dateStr === 'string' && !dateStr.includes('T')) {
                // SQLite format - convert to ISO
                dateStr = dateStr.replace(' ', 'T') + 'Z';
            }

            return {
                id: match.id,
                opponent: {
                    username: opponentUsername,
                    elo: opponentElo,
                    eloChange: opponentChange
                },
                result,
                myEloChange: myChange,
                playedAs: isWhite ? 'white' : 'black',
                date: dateStr
            };
        });

        res.json(formattedMatches);
    } catch (error) {
        console.error('Error fetching match history:', error);
        res.status(500).json({ error: 'Failed to fetch match history' });
    }
});

export default router;
