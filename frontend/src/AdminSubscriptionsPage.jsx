import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
import { Navigate } from 'react-router-dom';

const AdminSubscriptionsPage = () => {
  const { user } = useContext(AuthContext);
  const [subscriptions, setSubscriptions] = useState([]);

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get('/api/admin/subscriptions');
      setSubscriptions(res.data);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'Super Admin' || user.role === 'Admin')) {
      fetchSubscriptions();
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'Super Admin' && user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  const handleCancel = async (email) => {
    try {
      await axios.post(`/api/admin/subscriptions/${encodeURIComponent(email)}/cancel`);
      fetchSubscriptions();
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Failed to cancel subscription');
    }
  };

  const handleResume = async (email) => {
    try {
      await axios.post(`/api/admin/subscriptions/${encodeURIComponent(email)}/resume`);
      fetchSubscriptions();
    } catch (err) {
      console.error('Resume error:', err);
      alert('Failed to resume subscription');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Manage Subscriptions</h2>
      <table className="table table-dark table-bordered text-light mt-3">
        <thead>
          <tr>
            <th>Email</th>
            <th>Status</th>
            <th>Trial End</th>
            <th>Current Period End</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.length === 0 ? (
            <tr>
              <td colSpan="5">No subscriptions found.</td>
            </tr>
          ) : (
            subscriptions.map((s) => (
              <tr key={s.email}>
                <td>{s.email}</td>
                <td>{s.status}</td>
                <td>{s.trial_end ? new Date(s.trial_end).toLocaleString() : '-'}</td>
                <td>
                  {s.current_period_end
                    ? new Date(s.current_period_end).toLocaleString()
                    : '-'}
                </td>
                <td>
                  {(s.status === 'active' || s.status === 'trialing') && (
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => handleCancel(s.email)}
                    >
                      Cancel
                    </button>
                  )}
                  {s.status === 'canceled' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleResume(s.email)}
                    >
                      Resume
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminSubscriptionsPage;