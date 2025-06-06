import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
import { Navigate } from 'react-router-dom';

const AdminSubscriptionsPage = () => {
  const { user } = useContext(AuthContext);
  const [subscriptions, setSubscriptions] = useState([]);
  const [editEmail, setEditEmail] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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

  const handlePrompt = async (email) => {
    try {
      await axios.post(`/api/admin/subscriptions/${encodeURIComponent(email)}/prompt`);
      fetchSubscriptions();
      alert(`Prompt email sent to ${email}`);
    } catch (err) {
      console.error('Prompt error:', err);
      alert('Failed to send subscription prompt');
    }
  };

  const handleSync = async (email) => {
    try {
      await axios.post(`/api/admin/subscriptions/${encodeURIComponent(email)}/sync`);
      fetchSubscriptions();
    } catch (err) {
      console.error('Sync error:', err);
      alert('Failed to sync subscription');
    }
  };
  
  const handleEditClick = (s) => {
    setEditEmail(s.email);
    setEditFormData({
      email: s.email,
      status: s.status || '',
      trial_end: s.trial_end ? new Date(s.trial_end).toISOString().slice(0,16) : '',
      current_period_end: s.current_period_end ? new Date(s.current_period_end).toISOString().slice(0,16) : '',
      stripe_customer_id: s.stripe_customer_id || '',
      stripe_subscription_id: s.stripe_subscription_id || '',
      created_at: s.created_at ? new Date(s.created_at).toISOString().slice(0,16) : '',
      updated_at: s.updated_at ? new Date(s.updated_at).toISOString().slice(0,16) : '',
    });
  };

  const handleCancelEdit = () => {
    setEditEmail(null);
    setEditFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSubscription = async (originalEmail) => {
    try {
      await axios.put(`/api/admin/subscriptions/${encodeURIComponent(originalEmail)}`, editFormData);
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.email === originalEmail
            ? {
                ...s,
                email: editFormData.email,
                status: editFormData.status,
                trial_end: editFormData.trial_end ? new Date(editFormData.trial_end).toISOString() : null,
                current_period_end: editFormData.current_period_end
                  ? new Date(editFormData.current_period_end).toISOString()
                  : null,
                stripe_customer_id: editFormData.stripe_customer_id,
                stripe_subscription_id: editFormData.stripe_subscription_id,
                created_at: editFormData.created_at ? new Date(editFormData.created_at).toISOString() : null,
                updated_at: editFormData.updated_at ? new Date(editFormData.updated_at).toISOString() : null,
              }
            : s
        )
      );
      handleCancelEdit();
    } catch (err) {
      console.error('Error updating subscription:', err);
      alert('Failed to update subscription: ' + (err.response?.data?.msg || err.message));
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
            <th>Customer ID</th>
            <th>Subscription ID</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.length === 0 ? (
            <tr>
            <td colSpan="9">No subscriptions found.</td>
            </tr>
          ) : (
            subscriptions.map((s) => (
              <tr key={s.email}>
                {editEmail === s.email ? (
                  <>
                    <td>
                      <input
                        name="email"
                        value={editFormData.email}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <input
                        name="status"
                        value={editFormData.status}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        name="trial_end"
                        value={editFormData.trial_end}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        name="current_period_end"
                        value={editFormData.current_period_end}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <input
                        name="stripe_customer_id"
                        value={editFormData.stripe_customer_id}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <input
                        name="stripe_subscription_id"
                        value={editFormData.stripe_subscription_id}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        name="created_at"
                        value={editFormData.created_at}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        name="updated_at"
                        value={editFormData.updated_at}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => handleSaveSubscription(s.email)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{s.email}</td>
                    <td>{s.status}</td>
                    <td>{s.trial_end ? new Date(s.trial_end).toLocaleString() : '-'}</td>
                    <td>
                      {s.current_period_end
                        ? new Date(s.current_period_end).toLocaleString()
                        : '-'}
                    </td>
                    <td>{s.stripe_customer_id}</td>
                    <td>{s.stripe_subscription_id}</td>
                    <td>
                      {s.created_at
                        ? new Date(s.created_at).toLocaleString()
                        : '-'}
                    </td>
                    <td>
                      {s.updated_at
                        ? new Date(s.updated_at).toLocaleString()
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
                      {s.status !== 'active' && s.status !== 'trialing' && (
                        <button
                          className="btn btn-success btn-sm ms-2"
                          onClick={() => handlePrompt(s.email)}
                        >
                          Prompt
                        </button>
                      )}
                      {s.stripe_customer_id && (
                        <button
                          className="btn btn-info btn-sm ms-2"
                          onClick={() => handleSync(s.email)}
                        >
                          Sync
                        </button>
                      )}
                      <button
                        className="btn btn-primary btn-sm ms-2"
                        onClick={() => handleEditClick(s)}
                      >
                        Edit
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminSubscriptionsPage;