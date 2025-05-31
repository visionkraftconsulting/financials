import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const apiBase = process.env.REACT_APP_API_BASE_URL || '';
        const response = await axios.get(`${apiBase}/api/news`);
        setPosts(response.data || []);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
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
        <h2 className="section-title" style={styles.sectionTitle}>Latest Crypto News</h2>
        
        {loading ? (
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
          <div className="news-grid" style={styles.newsGrid}>
            {posts.slice(0, 6).map((post) => (
              <a 
                key={post.id} 
                href={post.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div className="news-card" style={styles.newsCard}>
                  {post.thumbnail && (
                    <img 
                      src={post.thumbnail} 
                      alt={post.title} 
                      style={styles.newsImage}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x180?text=No+Image';
                      }}
                    />
                  )}
                  <div className="news-content" style={styles.newsContent}>
                    <h3 className="news-title" style={styles.newsTitle}>{post.title}</h3>
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
        )}
      </section>
    </div>
  );
}

export default HomePage;