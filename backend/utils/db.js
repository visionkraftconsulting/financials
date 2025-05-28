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
pool.getConnection()
  .then(conn => {
    console.log('[✅] Initial DB connection established.');
    conn.release();
  })
  .catch(err => {
    console.error('[🚫] Failed to connect to the database at startup.');
    console.error('[💥] Error:', err.message);
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