// Local script to promote TheDev - connects directly to production database
require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://chess_elo_db_user:nS82QZFI48iFWblNGfVwUmUKpTpPlEjh@dpg-ctci34pu0jms73bhgq50-a.frankfurt-postgres.render.com/chess_elo_db';

async function promoteTheDev() {
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔧 Connecting to production database...');

        // Update TheDev
        const result = await pool.query(
            'UPDATE users SET elo = $1, is_admin = $2 WHERE username = $3 RETURNING *',
            [2800, true, 'TheDev']
        );

        if (result.rows.length === 0) {
            console.log('❌ TheDev not found!');
            process.exit(1);
        }

        const user = result.rows[0];
        console.log('✅ TheDev promoted successfully!');
        console.log('');
        console.log('   Username:', user.username);
        console.log('   ELO:', user.elo, '(Paragon)');
        console.log('   Admin:', user.is_admin);
        console.log('');
        console.log('🎉 You can now log in and access the admin panel!');

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

promoteTheDev();
