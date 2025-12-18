import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { run, get } from './db';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Types
interface UserRow {
    id: string;
    username: string;
    password: string;
    elo: number;
}

// Register Route
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Check if user exists
        const existing = await get('SELECT * FROM users WHERE username = ?', [username]);
        if (existing) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        // Insert user
        await run(
            'INSERT INTO users (id, username, password, elo) VALUES (?, ?, ?, ?)',
            [id, username, hashedPassword, 800] // Start at Pulse Tier
        );

        // Issue Token
        const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ token, user: { id, username, elo: 800, isAdmin: false } });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Find user
        const user = await get('SELECT * FROM users WHERE username = ?', [username]) as any;
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check if user is banned
        if (user.is_banned) {
            return res.status(403).json({ error: 'This account has been banned' });
        }

        // Verify password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Issue Token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, user: { id: user.id, username: user.username, elo: user.elo, isAdmin: user.is_admin || false } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Current User (Protected)
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const user = await get('SELECT id, username, elo, is_admin FROM users WHERE id = ?', [payload.id]) as any;

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ id: user.id, username: user.username, elo: user.elo, isAdmin: user.is_admin || false });
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// TEMPORARY: Update ELO (for testing rank colors)
router.post('/update-elo', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const { elo } = req.body;

        if (typeof elo !== 'number' || elo < 0 || elo > 5000) {
            return res.status(400).json({ error: 'Invalid ELO value' });
        }

        await run('UPDATE users SET elo = ? WHERE id = ?', [elo, payload.id]);

        const updatedUser = await get('SELECT id, username, elo FROM users WHERE id = ?', [payload.id]) as UserRow;

        res.json({ success: true, user: { id: updatedUser.id, username: updatedUser.username, elo: updatedUser.elo } });
    } catch (error) {
        console.error('Update ELO error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Middleware to verify JWT token
export const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        req.user = payload; // Attach user to request
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

export default router;

