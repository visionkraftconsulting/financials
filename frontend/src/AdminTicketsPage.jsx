import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
import { Navigate } from 'react-router-dom';

/**
 * Admin dashboard page to view all support tickets.
 */
const AdminTicketsPage = () => {
  const { user, token } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get('/api/tickets', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTickets(res.data);
      } catch (err) {
        console.error('Failed to load tickets:', err);
      }
    };
    fetchTickets();
  }, [token]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'Admin' && user.role !== 'Super Admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container py-4">
      <h2>Support Tickets</h2>
      <div className="table-responsive">
        <table className="table table-dark table-striped table-bordered text-light">
          <thead className="thead-dark">
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Type</th>
              <th>Subject</th>
              <th>Body</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.email}</td>
                <td>{t.type}</td>
                <td>{t.subject}</td>
                <td>{t.body}</td>
                <td>{t.status}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTicketsPage;