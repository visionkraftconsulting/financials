import React from 'react';
import axios from 'axios';

const styles = {
  container: {
    padding: '2rem',
    textAlign: 'center',
  },
  heading: {
    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
    marginBottom: '1rem',
  },
  description: {
    fontSize: 'clamp(1rem, 3vw, 1.2rem)',
    color: '#555',
  }
};

function HomePage() {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const API_BASE_URL = 'https://cryptopanic.com/api/developer/v2';
    const API_TOKEN = '5ef83b521d8bed2c502c0d0b818e27164d2e5171';

    async function fetchNews() {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/posts?auth_token=${API_TOKEN}`
        );
        setPosts(response.data.results || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="flex-grow-1" style={styles.container}>
        <h1 style={styles.heading}>Welcome to the Financial Tracker</h1>
        <p style={styles.description}>
          Navigate to different sections to track investments, BTC wallets, Bitcoin treasury companies, and high-yield ETFs.
        </p>

        <section style={{ marginTop: '2rem', textAlign: 'left' }}>
          <h2>Latest Crypto News</h2>
          {loading && <p>Loading news...</p>}
          {error && <p>Failed to load news.</p>}
          {!loading && !error && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {posts.map((post) => (
                <li key={post.id} style={{ marginBottom: '1rem' }}>
                  <a href={post.url} target="_blank" rel="noopener noreferrer">
                    {post.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default HomePage;