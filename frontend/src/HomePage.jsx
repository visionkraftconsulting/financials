import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  hero: {
    textAlign: 'center',
    padding: '3rem 1rem',
    marginBottom: '2rem',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    borderRadius: '12px',
  },
  heading: {
    fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
    fontWeight: '700',
    color: '#1a365d',
    marginBottom: '1rem',
    lineHeight: '1.3',
  },
  description: {
    fontSize: 'clamp(1rem, 3vw, 1.2rem)',
    color: '#4a5568',
    maxWidth: '800px',
    margin: '0 auto 2rem',
    lineHeight: '1.6',
  },
  section: {
    marginTop: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #e2e8f0',
  },
  newsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  newsCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
  },
  newsImage: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
  },
  newsContent: {
    padding: '1.25rem',
  },
  newsTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '0.75rem',
    lineHeight: '1.4',
  },
  newsMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: '#718096',
    marginTop: '1rem',
  },
  sentiment: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontWeight: '600',
    fontSize: '0.75rem',
  },
  positive: {
    backgroundColor: '#ebf8ff',
    color: '#3182ce',
  },
  negative: {
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
  },
  neutral: {
    backgroundColor: '#f7fafc',
    color: '#718096',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: '#e53e3e',
    backgroundColor: '#fff5f5',
    borderRadius: '8px',
  },
};

function HomePage() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [manualLoading, setManualLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const categoryLabels = {
    all: 'All',
    cryptopanic: 'CryptoPanic',
    fmp: 'Crypto Latest',
    'fmp-articles': 'FMP Articles',
    'fmp-general': 'FMP General',
    'fmp-press': 'FMP Press Releases',
    'fmp-stock': 'FMP Stock',
    'fmp-forex': 'FMP Forex',
  };

  const handleManualFetch = async () => {
    setManualLoading(true);
    try {
      const apiBase = process.env.NODE_ENV === 'production'
        ? 'https://smartgrowthassets.com'
        : 'http://52.25.19.40:4005';
      await axios.get(`${apiBase}/api/news?skipCache=true`);
      await fetchStoredNews();
      alert('News fetched and database updated successfully');
    } catch (err) {
      console.error('Error triggering news fetch:', err);
      alert('Failed to trigger news fetch. See console for details.');
    } finally {
      setManualLoading(false);
    }
  };

  const fetchStoredNews = async () => {
    try {
      const apiBase = process.env.NODE_ENV === 'production'
        ? 'https://smartgrowthassets.com'
        : 'http://52.25.19.40:4005';

      const response = await axios.get(`${apiBase}/api/news/stored`);
      setPosts(response.data || []);
      setPage(1);
    } catch (err) {
      console.error('Error fetching stored news:', err);
      setError('Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkForLatestNews = async () => {
    try {
      const apiBase = process.env.NODE_ENV === 'production'
        ? 'https://smartgrowthassets.com'
        : 'http://52.25.19.40:4005';

      const response = await axios.get(`${apiBase}/api/news`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setPosts(response.data);
      }
    } catch (err) {
      console.error('Error checking for latest news:', err);
    }
  };

  useEffect(() => {
    fetchStoredNews();

    const intervalId = setInterval(() => {
      checkForLatestNews();
    }, 300000); // 5 minutes

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const getSentimentStyle = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return { ...styles.sentiment, ...styles.positive };
      case 'negative':
        return { ...styles.sentiment, ...styles.negative };
      default:
        return { ...styles.sentiment, ...styles.neutral };
    }
  };

  // Deduplicate news posts by url before rendering
  const deduplicatePosts = (items) => {
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  };
  const uniquePosts = deduplicatePosts(posts);
  const filteredPosts = uniquePosts
    .filter(post => categoryFilter === 'all' || post.source_type === categoryFilter)
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  return (
    <div style={styles.container}>
      <div className="home-hero" style={styles.hero}>
        <h1 style={styles.heading}>Welcome to SGA Financial Tracker</h1>
        <p style={styles.description}>
          Your comprehensive dashboard for tracking investments, BTC wallets, 
          Bitcoin treasury companies, and high-yield ETFs. Stay informed with 
          real-time data and market insights from Smart Growth & Assets.
        </p>
      </div>

      <section className="home-section" style={styles.section}>
        <h2 className="section-title" style={styles.sectionTitle}>Latest News</h2>
        {user?.role === 'Super Admin' && (
          <div className="text-end mb-3">
            <button
              onClick={handleManualFetch}
              disabled={manualLoading}
              className="btn btn-primary btn-sm"
            >
              {manualLoading ? 'Fetching...' : 'Fetch Latest News'}
            </button>
          </div>
        )}
        {loading && posts.length === 0 ? (
          <div className="home-loading" style={styles.loading}>Loading market news...</div>
        ) : error ? (
          <div className="home-error" style={styles.error}>
            {error}
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#4299e1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="d-flex align-items-center mb-3">
              <label htmlFor="newsCategory" className="me-2" style={{ fontWeight: 500 }}>
                Category:
              </label>
              <select
                id="newsCategory"
                className="form-select form-select-sm"
                style={{ width: '200px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="news-grid" style={styles.newsGrid}>
              {filteredPosts.map((post) => (
              <a 
                key={post.id} 
                href={post.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div className="news-card" style={styles.newsCard}>
                  <img 
                    src={post.image || '/logo192.png'}
                    alt={post.title} 
                    style={styles.newsImage}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/logo192.png';
                    }}
                  />
                  <div className="news-content" style={styles.newsContent}>
                    <h3 className="news-title" style={styles.newsTitle}>{post.title}</h3>
                    <p style={{ fontSize: '0.95rem', color: '#4a5568', marginBottom: '0.75rem' }}>
                      {post.summary
                        ? (post.summary.replace(/<[^>]+>/g, '').slice(0, 150) + (post.summary.length > 150 ? '...' : ''))
                        : ''}
                    </p>
                    <a 
                      href={post.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.85rem', color: '#3182ce', textDecoration: 'underline' }}
                    >
                      Read more
                    </a>
                    <div className="news-meta" style={styles.newsMeta}>
                      <span>{new Date(post.published_at).toLocaleDateString()}</span>
                      {post.sentiment && (
                        <span
                          className={`sentiment ${post.sentiment}`}
                          style={getSentimentStyle(post.sentiment)}
                        >
                          {post.sentiment}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default HomePage;