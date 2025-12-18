import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, 'chess.db');

// Ensure DB file exists or will be created
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database at', DB_PATH);
        initSchema();
    }
});

function initSchema() {
    db.serialize(() => {
        // User Table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                elo INTEGER DEFAULT 800,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Match Table
        db.run(`
            CREATE TABLE IF NOT EXISTS matches (
                id TEXT PRIMARY KEY,
                white_player_id TEXT NOT NULL,
                black_player_id TEXT NOT NULL,
                white_player_name TEXT NOT NULL,
                black_player_name TEXT NOT NULL,
                result TEXT NOT NULL,
                winner_id TEXT,
                pgn TEXT NOT NULL,
                white_elo_before INTEGER NOT NULL,
                black_elo_before INTEGER NOT NULL,
                white_elo_after INTEGER NOT NULL,
                black_elo_after INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                casual INTEGER DEFAULT 0,
                FOREIGN KEY(white_player_id) REFERENCES users(id),
                FOREIGN KEY(black_player_id) REFERENCES users(id),
                FOREIGN KEY(winner_id) REFERENCES users(id)
            )
        `);

        // Friends Table
        db.run(`
            CREATE TABLE IF NOT EXISTS friends (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                friend_id TEXT NOT NULL,
                status TEXT CHECK(status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(friend_id) REFERENCES users(id),
                UNIQUE(user_id, friend_id)
            )
        `);
    });
}

// Promisified helper
export const query = (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

export const run = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

export const get = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

export default db;
