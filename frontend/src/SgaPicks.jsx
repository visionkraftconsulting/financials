import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#2d3748',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  heading: { 
    fontSize: '1.75rem', 
    fontWeight: '700', 
    color: '#1a365d',
    margin: 0,
    lineHeight: '1.3',
  },
  lastUpdated: {
    fontSize: '0.9rem', 
    color: '#718096',
    fontStyle: 'italic',
    marginTop: '0.5rem',
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '1.25rem 1.5rem',
    backgroundColor: '#f7fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#2d3748',
    margin: 0,
  },
  pickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
    padding: '1.5rem',
  },
  pickCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.25rem',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    },
  },
  pickNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: '#ebf8ff',
    color: '#3182ce',
    borderRadius: '50%',
    fontWeight: '600',
    marginBottom: '0.75rem',
  },
  pickName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1a365d',
    marginBottom: '0.5rem',
  },
  pickMetaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.25rem',
    fontSize: '0.9rem',
  },
  metaLabel: {
    color: '#718096',
    fontWeight: '500',
  },
  metaValue: {
    color: '#2d3748',
    fontWeight: '600',
  },
  positiveChange: {
    color: '#38a169',
  },
  negativeChange: {
    color: '#e53e3e',
  },
  refreshButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '&:hover': {
      backgroundColor: '#3182ce',
    },
    '&:disabled': {
      backgroundColor: '#a0aec0',
      cursor: 'not-allowed',
    },
  },
};

function SgaPicks() {
  const { token } = useContext(AuthContext);
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  const loadStoredPicks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/crypto/sga-picks/enriched`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const stored = Array.isArray(res.data)
        ? res.data.map(p => ({
            ...p,
            name: p.coin_name,
            price: p.current_price,
            symbol: p.symbol?.toUpperCase(),
            change24h: p.price_change_percentage_24h?.toFixed(2) + '%',
          }))
        : [];
      setPicks(stored);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching stored picks:', err);
      setError('Failed to load picks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPicks = async () => {
    setRefreshing(true);
    try {
      await axios.get(`${API_BASE_URL}/api/crypto/sga-picks`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      await loadStoredPicks();
    } catch (err) {
      console.error('Error fetching new picks:', err);
      setError('Failed to refresh picks. Please check your connection.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStoredPicks();
  }, [token]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ 
            border: '4px solid rgba(66, 153, 225, 0.2)',
            borderTopColor: '#4299e1',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={styles.loadingText}>Loading premium picks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ 
          backgroundColor: '#fff5f5',
          padding: '2rem',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #fed7d7',
        }}>
          <div style={{ color: '#e53e3e', marginBottom: '1rem' }}>{error}</div>
          <button 
            style={styles.refreshButton}
            onClick={loadStoredPicks}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Current Picks</h1>
          <div style={styles.lastUpdated}>
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        </div>
        <button 
          style={styles.refreshButton}
          onClick={fetchPicks}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Picks'}
        </button>
      </div>

      <div style={styles.cardContainer}>
        {picks.length > 0 ? (
          <div style={styles.pickGrid}>
            {picks.map((pick, index) => (
              <div key={index} style={styles.pickCard}>
                <div style={styles.pickNumber}>{index + 1}</div>
                <div style={styles.pickName}>
                  {pick.name || pick.coin || `Pick ${index + 1}`}
                </div>
                
                {pick.symbol && (
                  <div style={styles.pickMetaItem}>
                    <span style={styles.metaLabel}>Symbol:</span>
                    <span style={styles.metaValue}>{pick.symbol}</span>
                  </div>
                )}
                
                {pick.price && (
                  <div style={styles.pickMetaItem}>
                    <span style={styles.metaLabel}>Price:</span>
                    <span style={styles.metaValue}>
                      ${typeof pick.price === 'number' ? pick.price.toFixed(2) : pick.price}
                    </span>
                  </div>
                )}
                
                {pick.change24h && (
                  <div style={styles.pickMetaItem}>
                    <span style={styles.metaLabel}>24h Change:</span>
                    <span style={{
                      ...styles.metaValue,
                      ...(String(pick.change24h).startsWith('-') 
                        ? styles.negativeChange 
                        : styles.positiveChange),
                    }}>
                      {pick.change24h}
                    </span>
                  </div>
                )}
                
                {pick.recommendation && (
                  <div style={{ 
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px dashed #e2e8f0',
                  }}>
                    <div style={{ 
                      fontSize: '0.8rem',
                      color: '#718096',
                      marginBottom: '0.25rem',
                    }}>
                      Recommendation:
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      {pick.recommendation}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '3rem',
            textAlign: 'center',
            color: '#718096',
          }}>
            No picks available at this time
          </div>
        )}
      </div>
    </div>
  );
}

export default SgaPicks;