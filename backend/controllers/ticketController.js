import { executeQuery } from '../utils/db.js';
import { sendEmail } from '../utils/email.js';
import { isAdmin } from './adminSubscriptionController.js';

// POST /api/tickets
// Create a new support ticket (authenticated users)
export const createTicket = async (req, res) => {
  const { subject, body, type } = req.body;
  const email = req.user.email;
  if (!subject || !body) {
    return res.status(400).json({ msg: 'Missing subject or body' });
  }
  try {
    const now = new Date();
    await executeQuery(
      'INSERT INTO tickets (email, subject, body, type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, subject, body, type || 'general', 'open', now, now]
    );
    // Notify admins of new ticket (non-blocking)
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New ticket from ${email}: ${subject}`,
        html: `<p><strong>Type:</strong> ${type || 'general'}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Subject:</strong> ${subject}</p>
               <p><strong>Body:</strong><br/>${body.replace(/\n/g, '<br/>')}</p>`,
      });
    } catch (emailErr) {
      console.error('[ticketController] Notification email failed:', emailErr);
    }
    return res.status(201).json({ msg: 'Ticket created' });
  } catch (err) {
    console.error('[ticketController] Error creating ticket:', err);
    return res.status(500).json({ msg: 'Server error creating ticket' });
  }
};

// GET /api/tickets
// List all tickets (Admins and Super Admins only)
export const getAllTickets = async (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ msg: 'Forbidden: Admins only' });
  }
  try {
    const rows = await executeQuery('SELECT * FROM tickets ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    console.error('[ticketController] Error fetching tickets:', err);
    return res.status(500).json({ msg: 'Server error fetching tickets' });
  }
};