import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';

export const SubscriptionContext = createContext();

const SubscriptionProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [subscription, setSubscription] = useState({ status: 'none' });
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      const { data } = await axios.get('/api/subscription/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscription(data);
    } catch (err) {
      console.error('Failed to fetch subscription status', err);
      setSubscription({ status: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchSubscription();
    } else {
      setSubscription({ status: 'none' });
      setLoading(false);
    }
  }, [token]);

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, fetchSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
export default SubscriptionProvider;