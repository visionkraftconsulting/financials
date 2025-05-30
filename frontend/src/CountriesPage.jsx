import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';

const labels = {
  title: '🌍 Bitcoin Treasury Countries',
  country: 'Country',
  btcHoldings: 'BTC Amount',
  usdValue: 'USD Value (M)',
  total: 'Total',
  loading: 'Loading country data...',
  error: 'Failed to load country data',
  retry: 'Try Again',
  noData: 'No country data available',
  lastUpdated: 'Last Updated'
};

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  container: {
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  heading: {
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: 0
  },
  lastUpdated: {
    fontSize: '0.9rem',
    color: '#7f8c8d'
  },
  tableContainer: {
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    marginBottom: '2rem',
    backgroundColor: 'white'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.95rem'
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#495057',
    borderBottom: '2px solid #e9ecef',
    backgroundColor: '#f8f9fa',
    position: 'sticky',
    top: 0
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #e9ecef',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '3rem',
    flexDirection: 'column',
    gap: '1rem'
  },
  loadingText: {
    fontSize: '1.1rem',
    color: '#7f8c8d'
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    flexDirection: 'column',
    gap: '1rem',
    textAlign: 'center'
  },
  errorText: {
    color: '#e74c3c',
    fontSize: '1.1rem'
  },
  retryButton: {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  noDataContainer: {
    padding: '2rem',
    textAlign: 'center',
    color: '#7f8c8d'
  },
  totalRow: {
    backgroundColor: '#f1f8ff',
    fontWeight: '600'
  },
  footer: {
    marginTop: 'auto',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
  },
};

// Helpers to parse and format values
const parseBTC = (value) => parseFloat(value || 0) || 0;
const parseUSD = (value) => parseFloat(value || 0) || 0;

const formatUSD = (value) => {
  const numValue = parseUSD(value);
  if (numValue >= 1000) {
    return `$${(numValue / 1000).toFixed(1)}B`;
  }
  return `$${numValue.toFixed(1)}M`;
};

function CountriesPage() {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/btc/bitcoin-treasuries/countries`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error('Error fetching treasury countries:', err);
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingText}>{labels.loading}</div>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorText}>{error}</div>
          <button style={styles.retryButton} onClick={loadData}>
            {labels.retry}
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div style={styles.noDataContainer}>{labels.noData}</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.heading}>{labels.title}</h1>
          {lastUpdated && (
            <div style={styles.lastUpdated}>
              {labels.lastUpdated}: {lastUpdated}
            </div>
          )}
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{labels.country}</th>
                <th style={styles.th}>{labels.btcHoldings}</th>
                <th style={styles.th}>{labels.usdValue}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.country}>
                  <td style={styles.td}>{row.country}</td>
                  <td style={styles.td}>
                    {parseBTC(row.total_btc).toLocaleString()} BTC
                  </td>
                  <td style={styles.td}>{formatUSD(row.total_usd_m)}</td>
                </tr>
              ))}
              <tr style={styles.totalRow}>
                <td style={styles.td}>{labels.total}</td>
                <td style={styles.td}>
                  {data.reduce((sum, r) => sum + parseBTC(r.total_btc), 0).toLocaleString()}{' '}
                  BTC
                </td>
                <td style={styles.td}>
                  {formatUSD(
                    data.reduce((sum, r) => sum + parseUSD(r.total_usd_m), 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CountriesPage;