import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
import BtcEtfTrack from './BtcEtfTrack';

const labels = {
  entityType: 'Company Name',
  btcTreasuriesTitle: '₿ Bitcoin Treasury Holdings',
  companyName: 'Ticker',
  country: 'Country',
  btcHoldings: 'USD Value',
  usdValue: 'BTC Amount',
  dividendRate: 'Dividend',
  ticker: 'Symbol',
  exchange: 'Exchange',
  entityUrl: 'Source',
  totalHoldings: 'Total Holdings',
  refreshData: 'Refresh Data',
  groupBy: 'Group by:',
  lastUpdated: 'Last Updated:'
};

const styles = {
  container: {
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Inter', sans-serif",
    color: '#2d3748'
  },
  heading: {
    fontSize: '1.75rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    fontWeight: '600',
    color: '#1a202c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  tabs: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  tabButton: {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500',
    fontSize: '0.9rem',
    '&:hover': {
      backgroundColor: '#f7fafc'
    }
  },
  activeTab: {
    backgroundColor: '#4299e1',
    color: 'white',
    borderColor: '#4299e1',
    '&:hover': {
      backgroundColor: '#3182ce'
    }
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  refreshButton: {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    backgroundColor: '#48bb78',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#38a169'
    }
  },
  tableContainer: {
    overflowX: 'auto',
    marginBottom: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    backgroundColor: 'white'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem'
  },
  th: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f7fafc',
    textAlign: 'left',
    fontWeight: '600',
    color: '#4a5568',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0
  },
  td: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'middle'
  },
  tr: {
    '&:hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  totalRow: {
    fontWeight: 'bold',
    backgroundColor: '#f7fafc',
    '& td': {
      borderTop: '2px solid #e2e8f0',
      padding: '0.75rem 1rem'
    }
  },
  error: {
    color: '#e53e3e',
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#fff5f5',
    borderRadius: '0.375rem',
    marginBottom: '1.5rem'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#718096'
  },
  groupHeader: {
    backgroundColor: '#ebf8ff',
    padding: '0.75rem 1rem',
    margin: '1.5rem 0 0.5rem',
    borderRadius: '0.375rem',
    fontWeight: '600',
    color: '#2b6cb0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  link: {
    color: '#3182ce',
    textDecoration: 'none',
    fontWeight: '500',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  btcIcon: {
    color: '#f7931a',
    marginRight: '0.25rem'
  },
  lastUpdated: {
    fontSize: '0.75rem',
    color: '#718096',
    textAlign: 'right',
    marginTop: '0.5rem'
  }
};

