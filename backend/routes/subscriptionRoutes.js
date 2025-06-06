import express from 'express';
import bodyParser from 'body-parser';
import {
  createCheckoutSession,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  handleStripeWebhook,
} from '../controllers/subscriptionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Stripe webhook endpoint (raw body required to verify signature)
router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Create a checkout session for trial subscription
router.post('/create-checkout-session', authenticate, createCheckoutSession);

// Get current user's subscription status
router.get('/status', authenticate, getSubscription);

// Cancel the current user's subscription at period end
router.post('/cancel', authenticate, cancelSubscription);
router.post('/reactivate', authenticate, reactivateSubscription);

export default router;