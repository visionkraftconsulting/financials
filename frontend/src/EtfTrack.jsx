import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Using plain objects for icons to avoid potential conflicts
const icons = {
  etf: '📊',
  brain: '🧠',
  retry: '🔄',
};

const labels = {
  etfTitle: `${icons.etf} High-Yield Options Strategy ETFs`,
  ticker: 'Ticker',
  fundName: 'Fund Name',
  yield: 'Yield (%)',
  expenseRatio: 'Expense Ratio (%)',
  price: 'Price ($)',
  high52w: '52W High ($)',
  low52w: '52W Low ($)',
  dividendRate: 'Dividend Rate ($)',
  dividendYield: 'Dividend Yield (%)',
  distributionFrequency: 'Distribution Frequency',
  loading: 'Loading ETFs...',
  error: 'Failed to load ETF data. Please try again.',
  updateSuccess: 'OpenAI update completed successfully!',
  updating: 'Updating with OpenAI...',
  retry: `${icons.retry} Retry`,
  updateButton: `${icons.brain} Run OpenAI Update`,
  allTitle: `${icons.etf} All ETFs`,
};

const styles = {
  container: {
    padding: '1rem',
    maxWidth: '1400px',
    margin: '0 auto',
    fontSize: 'clamp(14px, 2vw, 16px)',
  },
  heading: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#2c3e50',
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    marginBottom: '2rem',
    backgroundColor: 'white',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
  },
  th: {
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    fontWeight: '600',
    color: '#495057',
    borderBottom: '2px solid #e9ecef',
    position: 'sticky',
    top: 0,
    cursor: 'pointer',
  },
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid #e9ecef',
    wordBreak: 'break-word',
    width: '1%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  trHover: {
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  totalRow: {
    fontWeight: 'bold',
    backgroundColor: '#f1f8ff',
    color: '#1864ab',
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
    border: '1px solid #f5c6cb',
    marginBottom: '1rem',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6c757d',
  },
  toast: {
    position: 'fixed',
    top: '1.5rem',
    right: '1.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    color: 'white',
    backgroundColor: '#28a745',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: '500',
    backgroundColor: '#1864ab',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '1.5rem',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
    '&:hover': {
      backgroundColor: '#0d4b8c',
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  retryButton: {
    backgroundColor: '#007bff',
    marginLeft: '1rem',
    '&:hover': {
      backgroundColor: '#0056b3',
    },
  },
  tabContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid #dee2e6',
  },
  tabButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.95rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    color: '#495057',
    transition: 'all 0.2s ease',
  },
  tabButtonActive: {
    color: '#1864ab',
    borderBottomColor: '#1864ab',
  },
};

