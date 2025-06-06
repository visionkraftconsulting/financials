import Stripe from 'stripe';
import { executeQuery } from '../utils/db.js';
import { sendEmail } from '../utils/email.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

function isAdmin(user) {
  return user && (user.role === 'Admin' || user.role === 'Super Admin');
}

// GET /api/admin/subscriptions
// List all subscriptions (Admins and Super Admins)
export const getAllSubscriptions = async (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ msg: 'Forbidden: Admins only' });
  }
  try {
    const rows = await executeQuery('SELECT * FROM subscriptions');
    res.json(rows);
  } catch (err) {
    console.error('[❌] Error fetching subscriptions:', err);
    res.status(500).json({ msg: 'Server error fetching subscriptions' });
  }
};

// POST /api/admin/subscriptions/:email/cancel
// Cancel a user's subscription at period end (Admins and Super Admins)
export const adminCancelSubscription = async (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ msg: 'Forbidden: Admins only' });
  }
  const { email } = req.params;
  try {
    const rows = await executeQuery(
      'SELECT stripe_subscription_id FROM subscriptions WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }
    const subscription = await stripe.subscriptions.update(rows[0].stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    await executeQuery(
      'UPDATE subscriptions SET status = ? WHERE email = ?',
      [subscription.status, email]
    );
    res.json({ canceled: true });
  } catch (err) {
    console.error('[❌] Error canceling subscription:', err);
    res.status(500).json({ msg: 'Server error canceling subscription' });
  }
};

// POST /api/admin/subscriptions/:email/resume
// Resume a canceled subscription (Admins and Super Admins)
export const adminResumeSubscription = async (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ msg: 'Forbidden: Admins only' });
  }
  const { email } = req.params;
  try {
    const rows = await executeQuery(
      'SELECT stripe_subscription_id FROM subscriptions WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }
    const subscription = await stripe.subscriptions.update(rows[0].stripe_subscription_id, {
      cancel_at_period_end: false,
    });
    await executeQuery(
      'UPDATE subscriptions SET status = ? WHERE email = ?',
      [subscription.status, email]
    );
    res.json({ resumed: true });
  } catch (err) {
    console.error('[❌] Error resuming subscription:', err);
    res.status(500).json({ msg: 'Server error resuming subscription' });
  }
};

// POST /api/admin/subscriptions/:email/prompt
// Send a subscription prompt email to a user (Admins and Super Admins only)
export const adminPromptSubscription = async (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ msg: 'Forbidden: Admins only' });
  }
  const { email } = req.params;
  try {
    const rows = await executeQuery('SELECT email FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const promptUrl = `${process.env.FRONTEND_URL}/subscription`;
    await sendEmail({
      to: email,
      subject: 'Start your 7-day free trial',
      html: `<p>Hi there,</p>
<p>We noticed you haven’t started your free trial yet. Click <a href="${promptUrl}">here</a> to start your 7-day free trial and unlock all features!</p>`,
    });
    res.json({ prompted: true });
  } catch (err) {
    console.error('[❌] Error prompting subscription email:', err);
    res.status(500).json({ msg: 'Server error sending prompt email' });
  }
};