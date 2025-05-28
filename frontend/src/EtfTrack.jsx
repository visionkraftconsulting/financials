import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Translation-ready labels
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
};

// Inline CSS
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
  }
};

function EtfTrack() {
  const [etfData, setEtfData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOpenAI, setUpdatingOpenAI] = useState(false);

  // Base API URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  const loadFromDB = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/etf/high-yield-etfs`);
      console.log('✅ ETF data fetched:', res.data);
      setEtfData(res.data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching high-yield ETFs:', err);
      setError('Failed to load ETF data. Please try again later.');
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
    } catch (err) {
      console.error('❌ Error running OpenAI ETF update:', err);
      setError('Failed to trigger OpenAI update. Please try again.');
    } finally {
      setUpdatingOpenAI(false);
    }
  };

  useEffect(() => {
    loadFromDB();
  }, []);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  const sortedEtfData = [...etfData].sort((a, b) => parseFloat(b.yield) - parseFloat(a.yield));

  console.log('📊 Average price:', (sortedEtfData.reduce((sum, etf) => sum + parseFloat(etf.price) || 0, 0) / sortedEtfData.length).toFixed(2));
  console.log('📊 Average yield:', (sortedEtfData.reduce((sum, etf) => sum + (parseFloat(etf.yield) / 100) || 0, 0) / sortedEtfData.length).toFixed(2));
  console.log('📊 Average dividend yield:', (sortedEtfData.reduce((sum, etf) => sum + (parseFloat(etf.dividendYield) / 100) || 0, 0) / sortedEtfData.length).toFixed(2));
  console.log('📊 Average expense ratio:', (sortedEtfData.reduce((sum, etf) => sum + parseFloat(etf.expenseRatio) || 0, 0) / sortedEtfData.length).toFixed(2));

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>{labels.etfTitle}</h3>
      {error && <p style={styles.error}>{error}</p>}
      <button
        onClick={runOpenAIUpdate}
        disabled={updatingOpenAI}
        style={{
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: updatingOpenAI ? 'not-allowed' : 'pointer',
          opacity: updatingOpenAI ? 0.6 : 1,
        }}
      >
        {updatingOpenAI ? 'Updating...' : '🧠 Run OpenAI Update'}
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
            </tr>
          </thead>
          <tbody>
            {sortedEtfData.map((etf, index) => (
              <tr key={index}>
                <td style={styles.td}>{etf.ticker}</td>
                <td style={styles.td}>{etf.fundName}</td>
                <td style={styles.td}>{etf.price}</td>
                <td style={styles.td}>{etf.high52w}</td>
                <td style={styles.td}>{etf.low52w}</td>
                <td style={styles.td}>{(parseFloat(etf.yield) / 100).toFixed(2)}%</td>
                <td style={styles.td}>{etf.dividendRate ? `$${parseFloat(etf.dividendRate).toFixed(2)}` : '-'}</td>
                <td style={styles.td}>{(parseFloat(etf.dividendYield) / 100).toFixed(2)}%</td>
                <td style={styles.td}>{parseFloat(etf.expenseRatio).toFixed(2)}%</td>
              </tr>
            ))}
            <tr style={styles.totalRow}>
              <td style={styles.td}>Average</td>
              <td style={styles.td}></td>
              <td style={styles.td}>
                {(sortedEtfData.reduce((sum, etf) => sum + parseFloat(etf.price) || 0, 0) / sortedEtfData.length).toFixed(2)}
              </td>
              <td style={styles.td}></td>
              <td style={styles.td}></td>
              <td style={styles.td}>
                {(sortedEtfData.reduce((sum, etf) => sum + (parseFloat(etf.yield) / 100) || 0, 0) / sortedEtfData.length).toFixed(2)}%
              </td>
              <td style={styles.td}>
                {(sortedEtfData.reduce((sum, etf) => sum + (parseFloat(etf.dividendRate) || 0), 0) / sortedEtfData.length).toFixed(2)}
              </td>
              <td style={styles.td}>
                {(sortedEtfData.reduce((sum, etf) => sum + (parseFloat(etf.dividendYield) / 100) || 0, 0) / sortedEtfData.length).toFixed(2)}%
              </td>
              <td style={styles.td}>
                {(sortedEtfData.reduce((sum, etf) => sum + parseFloat(etf.expenseRatio) || 0, 0) / sortedEtfData.length).toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EtfTrack;
