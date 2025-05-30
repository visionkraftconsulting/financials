import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
import BtcEtfTrack from './BtcEtfTrack';
import { FaExternalLinkAlt, FaSync, FaGlobeAmericas, FaBuilding, FaChartLine } from 'react-icons/fa';
import { GiTwoCoins } from 'react-icons/gi';
import CountriesPage from './CountriesPage';

// Enhanced labels with icons
const labels = {
  companyName: 'Company Name',
  btcTreasuriesTitle: '₿ Bitcoin Treasury Holdings',
  country: 'Country',
  btcHoldings: 'BTC Amount',
  usdValue: 'USD Value',
  dividendRate: 'Dividends',
  ticker: 'Stock Symbol',
  exchange: 'Stock Exchange',
  entityUrl: 'Source',
  lastVerified: 'Last Verified',
  total: 'Total',
  manualScrape: 'Refresh Data',
  companiesTab: 'Companies',
  countriesTab: 'Countries',
  etfsTab: 'ETFs',
};

// Modern, responsive CSS with better spacing and colors
const styles = {
  container: {
    padding: '1.5rem',
    maxWidth: '1400px',
    margin: '0 auto',
    fontSize: 'clamp(14px, 2vw, 16px)',
    color: '#333',
  },
  heading: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#2c3e50',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
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
    wordBreak: 'normal',
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
    margin: '1rem 0',
    padding: '1rem',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
    border: '1px solid #f5c6cb',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6c757d',
  },
  notification: {
    position: 'fixed',
    top: '1.5rem',
    right: '1.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    color: 'white',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    animation: 'slideIn 0.3s ease-out',
  },
  notificationSuccess: {
    backgroundColor: '#28a745',
  },
  notificationError: {
    backgroundColor: '#dc3545',
  },
  tabContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem',
    borderBottom: '1px solid #dee2e6',
  },
  tabButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: '500',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#495057',
    transition: 'all 0.2s ease',
  },
  tabButtonActive: {
    color: '#1864ab',
    borderBottomColor: '#1864ab',
  },
  actionButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: '500',
    backgroundColor: '#1864ab',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    margin: '0 auto 1.5rem',
    '&:hover': {
      backgroundColor: '#0d4b8c',
    },
  },
  groupHeader: {
    backgroundColor: '#f1f8ff',
    padding: '0.75rem 1.5rem',
    margin: '1.5rem 0 0.5rem',
    borderRadius: '6px',
    fontWeight: '600',
    color: '#1864ab',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  link: {
    color: '#1864ab',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  valuePositive: {
    color: '#28a745',
  },
  valueNegative: {
    color: '#dc3545',
  },
};

// Helper to parse BTC and USD values
const parseBTC = (value) => parseFloat(value?.replace(/[^0-9.]/g, '') || 0) || 0;
const parseUSD = (value) => {
  if (value == null) return 0;
  return parseFloat(String(value).replace(/[^0-9.]/g, '') || 0) || 0;
};

function TreasuryPage() {
  const { token } = useContext(AuthContext);
  const [treasuryData, setTreasuryData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('companies');
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // Sorting state for companies table
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  // Deduplicate and prepare data
  const processTreasuryData = useCallback((data) => {
    const uniqueByName = new Map();
    data.forEach((item) => {
      if (item.companyName && item.btcHoldings && !isNaN(parseBTC(item.btcHoldings))) {
        uniqueByName.set(item.companyName, item);
      }
    });
    return Array.from(uniqueByName.values());
  }, []);

  // Fetch treasury data
  useEffect(() => {
    if (!token) {
      setError('Please log in to view Bitcoin treasury data');
      return;
    }

    const fetchTreasuryData = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/btc/bitcoin-treasuries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const deduped = processTreasuryData(res.data);
        setTreasuryData(deduped);
        setError(null);
      } catch (err) {
        console.error('Bitcoin treasuries fetch error:', err.message);
        setError('Failed to load Bitcoin treasury data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTreasuryData();
  }, [API_BASE_URL, token, processTreasuryData]);


  // Handle manual scrape
  const handleManualScrape = async () => {
    if (!token) {
      setNotification({ message: 'Unauthorized: Please log in to run manual scrape', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    try {
      setIsLoading(true);
      const res = await axios.post(
        `${API_BASE_URL}/api/btc/bitcoin-treasuries/manual-scrape`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotification({ message: `Data refresh completed: ${res.data.message}`, type: 'success' });
      // Refresh treasury data
      const refreshRes = await axios.get(`${API_BASE_URL}/api/btc/bitcoin-treasuries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const deduped = processTreasuryData(refreshRes.data);
      setTreasuryData(deduped);
    } catch (err) {
      console.error('Manual scrape error:', err.message);
      setNotification({ message: 'Failed to refresh data', type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Group companies by BTC holdings
  const getBtcHoldingsGroup = (company) => {
    const btc = parseBTC(company.btcHoldings);
    if (btc >= 10000) return '🐳 Whale (≥ 10,000 BTC)';
    if (btc >= 1000) return '🐋 Large Holder (1,000–9,999 BTC)';
    if (btc >= 100) return '🐬 Mid-Size (100–999 BTC)';
    if (btc >= 10) return '🦐 Small Holder (10–99 BTC)';
    return '🧬 Minimal (< 10 BTC)';
  };

  // Group and sort companies
  const groupedCompanies = treasuryData
    ? (() => {
        const groups = treasuryData.reduce((acc, company) => {
          const group = getBtcHoldingsGroup(company);
          acc[group] = acc[group] || [];
          acc[group].push(company);
          return acc;
        }, {});
        return Object.entries(groups).sort(([, aCompanies], [, bCompanies]) => {
          const totalA = aCompanies.reduce((sum, c) => sum + parseBTC(c.btcHoldings), 0);
          const totalB = bCompanies.reduce((sum, c) => sum + parseBTC(c.btcHoldings), 0);
          return totalB - totalA;
        });
      })()
    : [];

  // Sort handler for companies table columns
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Format USD value with proper scaling
  const formatUSD = (value) => {
    const numValue = parseUSD(value);
    if (numValue >= 1000) {
      return `$${(numValue / 1000).toFixed(1)}B`;
    }
    return `$${numValue.toFixed(1)}M`;
  };

  return (
    <div style={styles.container}>
      {notification && (
        <div
          style={{
            ...styles.notification,
            ...(notification.type === 'success' ? styles.notificationSuccess : styles.notificationError),
          }}
        >
          {notification.type === 'success' ? '✓' : '⚠'} {notification.message}
        </div>
      )}
      
      <h3 style={styles.heading}>
        <GiTwoCoins /> {labels.btcTreasuriesTitle}
      </h3>
      
      <div style={styles.tabContainer}>
        <button
          onClick={() => setSelectedTab('companies')}
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'companies' ? styles.tabButtonActive : {}),
          }}
        >
          <FaBuilding /> {labels.companiesTab}
        </button>
        <button
          onClick={() => setSelectedTab('countries')}
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'countries' ? styles.tabButtonActive : {}),
          }}
        >
          <FaGlobeAmericas /> {labels.countriesTab}
        </button>
        <button
          onClick={() => setSelectedTab('etfs')}
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'etfs' ? styles.tabButtonActive : {}),
          }}
        >
          <FaChartLine /> {labels.etfsTab}
        </button>
      </div>

      {selectedTab === 'companies' && (
        <>
          {error && <div style={styles.error}>{error}</div>}
          {isLoading && !treasuryData && <div style={styles.loading}>Loading company data...</div>}
          
          {treasuryData && (
            <>
              <button 
                onClick={handleManualScrape} 
                style={styles.actionButton}
                disabled={isLoading}
              >
                <FaSync /> {isLoading ? 'Refreshing...' : labels.manualScrape}
              </button>

              {groupedCompanies.map(([group, companies]) => (
                <div key={group}>
                  <div style={styles.groupHeader}>
                    {group.split(' ')[0]} {/* Emoji */}
                    <span>{group.split(' ').slice(1).join(' ')}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 'normal' }}>
                      {companies.length} {companies.length === 1 ? 'company' : 'companies'} • 
                      Total: {companies.reduce((sum, c) => sum + parseBTC(c.btcHoldings), 0).toLocaleString()} BTC
                    </span>
                  </div>
                  
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th} onClick={() => handleSort('companyName')}>{labels.companyName}</th>
                          <th style={styles.th} onClick={() => handleSort('country')}>{labels.country}</th>
                          <th style={styles.th} onClick={() => handleSort('btcHoldings')}>{labels.btcHoldings}</th>
                          <th style={styles.th} onClick={() => handleSort('usdValue')}>{labels.usdValue}</th>
                          <th style={styles.th} onClick={() => handleSort('dividendRateDollars')}>{labels.dividendRate}</th>
                          <th style={styles.th} onClick={() => handleSort('ticker')}>{labels.ticker}</th>
                          <th style={styles.th}>{labels.entityUrl}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...companies]
                          .sort((a, b) => {
                            if (!sortKey) return 0;
                            const valA = a[sortKey] || '';
                            const valB = b[sortKey] || '';
                            const isNumeric = !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB));
                            const aVal = isNumeric ? parseFloat(valA) : valA.toString().toLowerCase();
                            const bVal = isNumeric ? parseFloat(valB) : valB.toString().toLowerCase();
                            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
                            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
                            return 0;
                          })
                          .map((company, index) => (
                            <tr key={`${company.companyName}-${index}`} style={styles.trHover}>
                              <td style={styles.td}>{company.companyName}</td>
                              <td style={styles.td}>{company.country || 'N/A'}</td>
                              <td style={styles.td}>{parseBTC(company.btcHoldings).toLocaleString()}</td>
                              <td style={styles.td}>{formatUSD(company.usdValue)}</td>
                              <td style={styles.td}>
                                {company.dividendRateDollars ? `$${company.dividendRateDollars}` : 'N/A'}
                              </td>
                              <td style={styles.td}>{company.ticker || 'N/A'}</td>
                              <td style={styles.td}>
                                {company.entityUrl ? (
                                  <a 
                                    href={company.entityUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={styles.link}
                                  >
                                    <FaExternalLinkAlt size={12} />
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
              ))}
              
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <tbody>
                    <tr style={styles.totalRow}>
                      <td style={styles.td} colSpan="2">{labels.total}</td>
                      <td style={styles.td}>
                        {treasuryData.reduce((sum, c) => sum + parseBTC(c.btcHoldings), 0).toLocaleString()} BTC
                      </td>
                      <td style={styles.td}>
                        {formatUSD(treasuryData.reduce((sum, c) => sum + parseUSD(c.usdValue), 0))}
                      </td>
                      <td style={styles.td} colSpan="3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {selectedTab === 'countries' && <CountriesPage />}

      {selectedTab === 'etfs' && <BtcEtfTrack />}
    </div>
  );
}

export default TreasuryPage;