function TreasuryPage() {
  const { token } = useContext(AuthContext);
  const [treasuryData, setTreasuryData] = useState(null);
  const [error, setError] = useState(null);
  const [countriesData, setCountriesData] = useState(null);
  const [countriesError, setCountriesError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('companies');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  const fetchData = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const [treasuriesRes, countriesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/btc/bitcoin-treasuries`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/btc/bitcoin-treasuries/countries`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Process treasuries data
      const uniqueByName = {};
      treasuriesRes.data.forEach(item => {
        if (!uniqueByName[item.companyName]) {
          uniqueByName[item.companyName] = item;
        }
      });

      const deduped = Object.values(uniqueByName).filter(
        item => item.usdValue && !item.usdValue.includes('%')
      );

      deduped.sort((a, b) => {
        const btcA = parseFloat(a.btcHoldings.replace(/,/g, '')) || 0;
        const btcB = parseFloat(b.btcHoldings.replace(/,/g, '')) || 0;
        return btcB - btcA;
      });

      setTreasuryData(deduped);
      setCountriesData(countriesRes.data);
      setError(null);
      setCountriesError(null);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error('Fetch error:', err.message);
      setError('Failed to load data. Please try again.');
      setCountriesError('Failed to load countries data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_BASE_URL, token]);

  const handleManualScrape = async () => {
    if (!token) {
      alert('Please log in to refresh data');
      return;
    }
    try {
      setIsLoading(true);
      const res = await axios.post(
        `${API_BASE_URL}/api/btc/bitcoin-treasuries/manual-scrape`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
      alert(`Data refreshed: ${res.data.message}`);
    } catch (err) {
      console.error('Manual scrape error:', err.message);
      alert('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const getUsdValueGroup = (company) => {
    const usd = parseFloat(company.usdValue.replace(/[$,M]/g, '')) || 0;
    if (usd >= 1000) return '🚀 > $1B';
    if (usd >= 500) return '🏦 $500M – $1B';
    if (usd >= 100) return '💼 $100M – $500M';
    if (usd >= 50) return '📈 $50M – $100M';
    if (usd >= 10) return '📊 $10M – $50M';
    return '🔹 < $10M';
  };

  const getBtcHoldingsGroup = (company) => {
    const btc = parseFloat(company.btcHoldings.replace(/,/g, '')) || 0;
    if (btc >= 10000) return '🐳 ≥ 10,000 BTC';
    if (btc >= 1000) return '🐋 1,000–9,999 BTC';
    if (btc >= 100) return '🐠 100–999 BTC';
    if (btc >= 10) return '🦐 10–99 BTC';
    return '🧬 < 10 BTC';
  };

  const groupedCompanies = treasuryData
    ? treasuryData.reduce((groups, company) => {
        const group = getBtcHoldingsGroup(company);
        if (!groups[group]) groups[group] = [];
        if (!groups[group].some(c => c.companyName === company.companyName && c.btcHoldings === company.btcHoldings)) {
          groups[group].push(company);
        }
        return groups;
      }, {})
    : {};

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    const valStr = typeof value === 'string' ? value : value.toString();
    const num = parseFloat(valStr.replace(/[$,]/g, ''));
    if (isNaN(num)) return valStr;

    if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}B`;
    }
    if (num >= 1) {
      return `$${num.toFixed(1)}M`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatBtc = (value) => {
    if (!value) return 'N/A';
    const num = parseFloat(value.replace(/,/g, ''));
    if (isNaN(num)) return value;
    return num.toLocaleString();
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>
        <span style={styles.btcIcon}>₿</span>
        {labels.btcTreasuriesTitle}
      </h3>
      
      <div style={styles.tabs}>
        <button
          onClick={() => setSelectedTab('companies')}
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'companies' && styles.activeTab)
          }}
        >
          Companies
        </button>
        <button
          onClick={() => setSelectedTab('countries')}
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'countries' && styles.activeTab)
          }}
        >
          Countries
        </button>
        <button
          onClick={() => setSelectedTab('etfs')}
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'etfs' && styles.activeTab)
          }}
        >
          ETFs
        </button>
      </div>
      
      {isLoading && !treasuryData && (
        <div style={styles.loading}>Loading data...</div>
      )}
      
      {error && (
        <div style={styles.error}>
          {error}
          <button 
            onClick={fetchData}
            style={{
              ...styles.refreshButton,
              marginLeft: '1rem',
              padding: '0.25rem 0.75rem',
              fontSize: '0.8rem'
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      {selectedTab === 'companies' && (
        <>
          <div style={styles.controls}>
            <button
              onClick={handleManualScrape}
              style={{
                ...styles.refreshButton,
                ...(isLoading && { opacity: 0.7, cursor: 'not-allowed' })
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : '↻ ' + labels.refreshData}
            </button>
          </div>
          
          {treasuryData && (
            <>
              {Object.entries(groupedCompanies)
                .sort(([groupA], [groupB]) => {
                  const order = [
                    '🐳 ≥ 10,000 BTC',
                    '🐋 1,000–9,999 BTC',
                    '🐠 100–999 BTC',
                    '🦐 10–99 BTC',
                    '🧬 < 10 BTC'
                  ];
                  return order.indexOf(groupA) - order.indexOf(groupB);
                })
                .map(([group, companies]) => {
                  const sorted = companies.sort((a, b) => {
                    const btcA = parseFloat(a.btcHoldings.replace(/,/g, '')) || 0;
                    const btcB = parseFloat(b.btcHoldings.replace(/,/g, '')) || 0;
                    return btcB - btcA;
                  });
                  
                  return (
                    <div key={group}>
                      <div style={styles.groupHeader}>
                        {group}
                        <span style={{ fontSize: '0.8rem', color: '#4a5568', marginLeft: 'auto' }}>
                          {sorted.length} {sorted.length === 1 ? 'company' : 'companies'}
                        </span>
                      </div>
                      
                      <div style={styles.tableContainer}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>{labels.entityType}</th>
                              <th style={styles.th}>{labels.country}</th>
                              <th style={styles.th}>{labels.usdValue}</th>
                              <th style={styles.th}>{labels.btcHoldings}</th>
                              <th style={styles.th}>{labels.dividendRate}</th>
                              <th style={styles.th}>{labels.ticker}</th>
                              <th style={styles.th}>{labels.exchange}</th>
                              <th style={styles.th}>{labels.entityUrl}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sorted.map((company, index) => (
                              <tr key={index} style={styles.tr}>
                                <td style={styles.td}>
                                  {company.ticker && company.ticker.toLowerCase() === 'xxi'
                                    ? 'Cantor Equity Partners (CEP)'
                                    : company.entityType}
                                </td>
                                <td style={styles.td}>{company.country || 'N/A'}</td>
                                <td style={styles.td}>{formatCurrency(company.usdValue)}</td>
                                <td style={styles.td}>{formatBtc(company.btcHoldings)}</td>
                                <td style={styles.td}>{company.dividendRateDollars || 'N/A'}</td>
                                <td style={styles.td}>{company.ticker || 'N/A'}</td>
                                <td style={styles.td}>{company.exchange || 'N/A'}</td>
                                <td style={styles.td}>
                                  {company.entityUrl ? (
                                    <a 
                                      href={company.entityUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      style={styles.link}
                                    >
                                      Source
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
                })}
              
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <tbody>
                    <tr style={styles.totalRow}>
                      <td colSpan="2" style={styles.td}>{labels.totalHoldings}</td>
                      <td style={styles.td}>
                        {formatCurrency(
                          treasuryData.reduce((sum, c) => sum + (parseFloat(c.usdValue.replace(/[$,M]/g, '')) || 0), 0)
                        )}
                      </td>
                      <td style={styles.td}>
                        {treasuryData.reduce((sum, c) => sum + (parseFloat(c.btcHoldings.replace(/,/g, '')) || 0), 0).toLocaleString()}
                      </td>
                      <td colSpan="4" style={styles.td}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
      
      {selectedTab === 'countries' && (
        <>
          {countriesError && (
            <div style={styles.error}>
              {countriesError}
              <button 
                onClick={fetchData}
                style={{
                  ...styles.refreshButton,
                  marginLeft: '1rem',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.8rem'
                }}
              >
                Retry
              </button>
            </div>
          )}
          
          {countriesData ? (
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
                  {countriesData.map((c, idx) => (
                    <tr key={idx} style={styles.tr}>
                      <td style={styles.td}>{c.country}</td>
                      <td style={styles.td}>{formatBtc(c.total_btc)}</td>
                      <td style={styles.td}>{formatCurrency(c.total_usd_m)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !isLoading && <div style={styles.loading}>No countries data available</div>
          )}
        </>
      )}
      
      {selectedTab === 'etfs' && (
        <BtcEtfTrack />
      )}
      
      {lastUpdated && (
        <div style={styles.lastUpdated}>
          {labels.lastUpdated} {lastUpdated}
        </div>
      )}
    </div>
  );
}

export default TreasuryPage;