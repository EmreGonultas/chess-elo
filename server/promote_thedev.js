// Promote TheDev to admin with Paragon rank
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set!');
    process.exit(1);
}

async function promoteTheDev() {
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔧 Promoting TheDev to admin with Paragon rank...');

        // Update TheDev account
        const result = await pool.query(
            'UPDATE users SET elo = $1, is_admin = $2 WHERE username = $3 RETURNING *',
            [2800, true, 'TheDev']
        );

        if (result.rows.length === 0) {
            console.log('❌ TheDev account not found!');
            process.exit(1);
        }

        const user = result.rows[0];
        console.log('✅ TheDev promoted successfully!');
        console.log(`   Username: ${user.username}`);
        console.log(`   ELO: ${user.elo} (Paragon)`);
        console.log(`   Admin: ${user.is_admin}`);
        console.log('');
        console.log('🎉 TheDev is now an admin with Paragon rank!');

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

promoteTheDev();
