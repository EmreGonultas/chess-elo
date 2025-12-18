import { run, get } from './db';

async function updateUserRank() {
    try {
        const username = 'anan3';
        const newElo = 1750; // Eclipse rank

        // Check if user exists
        const user = await get('SELECT * FROM users WHERE username = ?', [username]);

        if (!user) {
            console.error(`User '${username}' not found!`);
            process.exit(1);
        }

        console.log(`Found user: ${user.username} with current ELO ${user.elo}`);

        // Update ELO
        await run('UPDATE users SET elo = ? WHERE username = ?', [newElo, username]);

        console.log(`✅ SUCCESS: Updated ${username} to ${newElo} ELO (Eclipse)`);

        // Verify update
        const updatedUser = await get('SELECT * FROM users WHERE username = ?', [username]);
        console.log(`✅ VERIFIED: ${updatedUser.username} now has ${updatedUser.elo} ELO`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating ELO:', error);
        process.exit(1);
    }
}

updateUserRank();
