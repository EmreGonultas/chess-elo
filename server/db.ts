import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const DB_PATH = path.join(__dirname, 'chess.db');

// PostgreSQL pool for production
let pgPool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;

if (isProduction) {
    console.log('🚀 Using PostgreSQL for production');
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    initPostgresSchema();
} else {
    console.log('💻 Using SQLite for development');
    sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Could not connect to database', err);
        } else {
            console.log('Connected to SQLite database at', DB_PATH);
            initSqliteSchema();
        }
    });
}

async function initPostgresSchema() {
    if (!pgPool) return;

    try {
        // Users table
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                elo INTEGER DEFAULT 800,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Matches table
        await pgPool.query(`
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                casual INTEGER DEFAULT 0,
                FOREIGN KEY(white_player_id) REFERENCES users(id),
                FOREIGN KEY(black_player_id) REFERENCES users(id),
                FOREIGN KEY(winner_id) REFERENCES users(id)
            )
        `);

        // Friends table
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS friends (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                friend_id TEXT NOT NULL,
                status TEXT CHECK(status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(friend_id) REFERENCES users(id),
                UNIQUE(user_id, friend_id)
            )
        `);

        console.log('✅ PostgreSQL schema initialized');
    } catch (error) {
        console.error('Error initializing PostgreSQL schema:', error);
    }
}

function initSqliteSchema() {
    if (!sqliteDb) return;

    sqliteDb.serialize(() => {
        // User Table
        sqliteDb!.run(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                elo INTEGER DEFAULT 800,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Match Table
        sqliteDb!.run(`
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
        sqliteDb!.run(`
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

// Unified query interface
export const query = async (sql: string, params: any[] = []): Promise<any[]> => {
    if (isProduction && pgPool) {
        const result = await pgPool.query(sql, params);
        return result.rows;
    } else if (sqliteDb) {
        return new Promise((resolve, reject) => {
            sqliteDb!.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    throw new Error('No database connection available');
};

export const run = async (sql: string, params: any[] = []): Promise<any> => {
    if (isProduction && pgPool) {
        const result = await pgPool.query(sql, params);
        return result;
    } else if (sqliteDb) {
        return new Promise((resolve, reject) => {
            sqliteDb!.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
    throw new Error('No database connection available');
};

export const get = async (sql: string, params: any[] = []): Promise<any> => {
    if (isProduction && pgPool) {
        const result = await pgPool.query(sql, params);
        return result.rows[0];
    } else if (sqliteDb) {
        return new Promise((resolve, reject) => {
            sqliteDb!.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
    throw new Error('No database connection available');
};

export default isProduction ? pgPool : sqliteDb;
