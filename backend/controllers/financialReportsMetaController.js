import { executeQuery } from '../utils/db.js';

export const getFinancialReportsMeta = async (req, res) => {
  if (!req.user || req.user.role !== 'Super Admin') {
    return res.status(403).json({ msg: 'Forbidden: Super Admins only' });
  }
  try {
    const rows = await executeQuery('SELECT * FROM financial_reports_meta');
    return res.json(rows);
  } catch (err) {
    console.error('[❌] Error fetching financial_reports_meta:', err);
    return res.status(500).json({ msg: 'Server error fetching financial reports metadata.' });
  }
};