const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./chess.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

// Rename anan2 to TheDev
db.run(`UPDATE users SET username = 'TheDev' WHERE username = 'anan2'`, (err) => {
    if (err) {
        console.error('Error renaming user:', err);
        return;
    }
    console.log('✅ Renamed anan2 to TheDev');

    // Verify changes
    db.all(`SELECT id, username, elo FROM users WHERE username IN ('anan', 'anan2', 'anan3', 'anan4', 'TheDev')`, (err, rows) => {
        if (err) {
            console.error('Error querying users:', err);
        } else {
            console.log('\n📊 Current test accounts:');
            rows.forEach(row => {
                console.log(`  ${row.username}: ${row.elo} ELO (ID: ${row.id})`);
            });
        }
        db.close();
    });
});
