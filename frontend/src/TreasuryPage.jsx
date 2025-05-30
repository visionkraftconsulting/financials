import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
import BtcEtfTrack from './BtcEtfTrack';

// Translation-ready labels
const labels = {
  companyName: 'Company Name',
  btcTreasuriesTitle: '₿ Bitcoin Treasury Companies',
  entityType: 'Ticker',
  country: 'Country',
  btcHoldings: 'BTC Amount',
  usdValue: 'USD Value ($M)',
  dividendRate: 'Dividends ($)',
  ticker: 'Stock Symbol',
  exchange: 'Stock Exchange',
  entityUrl: 'Source Link',
  lastVerified: 'Last Verified',
};

// Inline CSS (subset from BtcTrack)
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

function TreasuryPage() {
  const { token } = useContext(AuthContext);
  const [treasuryData, setTreasuryData] = useState(null);
  const [error, setError] = useState(null);
  const [countriesData, setCountriesData] = useState(null);
  const [countriesError, setCountriesError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('companies');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  useEffect(() => {
    if (!token) return;

    axios.get(
      `${API_BASE_URL}/api/btc/bitcoin-treasuries`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => {
        const uniqueByName = {};
        res.data.forEach(item => {
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
        setError(null);
      })
      .catch(err => {
        console.error('Bitcoin treasuries fetch error:', err.message);
        setError('Failed to load Bitcoin treasury data');
      });
  }, [API_BASE_URL, token]);

  useEffect(() => {
    if (!token) return;

    axios.get(
      `${API_BASE_URL}/api/btc/bitcoin-treasuries/countries`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => {
        setCountriesData(res.data);
        setCountriesError(null);
      })
      .catch(err => {
        console.error('Treasury countries fetch error:', err.message);
        setCountriesError('Failed to load countries data');
      });
  }, [API_BASE_URL, token]);


  const handleManualScrape = async () => {
    if (!token) {
      alert('Unauthorized: Please log in to run manual scrape');
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/btc/bitcoin-treasuries/manual-scrape`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`📡 Manual scrape completed: ${res.data.message}`);
    } catch (err) {
      console.error('❌ Manual scrape error:', err.message);
      alert('❌ Failed to run manual scrape');
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

  // Sort companies by btcHoldings descending before grouping
  const groupedCompanies = treasuryData
    ? (() => {
        // Clone the array to avoid mutating state
        const companies = [...treasuryData];
        companies.sort((a, b) => (parseFloat(b.btcHoldings?.replace(/[^0-9.]/g, '')) || 0) - (parseFloat(a.btcHoldings?.replace(/[^0-9.]/g, '')) || 0));
        return companies.reduce((groups, company) => {
          const group = getBtcHoldingsGroup(company);
          if (!groups[group]) groups[group] = [];
          if (!groups[group].some(c => c.companyName === company.companyName && c.btcHoldings === company.btcHoldings)) {
            groups[group].push(company);
          }
          return groups;
        }, {});
      })()
    : {};

  // Sort groups by total BTC holding descending
  const sortedGroups = Object.entries(groupedCompanies).sort(([, aCompanies], [, bCompanies]) => {
    const totalA = aCompanies.reduce((sum, c) => sum + (parseFloat(c.btcHoldings.replace(/,/g, '')) || 0), 0);
    const totalB = bCompanies.reduce((sum, c) => sum + (parseFloat(c.btcHoldings.replace(/,/g, '')) || 0), 0);
    return totalB - totalA;
  });


  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>{labels.btcTreasuriesTitle}</h3>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <button
          onClick={() => setSelectedTab('companies')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            marginRight: '0.5rem',
            fontWeight: selectedTab === 'companies' ? 'bold' : 'normal'
          }}
        >
          Companies
        </button>
        <button
          onClick={() => setSelectedTab('countries')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            fontWeight: selectedTab === 'countries' ? 'bold' : 'normal'
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
            fontWeight: selectedTab === 'etfs' ? 'bold' : 'normal'
          }}
        >
          ETFs
        </button>
      </div>
      {selectedTab === 'companies' && (
        <>
          {(!treasuryData || error) && (
            <p style={styles.error}>{error || 'Loading...'}</p>
          )}
          {treasuryData && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <button onClick={handleManualScrape} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
                  📡 Run Manual Scrape
                </button>
              </div>
              {sortedGroups.map(([group, companies]) => {
                // Sort companies in group by btcHoldings descending
                companies.sort((a, b) => {
                  const btcA = parseFloat(a.btcHoldings.replace(/,/g, '')) || 0;
                  const btcB = parseFloat(b.btcHoldings.replace(/,/g, '')) || 0;
                  return btcB - btcA;
                });
                const chunks = [];
                for (let i = 0; i < companies.length; i += 5) {
                  chunks.push(companies.slice(i, i + 5));
                }
                return (
                  <div key={group} style={{ marginBottom: '2rem' }}>
                    <h4 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                      {group === '🧬 < 10 BTC' ? '' : group}
                    </h4>
                    {chunks.map((chunk, idx) => (
                      <div key={idx} style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>{labels.companyName}</th>
                              <th style={styles.th}>{labels.entityType}</th>
                              <th style={styles.th}>{labels.country}</th>
                              <th style={styles.th}>{labels.btcHoldings}</th>
                              <th style={styles.th}>{labels.usdValue}</th>
                              <th style={styles.th}>{labels.dividendRate}</th>
                              <th style={styles.th}>{labels.ticker || 'Ticker'}</th>
                              <th style={styles.th}>{labels.exchange}</th>
                              <th style={styles.th}>{labels.entityUrl}</th>
                              <th style={styles.th}>{labels.lastVerified}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chunk.map((company, index) => (
                              <tr key={index}>
                                <td style={styles.td}>{company.companyName}</td>
                                <td style={styles.td}>
                                  {company.ticker && company.ticker.toLowerCase() === 'xxi'
                                    ? 'Cantor Equity Partners (CEP)'
                                    : company.entityType}
                                </td>
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
                                <td style={styles.td}>{company.last_verified ? new Date(company.last_verified).toLocaleDateString() : 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                );
              })}
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <tbody>
                    <tr style={styles.totalRow}>
                      <td style={styles.td}>Total</td>
                      <td style={styles.td}></td>
                      <td style={styles.td}></td>
                      <td style={styles.td}>
                        {treasuryData.reduce((sum, c) => sum + (parseFloat(c.btcHoldings.replace(/,/g, '')) || 0), 0).toLocaleString()}
                      </td>
                      <td style={styles.td}>
                        {treasuryData
                          .reduce((sum, c) => sum + (parseFloat(c.usdValue.replace(/[$,M]/g, '')) * 1e6 || 0), 0)
                          .toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                      <td style={styles.td}></td>
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
                  {[...countriesData].sort((a, b) => parseFloat(b.total_btc) - parseFloat(a.total_btc)).map((c, idx) => (
                    <tr key={idx}>
                      <td style={styles.td}>{c.country}</td>
                      <td style={styles.td}>{parseFloat(c.total_btc).toLocaleString()}</td>
                      <td style={styles.td}>{parseFloat(c.total_usd_m).toLocaleString()}</td>
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
      {selectedTab === 'etfs' && (
        <BtcEtfTrack />
      )}
    </div>
  );
}

export default TreasuryPage;
