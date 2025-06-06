import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSubscription } from './SubscriptionContext';

const SubscriptionRoute = () => {
  const { subscription, loading } = useSubscription();
  if (loading) return null;
  const status = subscription.status || 'none';
  if (status === 'active' || status === 'trialing') {
    return <Outlet />;
  }
  return <Navigate to="/subscription" replace />;
};

export default SubscriptionRoute;