import express from 'express';
import { query, run, get } from './db';
import { authenticateToken } from './auth';
import { ioInstance, getUserSocketId } from './socket-handlers';

const router = express.Router();

// Middleware to check admin status
const requireAdmin = async (req: any, res: any, next: any) => {
    try {
        const userId = req.user.id;
        const user = await query('SELECT is_admin FROM users WHERE id = ?', [userId]);

        if (!user || !user[0] || !user[0].is_admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Ban a user
router.post('/ban', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }

        // Get user ID first
        const user = await get('SELECT id FROM users WHERE username = ?', [username]) as any;

        // Ban the user
        await run('UPDATE users SET is_banned = ? WHERE username = ?', [true, username]);

        // If user is online, emit ban event to force logout
        if (user && ioInstance) {
            const socketId = getUserSocketId(user.id);
            if (socketId) {
                ioInstance.to(socketId).emit('account_banned', {
                    message: 'Your account has been banned by an administrator.'
                });
                console.log(`🚫 Sent ban notification to ${username}`);
            }
        }

        res.json({ success: true, message: `${username} has been banned` });
    } catch (error) {
        console.error('Ban error:', error);
        res.status(500).json({ error: 'Failed to ban user' });
    }
});

// Unban a user
router.post('/unban', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }

        await run('UPDATE users SET is_banned = ? WHERE username = ?', [false, username]);

        res.json({ success: true, message: `${username} has been unbanned` });
    } catch (error) {
        console.error('Unban error:', error);
        res.status(500).json({ error: 'Failed to unban user' });
    }
});

// Update user ELO
router.post('/update-elo', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, newElo } = req.body;

        if (!username || newElo === undefined) {
            return res.status(400).json({ error: 'Username and newElo required' });
        }

        // Validate ELO range
        const eloNum = parseInt(newElo);
        if (isNaN(eloNum) || eloNum < 0 || eloNum > 5000) {
            return res.status(400).json({ error: 'ELO must be between 0 and 5000' });
        }

        // Check if user exists
        const user = await get('SELECT id FROM users WHERE username = ?', [username]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update ELO
        await run('UPDATE users SET elo = ? WHERE username = ?', [eloNum, username]);

        res.json({ success: true, message: `Updated ${username}'s ELO to ${eloNum}` });
    } catch (error) {
        console.error('Update ELO error:', error);
        res.status(500).json({ error: 'Failed to update ELO' });
    }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await query(
            'SELECT id, username, elo, is_admin, is_banned, created_at FROM users ORDER BY created_at DESC'
        );

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;
