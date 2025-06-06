import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
export { pool };
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
        phone VARCHAR(20),
        country VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured users table exists.');
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'phone'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding phone column to users table');
        return pool.execute(
          `ALTER TABLE users ADD COLUMN phone VARCHAR(20)`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'country'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding country column to users table');
        return pool.execute(
          `ALTER TABLE users ADD COLUMN country VARCHAR(255)`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'role'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding role column to users table');
        return pool.execute(
          `ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'User'`
        );
      }
    });
  })
  .then(() => {
    console.log('[✅] Ensured role column exists.');
  })
  .then(() => {
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
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'user_investments'
         AND COLUMN_NAME = 'symbol'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding symbol column to user_investments');
        return pool.execute(
          `ALTER TABLE user_investments ADD COLUMN symbol VARCHAR(20) NOT NULL DEFAULT 'MSTY'`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'user_investments'
         AND COLUMN_NAME = 'track_dividends'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding track_dividends column to user_investments');
        return pool.execute(
          `ALTER TABLE user_investments ADD COLUMN track_dividends TINYINT(1) DEFAULT 1`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'user_investments'
         AND COLUMN_NAME = 'type'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding type column to user_investments');
        return pool.execute(
          `ALTER TABLE user_investments ADD COLUMN type VARCHAR(20) DEFAULT 'stock'`
        );
      }
    });
  })
  // Cache calculated fields for user investments
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'user_investments'
         AND COLUMN_NAME = 'usd_invested'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding usd_invested column to user_investments');
        return pool.execute(
          `ALTER TABLE user_investments ADD COLUMN usd_invested DECIMAL(10,2) DEFAULT 0`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'user_investments'
         AND COLUMN_NAME = 'usd_value'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding usd_value column to user_investments');
        return pool.execute(
          `ALTER TABLE user_investments ADD COLUMN usd_value DECIMAL(10,2) DEFAULT 0`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'user_investments'
         AND COLUMN_NAME = 'portfolio_value'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding portfolio_value column to user_investments');
        return pool.execute(
          `ALTER TABLE user_investments ADD COLUMN portfolio_value DECIMAL(10,2) DEFAULT 0`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'user_investments'
         AND COLUMN_NAME = 'profit_or_loss_usd'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding profit_or_loss_usd column to user_investments');
        return pool.execute(
          `ALTER TABLE user_investments ADD COLUMN profit_or_loss_usd DECIMAL(10,2) DEFAULT 0`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'user_investments'
         AND COLUMN_NAME = 'profit_or_loss_per_share'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding profit_or_loss_per_share column to user_investments');
        return pool.execute(
          `ALTER TABLE user_investments ADD COLUMN profit_or_loss_per_share DECIMAL(10,4) DEFAULT 0`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'user_investments'
         AND COLUMN_NAME = 'annual_dividend_usd'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding annual_dividend_usd column to user_investments');
        return pool.execute(
          `ALTER TABLE user_investments ADD COLUMN annual_dividend_usd DECIMAL(10,2) DEFAULT 0`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'user_investments'
         AND COLUMN_NAME = 'updated_at'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding updated_at column to user_investments');
        return pool.execute(
          `ALTER TABLE user_investments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
        );
      }
    });
  })
  .then(() => {
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
      `CREATE TABLE IF NOT EXISTS user_wallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        chain VARCHAR(50) NOT NULL,
        wallet_address VARCHAR(255) NOT NULL,
        nickname VARCHAR(255),
        type VARCHAR(50) DEFAULT 'manual',
        FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
      )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured user_wallets table exists.');
  })
  .then(() => {
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
  // Ensure top_cryptos cache table exists
  .then(() => {
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS top_cryptos (
         id VARCHAR(255) PRIMARY KEY,
         symbol VARCHAR(50),
         name VARCHAR(255),
         image VARCHAR(512),
         current_price DECIMAL(30,10),
         market_cap DECIMAL(30,2),
         market_cap_rank INT,
         price_change_percentage_24h DECIMAL(10,2),
         total_volume DECIMAL(30,2),
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured top_cryptos table exists.');
  })
  // Ensure trending_cryptos cache table exists
  .then(() => {
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS trending_cryptos (
         id VARCHAR(255) PRIMARY KEY,
         symbol VARCHAR(50),
         name VARCHAR(255),
         image VARCHAR(512),
         current_price DECIMAL(30,10),
         market_cap DECIMAL(30,2),
         market_cap_rank INT,
         price_change_percentage_24h DECIMAL(10,2),
         total_volume DECIMAL(30,2),
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured trending_cryptos table exists.');
  })
  // Ensure sga_picks table exists for storing premium picks
  .then(() => {
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS sga_picks (
         id INT AUTO_INCREMENT PRIMARY KEY,
         coin_name VARCHAR(255) NOT NULL,
         suggested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured sga_picks table exists.');
  })
  .then(() => {
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS user_investment_summaries (
         email VARCHAR(255) PRIMARY KEY,
         summary JSON NOT NULL,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
       )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured user_investment_summaries table exists.');
  })
  .then(() => {
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS crypto_news (
         id INT AUTO_INCREMENT PRIMARY KEY,
         source VARCHAR(100),
         title TEXT,
         summary TEXT,
         content TEXT,
         url TEXT,
         image TEXT,
         source_type VARCHAR(50),
         published_at DATETIME,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       )`
    );
  })
  .then(() => {
    // Ensure summary column exists even if the table already existed
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'crypto_news'
         AND COLUMN_NAME = 'summary'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding summary column to crypto_news');
        return pool.execute(
          `ALTER TABLE crypto_news ADD COLUMN summary TEXT`
        );
      }
    });
  })
  .then(() => {
    // Ensure image column exists even if the table already existed
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'crypto_news'
         AND COLUMN_NAME = 'image'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding image column to crypto_news');
        return pool.execute(
          `ALTER TABLE crypto_news ADD COLUMN image TEXT`
        );
      }
    });
  })
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'crypto_news'
         AND COLUMN_NAME = 'source_type'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding source_type column to crypto_news');
        return pool.execute(
          `ALTER TABLE crypto_news ADD COLUMN source_type VARCHAR(50)`
        );
      }
    });
  })
  .then(() => {
    console.log('[✅] Ensured summary, image, and source_type columns exist in crypto_news table.');
  })
  // Ensure original_title column exists for storing untranslated titles
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'crypto_news'
         AND COLUMN_NAME = 'original_title'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding original_title column to crypto_news');
        return pool.execute(
          `ALTER TABLE crypto_news ADD COLUMN original_title TEXT`
        );
      }
    });
  })
  // Ensure detected_lang column exists for storing language detection info
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'crypto_news'
         AND COLUMN_NAME = 'detected_lang'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding detected_lang column to crypto_news');
        return pool.execute(
          `ALTER TABLE crypto_news ADD COLUMN detected_lang VARCHAR(50) DEFAULT 'unknown'`
        );
      }
    });
  })
  // Ensure symbol column exists for storing related ticker/symbol data
  .then(() => {
    return pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'crypto_news'
         AND COLUMN_NAME = 'symbol'`
    ).then(([rows]) => {
      if (rows.length === 0) {
        console.log('[🔧] Adding symbol column to crypto_news');
        return pool.execute(
          `ALTER TABLE crypto_news ADD COLUMN symbol VARCHAR(50)`
        );
      }
    });
  })
  .then(() => {
    console.log('[✅] Ensured original_title, detected_lang, and symbol columns exist in crypto_news table.');
  })
  // Ensure crypto_investments table exists for listing supported crypto assets
  .then(() => {
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS crypto_investments (
         symbol VARCHAR(20) PRIMARY KEY,
         coingecko_id VARCHAR(50),
         name VARCHAR(255)
       )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured crypto_investments table exists.');
  })
  // Ensure user_crypto_investments table exists for per-user crypto holdings
  .then(() => {
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS user_crypto_investments (
         id INT AUTO_INCREMENT PRIMARY KEY,
         email VARCHAR(255) NOT NULL,
         symbol VARCHAR(20) NOT NULL,
         amount DECIMAL(30,8),
         invested_at DATE,
         usd_invested DECIMAL(20,2) DEFAULT 0,
         usd_value DECIMAL(20,2) DEFAULT 0,
         profit_or_loss_usd DECIMAL(20,2) DEFAULT 0,
         profit_or_loss_per_unit DECIMAL(20,8) DEFAULT 0,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
       )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured user_crypto_investments table exists.');
  })
  .then(() => {
    return pool.execute(
      `CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        stripe_customer_id VARCHAR(255) NOT NULL,
        stripe_subscription_id VARCHAR(255),
        status VARCHAR(50),
        trial_end TIMESTAMP NULL,
        current_period_end TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
      )`
    );
  })
  .then(() => {
    console.log('[✅] Ensured subscriptions table exists.');
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

export default pool;