import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth';
import leaderboardRoutes from './leaderboard';
import matchRoutes from './match';
import matchHistoryRoutes from './match-history';
import friendsRoutes from './friends';
import { setupSocketHandlers } from './socket-handlers';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://192.168.1.18:5174",  // Allow mobile access
            "http://192.168.1.18:5173"   // Allow mobile access (backup port)
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/matches', matchHistoryRoutes);
app.use('/api/friends', friendsRoutes);

// Basic health check
app.get('/', (req, res) => {
    res.send('Chess ELO Server is running');
});

// Export io for use in other modules
export { io };

// Setup Socket.io handlers for multiplayer
setupSocketHandlers(io);

const PORT = parseInt(process.env.PORT || '3000');

// Listen on 0.0.0.0 to handle both IPv4 and IPv6 resolution issues
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
