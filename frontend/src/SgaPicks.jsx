import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';

const styles = {
  container: {
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  heading: { fontSize: '1.75rem', fontWeight: '600', color: '#2c3e50', margin: 0 },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '3rem',
    flexDirection: 'column',
    gap: '1rem',
  },
  loadingText: { fontSize: '1.1rem', color: '#7f8c8d' },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    flexDirection: 'column',
    gap: '1rem',
    textAlign: 'center',
  },
  errorText: { color: '#e74c3c', fontSize: '1.1rem' },
  retryButton: {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  },
  list: { listStyleType: 'none', padding: 0 },
  listItem: { padding: '0.5rem 0', borderBottom: '1px solid #e9ecef' },
};

function SgaPicks() {
  const { token } = useContext(AuthContext);
  const [picks, setPicks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  const fetchPicks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/crypto/sga-picks`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setPicks(res.data);
    } catch (err) {
      console.error('Error fetching SGA Premium Picks:', err);
      setError('Failed to load SGA Premium Picks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPicks();
  }, [token]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingText}>Loading SGA Premium Picks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorText}>{error}</div>
          <button style={styles.retryButton} onClick={fetchPicks}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!picks || (Array.isArray(picks) && picks.length === 0)) {
    return (
      <div style={styles.container}>
        <div>No SGA Premium Picks available.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>SGA Premium Picks</h1>
      </div>
      <ul style={styles.list}>
        {Array.isArray(picks)
          ? picks.map((pick, idx) => (
              <li key={idx} style={styles.listItem}>
                {typeof pick === 'object' ? JSON.stringify(pick) : pick}
              </li>
            ))
          : JSON.stringify(picks)}
      </ul>
    </div>
  );
}

export default SgaPicks;