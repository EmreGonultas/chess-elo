import { get, run } from './db';

async function updateElo() {
    try {
        const username = 'anan';
        const newElo = 2500;

        // Check if user exists
        const user = await get('SELECT * FROM users WHERE username = ?', [username]);

        if (!user) {
            console.error(`User '${username}' not found!`);
            process.exit(1);
        }

        console.log(`Found user: ${user.username} with current ELO ${user.elo}`);

        // Update ELO
        await run('UPDATE users SET elo = ? WHERE username = ?', [newElo, username]);

        console.log(`✅ SUCCESS: Updated ${username} from ${user.elo} to ${newElo} ELO`);

        // Verify update
        const updatedUser = await get('SELECT * FROM users WHERE username = ?', [username]);
        console.log(`✅ VERIFIED: ${updatedUser.username} now has ${updatedUser.elo} ELO`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating ELO:', error);
        process.exit(1);
    }
}

updateElo();
