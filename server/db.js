import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mysqlPool = null;
let sqliteDb = null;
let isUsingSqlite = false;

// Attempt MySQL Connection Pool
async function initDb() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'nutriscan';

  try {
    const connection = await mysql.createConnection({ host, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();

    mysqlPool = mysql.createPool({
      host,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create MySQL Tables
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        allergens JSON,
        custom_concerns JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id VARCHAR(255) PRIMARY KEY,
        user_id INT,
        title VARCHAR(255),
        raw_text TEXT,
        analysis_json JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Connected to MySQL Database successfully!');
  } catch (err) {
    console.warn('⚠️ MySQL connection not available, seamlessly falling back to local SQLite database for zero-config development.');
    isUsingSqlite = true;

    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'nutriscan_local.db');
    sqliteDb = new Database(dbPath);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        allergens TEXT,
        custom_concerns TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        title TEXT,
        raw_text TEXT,
        analysis_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Local SQLite database initialized at:', dbPath);
  }
}

initDb();

export async function queryDb(sql, params = []) {
  if (!isUsingSqlite && mysqlPool) {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql.replace(/\?/g, '?'));
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all(...params);
    } else {
      const result = stmt.run(...params);
      return { insertId: result.lastInsertRowid, affectedRows: result.changes };
    }
  } else {
    throw new Error('Database not initialized');
  }
}