function EtfTrack() {
  const [etfData, setEtfData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOpenAI, setUpdatingOpenAI] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [activeTab, setActiveTab] = useState('high-yield');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  const loadFromDB = async (force = false) => {
    setIsLoading(true);
    try {
      if (force) {
        await axios.post(`${API_BASE_URL}/api/etf/run-openai`);
      }
      const res = await axios.get(`${API_BASE_URL}/api/etf/high-yield-etfs`);
      console.log('✅ Cached ETF data fetched:', res.data);
      if (res.data.length > 0) {
        const missingFields = res.data.filter(
          etf => !etf.ticker || !etf.distributionFrequency || !etf.dividendRate
        );
        if (missingFields.length > 0) {
          console.warn('[⚠️] ETFs with missing fields:', missingFields.map(etf => ({
            ticker: etf.ticker,
            missing: [
              !etf.ticker ? 'ticker' : null,
              !etf.distributionFrequency ? 'distributionFrequency' : null,
              !etf.dividendRate ? 'dividendRate' : null,
            ].filter(Boolean),
          })));
        }
      }
      setEtfData(res.data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching cached ETFs:', err);
      setError(labels.error);
    } finally {
      setIsLoading(false);
    }
  };

  const runOpenAIUpdate = async () => {
    setUpdatingOpenAI(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/etf/run-openai`);
      console.log('🧠 OpenAI ETF update response:', res.data);
      await loadFromDB();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('❌ Error running OpenAI update:', err);
      setError('Failed to trigger OpenAI update. Please try again.');
    } finally {
      setUpdatingOpenAI(false);
    }
  };

  useEffect(() => {
    loadFromDB();
  }, []);

  useEffect(() => {
    if (etfData) {
      console.log('📊 ETF data shape:', {
        count: etfData.length,
        fields: Object.keys(etfData[0] || {}),
        sample: etfData[0],
      });
    }
  }, [etfData]);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>{labels.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          {error}
          <button
            onClick={() => {
              setError(null);
              axios.post(`${API_BASE_URL}/api/etf/run-openai`)
                .then(() => loadFromDB())
                .catch(err => {
                  console.error('❌ Retry fetch via OpenAI failed:', err);
                  setError(labels.error);
                });
            }}
            style={{ ...styles.button, ...styles.retryButton }}
          >
            {labels.retry}
          </button>
        </div>
      </div>
    );
  }

  if (!etfData || etfData.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          No ETF data available.
          <button
            onClick={() => {
              setError(null);
              axios.post(`${API_BASE_URL}/api/etf/run-openai`)
                .then(() => loadFromDB())
                .catch(err => {
                  console.error('❌ Retry fetch via OpenAI failed:', err);
                  setError(labels.error);
                });
            }}
            style={{ ...styles.button, ...styles.retryButton }}
          >
            {labels.retry}
          </button>
        </div>
      </div>
    );
  }

  const filteredData = activeTab === 'high-yield'
    ? etfData.filter(etf => parseFloat(etf.dividendYield) >= 20)
    : etfData;

  const sortedData = [...filteredData].sort((a, b) => {
    const getValue = (obj, key) => {
      const val = parseFloat(obj[key]);
      return isNaN(val) ? 0 : val;
    };
    if (!sortKey) {
      return getValue(b, 'dividendYield') - getValue(a, 'dividendYield');
    }
    const aVal = getValue(a, sortKey);
    const bVal = getValue(b, sortKey);
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const calculateAverage = (data, field) => {
    const validValues = data
      .map(item => parseFloat(item[field]))
      .filter(val => !isNaN(val));
    return validValues.length
      ? (validValues.reduce((sum, val) => sum + val, 0) / validValues.length).toFixed(2)
      : '-';
  };

  const averages = {
    price: calculateAverage(sortedData, 'price'),
    yield: calculateAverage(sortedData, 'yield'),
    dividendRate: calculateAverage(sortedData, 'dividendRate'),
    dividendYield: calculateAverage(sortedData, 'dividendYield'),
    expenseRatio: calculateAverage(sortedData, 'expenseRatio'),
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>
        {activeTab === 'high-yield' ? labels.etfTitle : labels.allTitle}
      </h3>
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('high-yield')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'high-yield' ? styles.tabButtonActive : {}),
          }}
        >
          {labels.etfTitle}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'all' ? styles.tabButtonActive : {}),
          }}
        >
          {labels.allTitle}
        </button>
      </div>
      {showToast && <div style={styles.toast}>{labels.updateSuccess}</div>}
      <button
        onClick={runOpenAIUpdate}
        disabled={updatingOpenAI}
        style={styles.button}
      >
        {updatingOpenAI ? labels.updating : labels.updateButton}
      </button>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{labels.ticker}</th>
              <th style={styles.th}>{labels.fundName}</th>
              <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('price')}>{labels.price}</th>
              <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('high52w')}>{labels.high52w}</th>
              <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('low52w')}>{labels.low52w}</th>
              <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('yield')}>{labels.yield}</th>
              <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('dividendRate')}>{labels.dividendRate}</th>
              <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('dividendYield')}>{labels.dividendYield}</th>
              <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('expenseRatio')}>{labels.expenseRatio}</th>
              <th style={styles.th}>{labels.distributionFrequency}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(
              sortedData.reduce((groups, etf) => {
                const freq = etf.distributionFrequency || 'Unknown';
                if (!groups[freq]) groups[freq] = [];
                groups[freq].push(etf);
                return groups;
              }, {})
            ).map(([frequency, groupEtfs], groupIndex) => (
              <React.Fragment key={groupIndex}>
                <tr>
                  <td colSpan="10" style={{ ...styles.th, backgroundColor: '#e9ecef', fontSize: '1.1rem' }}>
                    {frequency}
                  </td>
                </tr>
                {groupEtfs.map((etf, index) => (
                  <tr key={`${groupIndex}-${index}`} style={styles.trHover}>
                    <td style={styles.td}>{etf.ticker}</td>
                    <td style={styles.td}>{etf.fundName}</td>
                    <td style={styles.td}>
                      {etf.price ? `$${parseFloat(etf.price).toFixed(2)}` : '-'}
                    </td>
                    <td style={styles.td}>
                      {etf.high52w ? `$${parseFloat(etf.high52w).toFixed(2)}` : '-'}
                    </td>
                    <td style={styles.td}>
                      {etf.low52w ? `$${parseFloat(etf.low52w).toFixed(2)}` : '-'}
                    </td>
                    <td style={styles.td}>
                      {etf.yield ? `${parseFloat(etf.yield).toFixed(2)}%` : '-'}
                    </td>
                    <td style={styles.td}>
                      {etf.dividendRate ? `$${parseFloat(etf.dividendRate).toFixed(2)}` : etf.dividendRateDollar ? `$${parseFloat(etf.dividendRateDollar).toFixed(2)}` : '-'}
                    </td>
                    <td style={styles.td}>
                      {etf.dividendYield ? `${parseFloat(etf.dividendYield).toFixed(2)}%` : '-'}
                    </td>
                    <td style={styles.td}>
                      {etf.expenseRatio ? `${parseFloat(etf.expenseRatio).toFixed(2)}%` : '-'}
                    </td>
                    <td style={styles.td}>
                      {etf.distributionFrequency || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr style={styles.totalRow}>
              <td style={styles.td}>Average</td>
              <td style={styles.td}></td>
              <td style={styles.td}>{averages.price !== '-' ? `$${averages.price}` : '-'}</td>
              <td style={styles.td}></td>
              <td style={styles.td}></td>
              <td style={styles.td}>{averages.yield !== '-' ? `${averages.yield}%` : '-'}</td>
              <td style={styles.td}>
                {averages.dividendRate !== '-' ? `$${averages.dividendRate}` : '-'}
              </td>
              <td style={styles.td}>
                {averages.dividendYield !== '-' ? `${averages.dividendYield}%` : '-'}
              </td>
              <td style={styles.td}>
                {averages.expenseRatio !== '-' ? `${averages.expenseRatio}%` : '-'}
              </td>
              <td style={styles.td}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EtfTrack;