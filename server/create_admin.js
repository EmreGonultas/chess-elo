// Script to create TheDev admin account with Paragon rank
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Please run this on Render or set DATABASE_URL locally.');
    process.exit(1);
}

async function createAdminAccount() {
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔐 Creating TheDev admin account...');

        const username = 'TheDev';
        const password = 'admin123'; // Change this to your preferred password!
        const elo = 2800; // Paragon rank (2800+)

        // Check if user exists
        const existing = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        let userId;

        if (existing.rows.length > 0) {
            console.log('👤 User already exists, updating...');
            userId = existing.rows[0].id;

            // Update existing user
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET password = $1, elo = $2, is_admin = $3 WHERE id = $4',
                [hashedPassword, elo, true, userId]
            );
        } else {
            console.log('👤 Creating new user...');
            userId = uuidv4();
            const hashedPassword = await bcrypt.hash(password, 10);

            await pool.query(
                'INSERT INTO users (id, username, password, elo, is_admin) VALUES ($1, $2, $3, $4, $5)',
                [userId, username, hashedPassword, elo, true]
            );
        }

        console.log('✅ TheDev account created/updated successfully!');
        console.log(`   Username: ${username}`);
        console.log(`   Password: ${password}`);
        console.log(`   ELO: ${elo} (Paragon)`);
        console.log(`   Admin: true`);
        console.log('');
        console.log('🎉 You can now log in with these credentials!');

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdminAccount();
