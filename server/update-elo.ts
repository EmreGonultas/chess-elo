// Quick script to update anan2's ELO to Paragon
import { run } from './db.js';

async function updateElo() {
    try {
        await run('UPDATE users SET elo = 2500 WHERE username = ?', ['anan2']);
        console.log('✅ Updated anan2 to Paragon rank (2500 ELO)');
    } catch (error) {
        console.error('❌ Error:', error);
    }
    process.exit(0);
}

updateElo();
