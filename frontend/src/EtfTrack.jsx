import React, { useEffect, useState } from 'react';
import axios from 'axios';

const labels = {
  etfTitle: '📊 Top High-Yield Options Strategy ETFs (>20%)',
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
  retry: 'Retry',
  updateButton: '🧠 Run OpenAI Update',
};

const styles = {
  container: {
    padding: '1rem',
    maxWidth: '100%',
    margin: '0 auto',
    fontSize: 'clamp(14px, 3vw, 16px)',
  },
  heading: {
    fontSize: 'clamp(1.5rem, 5vw, 1.8rem)',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    marginBottom: '1.5rem',
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
  },
  th: {
    border: '1px solid #ddd',
    padding: 'clamp(6px, 1.5vw, 8px)',
    backgroundColor: '#f4f4f4',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  td: {
    border: '1px solid #ddd',
    padding: 'clamp(6px, 1.5vw, 8px)',
    wordBreak: 'break-word',
  },
  totalRow: {
    fontWeight: 'bold',
    backgroundColor: '#f9f9f9',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: '1rem',
    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: 'clamp(1rem, 3vw, 1.2rem)',
  },
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
    zIndex: 1000,
  },
  button: {
    marginBottom: '1rem',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    opacity: 1,
  },
  buttonDisabled: {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  retryButton: {
    backgroundColor: '#007bff',
    marginLeft: '1rem',
  },
};

function EtfTrack() {
  const [etfData, setEtfData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOpenAI, setUpdatingOpenAI] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  const loadFromDB = async () => {
    setIsLoading(true);
    try {
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
        <p style={styles.error}>
          {error}
          <button
            onClick={loadFromDB}
            style={{ ...styles.button, ...styles.retryButton }}
          >
            {labels.retry}
          </button>
        </p>
      </div>
    );
  }

  if (!etfData || etfData.length === 0) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>No ETF data available.</p>
      </div>
    );
  }

  const sortedEtfData = [...etfData].sort((a, b) => parseFloat(b.yield) - parseFloat(a.yield));

  const calculateAverage = (data, field) => {
    const validValues = data
      .map(item => parseFloat(item[field]))
      .filter(val => !isNaN(val));
    return validValues.length
      ? (validValues.reduce((sum, val) => sum + val, 0) / validValues.length).toFixed(2)
      : '-';
  };

  const averages = {
    price: calculateAverage(sortedEtfData, 'price'),
    yield: calculateAverage(sortedEtfData, 'yield'),
    dividendRate: calculateAverage(sortedEtfData, 'dividendRate'),
    dividendYield: calculateAverage(sortedEtfData, 'dividendYield'),
    expenseRatio: calculateAverage(sortedEtfData, 'expenseRatio'),
  };

  console.log('📊 Average price:', averages.price);
  console.log('📊 Average yield:', `${averages.yield}%`);
  console.log('📊 Average dividend rate:', averages.dividendRate);
  console.log('📊 Average dividend yield:', `${averages.dividendYield}%`);
  console.log('📊 Average expense ratio:', `${averages.expenseRatio}%`);

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>{labels.etfTitle}</h3>
      {showToast && (
        <div style={styles.toast}>{labels.updateSuccess}</div>
      )}
      <button
        onClick={runOpenAIUpdate}
        disabled={updatingOpenAI}
        style={{
          ...styles.button,
          ...(updatingOpenAI ? styles.buttonDisabled : {}),
        }}
      >
        {updatingOpenAI ? labels.updating : labels.updateButton}
      </button>
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{labels.ticker}</th>
              <th style={styles.th}>{labels.fundName}</th>
              <th style={styles.th}>{labels.price}</th>
              <th style={styles.th}>{labels.high52w}</th>
              <th style={styles.th}>{labels.low52w}</th>
              <th style={styles.th}>{labels.yield}</th>
              <th style={styles.th}>{labels.dividendRate}</th>
              <th style={styles.th}>{labels.dividendYield}</th>
              <th style={styles.th}>{labels.expenseRatio}</th>
              <th style={styles.th}>{labels.distributionFrequency}</th>
            </tr>
          </thead>
          <tbody>
            {sortedEtfData.map((etf, index) => (
              <tr key={index}>
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
