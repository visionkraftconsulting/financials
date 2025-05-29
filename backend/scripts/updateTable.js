import dotenv from 'dotenv';
dotenv.config({ path: '/home/bitnami/scripts/financial/investment-tracker/backend/.env' });
import mysql from 'mysql2/promise';

// DB config
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Helper: Check if company_name is an error message
function isErrorMessage(companyName) {
  if (!companyName) return false;
  const lowerName = companyName.toLowerCase();
  return lowerName.includes('sorry') || 
         lowerName.includes('not a valid') || 
         lowerName.includes('unable to provide') || 
         lowerName.includes("doesn't appear") || 
         lowerName.includes("couldn't find");
}

// Main: Update company names
async function updateCompanyNamesFromTickers() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('🔗 Connected to MySQL');

    const [rows] = await connection.execute(`
      SELECT id, company_name, ticker, entity_type
      FROM bitcoin_treasuries
    `);

    console.log(`🔍 Loaded ${rows.length} records from the database.`);

    for (const row of rows) {
      const rawCompanyName = row.company_name?.trim();
      const rawTicker = row.ticker?.trim();

      const companyName = rawCompanyName?.toLowerCase() || '';
      const ticker = rawTicker?.toLowerCase() || '';
      const entityType = row.entity_type?.trim();

      console.log(`🧪 Processing ID ${row.id}: company_name="${row.company_name}", ticker="${row.ticker}", entity_type="${entityType}"`);

      const isTickerMatch = rawCompanyName && rawTicker && companyName === ticker;
      const isError = isErrorMessage(row.company_name);

      if (isTickerMatch || isError) {
        if (isTickerMatch) {
          console.log(`⚠️ Detected ticker used as company name for ID ${row.id}`);
        }
        if (isError) {
          console.log(`⚠️ Detected error message in company_name for ID ${row.id}`);
        }

        // Use entity_type if valid
        if (
          entityType &&
          entityType.length > 2 &&
          entityType !== 'N/A' &&
          !['country', 'government', 'private company', 'public company', 'non-profit organization', 'radio station'].includes(entityType.toLowerCase())
        ) {
          console.log(`📌 Using entity_type "${entityType}" to update company name for ID ${row.id}`);
          await connection.execute(
            `UPDATE bitcoin_treasuries SET company_name = ? WHERE id = ?`,
            [entityType, row.id]
          );
          console.log(`✅ Updated company name for ID ${row.id}: "${entityType}"`);
        } else {
          console.log(`❌ Invalid or missing entity_type for ID ${row.id}, skipping update.`);
        }
      } else {
        console.log(`🆗 No update needed for ID ${row.id}`);
      }
    }

    console.log(`✅ Company name updates complete.`);
  } catch (err) {
    console.error('❌ Error in updating company names:', err.message);
  } finally {
    await connection.end();
    console.log('🔌 DB connection closed.');
  }
}

updateCompanyNamesFromTickers();