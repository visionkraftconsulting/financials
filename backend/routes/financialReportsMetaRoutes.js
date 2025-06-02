import express from 'express';
import { getFinancialReportsMeta } from '../controllers/financialReportsMetaController.js';

const router = express.Router();

router.get('/', getFinancialReportsMeta);

export default router;