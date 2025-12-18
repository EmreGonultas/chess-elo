/**
 * Friends API - Manage friend relationships
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { query, run } from './db';
import { ioInstance, getUserSocketId, isUserOnline } from './socket-handlers';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/**
 * Helper to verify auth token
 */
function getUserIdFromToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        return payload.id;
    } catch {
        return null;
    }
}

/**
 * GET /api/friends - Get all accepted friends
 */
router.get('/', async (req, res) => {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    try {
        const friends = await query(
            `SELECT 
                u.id, u.username, u.elo,
                f.created_at
            FROM friends f
            JOIN users u ON (
                CASE 
                    WHEN f.user_id = ? THEN f.friend_id = u.id
                    WHEN f.friend_id = ? THEN f.user_id = u.id
                END
            )
            WHERE (f.user_id = ? OR f.friend_id = ?)
            AND f.status = 'accepted'
            ORDER BY u.username ASC`,
            [userId, userId, userId, userId]
        );

        // Add online status to each friend
        const friendsWithStatus = friends.map((friend: any) => ({
            ...friend,
            isOnline: isUserOnline(friend.id)
        }));

        res.json(friendsWithStatus);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'Failed to fetch friends' });
    }
});

/**
 * GET /api/friends/pending - Get pending friend requests
 */
router.get('/pending', async (req, res) => {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    try {
        // Get requests sent TO this user
        const requests = await query(
            `SELECT 
                f.id as request_id,
                u.id, u.username, u.elo,
                f.created_at
            FROM friends f
            JOIN users u ON f.user_id = u.id
            WHERE f.friend_id = ?
            AND f.status = 'pending'
            ORDER BY f.created_at DESC`,
            [userId]
        );

        res.json(requests);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

/**
 * POST /api/friends/request - Send friend request
 */
router.post('/request', async (req, res) => {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }

        // Find user by username
        const users = await query('SELECT id, username FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const friendId = users[0].id;

        // Can't friend yourself
        if (friendId === userId) {
            return res.status(400).json({ error: 'Cannot add yourself as friend' });
        }

        // Check if friendship already exists (in any direction)
        const existing = await query(
            `SELECT * FROM friends 
             WHERE (user_id = ? AND friend_id = ?) 
             OR (user_id = ? AND friend_id = ?)`,
            [userId, friendId, friendId, userId]
        );

        if (existing.length > 0) {
            if (existing[0].status === 'accepted') {
                return res.status(400).json({ error: 'Already friends' });
            }
            return res.status(400).json({ error: 'Friend request already sent' });
        }

        // Create friend request
        const requestId = uuidv4();
        await run(
            `INSERT INTO friends (id, user_id, friend_id, status) 
             VALUES (?, ?, ?, 'pending')`,
            [requestId, userId, friendId]
        );

        // Emit socket event to friend if they're online
        if (ioInstance) {
            const friendSocketId = getUserSocketId(friendId);
            if (friendSocketId) {
                ioInstance.to(friendSocketId).emit('friend_request_received');
            }
        }

        res.json({
            message: 'Friend request sent',
            requestId,
            username: users[0].username
        });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ error: 'Failed to send request' });
    }
});

/**
 * POST /api/friends/accept - Accept friend request
 */
router.post('/accept', async (req, res) => {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    try {
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({ error: 'Request ID required' });
        }

        // Verify this request is for the current user
        const requests = await query(
            'SELECT * FROM friends WHERE id = ? AND friend_id = ? AND status = \'pending\'',
            [requestId, userId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        // Update to accepted
        await run(
            'UPDATE friends SET status = \'accepted\' WHERE id = ?',
            [requestId]
        );

        // Get the sender's info to notify them
        const senderInfo = await query(
            'SELECT u.id, u.username FROM friends f JOIN users u ON f.user_id = u.id WHERE f.id = ?',
            [requestId]
        );

        // Get accepter's username
        const accepterInfo = await query('SELECT username FROM users WHERE id = ?', [userId]);

        // Emit socket event to sender if they're online
        if (ioInstance && senderInfo.length > 0) {
            const senderSocketId = getUserSocketId(senderInfo[0].id);
            if (senderSocketId) {
                ioInstance.to(senderSocketId).emit('friend_request_accepted', {
                    username: accepterInfo[0]?.username || 'Someone'
                });
            }
        }

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ error: 'Failed to accept request' });
    }
});

/**
 * POST /api/friends/decline - Decline friend request
 */
router.post('/decline', async (req, res) => {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    try {
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({ error: 'Request ID required' });
        }

        // Verify this request is for the current user
        const requests = await query(
            'SELECT * FROM friends WHERE id = ? AND friend_id = ? AND status = \'pending\'',
            [requestId, userId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        // Delete the request
        await run('DELETE FROM friends WHERE id = ?', [requestId]);

        res.json({ message: 'Friend request declined' });
    } catch (error) {
        console.error('Error declining friend request:', error);
        res.status(500).json({ error: 'Failed to decline request' });
    }
});

/**
 * DELETE /api/friends/:friendId - Remove friend
 */
router.delete('/:friendId', async (req, res) => {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    try {
        const { friendId } = req.params;

        // Delete friendship (in either direction)
        await run(
            `DELETE FROM friends 
             WHERE (user_id = ? AND friend_id = ?) 
             OR (user_id = ? AND friend_id = ?)`,
            [userId, friendId, friendId, userId]
        );

        res.json({ message: 'Friend removed' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});

export default router;
