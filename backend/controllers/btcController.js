import { executeQuery } from '../utils/db.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Fetch live BTC balance from Blockstream
const fetchLiveBtcBalance = async (address) => {
  try {
    const res = await axios.get(`https://blockstream.info/api/address/${address}`);
    const stats = res.data.chain_stats;
    const balance = (stats.funded_txo_sum - stats.spent_txo_sum) / 1e8;
    console.log(`[🌍] Live balance for ${address}: ${balance} BTC`);
    return balance;
  } catch (err) {
    console.error(`[❌] Failed to fetch live BTC balance for ${address}:`, err.message);
    return 0;
  }
};

// Existing: Get BTC wallet summary
export const getBtcSummary = async (req, res) => {
  try {
  const { email } = req.user;
  console.log(`[📩] Fetching BTC data for ${email}`);
  console.log(
    `[🧠] Executing SQL: SELECT wallet_address, balance_btc, nickname FROM user_btc_wallets WHERE email = ?`
  );
  console.log(`[📦] With parameters: [${email}]`);

    const walletRows = await executeQuery(
      'SELECT wallet_address, balance_btc, nickname FROM user_btc_wallets WHERE email = ?',
      [email]
    );
    console.log(`[📬] Wallets found for ${email}:`, walletRows);

    let totalBtc = 0;
    const wallets = [];

    for (const wallet of walletRows) {
      console.log(`[👛] Wallet: ${wallet.wallet_address}, Stored Balance: ${wallet.balance_btc}, Nickname: ${wallet.nickname || 'None'}`);
      const liveBalance = await fetchLiveBtcBalance(wallet.wallet_address);
      console.log(`[🪙] Fetched live BTC balance for ${wallet.wallet_address}: ${liveBalance}`);

      const storedBalance = parseFloat(wallet.balance_btc);
      if (liveBalance !== storedBalance) {
        console.log(`[🔄] Updating DB balance for ${wallet.wallet_address}: ${storedBalance} -> ${liveBalance}`);
        await executeQuery(
          'UPDATE user_btc_wallets SET balance_btc = ? WHERE email = ? AND wallet_address = ?',
          [liveBalance, email, wallet.wallet_address]
        );
      }

      totalBtc += liveBalance;
      wallets.push({
        walletAddress: wallet.wallet_address,
        balanceBtc: liveBalance,
        nickname: wallet.nickname || null
      });
    }

    const coingeckoRes = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    );

    const currentPriceUsd = coingeckoRes.data.bitcoin.usd;
    const totalValueUsd = parseFloat((totalBtc * currentPriceUsd).toFixed(2));

    const walletDetails = wallets.map(wallet => ({
      walletAddress: wallet.walletAddress,
      balanceBtc: wallet.balanceBtc,
      nickname: wallet.nickname,
      currentPriceUsd,
      totalValueUsd: parseFloat((wallet.balanceBtc * currentPriceUsd).toFixed(2))
    }));

    return res.json({
      email,
      totalBtc,
      currentPriceUsd,
      totalValueUsd,
      wallets: walletDetails
    });
  } catch (err) {
    console.error('[❌] BTC fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch BTC data' });
  }
};

