// Test ELO Calculation System
// Run this file with: npx ts-node test_elo.ts

import axios from 'axios';

async function testEloSystem() {
    const API_URL = 'http://localhost:3000/api/match';

    console.log('🧪 Testing ELO Calculation System\n');
    console.log('================================\n');

    // Test 1: Simulate anan (2500) vs anan2 (2100)
    console.log('Test 1: anan (2500 ELO) vs anan2 (2100 ELO)');
    console.log('Result: anan wins');

    try {
        const result1 = await axios.post(`${API_URL}/simulate`, {
            player1Username: 'anan',
            player2Username: 'anan2',
            winner: 'player1'
        });

        console.log('\n✅ Match Result:');
        console.log(`White (${result1.data.white.username}): ${result1.data.white.oldRating} → ${result1.data.white.newRating} (${result1.data.white.change > 0 ? '+' : ''}${result1.data.white.change})`);
        console.log(`Black (${result1.data.black.username}): ${result1.data.black.oldRating} → ${result1.data.black.newRating} (${result1.data.black.change > 0 ? '+' : ''}${result1.data.black.change})`);
        console.log(`Match ID: ${result1.data.matchId}\n`);
    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
    }

    // Test 2: Simulate draw between anan3 (1750) vs anan2 (new rating)
    console.log('\n================================\n');
    console.log('Test 2: anan3 (1750 ELO) vs anan2 (updated ELO)');
    console.log('Result: Draw');

    try {
        const result2 = await axios.post(`${API_URL}/simulate`, {
            player1Username: 'anan3',
            player2Username: 'anan2',
            winner: 'draw'
        });

        console.log('\n✅ Match Result:');
        console.log(`White (${result2.data.white.username}): ${result2.data.white.oldRating} → ${result2.data.white.newRating} (${result2.data.white.change > 0 ? '+' : ''}${result2.data.white.change})`);
        console.log(`Black (${result2.data.black.username}): ${result2.data.black.oldRating} → ${result2.data.black.newRating} (${result2.data.black.change > 0 ? '+' : ''}${result2.data.black.change})`);
        console.log(`Match ID: ${result2.data.matchId}\n`);
    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
    }

    // Display leaderboard
    console.log('\n================================\n');
    console.log('📊 Updated Leaderboard:\n');

    try {
        const leaderboard = await axios.get('http://localhost:3000/api/leaderboard/top?limit=10');
        leaderboard.data.forEach((player: any) => {
            console.log(`#${player.rank} ${player.username}: ${player.elo} ELO`);
        });
    } catch (error: any) {
        console.error('❌ Error fetching leaderboard:', error.response?.data || error.message);
    }

    console.log('\n================================\n');
    console.log('✨ ELO System Test Complete!\n');
}

testEloSystem().catch(console.error);
