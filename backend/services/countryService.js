import pool from '../utils/db.js';
import logger from '../helpers/logger.js';

export async function populateCountriesFromHolders() {
  try {
    logger.info('[🌍] Starting country population from holders...');

    const [holders] = await pool.query(`
      SELECT holder_name, total_btc, total_usd_m
      FROM btc_holders_by_type
      WHERE holder_name LIKE '🇦🇫%' OR holder_name LIKE '🇦🇱%' OR holder_name LIKE '🇩🇪%' OR holder_name LIKE '🇺🇸%' OR holder_name LIKE '🇨🇳%' OR holder_name LIKE '🇯🇵%' OR holder_name LIKE '🇷🇺%' OR holder_name LIKE '🇧🇷%' OR holder_name LIKE '🇬🇧%' OR holder_name LIKE '🇨🇦%' OR holder_name LIKE '🇫🇷%' OR holder_name LIKE '🇮🇹%' OR holder_name LIKE '🇰🇷%' OR holder_name LIKE '🇸🇬%' OR holder_name LIKE '🇸🇦%' OR holder_name LIKE '🇮🇳%' OR holder_name LIKE '🇪🇸%' OR holder_name LIKE '🇦🇺%' OR holder_name LIKE '🇿🇦%' OR holder_name LIKE '🇹🇷%' OR holder_name LIKE '🇸🇪%' OR holder_name LIKE '🇳🇴%' OR holder_name LIKE '🇩🇰%' OR holder_name LIKE '🇦🇪%' OR holder_name LIKE '🇮🇱%' OR holder_name LIKE '🇨🇭%' OR holder_name LIKE '🇵🇱%' OR holder_name LIKE '🇲🇽%' OR holder_name LIKE '🇳🇱%' OR holder_name LIKE '🇫🇮%' OR holder_name LIKE '🇹🇭%' OR holder_name LIKE '🇲🇾%' OR holder_name LIKE '🇮🇩%' OR holder_name LIKE '🇳🇿%' OR holder_name LIKE '🇭🇰%' OR holder_name LIKE '🇻🇳%' OR holder_name LIKE '🇷🇴%' OR holder_name LIKE '🇭🇺%' OR holder_name LIKE '🇨🇿%' OR holder_name LIKE '🇧🇬%' OR holder_name LIKE '🇷🇸%' OR holder_name LIKE '🇬🇷%' OR holder_name LIKE '🇦🇷%' OR holder_name LIKE '🇨🇱%' OR holder_name LIKE '🇨🇴%' OR holder_name LIKE '🇻🇪%' OR holder_name LIKE '🇺🇦%' OR holder_name LIKE '🇰🇵%' OR holder_name LIKE '🇰🇼%' OR holder_name LIKE '🇵🇭%' OR holder_name LIKE '🇪🇬%' OR holder_name LIKE '🇧🇭%' OR holder_name LIKE '🇶🇦%' OR holder_name LIKE '🇱🇧%' OR holder_name LIKE '🇲🇦%' OR holder_name LIKE '🇪🇪%' OR holder_name LIKE '🇱🇹%' OR holder_name LIKE '🇱🇻%' OR holder_name LIKE '🇲🇹%' OR holder_name LIKE '🇱🇮%' OR holder_name LIKE '🇻🇬%' OR holder_name LIKE '🇲🇨%' OR holder_name LIKE '🇮🇸%' OR holder_name LIKE '🇧🇪%' OR holder_name LIKE '🇮🇷%' OR holder_name LIKE '🇧🇹%' OR holder_name LIKE '🇸🇻%' OR holder_name LIKE '🇧🇬%' OR holder_name LIKE '🇿🇼%'
    `);

    const countryData = {};

    for (const holder of holders) {
      const match = holder.holder_name.match(/^(🇦🇫|🇦🇱|🇩🇪|🇺🇸|🇨🇳|🇯🇵|🇷🇺|🇧🇷|🇬🇧|🇨🇦|🇫🇷|🇮🇹|🇰🇷|🇸🇬|🇸🇦|🇮🇳|🇪🇸|🇦🇺|🇿🇦|🇹🇷|🇸🇪|🇳🇴|🇩🇰|🇦🇪|🇮🇱|🇨🇭|🇵🇱|🇲🇽|🇳🇱|🇫🇮|🇹🇭|🇲🇾|🇮🇩|🇳🇿|🇭🇰|🇻🇳|🇷🇴|🇭🇺|🇨🇿|🇧🇬|🇷🇸|🇬🇷|🇦🇷|🇨🇱|🇨🇴|🇻🇪|🇺🇦|🇰🇵|🇰🇼|🇵🇭|🇪🇬|🇧🇭|🇶🇦|🇱🇧|🇲🇦|🇪🇪|🇱🇹|🇱🇻|🇲🇹|🇱🇮|🇻🇬|🇲🇨|🇮🇸|🇧🇪|🇮🇷|🇧🇹|🇸🇻|🇧🇬|🇿🇼)/);
      if (match) {
        const flag = match[1];
        const name = holder.holder_name.replace(flag, '').trim();
        const knownCountries = [
          'Afghanistan', 'Albania', 'Germany', 'United States', 'China', 'Japan', 'Russia', 'Brazil',
          'United Kingdom', 'Canada', 'France', 'Italy', 'South Korea', 'Singapore', 'Saudi Arabia',
          'India', 'Spain', 'Australia', 'South Africa', 'Turkey', 'Sweden', 'Norway', 'Denmark',
          'United Arab Emirates', 'Israel', 'Switzerland', 'Poland', 'Mexico', 'Netherlands',
          'Finland', 'Thailand', 'Malaysia', 'Indonesia', 'New Zealand', 'Hong Kong', 'Vietnam',
          'Romania', 'Hungary', 'Czech Republic', 'Bulgaria', 'Serbia', 'Greece', 'Argentina',
          'Chile', 'Colombia', 'Venezuela', 'Ukraine', 'North Korea', 'Kuwait', 'Philippines',
          'Egypt', 'Bahrain', 'Qatar', 'Lebanon', 'Morocco', 'Estonia', 'Lithuania', 'Latvia',
          'Malta', 'Liechtenstein', 'British Virgin Islands', 'Monaco', 'Iceland', 'Belgium',
          'Iran', 'Bhutan', 'El Salvador', 'Zimbabwe'
        ];
        const probableCountryName = name.toLowerCase();
        if (!knownCountries.some(c => probableCountryName.includes(c.toLowerCase()))) {
          continue;
        }
        if (!countryData[flag]) {
          countryData[flag] = {
            country_name: name,
            total_btc: 0,
            total_usd_m: 0,
          };
        }
        countryData[flag].total_btc += holder.total_btc;
        countryData[flag].total_usd_m += holder.total_usd_m;
      }
    }

    for (const [flag, data] of Object.entries(countryData)) {
      await pool.query(
        `INSERT INTO countries (country_flag, country_name, total_btc, total_usd_m)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           total_btc = VALUES(total_btc),
           total_usd_m = VALUES(total_usd_m),
           last_updated = CURRENT_TIMESTAMP`,
        [flag, data.country_name, data.total_btc, data.total_usd_m]
      );
    }

    logger.info(`[✅] Populated ${Object.keys(countryData).length} countries from holders.`);
  } catch (err) {
    logger.error('[❌] Failed to populate countries from holders:', err);
    throw err;
  }
}