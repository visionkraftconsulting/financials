import React from 'react';

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
  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="flex-grow-1" style={styles.container}>
        <h1 style={styles.heading}>Welcome to the Financial Tracker</h1>
        <p style={styles.description}>
          Navigate to different sections to track investments, BTC wallets, Bitcoin treasury companies, and high-yield ETFs.
        </p>
      </div>
    </div>
  );
}

export default HomePage;