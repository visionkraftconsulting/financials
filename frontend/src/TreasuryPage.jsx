import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
import BtcEtfTrack from './BtcEtfTrack';

// Translation-ready labels
const labels = {
  companyName: 'Company Name',
  btcTreasuriesTitle: '₿ Bitcoin Treasury Companies',
  entityType: 'Entity Type',
  country: 'Country',
  btcHoldings: 'BTC Amount',
  usdValue: 'USD Value ($M)',
  dividendRate: 'Dividends ($)',
  ticker: 'Stock Symbol',
  exchange: 'Stock Exchange',
  entityUrl: 'Source Link',
  lastVerified: 'Last Verified',
};

// Inline CSS (unchanged for brevity)
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
  notification: {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    color: 'white',
    zIndex: 1000,
  },
  notificationSuccess: {
    backgroundColor: '#28a745',
  },
  notificationError: {
    backgroundColor: '#dc3545',
  },
};

// Helper to parse BTC and USD values
const parseBTC = (value) => parseFloat(value?.replace(/[^0-9.]/g, '') || 0) || 0;
const parseUSD = (value) => parseFloat(value?.replace(/[^0-9.]/g, '') || 0) || 0;

function TreasuryPage() {
  const { token } = useContext(AuthContext);
  const [treasuryData, setTreasuryData] = useState(null);
  const [error, setError] = useState(null);
  const [countriesData, setCountriesData] = useState(null);
  const [countriesError, setCountriesError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('companies');
  const [notification, setNotification] = useState(null);

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
      try {
        const res = await axios.get(`${API_BASE_URL}/api/btc/bitcoin-treasuries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const deduped = processTreasuryData(res.data);
        setTreasuryData(deduped); // Backend already sorts by btcHoldings
        setError(null);
      } catch (err) {
        console.error('Bitcoin treasuries fetch error:', err.message);
        setError('Failed to load Bitcoin treasury data. Please try again later.');
      }
    };

    fetchTreasuryData();
  }, [API_BASE_URL, token, processTreasuryData]);

  // Fetch countries data
  useEffect(() => {
    if (!token) {
      setCountriesError('Please log in to view countries data');
      return;
    }

    const fetchCountriesData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/btc/bitcoin-treasuries/countries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCountriesData(res.data);
        setCountriesError(null);
      } catch (err) {
        console.error('Treasury countries fetch error:', err.message);
        setCountriesError('Failed to load countries data. Please try again later.');
      }
    };

    fetchCountriesData();
  }, [API_BASE_URL, token]);

  // Handle manual scrape
  const handleManualScrape = async () => {
    if (!token) {
      setNotification({ message: 'Unauthorized: Please log in to run manual scrape', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/btc/bitcoin-treasuries/manual-scrape`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotification({ message: `Manual scrape completed: ${res.data.message}`, type: 'success' });
      // Refresh treasury data
      const refreshRes = await axios.get(`${API_BASE_URL}/api/btc/bitcoin-treasuries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const deduped = processTreasuryData(refreshRes.data);
      setTreasuryData(deduped);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Manual scrape error:', err.message);
      setNotification({ message: 'Failed to run manual scrape', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Group companies by BTC holdings
  const getBtcHoldingsGroup = (company) => {
    const btc = parseBTC(company.btcHoldings);
    if (btc >= 10000) return '🐳 ≥ 10,000 BTC';
    if (btc >= 1000) return '🐋 1,000–9,999 BTC';
    if (btc >= 100) return '🐠 100–999 BTC';
    if (btc >= 10) return '🦐 10–99 BTC';
    return '🧬 < 10 BTC';
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

  return (
    <div style={styles.container}>
      {notification && (
        <div
          style={{
            ...styles.notification,
            ...(notification.type === 'success' ? styles.notificationSuccess : styles.notificationError),
          }}
        >
          {notification.message}
        </div>
      )}
      <h3 style={styles.heading}>{labels.btcTreasuriesTitle}</h3>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <button
          onClick={() => setSelectedTab('companies')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            marginRight: '0.5rem',
            fontWeight: selectedTab === 'companies' ? 'bold' : 'normal',
          }}
        >
          Companies
        </button>
        <button
          onClick={() => setSelectedTab('countries')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            fontWeight: selectedTab === 'countries' ? 'bold' : 'normal',
          }}
        >
          Countries
        </button>
        <button
          onClick={() => setSelectedTab('etfs')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            marginLeft: '0.5rem',
            fontWeight: selectedTab === 'etfs' ? 'bold' : 'normal',
          }}
        >
          ETFs
        </button>
      </div>
      {selectedTab === 'companies' && (
        <>
          {error && <p style={styles.error}>{error}</p>}
          {!treasuryData && !error && <p>Loading...</p>}
          {treasuryData && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <button onClick={handleManualScrape} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
                  📡 Run Manual Scrape
                </button>
              </div>
              {groupedCompanies.map(([group, companies]) => (
                <div key={group} style={{ marginBottom: '2rem' }}>
                  <h4 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{group}</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>{labels.companyName}</th>
                          <th style={styles.th}>{labels.entityType}</th>
                          <th style={styles.th}>{labels.country}</th>
                          <th style={styles.th}>{labels.btcHoldings}</th>
                          <th style={styles.th}>{labels.usdValue}</th>
                          <th style={styles.th}>{labels.dividendRate}</th>
                          <th style={styles.th}>{labels.ticker}</th>
                          <th style={styles.th}>{labels.exchange}</th>
                          <th style={styles.th}>{labels.entityUrl}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies.map((company, index) => (
                          <tr key={`${company.companyName}-${index}`}>
                            <td style={styles.td}>{company.companyName}</td>
                            <td style={styles.td}>{company.entityType}</td>
                            <td style={styles.td}>{company.country}</td>
                            <td style={styles.td}>{company.btcHoldings}</td>
                            <td style={styles.td}>{company.usdValue}</td>
                            <td style={styles.td}>{company.dividendRateDollars ?? 'N/A'}</td>
                            <td style={styles.td}>{company.ticker ?? 'N/A'}</td>
                            <td style={styles.td}>{company.exchange ?? 'N/A'}</td>
                            <td style={styles.td}>
                              {company.entityUrl ? (
                                <a href={company.entityUrl} target="_blank" rel="noopener noreferrer">
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
              ))}
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <tbody>
                    <tr style={styles.totalRow}>
                      <td style={styles.td}>Total</td>
                      <td style={styles.td}></td>
                      <td style={styles.td}></td>
                      <td style={styles.td}>
                        {treasuryData.reduce((sum, c) => sum + parseBTC(c.btcHoldings), 0).toLocaleString()}
                      </td>
                      <td style={styles.td}>
                        {treasuryData
                          .reduce((sum, c) => sum + parseUSD(c.usdValue) * 1e6, 0)
                          .toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                      <td style={styles.td}></td>
                      <td style={styles.td}></td>
                      <td style={styles.td}></td>
                      <td style={styles.td}></td>
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
          {countriesError && <p style={styles.error}>{countriesError}</p>}
          {countriesData ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>{labels.country}</th>
                    <th style={styles.th}>{labels.btcHoldings}</th>
                    <th style={styles.th}>{labels.usdValue}</th>
                  </tr>
                </thead>
                <tbody>
                  {countriesData
                    .sort((a, b) => parseFloat(b.total_btc) - parseFloat(a.total_btc))
                    .map((c, idx) => (
                      <tr key={idx}>
                        <td style={styles.td}>{c.country}</td>
                        <td style={styles.td}>{parseFloat(c.total_btc).toLocaleString()}</td>
                        <td style={styles.td}>
                          {(parseFloat(c.total_usd_m) * 1e6).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Loading countries...</p>
          )}
        </>
      )}
      {selectedTab === 'etfs' && <BtcEtfTrack />}
    </div>
  );
}

export default TreasuryPage;