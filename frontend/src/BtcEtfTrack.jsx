import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';

const labels = {
  etfTitle: '📊 Bitcoin ETFs',
  entityType: 'Entity Type',
  companyName: 'Company Name',
  ticker: 'Ticker',
  exchange: 'Exchange',
  btcHoldings: 'BTC Holdings',
  usdValue: 'USD Value',
  dividendRate: 'Dividend Rate ($)',
  loading: 'Loading Bitcoin ETF data...',
  error: 'Failed to load Bitcoin ETF data.',
  retry: 'Retry'
};

const styles = {
  container: { padding: '1rem', maxWidth: '100%', margin: '0 auto', fontSize: 'clamp(14px, 3vw, 16px)' },
  heading: { fontSize: 'clamp(1.5rem, 5vw, 1.8rem)', marginBottom: '1rem', textAlign: 'center' },
  table: { borderCollapse: 'collapse', width: '100%', marginBottom: '1.5rem', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' },
  th: { border: '1px solid #ddd', padding: 'clamp(6px, 1.5vw, 8px)', backgroundColor: '#f4f4f4', textAlign: 'left', whiteSpace: 'nowrap' },
  td: { border: '1px solid #ddd', padding: 'clamp(6px, 1.5vw, 8px)', wordBreak: 'break-word' },
  error: { color: 'red', textAlign: 'center', marginBottom: '1rem', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' },
  loading: { textAlign: 'center', padding: '2rem', fontSize: 'clamp(1rem, 3vw, 1.2rem)' },
  retryButton: { marginLeft: '1rem', padding: '0.5rem 1rem', fontSize: '1rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

function BtcEtfTrack() {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  const loadFromDB = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/btc/bitcoin-treasuries/etfs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching Bitcoin ETFs:', err);
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadFromDB();
  }, [API_BASE_URL, token]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>{labels.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>
          {error}
          <button onClick={loadFromDB} style={styles.retryButton}>
            {labels.retry}
          </button>
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>No Bitcoin ETF data available.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>{labels.etfTitle}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{labels.entityType}</th>
              <th style={styles.th}>{labels.companyName}</th>
              <th style={styles.th}>{labels.ticker}</th>
              <th style={styles.th}>{labels.exchange}</th>
              <th style={styles.th}>{labels.btcHoldings}</th>
              <th style={styles.th}>{labels.usdValue}</th>
              <th style={styles.th}>{labels.dividendRate}</th>
              <th style={styles.th}>Source Link</th>
            </tr>
          </thead>
          <tbody>
            {data.map((etf, idx) => (
              <tr key={idx}>
                <td style={styles.td}>{etf.entityType}</td>
                <td style={styles.td}>{etf.companyName}</td>
                <td style={styles.td}>{etf.ticker || 'N/A'}</td>
                <td style={styles.td}>{etf.exchange || 'N/A'}</td>
                <td style={styles.td}>{etf.btcHoldings}</td>
                <td style={styles.td}>{etf.usdValue}</td>
                <td style={styles.td}>{etf.dividendRateDollars != null ? `$${etf.dividendRateDollars}` : 'N/A'}</td>
                <td style={styles.td}>
                  {etf.entityUrl ? (
                    <a href={etf.entityUrl} target="_blank" rel="noopener noreferrer">
                      Link
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BtcEtfTrack;