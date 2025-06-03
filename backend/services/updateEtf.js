// updateEtf.js (ESM-compliant version)
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '/home/bitnami/scripts/financial/investment-tracker/backend/.env' });


const etfTickers = [
  'ABNY', 'AIYY', 'AMDY', 'AMZY', 'APLY', 'BABO', 'BIGY', 'CHPY', 'CONY',
  'CRSH', 'CVNY', 'DIPS', 'DISO', 'FBY', 'FEAT', 'FIAT', 'FIVY', 'GDXY',
  'GOOY', 'GPTY', 'HOOY', 'IWMY', 'JEPI', 'JEPQ', 'JPMO', 'LFGY', 'MARO',
  'MRNY', 'MSFO', 'MSTY', 'NFLY', 'NVDY', 'OARK', 'PBP', 'PLTY', 'PUTW',
  'PYPY', 'QDTY', 'QQQY', 'QYLD', 'RDTY', 'RNTY', 'RYLD', 'SDTY', 'SMCY',
  'SNOY', 'SOXY', 'TSLY', 'TSMY', 'ULTY', 'USOY', 'WBIF', 'WBIY', 'WNTR',
  'XOMO', 'XYLD', 'XYZY', 'YBIT', 'YMAG', 'YMAX', 'YQQQ'
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchEtfData(ticker) {
  const url = `https://finance.yahoo.com/quote/${ticker}`;
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

    const result = await page.evaluate(() => {
      const extractText = (label) => {
        const span = [...document.querySelectorAll('td span')].find(el => el.textContent.includes(label));
        return span ? span.parentElement.nextElementSibling?.textContent.trim() : 'N/A';
      };
      return {
        dividend: extractText('Dividend & Yield'),
        yield: extractText('Yield'),
        exDate: extractText('Ex-Dividend Date')
      };
    });

    await browser.close();
    console.log(`✅ [${ticker}] Scraped successfully.`);
    console.log(`[${ticker}] Parsed data:`, result);
    return { ticker, ...result };
  } catch (error) {
    if (browser) await browser.close();
    console.error(`❌ Error fetching ${ticker}: ${error.message}`);
    return { ticker, dividend: 'N/A', yield: 'N/A', exDate: 'N/A' };
  }
}

(async () => {
  const results = [];

  for (const ticker of etfTickers) {
    const data = await fetchEtfData(ticker);
    results.push(data);
    await sleep(1000); // rate limit
  }

  console.table(results.map(({ ticker, dividend, yield: yld, exDate }) => ({
    Ticker: ticker,
    'Dividend/Share': dividend,
    Yield: yld,
    'Ex-Date': exDate
  })));
})();