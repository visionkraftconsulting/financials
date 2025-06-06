import { executeQuery } from '../utils/db.js';
import { sendEmail } from '../utils/email.js';

// POST /api/contact
// Public endpoint for submitting contact form messages
export const submitContact = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }
  try {
    const now = new Date();
    // Store contact as a ticket for record-keeping
    await executeQuery(
      'INSERT INTO tickets (email, subject, body, type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, subject || `Contact from ${name}`, message, 'contact', 'open', now, now]
    );
    // Notify admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: subject || `New contact from ${name}`,
        html: `<p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`,
      });
    } catch (err) {
      console.error('[contactController] Notification email failed:', err);
    }
    return res.status(201).json({ msg: 'Contact message submitted' });
  } catch (err) {
    console.error('[contactController] Error saving contact message:', err);
    return res.status(500).json({ msg: 'Server error submitting contact message' });
  }
};