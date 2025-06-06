import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { AuthContext } from './AuthProvider';
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

  // Sample previews of premium features to entice unsubscribed users
  const previews = [
    {
      title: 'High Yield ETFs',
      description:
        'Explore high-yield ETFs with dividend returns per share: JEPI ($0.54), JEPQ ($0.62), TSLY ($0.76), NVDY ($0.63), and MSTY ($2.37) — all utilizing options income or covered call strategies to maximize monthly yield.',
    },
    { title: 'Investments', description: 'Track and analyze your investments with detailed charts and history.' },
    { title: 'Wallets', description: 'Manage multiple crypto and fiat wallets in one place.' },
    { title: 'Portfolio', description: 'Get an overview of your entire portfolio with performance metrics.' },
    {
      title: 'Treasury',
      description:
        'Monitor treasury accounts and liquidity positions seamlessly — including how Bitcoin and other digital assets can be integrated into modern portfolio strategies.',
    },
    { title: 'ETFs', description: 'View and simulate ETF investments with real-time data — including support for Bitcoin ETFs such as BITO and IBIT for digital asset exposure.' },
    {
      title: 'Cryptos',
      description: 'Explore top cryptocurrencies with a focus on Bitcoin — track market trends, get real-time alerts, and simulate performance in your portfolio.',
    },
    { title: 'SgaPicks', description: 'Receive curated investment picks by SGA experts.' },
  ];


  const handleSubscribe = async () => {
    const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      alert('Stripe is not configured. Please contact the administrator.');
      return;
    }
    try {
      const stripe = await loadStripe(key);
      if (!stripe) {
        alert('Failed to initialize Stripe. Please contact the administrator.');
        return;
      }
      const { data } = await axios.post('/api/subscription/create-checkout-session');
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
        <>
          <button className="btn btn-primary" onClick={handleSubscribe}>
            Start 7-day Free Trial
          </button>
          <div className="mt-4">
            <h3>Preview Features</h3>
            <div className="row">
              {previews.map((item) => (
                <div className="col-md-4 mb-3" key={item.title}>
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">{item.title}</h5>
                      <p className="card-text">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
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