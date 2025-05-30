import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
import SgaPicks from './SgaPicks';

const labels = {
  title: '💰 Top 100 Cryptocurrencies',
  suggestedTitle: '🚀 Trending Cryptocurrencies',
  topTab: 'Top Cryptos',
  suggestedTab: 'Trending Cryptos',
  premiumTab: 'SGA Premium Picks',
  rank: 'Rank',
  name: 'Name',
  symbol: 'Symbol',
  price: 'Price (USD)',
  marketCap: 'Market Cap (USD)',
  change24h: '24h Change (%)',
  volume: 'Total Volume',
  loading: 'Loading cryptocurrency data...',
  suggestedLoading: 'Loading suggested cryptocurrency data...',
  error: 'Failed to load cryptocurrency data',
  suggestedError: 'Failed to load suggested cryptocurrency data',
  retry: 'Try Again',
  noData: 'No cryptocurrency data available',
  suggestedNoData: 'No suggested cryptocurrency data available',
  refreshAll: 'Refresh All Data',
  refreshTop: 'Refresh Top Cryptos',
  refreshSuggested: 'Refresh Trending Cryptos',
};

const styles = {
  page: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' },
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
  },
  heading: { fontSize: '1.75rem', fontWeight: '600', color: '#2c3e50', margin: 0 },
  tableContainer: {
    borderRadius: '8px',
    overflowX: 'auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    marginBottom: '2rem',
    backgroundColor: 'white',
    width: '100%',
    maxWidth: '100%',
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    fontSize: '0.95rem',
    display: 'block',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#495057',
    borderBottom: '2px solid #e9ecef',
    backgroundColor: '#f8f9fa',
    position: 'sticky',
    top: 0,
    cursor: 'pointer',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #e9ecef',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '3rem',
    flexDirection: 'column',
    gap: '1rem',
  },
  loadingText: { fontSize: '1.1rem', color: '#7f8c8d' },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    flexDirection: 'column',
    gap: '1rem',
    textAlign: 'center',
  },
  errorText: { color: '#e74c3c', fontSize: '1.1rem' },
  retryButton: {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  },
  noDataContainer: { padding: '2rem', textAlign: 'center', color: '#7f8c8d' },

  tabsContainer: { display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' },
  tabButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    borderTop: 'none',
    borderRight: 'none',
    borderLeft: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#2c3e50',
  },
  activeTabButton: {
    borderBottom: '2px solid #2c3e50',
  },
};

