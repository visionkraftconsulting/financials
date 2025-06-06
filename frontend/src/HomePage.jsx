import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
import { FiRefreshCw, FiExternalLink, FiShare2, FiClock, FiUser, FiMenu, FiX } from 'react-icons/fi';

const styles = {
  container: {
    maxWidth: '100%',
    padding: 0,
    margin: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backgroundColor: 'white',
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
  },
  logo: {
    fontWeight: '800',
    fontSize: '1.5rem',
    color: '#3b82f6',
    letterSpacing: '-0.5px',
  },
  mobileMenuButton: {
    display: 'none', // Hidden by default, shown on mobile
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    color: '#3b82f6',
    cursor: 'pointer',
  },
  feedContainer: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '1rem',
    paddingBottom: '80px',
  },
  desktopFeedContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem',
    paddingBottom: '80px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '1.5rem',
  },
  post: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    marginBottom: '1.5rem',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
  },
  desktopPost: {
    marginBottom: 0, // Remove margin in grid layout
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    marginRight: '0.75rem',
    backgroundColor: '#e0f2fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0ea5e9',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  postUser: {
    fontWeight: '600',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  postTime: {
    color: '#64748b',
    fontSize: '0.75rem',
    marginTop: '0.2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  postImage: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'cover',
    borderTop: '1px solid #f1f5f9',
    borderBottom: '1px solid #f1f5f9',
  },
  postContent: {
    padding: '1rem',
    flexGrow: 1, // For desktop layout to push actions to bottom
  },
  postTitle: {
    fontWeight: '700',
    marginBottom: '0.75rem',
    fontSize: '1.15rem',
    lineHeight: '1.4',
    color: '#1e293b',
  },
  postText: {
    marginBottom: '0.75rem',
    lineHeight: '1.5',
    color: '#475569',
    fontSize: '0.9rem',
  },
  postActions: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderTop: '1px solid #f1f5f9',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    gap: '0.5rem',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#64748b',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f1f5f9',
      color: '#3b82f6',
    },
  },
  sentimentBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: '600',
    marginLeft: '0.5rem',
    textTransform: 'capitalize',
  },
  positive: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  negative: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  neutral: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#64748b',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    gridColumn: '1 / -1', // Span all columns in desktop view
  },
  loadingSpinner: {
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    animation: 'spin 1s linear infinite',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    borderRadius: '12px',
    margin: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    gridColumn: '1 / -1',
  },
  filterBar: {
    position: 'sticky',
    top: '60px',
    zIndex: 900,
    backgroundColor: 'white',
    padding: '0.75rem 1rem',
    display: 'flex',
    overflowX: 'auto',
    borderBottom: '1px solid #e2e8f0',
    scrollbarWidth: 'none',
    justifyContent: 'center',
    '::-webkit-scrollbar': {
      display: 'none',
    },
  },
  mobileFilterBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 1000,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  mobileFilterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  mobileFilterTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  mobileFilterClose: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    color: '#64748b',
    cursor: 'pointer',
  },
  filterItem: {
    padding: '0.5rem 1rem',
    marginRight: '0.5rem',
    borderRadius: '20px',
    backgroundColor: '#f1f5f9',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#475569',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e2e8f0',
    },
  },
  mobileFilterItem: {
    padding: '1rem',
    marginBottom: '0.5rem',
    borderRadius: '8px',
    backgroundColor: '#f1f5f9',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#475569',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e2e8f0',
    },
  },
  activeFilter: {
    backgroundColor: '#3b82f6',
    color: 'white',
    ':hover': {
      backgroundColor: '#2563eb',
    },
  },
  floatingButton: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#2563eb',
      transform: 'scale(1.05)',
    },
    ':active': {
      transform: 'scale(0.95)',
    },
  },
  refreshButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#2563eb',
    },
    ':disabled': {
      backgroundColor: '#e2e8f0',
      cursor: 'not-allowed',
    },
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#64748b',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    margin: '1rem',
    gridColumn: '1 / -1',
  },
  timeIcon: {
    fontSize: '0.8rem',
    opacity: '0.8',
  },
  mobileFilterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '20px',
    padding: '0.5rem 1rem',
    marginLeft: '1rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
};

