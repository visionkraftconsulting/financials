import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
// Utility function for word wrapping
const wrapText = (text, width = 30) => {
  if (!text || typeof text !== 'string') return text;
  return text.length > width ? text.match(new RegExp(`.{1,${width}}`, 'g')).join('\n') : text;
};

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
  missingFundName: '(No fund name)',
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
  updateSuccess: 'FMP update completed successfully!',
  updating: 'Updating with FMP...',
  retry: `${icons.retry} Retry`,
  updateButton: 'Fetch ETFs',
  allTitle: `${icons.etf} All ETFs`,
  earningsYieldTTM: 'Earnings Yield (TTM) (%)',
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
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
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
  const { token, user } = useContext(AuthContext);
  const isAdmin = user?.role === 'Super Admin';
  const [etfData, setEtfData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingFMP, setUpdatingFMP] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [activeTab, setActiveTab] = useState('all');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const API_BASE_URL =
    process.env.NODE_ENV === 'production'
      ? 'https://smartgrowthassets.com'
      : 'http://52.25.19.40:4005';

  const loadFromDB = async (force = false) => {
    setIsLoading(true);
    try {
      if (force) {
        await axios.post(`${API_BASE_URL}/api/etf/run-fmp`);
      }
      const res = await axios.get(`${API_BASE_URL}/api/etf/cached-high-yield-etfs`);
      // Guard clause: Ensure res.data is an array
      if (!Array.isArray(res.data)) {
        console.error('❌ Invalid response format for ETF data');
        setEtfData([]);
        return;
      }
      // Normalize API keys for frontend rendering, ensure all fields compatible
      setEtfData(
        res.data.map(item => ({
          ...item,
          yield: item.yield ?? item.yield_percent ?? null,
          high52w: item.high52w ?? item.high_52w ?? null,
          low52w: item.low52w ?? item.low_52w ?? null,
          dividendRate: item.dividendRate ?? item.dividend_rate ?? item.dividend_rate_dollars ?? null,
          dividendYield: item.dividendYield ?? item.dividend_yield ?? null,
          fundName: item.fundName ?? (item.fund_name && item.fund_name.trim() !== '' ? item.fund_name : item.ticker),
          earningsYieldTTM: item.earningsYieldTTM ?? item.earnings_yield_ttm ?? null,
        }))
      );
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching cached ETFs:', err);
      setError(labels.error);
    } finally {
      setIsLoading(false);
    }
  };

  const runFmpUpdate = async () => {
    setUpdatingFMP(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/etf/run-fmp`);
      console.log('🧠 FMP ETF update response:', res.data);
      await loadFromDB();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('❌ Error running FMP update:', err);
      setError('Failed to fetch ETF data from FMP. Please try again.');
    } finally {
      setUpdatingFMP(false);
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
      // Build formattedResults for console.table with word wrapping
      const formattedResults = etfData.map(etf => ({
        Ticker: etf.ticker,
        'Fund Name': etf.fundName && etf.fundName !== etf.ticker
          ? etf.fundName
          : labels.missingFundName + ` (${etf.ticker})`,
        'Price ($)': !isNaN(parseFloat(etf.price))
          ? `$${parseFloat(etf.price).toFixed(2)}`
          : '-',
        '52W High ($)': !isNaN(parseFloat(etf.high52w))
          ? `$${parseFloat(etf.high52w).toFixed(2)}`
          : '-',
        '52W Low ($)': !isNaN(parseFloat(etf.low52w))
          ? `$${parseFloat(etf.low52w).toFixed(2)}`
          : '-',
        'Yield (%)': !isNaN(parseFloat(etf.yield))
          ? `${parseFloat(etf.yield).toFixed(2)}%`
          : '-',
        'Dividend Rate ($)': !isNaN(parseFloat(etf.dividendRate))
          ? `$${parseFloat(etf.dividendRate).toFixed(2)}`
          : '-',
        'Dividend Yield (%)': !isNaN(parseFloat(etf.dividendYield))
          ? `${parseFloat(etf.dividendYield).toFixed(2)}%`
          : '-',
        'Earnings Yield (TTM) (%)': !isNaN(parseFloat(etf.earningsYieldTTM))
          ? `${parseFloat(etf.earningsYieldTTM).toFixed(2)}%`
          : '-',
        'Expense Ratio (%)': !isNaN(parseFloat(etf.expenseRatio))
          ? `${parseFloat(etf.expenseRatio).toFixed(2)}%`
          : '-',
        'Distribution Frequency': etf.distributionFrequency || 'Unknown',
      }));
      const formattedResultsWrapped = formattedResults.map(row => ({
        Ticker: wrapText(row.Ticker),
        'Fund Name': wrapText(row['Fund Name']),
        'Price ($)': row['Price ($)'],
        '52W High ($)': row['52W High ($)'],
        '52W Low ($)': row['52W Low ($)'],
        'Yield (%)': row['Yield (%)'],
        'Dividend Rate ($)': row['Dividend Rate ($)'],
        'Dividend Yield (%)': row['Dividend Yield (%)'],
        'Earnings Yield (TTM) (%)': row['Earnings Yield (TTM) (%)'],
        'Expense Ratio (%)': row['Expense Ratio (%)'],
        'Distribution Frequency': wrapText(row['Distribution Frequency'])
      }));
      console.table(formattedResultsWrapped);
    }
  }, [etfData]);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>{labels.loading}</div>
      </div>
    );
  }

  if (!etfData || etfData.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          No ETF data available.
          {isAdmin && (
          <button
            onClick={() => {
              setError(null);
              axios.post(`${API_BASE_URL}/api/etf/run-fmp`)
                .then(() => loadFromDB())
                .catch(err => {
                  console.error('❌ Retry fetch via FMP failed:', err);
                  setError(labels.error);
                });
            }}
            style={{ ...styles.button, ...styles.retryButton }}
          >
            {labels.retry}
          </button>
          )}
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
    earningsYieldTTM: calculateAverage(sortedData, 'earningsYieldTTM'),
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>
        {activeTab === 'high-yield' ? labels.etfTitle : labels.allTitle}
      </h3>
      <div className="tabs-container" style={styles.tabContainer}>
        <button
          className={`tab-button${activeTab === 'high-yield' ? ' active-tab-button' : ''}`}
          onClick={() => setActiveTab('high-yield')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'high-yield' ? styles.tabButtonActive : {}),
          }}
        >
          {labels.etfTitle}
        </button>
        <button
          className={`tab-button${activeTab === 'all' ? ' active-tab-button' : ''}`}
          onClick={() => setActiveTab('all')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'all' ? styles.tabButtonActive : {}),
          }}
        >
          {labels.allTitle}
        </button>
      </div>
      {error && (
        <div style={styles.error}>
          Failed to fetch ETF data from FMP. Please try again.
          {isAdmin && (
            <button
              onClick={() => {
                setError(null);
                axios.post(`${API_BASE_URL}/api/etf/run-fmp`)
                  .then(() => loadFromDB())
                  .catch(err => {
                    console.error('❌ Retry fetch via FMP failed:', err);
                    setError(labels.error);
                  });
              }}
              style={{ ...styles.button, ...styles.retryButton }}
            >
              {labels.retry}
            </button>
          )}
        </div>
      )}
      {showToast && <div style={styles.toast}>{labels.updateSuccess}</div>}
      {isAdmin && (
      <button
        onClick={runFmpUpdate}
        disabled={updatingFMP}
        style={styles.button}
      >
        {updatingFMP ? labels.updating : labels.updateButton}
      </button>
      )}
      {/* 
        If you want to use MUI DataGrid, here's how you would define the columns:
        const columns = [
          { field: 'ticker', headerName: 'Ticker', flex: 1 },
          { field: 'fundName', headerName: 'Fund Name', flex: 1 },
          { field: 'price', headerName: 'Price ($)', flex: 1 },
          { field: 'high52w', headerName: '52W High ($)', flex: 1 },
          { field: 'low52w', headerName: '52W Low ($)', flex: 1 },
          { field: 'yield', headerName: 'Yield (%)', flex: 1 },
          { field: 'dividendRate', headerName: 'Dividend Rate ($)', flex: 1 },
          { field: 'dividendYield', headerName: 'Dividend Yield (%)', flex: 1 },
          { field: 'earningsYieldTTM', headerName: 'Earnings Yield (TTM) (%)', flex: 1 },
          { field: 'expenseRatio', headerName: 'Expense Ratio (%)', flex: 1 },
          { field: 'distributionFrequency', headerName: 'Distribution Frequency', flex: 1 },
        ];
        Each column has flex: 1 and no width property, so the DataGrid will auto-size columns proportionally.
      */}
      <div className="table-container" style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: undefined }}>{labels.ticker}</th>
              <th style={{ ...styles.th, width: undefined }}>{labels.fundName}</th>
              <th style={{ ...styles.th, cursor: 'pointer', width: undefined }} onClick={() => handleSort('price')}>{labels.price}</th>
              <th style={{ ...styles.th, cursor: 'pointer', width: undefined }} onClick={() => handleSort('high52w')}>{labels.high52w}</th>
              <th style={{ ...styles.th, cursor: 'pointer', width: undefined }} onClick={() => handleSort('low52w')}>{labels.low52w}</th>
              <th style={{ ...styles.th, cursor: 'pointer', width: undefined }} onClick={() => handleSort('yield')}>{labels.yield}</th>
              <th style={{ ...styles.th, cursor: 'pointer', width: undefined }} onClick={() => handleSort('dividendRate')}>{labels.dividendRate}</th>
              <th style={{ ...styles.th, cursor: 'pointer', width: undefined }} onClick={() => handleSort('dividendYield')}>{labels.dividendYield}</th>
              <th style={{ ...styles.th, cursor: 'pointer', width: undefined }} onClick={() => handleSort('earningsYieldTTM')}>
                {labels.earningsYieldTTM}
              </th>
              <th style={{ ...styles.th, cursor: 'pointer', width: undefined }} onClick={() => handleSort('expenseRatio')}>{labels.expenseRatio}</th>
              <th style={{ ...styles.th, width: undefined }}>{labels.distributionFrequency}</th>
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
                  <th colSpan="11" style={{ ...styles.th, fontSize: '1.1rem', width: undefined }}>
                    {frequency}
                  </th>
                </tr>
                {groupEtfs.map((etf, index) => (
                  <tr key={`${groupIndex}-${index}`} style={styles.trHover}>
                    <td style={{ ...styles.td, width: undefined }}>{etf.ticker}</td>
                    <td style={{ ...styles.td, width: undefined }}>
                      {etf.fundName && etf.fundName !== etf.ticker
                        ? etf.fundName
                        : labels.missingFundName + ` (${etf.ticker})`}
                    </td>
                    <td style={{ ...styles.td, width: undefined }}>
                      {!isNaN(parseFloat(etf.price))
                        ? `$${parseFloat(etf.price).toFixed(2)}`
                        : '-'}
                    </td>
                    <td style={{ ...styles.td, width: undefined }}>
                      {!isNaN(parseFloat(etf.high52w))
                        ? `$${parseFloat(etf.high52w).toFixed(2)}`
                        : '-'}
                    </td>
                    <td style={{ ...styles.td, width: undefined }}>
                      {!isNaN(parseFloat(etf.low52w))
                        ? `$${parseFloat(etf.low52w).toFixed(2)}`
                        : '-'}
                    </td>
                    <td style={{ ...styles.td, width: undefined }}>
                      {!isNaN(parseFloat(etf.yield))
                        ? `${parseFloat(etf.yield).toFixed(2)}%`
                        : '-'}
                    </td>
                    <td style={{ ...styles.td, width: undefined }}>
                      {!isNaN(parseFloat(etf.dividendRate))
                        ? `$${parseFloat(etf.dividendRate).toFixed(2)}`
                        : '-'}
                    </td>
                    <td style={{ ...styles.td, width: undefined }}>
                      {!isNaN(parseFloat(etf.dividendYield))
                        ? `${parseFloat(etf.dividendYield).toFixed(2)}%`
                        : '-'}
                    </td>
                    <td style={{ ...styles.td, width: undefined }}>
                      {!isNaN(parseFloat(etf.earningsYieldTTM))
                        ? `${parseFloat(etf.earningsYieldTTM).toFixed(2)}%`
                        : '-'}
                    </td>
                    <td style={{ ...styles.td, width: undefined }}>
                      {!isNaN(parseFloat(etf.expenseRatio))
                        ? `${parseFloat(etf.expenseRatio).toFixed(2)}%`
                        : '-'}
                    </td>
                    <td style={{ ...styles.td, width: undefined }}>
                      {etf.distributionFrequency || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr style={styles.totalRow}>
              <td style={{ ...styles.td, width: undefined }}>Average</td>
              <td style={{ ...styles.td, width: undefined }}></td>
              <td style={{ ...styles.td, width: undefined }}>{averages.price !== '-' ? `$${averages.price}` : '-'}</td>
              <td style={{ ...styles.td, width: undefined }}></td>
              <td style={{ ...styles.td, width: undefined }}></td>
              <td style={{ ...styles.td, width: undefined }}>{averages.yield !== '-' ? `${averages.yield}%` : '-'}</td>
              <td style={{ ...styles.td, width: undefined }}>
                {averages.dividendRate !== '-' ? `$${averages.dividendRate}` : '-'}
              </td>
              <td style={{ ...styles.td, width: undefined }}>
                {averages.dividendYield !== '-' ? `${averages.dividendYield}%` : '-'}
              </td>
              <td style={{ ...styles.td, width: undefined }}>
                {averages.earningsYieldTTM !== '-' ? `${averages.earningsYieldTTM}%` : '-'}
              </td>
              <td style={{ ...styles.td, width: undefined }}>
                {averages.expenseRatio !== '-' ? `${averages.expenseRatio}%` : '-'}
              </td>
              <td style={{ ...styles.td, width: undefined }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EtfTrack;