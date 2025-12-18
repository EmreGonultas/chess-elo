const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/chess.db');
const db = new sqlite3.Database(dbPath);

const username = 'anan'; // Target user from screenshot
const newElo = 2500;

db.serialize(() => {
    db.run("UPDATE users SET elo = ? WHERE username = ?", [newElo, username], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        console.log(`Updated ${username} to ELO ${newElo}`);
    });
});

db.close();
