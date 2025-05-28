import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Translation-ready labels
const labels = {
  btcTreasuriesTitle: '₿ Bitcoin Treasury Companies',
  companyName: 'Company Name',
  country: 'Country',
  btcHoldings: 'BTC Holdings',
  usdValue: 'USD Value ($M)',
  dividendRate: 'Dividend Rate ($)',
  entityType: 'Entity Type',
  entityUrl: 'Entity URL'
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
  const [treasuryData, setTreasuryData] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/btc/bitcoin-treasuries`)
      .then(res => {
        const uniqueByName = {};
        res.data.forEach(item => {
          if (!uniqueByName[item.companyName]) {
            uniqueByName[item.companyName] = item;
          }
        });

        const deduped = Object.values(uniqueByName).filter(item => !item.usdValue.includes('%'));

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
  }, []);

  const handleRunOpenAIUpdate = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/btc/bitcoin-treasuries/run-openai`);
      alert(`✅ OpenAI update successful: ${res.data.message}`);
    } catch (err) {
      console.error('❌ OpenAI update error:', err.message);
      alert('❌ Failed to run OpenAI update');
    }
  };

  const handleManualScrape = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/btc/bitcoin-treasuries/manual-scrape`);
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

  if (!treasuryData) {
    return (
      <div style={styles.container}>
        {error ? <p style={styles.error}>{error}</p> : 'Loading...'}
      </div>
    );
  }

  const groupedCompanies = treasuryData.reduce((groups, company) => {
    const group = getBtcHoldingsGroup(company);
    if (!groups[group]) groups[group] = [];
    if (!groups[group].some(c => c.companyName === company.companyName && c.btcHoldings === company.btcHoldings)) {
      groups[group].push(company);
    }
    return groups;
  }, {});

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>{labels.btcTreasuriesTitle}</h3>
      {error && <p style={styles.error}>{error}</p>}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <button onClick={handleRunOpenAIUpdate} style={{ padding: '0.5rem 1rem', fontSize: '1rem', marginRight: '1rem' }}>
          🔄 Run OpenAI Update
        </button>
        <button onClick={handleManualScrape} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
          📡 Run Manual Scrape
        </button>
      </div>
      {Object.entries(groupedCompanies).map(([group, companies]) => {
        const sortedCompanies = companies
          .sort((a, b) => {
            const btcA = parseFloat(a.btcHoldings.replace(/,/g, '')) || 0;
            const btcB = parseFloat(b.btcHoldings.replace(/,/g, '')) || 0;
            return btcB - btcA;
          });

        const chunkSize = 5;
        const chunks = [];
        for (let i = 0; i < sortedCompanies.length; i += chunkSize) {
          chunks.push(sortedCompanies.slice(i, i + chunkSize));
        }

        return (
          <div key={group} style={{ marginBottom: '2rem' }}>
            <h4 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              {group === '🧬 < 10 BTC' ? '' : group}
            </h4>
            {chunks.map((chunk, idx) => {
              return (
                <div key={idx} style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>{labels.companyName}</th>
                        <th style={styles.th}>{labels.country}</th>
                        <th style={styles.th}>{labels.btcHoldings}</th>
                        <th style={styles.th}>{labels.usdValue}</th>
                        <th style={styles.th}>{labels.dividendRate}</th>
                        <th style={styles.th}>{labels.entityType}</th>
                        <th style={styles.th}>{labels.entityUrl}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.map((company, index) => (
                        <tr key={index}>
                          <td style={styles.td}>{company.companyName}</td>
                          <td style={styles.td}>{company.country}</td>
                          <td style={styles.td}>{company.usdValue}</td>
                          <td style={styles.td}>{company.btcHoldings}</td>
                          <td style={styles.td}>{company.dividendRateDollars ?? 'N/A'}</td>
                          <td style={styles.td}>{company.entityType}</td>
                          <td style={styles.td}>
                            {company.entityUrl ? (
                              <a href={company.entityUrl} target="_blank" rel="noopener noreferrer">Link</a>
                            ) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        );
      })}
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <tbody>
            <tr style={styles.totalRow}>
              <td style={styles.td}>Total</td>
              <td style={styles.td}></td>
              <td style={styles.td}>
                {treasuryData.reduce((sum, company) => {
                  const btc = parseFloat(company.btcHoldings.replace(/,/g, '')) || 0;
                  return sum + btc;
                }, 0).toLocaleString()}
              </td>
              <td style={styles.td}>
                {treasuryData.reduce((sum, company) => {
                  const usd = parseFloat(company.usdValue.replace(/[$,M]/g, '')) * 1e6 || 0;
                  return sum + usd;
                }, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </td>
              <td style={styles.td}></td>
              <td style={styles.td}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TreasuryPage;
