/**
 * Socket.io Backend Test - FIXED
 * Tests matchmaking, game creation, and move synchronization
 */

import { io, Socket } from 'socket.io-client';

// Test users
const player1 = {
    userId: 'test-user-1',
    username: 'TestPlayer1',
    elo: 1200
};

const player2 = {
    userId: 'test-user-2',
    username: 'TestPlayer2',
    elo: 1300
};

let socket1: Socket;
let socket2: Socket;
let gameId: string;
let whiteSocket: Socket;
let blackSocket: Socket;

async function runTests() {
    console.log('🧪 Testing Multiplayer Backend...\n');
    console.log('=================================\n');

    // Connect players
    console.log('📡 Connecting Player 1...');
    socket1 = io('http://localhost:3000');
    await new Promise((resolve) => {
        socket1.on('connect', () => {
            console.log(`✅ Player 1 connected: ${socket1.id}\n`);
            resolve(true);
        });
    });

    console.log('📡 Connecting Player 2...');
    socket2 = io('http://localhost:3000');
    await new Promise((resolve) => {
        socket2.on('connect', () => {
            console.log(`✅ Player 2 connected: ${socket2.id}\n`);
            resolve(true);
        });
    });

    // Test 1: Matchmaking
    console.log('=================================');
    console.log('Test 1: Matchmaking Queue\n');

    socket1.emit('join_queue', player1);
    await new Promise((resolve) => {
        socket1.on('queue_joined', (data) => {
            console.log(`✅ Player 1 joined queue at position ${data.position}`);
            resolve(true);
        });
    });

    socket2.emit('join_queue', player2);
    console.log('\nWaiting for match...');

    // Test 2: Match Found - TRACK COLORS
    await Promise.all([
        new Promise((resolve) => {
            socket1.on('match_found', (data) => {
                console.log(`\n✅ Player 1 matched! Color: ${data.color}`);
                gameId = data.gameId;
                if (data.color === 'white') {
                    whiteSocket = socket1;
                    blackSocket = socket2;
                }
                resolve(true);
            });
        }),
        new Promise((resolve) => {
            socket2.on('match_found', (data) => {
                console.log(`✅ Player 2 matched! Color: ${data.color}`);
                if (data.color === 'white') {
                    whiteSocket = socket2;
                    blackSocket = socket1;
                }
                resolve(true);
            });
        })
    ]);

    // Test 3: Game Start
    console.log('\n=================================');
    console.log('Test 2: Game Start\n');

    await Promise.all([
        new Promise((resolve) => { socket1.on('game_start', () => { console.log('✅ Game started for Player 1'); resolve(true); }); }),
        new Promise((resolve) => { socket2.on('game_start', () => { console.log('✅ Game started for Player 2'); resolve(true); }); })
    ]);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 4: Move (WHITE moves)
    console.log('\n=================================');
    console.log('Test 3: Move Synchronization\n');

    console.log(`♟️  White plays e2-e4...`);
    whiteSocket.emit('make_move', { gameId, from: 'e2', to: 'e4' });

    await Promise.all([
        new Promise((resolve) => { socket1.once('move_made', (data) => { console.log(`✅ Player 1 received: ${data.from}→${data.to}`); resolve(true); }); }),
        new Promise((resolve) => { socket2.once('move_made', (data) => { console.log(`✅ Player 2 received: ${data.from}→${data.to}, Turn: Black`); resolve(true); }); })
    ]);

    // Test 5: Invalid Move
    console.log('\n=================================');
    console.log('Test 4: Move Validation\n');

    console.log('❌ White tries to move on Black\'s turn...');
    whiteSocket.emit('make_move', { gameId, from: 'd2', to: 'd4' });

    await new Promise((resolve) => {
        whiteSocket.once('invalid_move', (data) => {
            console.log(`✅ Correctly rejected: ${data.error}`);
            resolve(true);
        });
    });

    // Test 6: Resignation
    console.log('\n=================================');
    console.log('Test 5: Resignation & ELO\n');

    console.log('🏳️  Black resigns...');
    blackSocket.emit('resign', { gameId });

    await Promise.all([
        new Promise((resolve) => {
            socket1.once('game_over', (data) => {
                console.log(`\n✅ Game Over!`);
                console.log(`   Winner: ${data.winner}`);
                console.log(`   ${data.white.username}: ${data.white.oldElo} → ${data.white.newElo} (${data.white.change > 0 ? '+' : ''}${data.white.change})`);
                console.log(`   ${data.black.username}: ${data.black.oldElo} → ${data.black.newElo} (${data.black.change > 0 ? '+' : ''}${data.black.change})`);
                resolve(true);
            });
        }),
        new Promise((resolve) => { socket2.once('game_over', () => resolve(true)); })
    ]);

    console.log('\n=================================');
    console.log('✨ All Tests Passed!\n');

    socket1.close();
    socket2.close();
    process.exit(0);
}

runTests().catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
