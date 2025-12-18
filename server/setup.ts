import express from 'express';
import { query, run } from './db';

const router = express.Router();

// ONE-TIME setup endpoint - remove after use!
router.post('/setup-admin', async (req, res) => {
    try {
        const { secret, username } = req.body;

        // Secret key to prevent unauthorized access
        if (secret !== 'setup-thedev-2024') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }

        // Promote user to admin with Paragon rank
        await run(
            'UPDATE users SET elo = ?, is_admin = ? WHERE username = ?',
            [2800, true, username]
        );

        // Verify update
        const user = await query('SELECT username, elo, is_admin FROM users WHERE username = ?', [username]);

        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User promoted successfully!',
            user: user[0]
        });

    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
