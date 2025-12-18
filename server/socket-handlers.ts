/**
 * Socket.io Event Handlers
 * Manages real-time communication for multiplayer chess
 */

import { Server, Socket } from 'socket.io';
import { MatchmakingQueue } from './matchmaking';
import { GameRoom, Player } from './gameRoom';
import { run } from './db';
import { calculateEloChanges } from './elo';
import { v4 as uuidv4 } from 'uuid';

// Global state
const matchmakingQueue = new MatchmakingQueue();
const activeGames = new Map<string, GameRoom>();
const socketToGame = new Map<string, string>(); // socketId -> gameId
const socketToUser = new Map<string, string>(); // socketId -> userId
const userToSocket = new Map<string, string>(); // userId -> socketId

// Export for friends API
export let ioInstance: Server | null = null;
export const getUserSocketId = (userId: string) => userToSocket.get(userId);
export const isUserOnline = (userId: string) => userToSocket.has(userId);

export function setupSocketHandlers(io: Server) {
    ioInstance = io; // Set for friends API

    io.on('connection', (socket: Socket) => {
        console.log(`✅ Player connected: ${socket.id}`);

        // Register user for friend notifications
        socket.on('register_user', async (data: { userId: string }) => {
            socketToUser.set(socket.id, data.userId);
            userToSocket.set(data.userId, socket.id);
            console.log(`📝 Registered user ${data.userId} for notifications`);

            // Notify all online friends that this user came online
            try {
                const { query } = await import('./db');
                const friends = await query(
                    `SELECT 
                        CASE 
                            WHEN f.user_id = ? THEN f.friend_id
                            WHEN f.friend_id = ? THEN f.user_id
                        END as friend_id
                    FROM friends f
                    WHERE (f.user_id = ? OR f.friend_id = ?)
                    AND f.status = 'accepted'`,
                    [data.userId, data.userId, data.userId, data.userId]
                );

                // Emit to each online friend
                friends.forEach((friend: any) => {
                    const friendSocketId = userToSocket.get(friend.friend_id);
                    if (friendSocketId) {
                        io.to(friendSocketId).emit('friend_status_changed', {
                            friendId: data.userId,
                            isOnline: true
                        });
                    }
                });
            } catch (error) {
                console.error('Error notifying friends of online status:', error);
            }
        });

        //  ----- FRIEND CHALLENGES -----

        /**
         * Send challenge to friend
         */
        socket.on('send_challenge', (data: { friendId: string, challengerName: string, timeControl: number }) => {
            const challengerId = socketToUser.get(socket.id);
            if (!challengerId) return;

            const friendSocketId = userToSocket.get(data.friendId);
            if (friendSocketId) {
                const challengeId = uuidv4();
                io.to(friendSocketId).emit('challenge_received', {
                    challengeId,
                    challengerId,
                    challengerName: data.challengerName,
                    timeControl: data.timeControl
                });
                console.log(`⚔️ ${data.challengerName} challenged friend ${data.friendId} - ${data.timeControl / 60000}min`);
            }
        });

        /**
         * Accept challenge
         */
        socket.on('accept_challenge', async (data: { challengeId: string, challengerId: string, challengerName: string, accepterName: string, timeControl: number }) => {
            const accepterId = socketToUser.get(socket.id);
            if (!accepterId) return;

            // Fetch ELO for both players from database
            const { query } = await import('./db');
            const challengerData = await query('SELECT elo FROM users WHERE id = ?', [data.challengerId]);
            const accepterData = await query('SELECT elo FROM users WHERE id = ?', [accepterId]);

            if (challengerData.length === 0 || accepterData.length === 0) {
                console.error('Failed to fetch user data for challenge');
                return;
            }

            // Create casual game
            const timeControl = data.timeControl;

            const challengerPlayer: Player = {
                userId: data.challengerId,
                username: data.challengerName,
                elo: challengerData[0].elo,
                socketId: userToSocket.get(data.challengerId)!
            };

            const accepterPlayer: Player = {
                userId: accepterId,
                username: data.accepterName,
                elo: accepterData[0].elo,
                socketId: socket.id
            };

            const game = new GameRoom(
                challengerPlayer,
                accepterPlayer,
                timeControl,
                true // casual = true
            );

            // Use game.id (created by GameRoom constructor)
            activeGames.set(game.id, game);
            socketToGame.set(challengerPlayer.socketId, game.id);
            socketToGame.set(accepterPlayer.socketId, game.id);

            // Start the game immediately
            game.start();

            // Emit game_start to both players with full game state
            const gameState = {
                gameId: game.id,
                white: game.white,
                black: game.black,
                position: game.chess.fen(),
                moves: game.chess.history({ verbose: true }),
                status: game.status,
                whiteTime: game.whiteTime,
                blackTime: game.blackTime,
                timeControl: game.timeControl,
                casual: game.casual
            };

            io.to(challengerPlayer.socketId).emit('game_start', gameState);
            io.to(accepterPlayer.socketId).emit('game_start', gameState);

            console.log(`✅ Casual game created: ${game.id} - ${challengerPlayer.username} vs ${accepterPlayer.username}`);
        });

        /**
         * Join existing game (for page reloads / navigation)
         */
        socket.on('join_game', ({ gameId }: { gameId: string }) => {
            const userId = socketToUser.get(socket.id);
            if (!userId) {
                console.error('User not found for join_game');
                return;
            }

            const game = activeGames.get(gameId);
            if (!game) {
                console.error(`Game ${gameId} not found for join_game`);
                return;
            }

            // Update socket ID mapping
            socketToGame.set(socket.id, gameId);

            // Update player's socket ID in the game
            if (game.white.userId === userId) {
                game.white.socketId = socket.id;
                console.log(`✅ White player reconnected to game ${gameId}`);
            } else if (game.black.userId === userId) {
                game.black.socketId = socket.id;
                console.log(`✅ Black player reconnected to game ${gameId}`);
            }

            // Send current game state
            socket.emit('game_start', {
                gameId: game.id,
                white: game.white,
                black: game.black,
                fen: game.chess.fen(),
                position: game.chess.fen(),
                moves: game.chess.history({ verbose: true }),
                status: game.status,
                whiteTime: game.whiteTime,
                blackTime: game.blackTime,
                timeControl: game.timeControl,
                casual: game.casual,
                turn: game.chess.turn()
            });
        });

        /**
         * Decline challenge
         */
        socket.on('decline_challenge', (data: { challengerId: string, declinerName: string }) => {
            const challengerSocketId = userToSocket.get(data.challengerId);
            if (challengerSocketId) {
                io.to(challengerSocketId).emit('challenge_declined', {
                    message: `${data.declinerName} declined your challenge`
                });
            }
        });

        // ----- MATCHMAKING -----

        /**
         * Player joins matchmaking queue
         */
        socket.emit('queue_update', { queueSize: matchmakingQueue.getSize() });
        socket.on('get_queue_size', () => { socket.emit('queue_update', { queueSize: matchmakingQueue.getSize() }) })
        socket.on('join_queue', (data: { userId: string, username: string, elo: number, timeControl?: number }) => {
            const timeControl = data.timeControl || 600000; // Default 10 minutes
            console.log(`🎯 ${data.username} joining queue:`);
            console.log(`   - Received timeControl: ${data.timeControl}`);
            console.log(`   - Using timeControl: ${timeControl} (${timeControl / 60000} min)`);

            socketToUser.set(socket.id, data.userId);
            userToSocket.set(data.userId, socket.id); // Track for friends notifications

            // Add to queue with time control
            matchmakingQueue.addPlayer(data.userId, data.username, data.elo, socket.id, timeControl);

            // Confirm queue entry
            const position = matchmakingQueue.getPosition(data.userId);
            socket.emit('queue_joined', { position, queueSize: matchmakingQueue.getSize() });

            // Broadcast queue size to ALL connected clients
            io.emit('queue_update', { queueSize: matchmakingQueue.getSize() });

            // Try to find a match
            const match = matchmakingQueue.tryMatch();
            if (match) {
                createGame(io, match.player1, match.player2, match.player1.timeControl);
                // Update queue size after match
                io.emit('queue_update', { queueSize: matchmakingQueue.getSize() });
            }
        });

        /**
         * Player leaves matchmaking queue
         */
        socket.on('leave_queue', (data: { userId: string }) => {
            const removed = matchmakingQueue.removePlayer(data.userId);
            if (removed) {
                socket.emit('queue_left');
                console.log(`❌ ${data.userId} left queue`);
            }
        });

        // ----- GAMEPLAY -----

        /**
         * Player makes a move
         */
        socket.on('make_move', async (data: { gameId: string, from: string, to: string, promotion?: string }) => {
            const { gameId, from, to, promotion } = data;

            console.log(`🔍 Move request for gameId: ${gameId}`);
            console.log(`🔍 Active games:`, Array.from(activeGames.keys()));
            console.log(`🔍 SocketToGame mapping for ${socket.id}:`, socketToGame.get(socket.id));

            const game = activeGames.get(gameId);

            if (!game) {
                console.error(`❌ Game ${gameId} not found in activeGames`);
                return socket.emit('error', { message: 'Game not found' });
            }

            const userId = socketToUser.get(socket.id);
            if (!userId) {
                return socket.emit('error', { message: 'User not found' });
            }

            try {
                // Make the move (server validates)
                const result = game.makeMove(userId, from, to, promotion);

                // Get current time state
                const timeState = game.getTimeState();

                console.log(`⏱️  Time state after move: White=${timeState.whiteTime}ms, Black=${timeState.blackTime}ms, Turn=${result.turn}`);

                // Broadcast move to both players with time update
                io.to(game.white.socketId).to(game.black.socketId).emit('move_made', {
                    from,
                    to,
                    promotion,
                    fen: result.fen,
                    turn: result.turn,
                    whiteTime: timeState.whiteTime,
                    blackTime: timeState.blackTime
                });

                console.log(`♟️  Game ${gameId}: ${from} → ${to}`);

                // Handle game over
                if (result.isGameOver) {
                    await handleGameEnd(io, game, result.winner!, result.reason);
                }

            } catch (error: any) {
                socket.emit('invalid_move', { error: error.message });
                console.log(`❌ Invalid move in game ${gameId}: ${error.message}`);
            }
        });

        /**
         * Player resigns
         */
        socket.on('resign', async (data: { gameId: string }) => {
            console.log(`🏳️ Resign request for game: ${data.gameId}`);
            const game = activeGames.get(data.gameId);
            if (!game) {
                console.log('Game not found for resign');
                return;
            }

            const userId = socketToUser.get(socket.id);
            if (!userId) {
                console.log('User not found for resign');
                return;
            }

            try {
                const result = game.resign(userId);
                await handleGameEnd(io, game, result.winner!, 'resignation');
            } catch (error: any) {
                console.error('Resign error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // ----- DISCONNECT HANDLING -----

        socket.on('disconnect', async () => {
            console.log(`🔌 Player disconnected: ${socket.id}`);

            // Remove from queue if in queue
            matchmakingQueue.removeBySocketId(socket.id);
            io.emit('queue_update', { queueSize: matchmakingQueue.getSize() });

            // Handle if in active game
            const gameId = socketToGame.get(socket.id);
            if (gameId) {
                const game = activeGames.get(gameId);
                if (game && game.status === 'active') {
                    const userId = socketToUser.get(socket.id);
                    if (userId) {
                        try {
                            // Auto-resign on disconnect
                            console.log(`🚪 Auto-resigning ${userId} from game ${gameId}`);
                            const result = game.resign(userId);
                            await handleGameEnd(io, game, result.winner!, 'disconnect');
                        } catch (error) {
                            console.error('Error during auto-resign:', error);
                            // Cleanup anyway
                            activeGames.delete(gameId);
                        }
                    }
                }
            }

            // Notify friends this user went offline
            const userId = socketToUser.get(socket.id);
            if (userId) {
                try {
                    const { query } = await import('./db');
                    const friends = await query(
                        `SELECT 
                            CASE 
                                WHEN f.user_id = ? THEN f.friend_id
                                WHEN f.friend_id = ? THEN f.user_id
                            END as friend_id
                        FROM friends f
                        WHERE (f.user_id = ? OR f.friend_id = ?)
                        AND f.status = 'accepted'`,
                        [userId, userId, userId, userId]
                    );

                    // Emit to each online friend
                    friends.forEach((friend: any) => {
                        const friendSocketId = userToSocket.get(friend.friend_id);
                        if (friendSocketId) {
                            io.to(friendSocketId).emit('friend_status_changed', {
                                friendId: userId,
                                isOnline: false
                            });
                        }
                    });
                } catch (error) {
                    console.error('Error notifying friends of offline status:', error);
                }
            }

            // Cleanup
            socketToGame.delete(socket.id);
            socketToUser.delete(socket.id);
            if (userId) {
                userToSocket.delete(userId);
            }
        });
    });
}

/**
 * Create a new game from matched players
 */
function createGame(io: Server, player1: Player, player2: Player, timeControl: number = 600000) {
    const game = new GameRoom(player1, player2, timeControl);
    activeGames.set(game.id, game);

    // Map sockets to game
    socketToGame.set(player1.socketId, game.id);
    socketToGame.set(player2.socketId, game.id);

    // Notify both players
    io.to(player1.socketId).emit('match_found', {
        gameId: game.id,
        opponent: {
            username: player2.username,
            elo: player2.elo
        },
        color: game.white.userId === player1.userId ? 'white' : 'black'
    });

    io.to(player2.socketId).emit('match_found', {
        gameId: game.id,
        opponent: {
            username: player1.username,
            elo: player1.elo
        },
        color: game.white.userId === player2.userId ? 'white' : 'black'
    });


    // Start game immediately BEFORE emitting game_start
    game.start();

    // Emit game_start to both players
    io.to(player1.socketId).to(player2.socketId).emit('game_start', {
        gameId: game.id,
        white: { username: game.white.username, elo: game.white.elo },
        black: { username: game.black.username, elo: game.black.elo },
        fen: game.getFEN(),
        timeControl: game.timeControl,
        whiteTime: game.whiteTime,
        blackTime: game.blackTime
    });

    console.log(`🎮 Created game ${game.id}: ${game.white.username} vs ${game.black.username}`);
}

/**
 * Handle game end - calculate ELO and store match
 */
async function handleGameEnd(
    io: Server,
    game: GameRoom,
    winner: 'white' | 'black' | 'draw',
    reason?: string
) {
    console.log(`🏁 Game ${game.id} ended: ${winner} by ${reason}`);

    try {
        let eloChanges;

        // Only calculate and update ELO for ranked games
        if (!game.casual) {
            // Calculate ELO changes
            eloChanges = calculateEloChanges(
                game.white.elo,
                game.black.elo,
                winner
            );

            // Update ELO in database
            await run('UPDATE users SET elo = ? WHERE id = ?', [eloChanges.whiteNewRating, game.white.userId]);
            await run('UPDATE users SET elo = ? WHERE id = ?', [eloChanges.blackNewRating, game.black.userId]);

            console.log(`📊 ELO updated - White: ${game.white.elo} → ${eloChanges.whiteNewRating}, Black: ${game.black.elo} → ${eloChanges.blackNewRating}`);
        } else {
            // For casual games, no ELO changes
            eloChanges = {
                whiteNewRating: game.white.elo,
                blackNewRating: game.black.elo,
                whiteChange: 0,
                blackChange: 0
            };
            console.log(`🎲 Casual game - No ELO changes`);
        }

        // Store match in database with ELO at match time
        const matchId = uuidv4();
        const winnerId = winner === 'draw' ? null : (winner === 'white' ? game.white.userId : game.black.userId);

        // Store match data including ELO at match time and changes
        const matchData = JSON.stringify({
            moves: game.moveHistory,
            whiteElo: game.white.elo,
            blackElo: game.black.elo,
            whiteChange: eloChanges.whiteChange,
            blackChange: eloChanges.blackChange
        });

        // Use JavaScript ISO timestamp for proper parsing
        const timestamp = new Date().toISOString();


        await run(
            `INSERT INTO matches (
                id, 
                white_player_id, 
                black_player_id, 
                white_player_name,
                black_player_name,
                result, 
                winner_id, 
                pgn,
                white_elo_before,
                black_elo_before,
                white_elo_after,
                black_elo_after,
                casual,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                matchId,
                game.white.userId,
                game.black.userId,
                game.white.username,
                game.black.username,
                winner === 'draw' ? 'draw' : 'win',
                winnerId,
                matchData,
                game.white.elo,
                game.black.elo,
                eloChanges.whiteNewRating,
                eloChanges.blackNewRating,
                game.casual ? 1 : 0,
                timestamp
            ]
        );

        // Notify both players
        io.to(game.white.socketId).to(game.black.socketId).emit('game_over', {
            winner,
            reason: reason || 'checkmate',
            white: {
                username: game.white.username,
                oldElo: game.white.elo,
                newElo: eloChanges.whiteNewRating,
                change: eloChanges.whiteChange
            },
            black: {
                username: game.black.username,
                oldElo: game.black.elo,
                newElo: eloChanges.blackNewRating,
                change: eloChanges.blackChange
            }
        });

        console.log(`✨ ELO updated: ${game.white.username} ${eloChanges.whiteChange > 0 ? '+' : ''}${eloChanges.whiteChange}, ${game.black.username} ${eloChanges.blackChange > 0 ? '+' : ''}${eloChanges.blackChange}`);

    } catch (error) {
        console.error('Error in handleGameEnd:', error);
    } finally {
        // Cleanup
        activeGames.delete(game.id);
        socketToGame.delete(game.white.socketId);
        socketToGame.delete(game.black.socketId);
    }
}