function CryptoPage() {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('top');
  const [topData, setTopData] = useState(null);
  const [suggestedData, setSuggestedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Sorting state
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [globalRefreshing, setGlobalRefreshing] = useState(false);

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

  const loadCryptos = async (tab) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'top') {
        // Try cached data first; fallback to live data if cache is empty
        const res = await axios.get(
          `${API_BASE_URL}/api/crypto/top-cryptos/cached`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
        let data = res.data;
        if (Array.isArray(data) && data.length === 0) {
          const liveRes = await axios.get(
            `${API_BASE_URL}/api/crypto/top-cryptos`,
            { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
          );
          data = liveRes.data;
        }
        setTopData(data);
      } else if (tab === 'suggested') {
        // Try cached trending data first; fallback to live update if cache is empty
        const res = await axios.get(
          `${API_BASE_URL}/api/crypto/suggested-cryptos/cached`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
        let data = res.data;
        if (!Array.isArray(data) || data.length === 0) {
          const liveRes = await axios.get(
            `${API_BASE_URL}/api/crypto/update-trending-cryptos`,
            { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
          );
          data = liveRes.data;
        }
        setSuggestedData(data);
      }
    } catch (err) {
      console.error(`Error fetching ${tab} cryptos:`, err);
      setError(tab === 'top' ? labels.error : labels.suggestedError);
    } finally {
      setLoading(false);
    }
  };

  const refreshTab = async (tab) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'top') {
        const res = await axios.get(`${API_BASE_URL}/api/crypto/top-cryptos`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setTopData(res.data);
      } else {
        const res = await axios.get(`${API_BASE_URL}/api/crypto/update-trending-cryptos`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setSuggestedData(res.data);
      }
    } catch (err) {
      console.error(`[❌] Failed to refresh ${tab} cryptos:`, err);
      setError(tab === 'top' ? labels.error : labels.suggestedError);
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    setGlobalRefreshing(true);
    try {
      await axios.get(`${API_BASE_URL}/api/crypto/top-cryptos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      await axios.get(`${API_BASE_URL}/api/crypto/update-trending-cryptos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      await axios.get(`${API_BASE_URL}/api/crypto/sga-picks`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (activeTab !== 'sga') {
        await loadCryptos(activeTab);
      }
    } catch (err) {
      console.error('[❌] Failed to refresh all crypto data:', err);
      alert('Failed to refresh all data. Please check console for details.');
    } finally {
      setGlobalRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'sga') {
      loadCryptos(activeTab);
    }
  }, [activeTab]);

  let data = activeTab === 'top' ? topData : suggestedData;
  if (activeTab === 'suggested' && Array.isArray(data)) {
    data = [...data].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  }
  // Sorting logic
  if (Array.isArray(data) && sortKey) {
    data = [...data].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }
  const title = activeTab === 'top' ? labels.title : labels.suggestedTitle;

  if (activeTab !== 'sga' && loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingText}>
            {activeTab === 'top' ? labels.loading : labels.suggestedLoading}
          </div>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (activeTab !== 'sga' && error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorText}>{error}</div>
          <button style={styles.retryButton} onClick={() => loadCryptos(activeTab)}>
            {labels.retry}
          </button>
        </div>
      </div>
    );
  }

  if (activeTab !== 'sga' && (!data || data.length === 0)) {
    return (
      <div style={styles.container}>
        <div style={styles.noDataContainer}>
          {activeTab === 'top' ? labels.noData : labels.suggestedNoData}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button
            style={styles.retryButton}
            onClick={() => refreshTab(activeTab)}
            disabled={loading}
          >
            {activeTab === 'top' ? labels.refreshTop : labels.refreshSuggested}
          </button>
          <button
            style={styles.retryButton}
            onClick={refreshAllData}
            disabled={globalRefreshing}
          >
            {globalRefreshing ? 'Refreshing All...' : labels.refreshAll}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.heading}>{title}</h1>
          <div>
            {activeTab === 'top' && (
              <button
                style={styles.retryButton}
                onClick={() => refreshTab('top')}
                disabled={loading}
              >
                {labels.refreshTop}
              </button>
            )}
            {activeTab === 'suggested' && (
              <button
                style={styles.retryButton}
                onClick={() => refreshTab('suggested')}
                disabled={loading}
              >
                {labels.refreshSuggested}
              </button>
            )}
            <button
              style={styles.retryButton}
              onClick={refreshAllData}
              disabled={globalRefreshing}
            >
              {globalRefreshing ? 'Refreshing All...' : labels.refreshAll}
            </button>
          </div>
        </div>
        <div className="tabs-container" style={styles.tabsContainer}>
          <button
            className={`tab-button${activeTab === 'top' ? ' active-tab-button' : ''}`}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'top' ? styles.activeTabButton : {}),
            }}
            onClick={() => setActiveTab('top')}
          >
            {labels.topTab}
          </button>
          <button
            className={`tab-button${activeTab === 'suggested' ? ' active-tab-button' : ''}`}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'suggested' ? styles.activeTabButton : {}),
            }}
            onClick={() => setActiveTab('suggested')}
          >
            {labels.suggestedTab}
          </button>
          <button
            className={`tab-button${activeTab === 'sga' ? ' active-tab-button' : ''}`}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'sga' ? styles.activeTabButton : {}),
            }}
            onClick={() => setActiveTab('sga')}
          >
            {labels.premiumTab}
          </button>
        </div>
        {activeTab === 'sga' ? (
          <SgaPicks />
        ) : (
          <div className="table-container" style={styles.tableContainer}>
            <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => handleSort('market_cap_rank')}>{labels.rank}</th>
                <th style={styles.th} onClick={() => handleSort('name')}>{labels.name}</th>
                <th style={styles.th} onClick={() => handleSort('symbol')}>{labels.symbol}</th>
                <th style={styles.th} onClick={() => handleSort('current_price')}>{labels.price}</th>
                <th style={styles.th} onClick={() => handleSort('market_cap')}>{labels.marketCap}</th>
                <th style={styles.th} onClick={() => handleSort('price_change_percentage_24h')}>{labels.change24h}</th>
                <th style={styles.th} onClick={() => handleSort('total_volume')}>{labels.volume}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((coin) => (
                <tr key={coin.id}>
                  <td style={styles.td}>{coin.market_cap_rank}</td>
                  <td style={styles.td}>
                    <img
                      src={coin.image}
                      alt={coin.name}
                      style={{ width: '20px', verticalAlign: 'middle', marginRight: '8px' }}
                    />
                    {coin.name}
                  </td>
                  <td style={styles.td}>{coin.symbol.toUpperCase()}</td>
                  <td style={styles.td}>${coin.current_price.toLocaleString()}</td>
                  <td style={styles.td}>${coin.market_cap.toLocaleString()}</td>
                  <td
                    style={{
                      ...styles.td,
                      color: coin.price_change_percentage_24h >= 0 ? 'green' : 'red',
                    }}
                  >
                    {coin.price_change_percentage_24h != null
                      ? `${parseFloat(coin.price_change_percentage_24h).toFixed(2)}%`
                      : '-'}
                  </td>
                  <td style={styles.td}>${coin.total_volume.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CryptoPage;