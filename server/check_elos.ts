import { query } from './db';

async function checkRatings() {
    console.log('📊 Current Player Ratings:\n');

    const users = await query('SELECT username, elo FROM users ORDER BY elo DESC');

    users.forEach((user: any) => {
        console.log(`${user.username}: ${user.elo} ELO`);
    });

    process.exit(0);
}

checkRatings().catch(console.error);
