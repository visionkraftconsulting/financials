import Stripe from 'stripe';
import { executeQuery } from '../utils/db.js';
import { sendEmail } from '../utils/email.js';
import cron from 'node-cron';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export function isAdmin(user) {
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
      ['canceled', email]
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

// PUT /api/admin/subscriptions/:email
// Update a subscription record (Admins and Super Admins only)
export const updateSubscription = async (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ msg: 'Forbidden: Admins only' });
  }
  const originalEmail = req.params.email;
  const {
    email,
    status,
    trial_end,
    current_period_end,
    stripe_customer_id,
    stripe_subscription_id,
    created_at,
    updated_at,
  } = req.body;
  try {
    const fields = [];
    const values = [];
    if (email !== undefined) {
      fields.push('email = ?');
      values.push(email);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      values.push(status);
    }
    if (trial_end !== undefined) {
      fields.push('trial_end = ?');
      values.push(trial_end);
    }
    if (current_period_end !== undefined) {
      fields.push('current_period_end = ?');
      values.push(current_period_end);
    }
    if (stripe_customer_id !== undefined) {
      fields.push('stripe_customer_id = ?');
      values.push(stripe_customer_id);
    }
    if (stripe_subscription_id !== undefined) {
      fields.push('stripe_subscription_id = ?');
      values.push(stripe_subscription_id);
    }
    if (created_at !== undefined) {
      fields.push('created_at = ?');
      values.push(created_at);
    }
    if (updated_at !== undefined) {
      fields.push('updated_at = ?');
      values.push(updated_at);
    }
    if (fields.length === 0) {
      return res.status(400).json({ msg: 'At least one subscription field is required' });
    }
    values.push(originalEmail);
    const sql = `UPDATE subscriptions SET ${fields.join(', ')} WHERE email = ?`;
    await executeQuery(sql, values);
    // Return updated record
    const rows = await executeQuery('SELECT * FROM subscriptions WHERE email = ?', [
      email !== undefined ? email : originalEmail,
    ]);
    res.json(rows[0] || {});
  } catch (err) {
    console.error('[❌] Error updating subscription:', err);
    res.status(500).json({ msg: 'Server error updating subscription' });
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

// POST /api/admin/subscriptions/:email/sync
// Manually sync a single subscription's Stripe data (Admins and Super Admins only)
export const adminSyncSubscription = async (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ msg: 'Forbidden: Admins only' });
  }
  const { email } = req.params;
  try {
    const rows = await executeQuery(
      'SELECT stripe_customer_id FROM subscriptions WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }
    const customerId = rows[0].stripe_customer_id;
    if (!customerId) {
      return res.status(400).json({ msg: 'No stripe_customer_id for this subscription' });
    }
    const subsList = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
    const sub = subsList.data?.[0];
    if (!sub) {
      return res.status(404).json({ msg: 'No Stripe subscription found for this customer' });
    }
    const trialEndDate = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
    const periodEndDate = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
    await executeQuery(
      'UPDATE subscriptions SET stripe_subscription_id = ?, status = ?, trial_end = ?, current_period_end = ? WHERE email = ?',
      [sub.id, sub.status, trialEndDate, periodEndDate, email]
    );
    const updatedRows = await executeQuery('SELECT * FROM subscriptions WHERE email = ?', [email]);
    res.json(updatedRows[0] || {});
  } catch (err) {
    console.error('[❌] Error syncing subscription:', err);
    res.status(500).json({ msg: 'Server error syncing subscription' });
  }
};

// Scheduled sync of subscription data from Stripe (using stripe_customer_id)
// Updates stripe_subscription_id, status, trial_end, current_period_end for all subscriptions
cron.schedule('0 * * * *', async () => {
  console.log('[⏰] Running periodic subscription sync from Stripe...');
  try {
    const rows = await executeQuery('SELECT email, stripe_customer_id FROM subscriptions');
    for (const { email, stripe_customer_id: customerId } of rows) {
      if (!customerId) continue;
      const subs = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
      const sub = subs.data?.[0];
      if (!sub) continue;
      const trialEndDate = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
      const periodEndDate = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
      await executeQuery(
        `UPDATE subscriptions SET stripe_subscription_id = ?, status = ?, trial_end = ?, current_period_end = ? WHERE email = ?`,
        [sub.id, sub.status, trialEndDate, periodEndDate, email]
      );
    }
    console.log('[✅] Completed subscription sync');
  } catch (err) {
    console.error('[❌] Error running periodic subscription sync:', err);
  }
});