// Existing: Update wallet nickname
export const updateWalletNickname = async (req, res) => {
  const { walletAddress, nickname } = req.body;
  const { email } = req.user;

  if (!walletAddress || !nickname) {
    return res.status(400).json({ error: 'Wallet address and nickname are required' });
  }

  try {
    console.log(`[✏️] Updating nickname for wallet ${walletAddress} to ${nickname}`);
    const result = await executeQuery(
      'UPDATE user_btc_wallets SET nickname = ? WHERE email = ? AND wallet_address = ?',
      [nickname, email, walletAddress]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    console.log(`[✅] Nickname updated successfully for ${walletAddress}`);
    return res.json({ message: 'Nickname updated successfully' });
  } catch (err) {
    console.error('[❌] Nickname update error:', err.message);
    return res.status(500).json({ error: 'Failed to update nickname' });
  }
};

// New: Get Bitcoin treasury companies
export const getBitcoinTreasuries = async (req, res) => {
  try {
    console.log('[📊] Checking cached Bitcoin treasury companies');
    let cachedRows = [];
    try {
      cachedRows = await executeQuery(
        'SELECT company_name, country, btc_holdings, usd_value, entity_url, entity_type ' +
        'FROM bitcoin_treasuries WHERE last_updated > DATE_SUB(NOW(), INTERVAL 24 HOUR)'
      );
    } catch (err) {
      console.error('[❌] Failed to query cached Bitcoin treasury companies:', err.message);
    }

    if (cachedRows.length > 0) {
      console.log(`[📬] Returning ${cachedRows.length} cached public companies`);
      const publicCompanies = cachedRows
        .filter(row => row.entity_type === 'Public Company')
        .map(row => ({
          entityType: row.entity_type,
          companyName: row.company_name,
          country: row.country,
          btcHoldings: row.btc_holdings,
          usdValue: row.usd_value,
          entityUrl: row.entity_url || ''
        }));
      return res.json(publicCompanies);
    }

    console.log('[🌐] No recent cache or cache query failed, fetching from Bitcoin Treasuries');
    const response = await axios.get('https://bitcointreasuries.net/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; sgaInvest/1.0; +https://visionkraftconsulting.com)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    const $ = cheerio.load(response.data);
    const companies = [];

    $('table tr').each((index, element) => {
      if (index === 0) return; // Skip header
      const cells = $(element).find('td');
      if (cells.length >= 5) {
        const entityType = $(cells[0]).text().trim();
        const company = {
          entityType,
          companyName: $(cells[1]).text().trim(),
          country: $(cells[2]).text().trim(),
          btcHoldings: $(cells[3]).text().trim(),
          usdValue: $(cells[4]).text().trim(),
          entityUrl: $(cells[5]).find('a').attr('href') || ''
        };
        companies.push(company);

        // Cache the data
        if (entityType === 'Public Company') {
          executeQuery(
            'INSERT INTO bitcoin_treasuries (company_name, country, btc_holdings, usd_value, entity_url, entity_type) ' +
            'VALUES (?, ?, ?, ?, ?, ?)',
            [
              company.companyName,
              company.country,
              company.btcHoldings,
              company.usdValue,
              company.entityUrl,
              company.entityType
            ]
          ).catch(err => console.error(`[❌] Failed to cache ${company.companyName}:`, err.message));
        }
      }
    });

    const publicCompanies = companies.filter(c => c.entityType === 'Public Company');
    console.log(`[📬] Found ${publicCompanies.length} public companies holding Bitcoin`);
    return res.json(publicCompanies);
  } catch (err) {
    console.error('[❌] Bitcoin treasuries fetch error:', err.message);
    console.error('[🐛] Full error response:', err.response?.data || err);
    return res.status(500).json({ error: 'Failed to fetch Bitcoin treasury data' });
  }
};

// Alternative: Using CoinGecko API (uncomment to use instead)
// export const getBitcoinTreasuries = async (req, res) => {
//   try {
//     console.log('[📊] Fetching Bitcoin treasury companies from CoinGecko');
//     const response = await axios.get('https://api.coingecko.com/api/v3/companies/public_treasury/bitcoin');
//     const companies = response.data.companies.map(company => ({
//       entityType: 'Public Company',
//       companyName: company.name,
//       country: company.country, // Note: Uses country codes (e.g., "US")
//       btcHoldings: company.total_holdings.toLocaleString(),
//       usdValue: `$${(company.total_value_usd / 1e6).toFixed(2)}M`,
//       entityUrl: '' // CoinGecko doesn't provide URLs
//     }));

//     console.log(`[📬] Found ${companies.length} public companies holding Bitcoin`);
//     return res.json(companies);
//   } catch (err) {
//     console.error('[❌] Bitcoin treasuries fetch error:', err.message);
//     return res.status(500).json({ error: 'Failed to fetch Bitcoin treasury data' });
//   }
// };