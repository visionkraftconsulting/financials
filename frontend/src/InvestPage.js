import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Label
} from 'recharts';

// Translation-ready labels
const labels = {
  title: '📊 Investment Tracker',
  totalShares: 'Total Shares',
  totalDividends: 'Total Dividends',
  avgDividend: 'Avg Weekly Dividend/Share',
  totalInvestment: 'Total Investment (USD)',
  week: 'Week',
  shares: 'Shares',
  dividends: 'Dividends',
  walletAddress: 'Wallet Address',
  nickname: 'Nickname',
  totalBtc: 'Total BTC',
  currentPrice: 'Current Price (USD)',
  totalValue: 'Total Value (USD)',
  updateNickname: 'Update Nickname'
};

// Inline CSS (unchanged from previous)
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
  stat: {
    margin: '0.5rem 0',
    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
    wordWrap: 'break-word',
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
  chartContainer: {
    margin: '1rem 0',
    height: 'clamp(250px, 50vw, 300px)',
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
  }
};

function InvestPage() {
  const [data, setData] = useState(null);
  const [btcData, setBtcData] = useState(null);
  const [nicknames, setNicknames] = useState({});
  const [error, setError] = useState(null);

  // Base API URL (can be overridden with env variable)
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://52.25.19.40:4004';

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/investments/summary`)
      .then(res => setData(res.data))
      .catch(err => {
        console.error('Investment fetch error:', err);
        setError('Failed to load investment data');
      });

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
      const response = await axios.post(`${API_BASE_URL}/api/btc/update-nickname`, {
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
      if (err.response?.status === 404) {
        setError('Nickname update service unavailable. Please try again later.');
      } else if (err.response?.status === 400) {
        setError(err.response.data.error || 'Invalid nickname input.');
      } else {
        setError('Failed to update nickname. Check your connection.');
      }
    }
  };

  if (!data || !btcData) return <div style={styles.container}>{error || 'Loading...'}</div>;

  const chartData = Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    shares: (data.totalShares / 12) * (i + 1),
    dividends: (data.totalDividends / 12) * (i + 1)
  }));

  const customTooltipFormatter = (value, name) => {
    return name === 'dividends'
      ? [`$${value.toFixed(2)}`, labels.dividends]
      : [value.toFixed(2), labels.shares];
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>{labels.title} for {data.symbol}</h2>
      <p style={styles.stat}>
        <strong>{labels.totalShares}:</strong> {parseFloat(data.totalShares).toFixed(4)}
      </p>
      <p style={styles.stat}>
        <strong>{labels.totalDividends}:</strong> ${parseFloat(data.totalDividends).toFixed(2)}
      </p>
      <p style={styles.stat}>
        <strong>{labels.avgDividend}:</strong> ${data.weeklyDividendPerShare.toFixed(4)}
      </p>
      <p style={styles.stat}>
        <strong>{labels.totalInvestment}:</strong>{' '}
        {!isNaN(data.totalInvestmentUsd)
          ? `$${parseFloat(data.totalInvestmentUsd).toFixed(2)}`
          : 'N/A'}
      </p>
      <p style={styles.stat}>
        <strong>Profit/Loss (USD):</strong>{' '}
        <span style={{ color: data.profitOrLossUsd >= 0 ? 'green' : 'red' }}>
          {!isNaN(data.profitOrLossUsd)
            ? `$${parseFloat(data.profitOrLossUsd).toFixed(2)}`
            : 'N/A'}
        </span>
      </p>

      <div style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: window.innerWidth < 600 ? 10 : 30,
              bottom: 30,
              left: window.innerWidth < 600 ? 0 : 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: window.innerWidth < 600 ? 10 : 12 }}
            >
              <Label
                value={labels.week}
                offset={-10}
                position="insideBottom"
                style={{ fontSize: window.innerWidth < 600 ? '0.7rem' : '0.9rem' }}
              />
            </XAxis>
            <YAxis
              tick={{ fontSize: window.innerWidth < 600 ? 10 : 12 }}
              tickFormatter={value => `$${value.toFixed(0)}`}
            >
              <Label
                value="Value ($)"
                angle={-90}
                position="insideLeft"
                offset={window.innerWidth < 600 ? -5 : -10}
                style={{ fontSize: window.innerWidth < 600 ? '0.7rem' : '0.9rem' }}
              />
            </YAxis>
            <Tooltip
              formatter={customTooltipFormatter}
              labelFormatter={label => `${label}`}
              contentStyle={{
                fontSize: window.innerWidth < 600 ? '0.8rem' : '0.9rem',
                padding: '5px',
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconSize={window.innerWidth < 600 ? 10 : 14}
              wrapperStyle={{ fontSize: window.innerWidth < 600 ? '0.8rem' : '0.9rem' }}
            />
            <Line
              type="monotone"
              dataKey="shares"
              stroke="#8884d8"
              name={labels.shares}
              strokeWidth={window.innerWidth < 600 ? 1.5 : 2}
            />
            <Line
              type="monotone"
              dataKey="dividends"
              stroke="#82ca9d"
              name={labels.dividends}
              strokeWidth={window.innerWidth < 600 ? 1.5 : 2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {btcData && btcData.wallets && (
        <>
          <h3 style={styles.heading}>₿ BTC Wallet Summary</h3>
          {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
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
                        maxLength={50} // Match DB constraint
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
        </>
      )}
    </div>
  );
}

export default InvestPage;