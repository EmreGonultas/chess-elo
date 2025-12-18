import express from 'express';
import { get, run } from './db';

const router = express.Router();

// GET endpoint - just visit in browser!
router.get('/promote-thedev/:secret', async (req, res) => {
    try {
        const { secret } = req.params;

        if (secret !== 'setup-thedev-2024') {
            return res.status(403).send('❌ Unauthorized');
        }

        // Promote TheDev
        await run(
            'UPDATE users SET elo = ?, is_admin = ? WHERE username = ?',
            [2800, true, 'TheDev']
        );

        // Verify
        const user = await get('SELECT username, elo, is_admin FROM users WHERE username = ?', ['TheDev']);

        if (!user) {
            return res.status(404).send('❌ TheDev not found! Please create the account first.');
        }

        res.send(`
            <html>
            <head><title>Success!</title></head>
            <body style="font-family: Arial; padding: 50px; background: #1a1a2e; color: white;">
                <h1>✅ SUCCESS!</h1>
                <p>TheDev has been promoted!</p>
                <pre style="background: #16213e; padding: 20px; border-radius: 10px;">
Username: ${user.username}
ELO: ${user.elo} (Paragon)
Admin: ${user.is_admin}
                </pre>
                <p>🎉 You can now log in and access the admin panel!</p>
                <a href="https://chess-elo-alpha.vercel.app" style="color: #4ecca3;">Go to Chess ELO →</a>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).send('❌ Server error: ' + error.message);
    }
});

// POST endpoint for API calls
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
        const user = await get('SELECT username, elo, is_admin FROM users WHERE username = ?', [username]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User promoted successfully!',
            user: user
        });

    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

export default router;
