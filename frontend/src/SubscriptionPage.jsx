import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { AuthContext } from './AuthProvider';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const SubscriptionPage = () => {
  const { user } = useContext(AuthContext);
  const [subscription, setSubscription] = useState({ status: 'none' });

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/subscription/status');
      setSubscription(res.data);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    }
  };

  useEffect(() => {
    if (user) fetchStatus();
  }, [user]);

  const handleSubscribe = async () => {
    try {
      const { data } = await axios.post('/api/subscription/create-checkout-session');
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err) {
      console.error('Subscription error:', err);
      alert('Failed to initiate subscription');
    }
  };

  const handleCancel = async () => {
    try {
      await axios.post('/api/subscription/cancel');
      fetchStatus();
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Failed to cancel subscription');
    }
  };

  if (!user) return null;

  return (
    <div className="container mt-4">
      <h2>Subscription</h2>
      <p>Status: {subscription.status}</p>
      {subscription.trial_end && (
        <p>Trial ends: {new Date(subscription.trial_end * 1000).toLocaleString()}</p>
      )}
      {subscription.current_period_end && (
        <p>
          Current period ends: {new Date(subscription.current_period_end * 1000).toLocaleString()}
        </p>
      )}
      {(subscription.status === 'none' || subscription.status === 'canceled') && (
        <button className="btn btn-primary" onClick={handleSubscribe}>
          Start 7-day Free Trial
        </button>
      )}
      {(subscription.status === 'active' || subscription.status === 'trialing') && (
        <button className="btn btn-warning" onClick={handleCancel}>
          Cancel Subscription
        </button>
      )}
    </div>
  );
};

export default SubscriptionPage;