import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Script logic to read CSVs from csvs folder and export Excel for user_investments/import ---
const csvFolder = path.join(__dirname, 'csvs');
const outputExcel = path.join(__dirname, 'user_investments_import.xlsx');

const excelHeaders = ['symbol', 'shares', 'invested_at', 'track_dividends', 'type', 'usd_invested'];
const defaultSymbol = 'AAPL';
const allRows = [];

function parseCsvToRows(filePath) {
  return new Promise((resolve) => {
    const rows = [];
    let skip = 2;
    let headers = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (skip > 0) {
          skip--;
          return;
        }

        if (headers.length === 0) {
          headers = Object.values(row);
          return;
        }

        const values = Object.values(row);
        const invested_at = values[0];
        const shares = parseFloat(values[1]);
        const usd_invested = parseFloat(values[5]?.replace(/[^0-9.-]/g, '') || '0');

        if (!isNaN(shares) && invested_at) {
          rows.push({
            symbol: defaultSymbol,
            shares,
            invested_at: new Date(invested_at).toISOString().split('T')[0],
            track_dividends: true,
            type: 'stock',
            usd_invested: usd_invested || 0,
          });
        }
      })
      .on('end', () => resolve(rows));
  });
}

async function generateExcelFromFolder() {
  const files = fs.readdirSync(csvFolder).filter(f => f.endsWith('.csv'));
  const outputExists = fs.existsSync(outputExcel);

  let existingData = [];
  let workbook, worksheet;

  if (outputExists) {
    workbook = xlsx.readFile(outputExcel);
    worksheet = workbook.Sheets['Investments'];
    if (worksheet) {
      existingData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    }
  } else {
    workbook = xlsx.utils.book_new();
  }

  for (const file of files) {
    const filePath = path.join(csvFolder, file);
    const rows = await parseCsvToRows(filePath);
    existingData.push(...rows);
  }

  const newSheet = xlsx.utils.json_to_sheet(existingData, { header: excelHeaders });

  // Remove old sheet if exists
  const sheetName = 'Investments';
  if (workbook.Sheets[sheetName]) {
    delete workbook.Sheets[sheetName];
    const idx = workbook.SheetNames.indexOf(sheetName);
    if (idx > -1) workbook.SheetNames.splice(idx, 1);
  }

  xlsx.utils.book_append_sheet(workbook, newSheet, sheetName);
  xlsx.writeFile(workbook, outputExcel);

  console.log(`✅ Updated Excel file created with parsed CSV data: ${outputExcel}`);
}

function generateEmptyTemplateXLSX() {
  const exampleRows = [
    {
      symbol: 'AAPL',
      shares: 10,
      invested_at: '2024-01-15',
      track_dividends: true,
      type: 'stock',
      usd_invested: 1500.00,
    },
    {
      symbol: 'MSFT',
      shares: 15,
      invested_at: '2024-02-20',
      track_dividends: false,
      type: 'etf',
      usd_invested: 2200.00,
    }
  ];

  const templatePath = path.join(__dirname, 'user_investments_template.xlsx');
  const worksheet = xlsx.utils.json_to_sheet(exampleRows, { header: excelHeaders });
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Template');
  xlsx.writeFile(workbook, templatePath);

  console.log(`📄 Template created: ${templatePath}`);
}

generateExcelFromFolder()
  .then(() => generateEmptyTemplateXLSX())
  .catch(console.error);