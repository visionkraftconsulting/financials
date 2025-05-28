import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Translation-ready labels
const labels = {
  walletTitle: '₿ BTC Wallet Summary',
  walletAddress: 'Wallet Address',
  nickname: 'Nickname',
  totalBtc: 'Total BTC',
  currentPrice: 'Current Price (USD)',
  totalValue: 'Total Value (USD)',
  updateNickname: 'Update Nickname'
};

// Inline CSS (subset from InvestPage)
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
  input: {
    padding: '5px',
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
    width: '100%',
    maxWidth: '150px',
    marginRight: '5px',
  },
  button: {
    padding: '5px 10px',
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: '1rem',
    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
  }
};

function WalletPage() {
  const [btcData, setBtcData] = useState(null);
  const [nicknames, setNicknames] = useState({});
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/btc/summary`)
      .then(res => {
        setBtcData(res.data);
        const initialNicknames = {};
        res.data.wallets.forEach(wallet => {
          initialNicknames[wallet.walletAddress] = wallet.nickname || '';
        });
        setNicknames(initialNicknames);
      })
      .catch(err => {
        console.error('BTC fetch error:', err);
        setError('Failed to load BTC data');
      });
  }, []);

  const handleNicknameChange = (walletAddress, value) => {
    setNicknames(prev => ({ ...prev, [walletAddress]: value }));
  };

  const updateNickname = async (walletAddress) => {
    const nickname = nicknames[walletAddress];
    if (!nickname.trim()) {
      setError('Nickname cannot be empty');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/btc/update-nickname`, {
        walletAddress,
        nickname
      });
      setBtcData(prev => ({
        ...prev,
        wallets: prev.wallets.map(wallet =>
          wallet.walletAddress === walletAddress ? { ...wallet, nickname } : wallet
        )
      }));
      setError(null);
      console.log(`[✅] Nickname updated for ${walletAddress}: ${nickname}`);
    } catch (err) {
      console.error('Nickname update error:', err);
      setError('Failed to update nickname');
    }
  };

  if (!btcData) {
    return (
      <div style={styles.container}>
        {error ? <p style={styles.error}>{error}</p> : 'Loading...'}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>{labels.walletTitle}</h3>
      {error && <p style={styles.error}>{error}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{labels.nickname}</th>
              <th style={styles.th}>{labels.walletAddress}</th>
              <th style={styles.th}>{labels.totalBtc}</th>
              <th style={styles.th}>{labels.currentPrice}</th>
              <th style={styles.th}>{labels.totalValue}</th>
              <th style={styles.th}>{labels.updateNickname}</th>
            </tr>
          </thead>
          <tbody>
            {btcData.wallets.map((wallet, index) => (
              <tr key={index}>
                <td style={styles.td}>{wallet.nickname || 'N/A'}</td>
                <td style={styles.td}>
                  {window.innerWidth < 600
                    ? `${wallet.walletAddress.slice(0, 6)}...${wallet.walletAddress.slice(-4)}`
                    : wallet.walletAddress}
                </td>
                <td style={styles.td}>{wallet.balanceBtc.toFixed(8)}</td>
                <td style={styles.td}>${wallet.currentPriceUsd.toFixed(2)}</td>
                <td style={styles.td}>${wallet.totalValueUsd.toFixed(2)}</td>
                <td style={styles.td}>
                  <input
                    style={styles.input}
                    type="text"
                    value={nicknames[wallet.walletAddress] || ''}
                    onChange={(e) => handleNicknameChange(wallet.walletAddress, e.target.value)}
                    placeholder="Enter nickname"
                    maxLength={50}
                  />
                  <button
                    style={{
                      ...styles.button,
                      opacity: nicknames[wallet.walletAddress]?.trim() ? 1 : 0.5,
                      cursor: nicknames[wallet.walletAddress]?.trim() ? 'pointer' : 'not-allowed'
                    }}
                    onClick={() => updateNickname(wallet.walletAddress)}
                    disabled={!nicknames[wallet.walletAddress]?.trim()}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
            <tr style={styles.totalRow}>
              <td style={styles.td}>Total</td>
              <td style={styles.td}></td>
              <td style={styles.td}>{btcData.totalBtc.toFixed(8)}</td>
              <td style={styles.td}>${btcData.currentPriceUsd.toFixed(2)}</td>
              <td style={styles.td}>${btcData.totalValueUsd.toFixed(2)}</td>
              <td style={styles.td}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WalletPage;
