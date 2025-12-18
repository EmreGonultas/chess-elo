const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./chess.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

const newPassword = '2pizza6acbitir';

bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
    if (err) {
        console.error('Error hashing password:', err);
        db.close();
        return;
    }

    db.run(
        `UPDATE users SET password = ? WHERE username = 'TheDev'`,
        [hashedPassword],
        (err) => {
            if (err) {
                console.error('Error updating password:', err);
            } else {
                console.log('✅ TheDev password updated successfully!');
                console.log('Username: TheDev');
                console.log('Password: 2pizza6acbitir');
            }
            db.close();
        }
    );
});
