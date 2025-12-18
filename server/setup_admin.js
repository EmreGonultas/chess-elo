const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./chess.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

console.log('🔧 Adding admin and ban fields...');

// Add is_admin column
db.run(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding is_admin:', err);
    } else {
        console.log('✅ Added is_admin column');
    }
});

// Add is_banned column
db.run(`ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding is_banned:', err);
    } else {
        console.log('✅ Added is_banned column');
    }
});

// Make TheDev an admin
setTimeout(() => {
    db.run(`UPDATE users SET is_admin = 1 WHERE username = 'TheDev'`, (err) => {
        if (err) {
            console.error('Error making TheDev admin:', err);
        } else {
            console.log('👑 TheDev is now an admin!');
        }

        // Verify
        db.get(`SELECT username, is_admin, is_banned FROM users WHERE username = 'TheDev'`, (err, row) => {
            if (row) {
                console.log('Verified:', row);
            }
            db.close();
        });
    });
}, 1000);
