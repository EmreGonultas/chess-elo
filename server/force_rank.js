const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// DB is in the same directory as this script
const dbPath = path.resolve(__dirname, 'chess.db');
const db = new sqlite3.Database(dbPath);

const username = 'anan';
const newElo = 2500;

console.log(`Openining DB at ${dbPath}`);

db.serialize(() => {
    // Check if user exists first
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            console.error("Error finding user:", err);
            return;
        }
        if (!row) {
            console.error(`User '${username}' not found!`);
            return;
        }
        console.log(`Found user: ${row.username} with ELO ${row.elo}`);

        // Update
        db.run("UPDATE users SET elo = ? WHERE username = ?", [newElo, username], function (err) {
            if (err) {
                return console.error("Update error:", err.message);
            }
            console.log(`SUCCESS: Updated ${username} to ELO ${newElo}`);
        });
    });
});

db.close();
