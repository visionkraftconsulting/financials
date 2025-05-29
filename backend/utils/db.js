import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
dotenv.config();

console.log('[🔌] Attempting DB connection with config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

// Immediately test DB connection at startup
// Immediately test DB connection and ensure users table exists at startup
pool.getConnection()
  .then(conn => {
    console.log('[✅] Initial DB connection established.');
    conn.release();
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured users table exists.');
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS user_investments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        shares DECIMAL(10,4),
        invested_at DATE,
        FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
      )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured user_investments table exists.');
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS user_btc_wallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        wallet_address VARCHAR(255) NOT NULL,
        balance_btc DECIMAL(18,8) DEFAULT 0,
        nickname VARCHAR(255),
        FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
      )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured user_btc_wallets table exists.');
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS bitcoin_treasuries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(255),
        country VARCHAR(255),
        btc_holdings VARCHAR(255),
        usd_value VARCHAR(255),
        entity_url VARCHAR(255),
        entity_type VARCHAR(50),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured bitcoin_treasuries table exists.');
  })
  .then(() => {
    return pool.execute(
      `SELECT 1
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'bitcoin_treasuries'
         AND COLUMN_NAME = 'dividend_rate'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding dividend_rate column to bitcoin_treasuries');
        return pool.execute(
          `ALTER TABLE bitcoin_treasuries ADD COLUMN dividend_rate VARCHAR(20)`
        );
      }
    });
  })
  .then(() => {
    console.log('[✅] Ensured dividend_rate column exists.');
  })
  .then(() => {
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS countries (
         id INT AUTO_INCREMENT PRIMARY KEY,
         country_name VARCHAR(255) NOT NULL UNIQUE
       )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured countries table exists.');
    return pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'countries'
         AND COLUMN_NAME = 'total_btc'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding total_btc column to countries');
        return pool.execute(
          `ALTER TABLE countries ADD COLUMN total_btc DECIMAL(20,4) DEFAULT 0`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'countries'
         AND COLUMN_NAME = 'total_usd_m'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding total_usd_m column to countries');
        return pool.execute(
          `ALTER TABLE countries ADD COLUMN total_usd_m DECIMAL(20,4) DEFAULT 0`
        );
      }
    });
  })
  .then(() => {
    console.log('[✅] Ensured total_btc and total_usd_m columns exist in countries table.');
  })
  .catch(err => {
    console.error('[🚫] DB initialization error:', err.message);
  });

export const executeQuery = async (query, params = []) => {
    const start = Date.now();
    console.log(`\n[🧠] Executing SQL: ${query}`);
    console.log(`[📦] With parameters:`, params);
    try {
      const [rows] = await pool.execute(query, params);
      const duration = Date.now() - start;
      console.log(`[✅] Query executed successfully.`);
      console.log(`[📊] Rows returned: ${rows.length}`);
      console.log(`[⏱️] Duration: ${duration}ms`);
      return rows;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[❌] SQL Execution Failed in ${duration}ms`);
  
      // Advanced error logging
      console.error(`[💥] Error name:`, error?.name);
      console.error(`[💥] Error message:`, error?.message);
      console.error(`[💥] Full error:`, error);
  
      throw error;
    }
  };