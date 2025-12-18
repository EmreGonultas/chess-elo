import express from 'express';
import { query, run } from './db';
import { authenticateToken } from './auth';

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

        await run('UPDATE users SET is_banned = 1 WHERE username = ?', [username]);

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

        await run('UPDATE users SET is_banned = 0 WHERE username = ?', [username]);

        res.json({ success: true, message: `${username} has been unbanned` });
    } catch (error) {
        console.error('Unban error:', error);
        res.status(500).json({ error: 'Failed to unban user' });
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
