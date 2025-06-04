import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';

dotenv.config({ path: '/home/bitnami/scripts/financial/investment-tracker/backend/.env' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function sanitizeTicker(ticker) {
  return ticker.replace(/[^A-Za-z0-9\.]/g, '').toUpperCase();
}

function getCAGR(assetType) {
  switch (assetType.toLowerCase()) {
    case 'stock':
      return 0.12;
    case 'bond':
      return 0.05;
    case 'crypto':
      return 0.2;
    default:
      return 0.1;
  }
}

function calculateGrowth(initialValue, cagr, years) {
  return initialValue * Math.pow(1 + cagr, years);
}

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  args.forEach(arg => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      result[match[1]] = match[2];
    }
  });
  return result;
}

async function main() {
  try {
    const args = parseArgs();

    let ticker = args.ticker ? sanitizeTicker(args.ticker) : null;
    if (!ticker) {
      const tickerInput = await prompt('Enter the ticker symbol: ');
      ticker = sanitizeTicker(tickerInput);
    }

    let assetType = args.type ? args.type.trim() : null;
    if (!assetType) {
      const assetTypeInput = await prompt('Enter asset type (stock, bond, crypto, etc.): ');
      assetType = assetTypeInput.trim();
    }

    let initialValue = args.price ? parseFloat(args.price) : NaN;
    while (isNaN(initialValue) || initialValue <= 0) {
      const initialValueInput = await prompt('Enter the initial investment value: ');
      initialValue = parseFloat(initialValueInput);
      if (isNaN(initialValue) || initialValue <= 0) {
        console.error('Invalid initial investment value.');
      }
    }

    let years = args.years ? parseInt(args.years, 10) : NaN;
    while (isNaN(years) || years <= 0) {
      const yearsInput = await prompt('Enter the number of years for growth estimate: ');
      years = parseInt(yearsInput, 10);
      if (isNaN(years) || years <= 0) {
        console.error('Invalid number of years.');
      }
    }

    const cagr = getCAGR(assetType);

    const tableName = `${ticker.toLowerCase()}_estimates`;
    let sqlContent = '';

    sqlContent += `-- Creating table to store ${ticker.toUpperCase()} price estimates\n`;
    sqlContent += `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n`;
    sqlContent += `  year INT PRIMARY KEY,\n`;
    sqlContent += `  conservative_usd DOUBLE\n`;
    sqlContent += `);\n\n`;

    sqlContent += `-- Inserting ${ticker.toUpperCase()} conservative price estimates for next ${years} years\n`;
    sqlContent += `INSERT INTO \`${tableName}\` (year, conservative_usd) VALUES\n`;

    const estimates = [];
    for (let year = 1; year <= years; year++) {
      const valueEstimate = calculateGrowth(initialValue, cagr, year);
      const comma = year < years ? ',' : ';';
      sqlContent += `  (${year}, ${valueEstimate.toFixed(2)})${comma}\n`;
      estimates.push({ year, conservative: valueEstimate });
    }

    const outputPath = new URL('../scripts/valueEstimate.sql', import.meta.url).pathname;
    fs.writeFileSync(outputPath, sqlContent, 'utf8');
    console.log(`Value estimate SQL script has been written to ${outputPath}`);

    // Display formatted console preview of the estimates
    console.log('\nPrice Estimates Preview:');
    console.log('Year | Conservative');
    console.log('--------------------');
    estimates.forEach(({ year, conservative }) => {
      console.log(`${year.toString().padEnd(4)} | ${conservative.toFixed(2).padStart(12)}`);
    });

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
}

main();
