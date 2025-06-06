import Stripe from 'stripe';
import { executeQuery } from '../utils/db.js';
import { sendEmail } from '../utils/email.js';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
const PRICE_ID = process.env.STRIPE_PRICE_ID;
const FRONTEND_URL = process.env.FRONTEND_URL;

// POST /api/subscription/create-checkout-session
// Create a Stripe Checkout session for a 7-day trial subscription
export const createCheckoutSession = async (req, res) => {
  const email = req.user.email;
  let customerId;
  const rows = await executeQuery(
    'SELECT stripe_customer_id FROM subscriptions WHERE email = ?',
    [email]
  );
  if (rows.length > 0) {
    customerId = rows[0].stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({ email });
    customerId = customer.id;
    await executeQuery(
      'INSERT INTO subscriptions (email, stripe_customer_id, status) VALUES (?, ?, ?)',
      [email, customerId, 'created']
    );
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    success_url: `${FRONTEND_URL}/subscription?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/subscription?canceled=true`,
  });
  res.json({ sessionId: session.id, sessionUrl: session.url });
};

// GET /api/subscription/status
// Retrieve subscription status for the current user
export const getSubscription = async (req, res) => {
  const email = req.user.email;
  // Super Admin users are automatically treated as subscribed
  if (req.user.role === 'Super Admin') {
    return res.json({ status: 'active' });
  }
  const rows = await executeQuery(
    'SELECT stripe_subscription_id, stripe_customer_id FROM subscriptions WHERE email = ?',
    [email]
  );
  if (rows.length === 0) {
    return res.json({ status: 'none' });
  }
  let { stripe_subscription_id: subscriptionId, stripe_customer_id: customerId } = rows[0];
  // If we don't have a subscription ID but have a customer ID, fetch it from Stripe and update our record
  if (!subscriptionId && customerId) {
    const subsList = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
    const fetched = subsList.data?.[0];
    if (fetched) {
      subscriptionId = fetched.id;
      const trialEnd = fetched.trial_end ? new Date(fetched.trial_end * 1000) : null;
      const periodEnd = fetched.current_period_end ? new Date(fetched.current_period_end * 1000) : null;
      await executeQuery(
        'UPDATE subscriptions SET stripe_subscription_id = ?, status = ?, trial_end = ?, current_period_end = ? WHERE email = ?',
        [subscriptionId, fetched.status, trialEnd, periodEnd, email]
      );
    }
  }
  if (!subscriptionId) {
    return res.json({ status: 'none' });
  }
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
  const currentPeriodEndDate = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;
  let status = subscription.status === 'trialing' ? 'active' : subscription.status;
  if (subscription.cancel_at_period_end) status = 'canceled';
  await executeQuery(
    'UPDATE subscriptions SET status = ?, trial_end = ?, current_period_end = ? WHERE stripe_subscription_id = ?',
    [status, trialEndDate, currentPeriodEndDate, subscriptionId]
  );
  const response = { status };
  if (subscription.trial_end) response.trial_end = subscription.trial_end;
  if (subscription.current_period_end) response.current_period_end = subscription.current_period_end;
  res.json(response);
};

// POST /api/subscription/cancel
// Cancel the user's subscription at period end
export const cancelSubscription = async (req, res) => {
  const email = req.user.email;
  const rows = await executeQuery(
    'SELECT stripe_subscription_id FROM subscriptions WHERE email = ?',
    [email]
  );
  if (rows.length === 0) {
    return res.status(400).json({ msg: 'No subscription found' });
  }
  const subscription = await stripe.subscriptions.update(
    rows[0].stripe_subscription_id,
    { cancel_at_period_end: true }
  );
  await executeQuery(
    'UPDATE subscriptions SET status = ? WHERE email = ?',
    ['canceled', email]
  );
  res.json({ canceled: true });
};

export const reactivateSubscription = async (req, res) => {
  const email = req.user.email;
  const rows = await executeQuery(
    'SELECT stripe_subscription_id FROM subscriptions WHERE email = ?',
    [email]
  );
  if (rows.length === 0) {
    return res.status(400).json({ msg: 'No subscription found' });
  }
  await stripe.subscriptions.update(rows[0].stripe_subscription_id, {
    cancel_at_period_end: false,
  });
  await executeQuery(
    'UPDATE subscriptions SET status = ? WHERE email = ?',
    ['active', email]
  );
  res.json({ reactivated: true });
};

// POST /api/subscription/webhook
// Stripe webhook handler for managing subscription state and sending receipts
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const subscriptionId = session.subscription;
      const customerId = session.customer;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const status = subscription.status;
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
      const currentPeriodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null;
      await executeQuery(
        'UPDATE subscriptions SET stripe_subscription_id = ?, status = ?, trial_end = ?, current_period_end = ? WHERE stripe_customer_id = ?',
        [subscriptionId, status, trialEnd, currentPeriodEnd, customerId]
      );
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const rows = await executeQuery(
        'SELECT email FROM subscriptions WHERE stripe_customer_id = ?',
        [customerId]
      );
      if (rows.length > 0) {
        const userEmail = rows[0].email;
        const periodEnd =
          invoice.lines.data[0]?.period.end
            ? new Date(invoice.lines.data[0].period.end * 1000)
            : null;
        await executeQuery(
          'UPDATE subscriptions SET status = ?, current_period_end = ? WHERE stripe_customer_id = ?',
          ['active', periodEnd, customerId]
        );
        await sendEmail({
          to: userEmail,
          subject: 'Your subscription payment succeeded',
          html: `<p>Your subscription payment of $${(
            invoice.amount_paid / 100
          ).toFixed(2)} succeeded. <a href="${invoice.hosted_invoice_url}">View invoice</a></p>`,
        });
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const rows = await executeQuery(
        'SELECT email FROM subscriptions WHERE stripe_customer_id = ?',
        [customerId]
      );
      if (rows.length > 0) {
        const userEmail = rows[0].email;
        await sendEmail({
          to: userEmail,
          subject: 'Your subscription payment failed',
          html: `<p>Your subscription payment failed. Please update your payment details. <a href="${invoice.hosted_invoice_url}">View invoice</a></p>`,
        });
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscriptionObj = event.data.object;
      const subscriptionId = subscriptionObj.id;
      const customerId = subscriptionObj.customer;
      const status = subscriptionObj.status;
      const trialEnd = subscriptionObj.trial_end ? new Date(subscriptionObj.trial_end * 1000) : null;
      const currentPeriodEnd = subscriptionObj.current_period_end
        ? new Date(subscriptionObj.current_period_end * 1000)
        : null;
      await executeQuery(
        'UPDATE subscriptions SET stripe_subscription_id = ?, status = ?, trial_end = ?, current_period_end = ? WHERE stripe_customer_id = ?',
        [subscriptionId, status, trialEnd, currentPeriodEnd, customerId]
      );
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  res.json({ received: true });
};