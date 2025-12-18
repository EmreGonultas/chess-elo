const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'chess.db');
const db = new sqlite3.Database(dbPath);

db.run('UPDATE users SET elo = ? WHERE username = ?', [2500, 'anan2'], function (err) {
    if (err) {
        console.error('❌ Error updating ELO:', err);
    } else {
        console.log(`✅ Updated anan2 to 2500 ELO (Paragon rank) - ${this.changes} row(s) updated`);
    }
    db.close();
});
