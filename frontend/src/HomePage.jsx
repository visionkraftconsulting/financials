import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';

const styles = {
  container: {
    maxWidth: '100%',
    padding: 0,
    margin: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: '#f0f2f5',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'white',
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '1.5rem',
    color: '#1877f2',
  },
  feedContainer: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '1rem',
  },
  post: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    marginBottom: '1rem',
    overflow: 'hidden',
  },
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '0.75rem',
    backgroundColor: '#e4e6eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1877f2',
    fontWeight: 'bold',
  },
  postUser: {
    fontWeight: '600',
  },
  postTime: {
    color: '#65676b',
    fontSize: '0.8rem',
    marginTop: '0.1rem',
  },
  postImage: {
    width: '100%',
    maxHeight: '500px',
    objectFit: 'cover',
  },
  postContent: {
    padding: '0.75rem 1rem',
  },
  postTitle: {
    fontWeight: '600',
    marginBottom: '0.5rem',
    fontSize: '1.1rem',
  },
  postText: {
    marginBottom: '0.75rem',
    lineHeight: '1.4',
  },
  postActions: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    borderTop: '1px solid #e4e6eb',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#f0f2f5',
    },
  },
  sentimentBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    marginLeft: '0.5rem',
  },
  positive: {
    backgroundColor: '#e7f3ff',
    color: '#1877f2',
  },
  negative: {
    backgroundColor: '#ffeeee',
    color: '#f02849',
  },
  neutral: {
    backgroundColor: '#f0f2f5',
    color: '#65676b',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#65676b',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: '#f02849',
    backgroundColor: '#ffeeee',
    borderRadius: '8px',
  },
  filterBar: {
    position: 'sticky',
    top: '60px',
    zIndex: 90,
    backgroundColor: 'white',
    padding: '0.75rem 1rem',
    display: 'flex',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    borderBottom: '1px solid #e4e6eb',
  },
  filterItem: {
    padding: '0.5rem 1rem',
    marginRight: '0.5rem',
    borderRadius: '20px',
    backgroundColor: '#f0f2f5',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: '#e4e6eb',
    },
  },
  activeFilter: {
    backgroundColor: '#1877f2',
    color: 'white',
    '&:hover': {
      backgroundColor: '#166fe5',
    },
  },
  floatingButton: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#1877f2',
    color: 'white',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    zIndex: 100,
  },
};

function HomePage() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const categoryLabels = {
    all: 'All News',
    cryptopanic: 'CryptoPanic',
    fmp: 'Crypto Latest',
    'fmp-articles': 'Articles',
    'fmp-general': 'General',
    'fmp-press': 'Press Releases',
    'fmp-stock': 'Stocks',
    'fmp-forex': 'Forex',
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
        return { ...styles.sentimentBadge, ...styles.positive };
      case 'negative':
        return { ...styles.sentimentBadge, ...styles.negative };
      default:
        return { ...styles.sentimentBadge, ...styles.neutral };
    }
  };

  const getSourceInitials = (source) => {
    if (!source) return 'SGA';
    const words = source.split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.map(word => word[0].toUpperCase()).join('').substring(0, 2);
  };

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
      <header style={styles.header}>
        <div style={styles.logo}>SGA News</div>
        {user?.role === 'Super Admin' && (
          <button
            onClick={handleManualFetch}
            disabled={manualLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: manualLoading ? '#e4e6eb' : '#1877f2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: manualLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {manualLoading ? 'Fetching...' : 'Refresh News'}
          </button>
        )}
      </header>

      <div style={styles.filterBar}>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <div
            key={key}
            style={{
              ...styles.filterItem,
              ...(categoryFilter === key ? styles.activeFilter : {}),
            }}
            onClick={() => setCategoryFilter(key)}
          >
            {label}
          </div>
        ))}
      </div>

      <div style={styles.feedContainer}>
        {loading && posts.length === 0 ? (
          <div style={styles.loading}>Loading news feed...</div>
        ) : error ? (
          <div style={styles.error}>
            {error}
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#1877f2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={styles.loading}>No news found in this category</div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} style={styles.post}>
              <div style={styles.postHeader}>
                <div style={styles.avatar}>
                  {getSourceInitials(post.source_name)}
                </div>
                <div>
                  <div style={styles.postUser}>
                    {post.source_name || 'Unknown Source'}
                    {post.sentiment && (
                      <span style={getSentimentStyle(post.sentiment)}>
                        {post.sentiment}
                      </span>
                    )}
                  </div>
                  <div style={styles.postTime}>
                    {new Date(post.published_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div style={styles.postContent}>
                <h3 style={styles.postTitle}>{post.title}</h3>
                <p style={styles.postText}>
                  {post.summary
                    ? (post.summary.replace(/<[^>]+>/g, '').slice(0, 200) + 
                       (post.summary.length > 200 ? '...' : ''))
                    : 'No summary available'}
                </p>
              </div>
              
              {post.image && (
                <img
                  src={post.image}
                  alt={post.title}
                  style={styles.postImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              )}
              
              <div style={styles.postActions}>
                <a 
                  href={post.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ ...styles.actionButton, textDecoration: 'none', color: 'inherit' }}
                >
                  <span>Read More</span>
                </a>
                <div style={styles.actionButton}>
                  <span>Share</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {user?.role === 'Super Admin' && (
        <div 
          style={styles.floatingButton}
          onClick={handleManualFetch}
          title="Fetch latest news"
        >
          {manualLoading ? '...' : '↻'}
        </div>
      )}
    </div>
  );
}

export default HomePage;