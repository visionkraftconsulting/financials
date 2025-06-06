import express from 'express';
import { createTicket, getAllTickets } from '../controllers/ticketController.js';

const router = express.Router();

// Public: create new ticket
router.post('/', createTicket);

// Admin: view all tickets
router.get('/', getAllTickets);

export default router;