function HomePage() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Pagination state for infinite scroll
  const [visibleCount, setVisibleCount] = useState(10);
  const loadMoreArticles = () => setVisibleCount(prev => prev + 10);
  
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleManualFetch = async () => {
    setManualLoading(true);
    try {
      const apiBase = process.env.NODE_ENV === 'production'
        ? 'https://smartgrowthassets.com'
        : 'http://52.25.19.40:4005';
      await axios.get(`${apiBase}/api/news?skipCache=true`);
      await fetchStoredNews();
      showToast('News updated successfully');
    } catch (err) {
      console.error('Error triggering news fetch:', err);
      showToast('Failed to update news', 'error');
    } finally {
      setManualLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.style.color = 'white';
    toast.style.padding = '0.75rem 1.5rem';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.zIndex = '1000';
    toast.style.transition = 'all 0.3s ease';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
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
      setError('Failed to load news. Please check your connection and try again.');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const uniquePosts = deduplicatePosts(posts);
  const filteredPosts = uniquePosts
    .filter(post => categoryFilter === 'all' || post.source_type === categoryFilter)
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  return (
    <div style={styles.container} className="home-container">
      <header style={styles.header} className="home-header">
        <div style={styles.logo}>SGA News</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <button 
              style={styles.mobileFilterButton}
              onClick={() => setShowMobileFilters(true)}
            >
              <FiMenu /> Filters
            </button>
          )}
          {(user?.role === 'Super Admin' || user?.role === 'Admin') && (
            <button
              onClick={handleManualFetch}
              disabled={manualLoading}
              style={styles.refreshButton}
            >
              {manualLoading ? (
                <>
                  <FiRefreshCw className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  {isMobile ? '' : 'Updating...'}
                </>
              ) : (
                <>
                  <FiRefreshCw />
                  {isMobile ? '' : 'Refresh News'}
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {showMobileFilters ? (
        <div style={styles.mobileFilterBar}>
          <div style={styles.mobileFilterHeader}>
            <div style={styles.mobileFilterTitle}>Filter News</div>
            <button 
              style={styles.mobileFilterClose}
              onClick={() => setShowMobileFilters(false)}
            >
              <FiX />
            </button>
          </div>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <div
              key={key}
              style={{
                ...styles.mobileFilterItem,
                ...(categoryFilter === key ? styles.activeFilter : {}),
              }}
              onClick={() => {
                setCategoryFilter(key);
                setShowMobileFilters(false);
              }}
            >
              {label}
            </div>
          ))}
        </div>
      ) : (
        !isMobile && (
          <div style={styles.filterBar} className="filter-bar">
            {Object.entries(categoryLabels)
              .filter(([key]) => {
                if (key === 'all') return true;
                return uniquePosts.some(post => post.source_type === key);
              })
              .map(([key, label]) => (
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
        )
      )}

      <div style={isMobile ? styles.feedContainer : styles.desktopFeedContainer} className="feed-container">
        {loading && posts.length === 0 ? (
          <div style={styles.loading}>
            <div style={styles.loadingSpinner}></div>
            Loading news feed...
          </div>
        ) : error ? (
          <div style={styles.error} className="home-error">
            <div style={{ fontWeight: '600' }}>Error loading news</div>
            <div>{error}</div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Try Again
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>No news found</div>
            <div>There are no articles in this category at the moment.</div>
            {categoryFilter !== 'all' && (
              <button 
                onClick={() => setCategoryFilter('all')}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                View All News
              </button>
            )}
          </div>
        ) : (
          <>
            {filteredPosts.slice(0, visibleCount).map((post) => (
              <div 
                key={post.id} 
                style={isMobile ? styles.post : { ...styles.post, ...styles.desktopPost }} 
                className="post card"
              >
                <div style={styles.postHeader} className="post-header">
                  <div style={styles.avatar} className="avatar">
                    {getSourceInitials(post.source_name)}
                  </div>
                  <div>
                    <div style={styles.postUser} className="post-user">
                      <FiUser size={14} />
                      {post.source_name || 'SGA Investments'}
                      {post.sentiment && (
                        <span
                          style={getSentimentStyle(post.sentiment)}
                          className={`sentiment ${post.sentiment}`}
                        >
                          {post.sentiment}
                        </span>
                      )}
                    </div>
                    <div style={styles.postTime} className="post-time">
                      <FiClock size={12} style={styles.timeIcon} />
                      {formatDate(post.published_at)}
                    </div>
                  </div>
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
                
                <div style={styles.postContent} className="post-content">
                  <h3 style={styles.postTitle} className="post-title card-title">
                    {post.title}
                  </h3>
                  <p style={styles.postText} className="post-text">
                    {post.summary
                      ? (post.summary.replace(/<[^>]+>/g, '').slice(0, isMobile ? 250 : 350) + 
                         (post.summary.length > (isMobile ? 250 : 350) ? '...' : ''))
                      : 'No summary available'}
                  </p>
                </div>
                
                <div style={styles.postActions} className="post-actions">
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.actionButton, textDecoration: 'none' }}
                    className="action-button"
                  >
                    <FiExternalLink size={16} />
                    <span>Read More</span>
                  </a>
                  <div style={styles.actionButton}>
                    <FiShare2 size={16} />
                    <span>Share</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredPosts.length > visibleCount && (
              <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                <button
                  onClick={loadMoreArticles}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {(user?.role === 'Super Admin' || user?.role === 'Admin') && (
        <div 
          style={styles.floatingButton}
          onClick={handleManualFetch}
          title="Fetch latest news"
          aria-label="Refresh news"
        >
          {manualLoading ? (
            <FiRefreshCw className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <FiRefreshCw />
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .home-header button {
            padding: 0.5rem;
          }
          .home-header button span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePage;