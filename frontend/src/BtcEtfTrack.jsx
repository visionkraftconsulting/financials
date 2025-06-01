import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';

const labels = {
  etfTitle: '📊 Bitcoin ETFs Tracker',
  companyName: 'Issuer',
  ticker: 'Ticker',
  exchange: 'Exchange',
  btcHoldings: 'BTC Holdings',
  usdValue: 'USD Value',
  dividendRate: 'Dividend Yield',
  loading: 'Loading ETF data...',
  error: 'Failed to load ETF data',
  retry: 'Try Again',
  source: 'Details',
  noData: 'No ETF data available',
  lastUpdated: 'Last Updated',
  totalAssets: 'Total Assets',
  scrape: '🔄 Scrape ETFs'
};

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
  },
  container: {
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  heading: {
    fontSize: 'clamp(1.5rem, 4vw, 1.75rem)',
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
    overflowX: 'auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    marginBottom: '2rem',
    width: '100%',
    maxWidth: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
    display: 'block',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    position: 'sticky',
    top: 0
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#495057',
    borderBottom: '2px solid #e9ecef',
    whiteSpace: 'nowrap',
    cursor: 'pointer'
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #e9ecef',
    verticalAlign: 'middle',
    width: '1%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordBreak: 'break-word',
  },
  tr: {
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  link: {
    color: '#3498db',
    textDecoration: 'none',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    '&:hover': {
      textDecoration: 'underline'
    }
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
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2980b9'
    }
  },
  noDataContainer: {
    padding: '2rem',
    textAlign: 'center',
    color: '#7f8c8d'
  },
  totalRow: {
    backgroundColor: '#2c3e50', // Dark background
    color: '#ecf0f1', // Light text for contrast
    fontWeight: '600'
  },
  positiveValue: {
    color: '#27ae60'
  },
  neutralValue: {
    color: '#7f8c8d'
  }
};

function BtcEtfTrack() {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortKey, setSortKey] = useState('btcHoldings');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isScraping, setIsScraping] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  const loadFromDB = async () => {
    setLoading(true);
    setError(null);
    try {
      // Only fetch required fields from backend
      // Backend endpoint should SELECT only:
      // company_name, country, btc_holdings, btc_holdings_usd, usd_value, entity_url, ticker, exchange, dividend_rate
      const res = await axios.get(`${API_BASE_URL}/api/btc/bitcoin-treasuries/etfs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[📥] Raw ETF data:', res.data);
      setData(res.data);
      console.log('[✅] ETF data loaded:', res.data);
      console.log('[📊] Total ETFs:', res.data.length);
      console.log('[🔍] Sample ETF:', res.data[0]);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error('Error fetching Bitcoin ETFs:', err);
      setError(labels.error);
      console.log('[❌] ETF load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadFromDB().then(() => {
        setSortKey('btcHoldings');
        setSortOrder('desc');
      });
    }
  }, [token]);

  const handleScrape = async () => {
    console.log('[🔄] Initiating ETF scrape');
    setIsScraping(true);
    try {
      await axios.post(`${API_BASE_URL}/api/btc/bitcoin-treasuries/manual-scrape`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[✅] Scrape complete. Reloading data.');
      await loadFromDB();
    } catch (err) {
      console.error('Error scraping ETFs:', err);
      setError('Failed to scrape ETF data');
      console.log('[❌] Scrape failed:', err);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedData = [...(data || [])].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    const valA = typeof aVal === 'string' ? parseFloat(aVal.replace(/[^0-9.]/g, '')) : parseFloat(aVal);
    const valB = typeof bVal === 'string' ? parseFloat(bVal.replace(/[^0-9.]/g, '')) : parseFloat(bVal);
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const formatValue = (value) => {
    if (!value) return 'N/A';
    if (typeof value === 'number') return value.toLocaleString();
    return value;
  };

  const calculateTotal = (field) => {
    if (!data) return 0;
    return data.reduce((sum, etf) => {
      const value = typeof etf[field] === 'string'
        ? parseFloat(etf[field]?.replace(/[^0-9.]/g, '')) || 0
        : parseFloat(etf[field]) || 0;
      return sum + value;
    }, 0);
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div style={styles.loadingText}>{labels.loading}</div>
            <div className="spinner"></div>
          </div>
        </div>
        <footer style={{ textAlign: 'center', padding: '1rem 0', color: '#95a5a6' }}>
          © {new Date().getFullYear()} Bitcoin Treasury Tracker
        </footer>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorContainer}>
            <div style={styles.errorText}>{error}</div>
            <button onClick={loadFromDB} style={styles.retryButton}>
              {labels.retry}
            </button>
          </div>
        </div>
        <footer style={{ textAlign: 'center', padding: '1rem 0', color: '#95a5a6' }}>
          © {new Date().getFullYear()} Bitcoin Treasury Tracker
        </footer>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.noDataContainer}>
            <div>{labels.noData}</div>
            <button onClick={loadFromDB} style={styles.retryButton}>
              {labels.retry}
            </button>
          </div>
        </div>
        <footer style={{ textAlign: 'center', padding: '1rem 0', color: '#95a5a6' }}>
          © {new Date().getFullYear()} Bitcoin Treasury Tracker
        </footer>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.heading}>{labels.etfTitle}</h2>
          <button onClick={handleScrape} style={styles.retryButton} disabled={loading || isScraping}>
            {isScraping ? 'Scraping...' : labels.scrape}
          </button>
          {lastUpdated && (
            <div style={styles.lastUpdated}>
              {labels.lastUpdated}: {lastUpdated}
            </div>
          )}
        </div>

        <div className="table-container" style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('companyName')}>{labels.companyName}</th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('ticker')}>{labels.ticker}</th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('exchange')}>{labels.exchange}</th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('btcHoldings')}>{labels.btcHoldings}</th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('usdValue')}>{labels.usdValue}</th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('dividendRateDollars')}>{labels.dividendRate}</th>
                <th style={styles.th}>{labels.source}</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((etf, idx) => (
                <tr key={idx} style={styles.tr}>
                  <td style={styles.td}>{etf.companyName}</td>
                  <td style={styles.td}>
                    <strong>{etf.ticker || 'N/A'}</strong>
                  </td>
                  <td style={styles.td}>{etf.exchange || 'N/A'}</td>
                  <td style={styles.td}>
                    <div style={{ color: '#f1c40f', fontWeight: 'bold' }}>
                      ₿{parseFloat(etf.btcHoldings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td style={styles.td}>{formatValue(etf.usdValue)}</td>
                  <td style={{ ...styles.td, ...(etf.dividendRateDollars ? styles.positiveValue : styles.neutralValue) }}>
                    {etf.dividendRateDollars != null ? `$${etf.dividendRateDollars}` : 'N/A'}
                  </td>
                  <td style={styles.td}>
                    {etf.entityUrl ? (
                      <a href={etf.entityUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
                        View
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    ) : (
                      <span style={styles.neutralValue}>N/A</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr style={styles.totalRow}>
                <td style={styles.td} colSpan="3">
                  <strong>{labels.totalAssets}</strong>
                </td>
                <td style={styles.td}>
                  <div style={{ color: '#f1c40f', fontWeight: 'bold' }}>
                    ₿{calculateTotal('btcHoldings').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td style={styles.td}>
                  <strong>${calculateTotal('usdValue').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </td>
                <td style={styles.td} colSpan="2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <footer style={{ textAlign: 'center', padding: '1rem 0', color: '#95a5a6' }}>
        © {new Date().getFullYear()} Bitcoin Treasury Tracker
      </footer>
    </div>
  );
}

export default BtcEtfTrack;