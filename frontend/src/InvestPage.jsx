import { useEffect as useEffect_, useState as useState_ } from 'react';
import React, { useEffect, useState, useContext, useMemo, useRef } from 'react';
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
  Label,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { FaBitcoin, FaWallet, FaChartLine, FaExchangeAlt, FaEdit } from 'react-icons/fa';

import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthProvider';
import { ThemeContext } from './ThemeContext';

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
  },
  heading: {
    fontSize: 'clamp(1.8rem, 5vw, 2.2rem)',
    fontWeight: '700',
    color: '#1a365d',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'translateY(-3px)',
    },
  },
  statTitle: {
    fontSize: '1rem',
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#2d3748',
  },
  profit: {
    color: '#38a169',
  },
  loss: {
    color: '#e53e3e',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  chartTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: '#f7fafc',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#4a5568',
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0',
    color: '#2d3748',
  },
  trHover: {
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8fafc',
    },
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.9rem',
    width: '100%',
    maxWidth: '150px',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '&:hover': {
      backgroundColor: '#3182ce',
    },
    '&:disabled': {
      backgroundColor: '#a0aec0',
      cursor: 'not-allowed',
    },
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
  },
  error: {
    backgroundColor: '#fff5f5',
    color: '#e53e3c',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    border: '1px solid #fed7d7',
  },
  walletIcon: {
    color: '#f6ad55',
    marginRight: '0.5rem',
  },
  totalRow: {
    fontWeight: 'bold',
    backgroundColor: '#ebf8ff',
  },
};

function InvestPage() {
  // User Investments state and fetch logic
  const [userInvestments, setUserInvestments] = useState_([]);
  const navigate = useNavigate();
  const { logout, user, token } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  // derive email from authenticated user
  const userEmail = user?.email;

  // Set up dynamic BASE_URL based on environment
  const BASE_URL =
    process.env.NODE_ENV === 'production'
      ? 'https://smartgrowthassets.com'
      : 'http://52.25.19.40:4005';
  const API_BASE_URL = BASE_URL;

  useEffect_(() => {
    if (!userEmail) return;
    const fetchUserInvestments = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/investments/user_investments`, {
          params: { email: userEmail },
        });
        setUserInvestments(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        console.error('Failed to load user investments:', err);
      }
    };
    fetchUserInvestments();
  }, [API_BASE_URL, userEmail, logout, navigate]);

  const shareTotalsBySymbol = useMemo(() => {
    const totals = {};
    userInvestments.forEach(inv => {
      totals[inv.symbol] = (totals[inv.symbol] || 0) + inv.shares;
    });
    return totals;
  }, [userInvestments]);

  const totalDividendsAll = useMemo(() => {
    return userInvestments.reduce((sum, inv) => {
      const invTotal = Array.isArray(inv.simulation)
        ? inv.simulation.reduce((s, r) => s + (r.dividends || 0), 0)
        : 0;
      return sum + invTotal;
    }, 0);
  }, [userInvestments]);

  const sumSharesAll = useMemo(
    () => Object.values(shareTotalsBySymbol).reduce((sum, v) => sum + v, 0),
    [shareTotalsBySymbol]
  );

  const sumAnnualDividendUsdAll = useMemo(
    () => userInvestments.reduce((sum, inv) => sum + (inv.annualDividendUsd || 0), 0),
    [userInvestments]
  );

  const [data, setData] = useState(null);
  const [btcData, setBtcData] = useState(null);
  const [nicknames, setNicknames] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newSymbol, setNewSymbol] = useState('');
  const [investmentType, setInvestmentType] = useState('stock');
  const [newShares, setNewShares] = useState('');
  const [newUsdValue, setNewUsdValue] = useState('');
  const [newInvestedAt, setNewInvestedAt] = useState('');
  const [newTrackDividends, setNewTrackDividends] = useState(true);
  const [lastChanged, setLastChanged] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [simulationYears, setSimulationYears] = useState(10);
  const [simulationResults, setSimulationResults] = useState(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const simulationRef = useRef(null);
  const [portfolioSimulation, setPortfolioSimulation] = useState(null);
  const [portfolioSimLoading, setPortfolioSimLoading] = useState(false);

  // Fetch investment and BTC data, optionally filtered by date and dividends tracking
  const fetchData = async () => {
    try {
      setLoading(true);
      const authHeader = { Authorization: `Bearer ${token}` };
      const [investments, btc] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/investments/summary`, {
          headers: authHeader,
          params: { start_date: startDate, end_date: endDate, track_dividends: newTrackDividends }
        }),
        axios.get(`${API_BASE_URL}/api/btc/summary`, { headers: authHeader })
      ]);

      setData(investments.data);
      setBtcData(btc.data);

      const initialNicknames = {};
      btc.data.wallets.forEach(wallet => {
        initialNicknames[wallet.walletAddress] = wallet.nickname || '';
      });
      setNicknames(initialNicknames);
    } catch (err) {
      console.error('Fetch error:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [API_BASE_URL, token]);

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
    } catch (err) {
      console.error('Nickname update error:', err);
      setError(err.response?.data?.error || 'Failed to update nickname');
    }
  };

  useEffect(() => {
    if (!token || !lastChanged || !newSymbol || !newInvestedAt) return;
    setCalcLoading(true);
    const authHeader = { Authorization: `Bearer ${token}` };
    axios.get(`${API_BASE_URL}/api/investments/price`, {
      headers: authHeader,
      params: { symbol: newSymbol, date: newInvestedAt }
    })
      .then(res => {
        const price = res.data.price;
        if (lastChanged === 'usd' && newUsdValue) {
          setNewShares((parseFloat(newUsdValue) / price).toFixed(4));
        } else if (lastChanged === 'shares' && newShares) {
          setNewUsdValue((parseFloat(newShares) * price).toFixed(2));
        }
      })
      .catch(err => {
        console.error('Price fetch error:', err);
        setError('Failed to fetch historical price');
      })
      .finally(() => {
        setCalcLoading(false);
        setLastChanged(null);
      });
  }, [API_BASE_URL, token, lastChanged, newSymbol, newInvestedAt, newUsdValue, newShares]);

  useEffect(() => {
    if (!token || !selectedInvestment?.symbol || !selectedInvestment?.investedAt || !simulationYears) return;
    console.log('🧮 Fetching simulation for', selectedInvestment.symbol, selectedInvestment.investedAt, 'for', simulationYears, 'years');
    setSimulationResults(null);
    setSimulationLoading(true);
    const authHeader = { Authorization: `Bearer ${token}` };
    axios.get(`${API_BASE_URL}/api/investments/simulation`, {
      headers: authHeader,
      params: {
        years: simulationYears,
        symbol: selectedInvestment.symbol,
        date: selectedInvestment.investedAt
      }
    })
      .then(res => {
        console.log('🧮 Simulation results received:', res.data.results);
        setSimulationResults(res.data.results);
      })
      .catch(err => {
        console.error('Simulation fetch error:', err);
        setError(err.response?.data?.details || err.response?.data?.error || 'Failed to load simulation');
      })
      .finally(() => setSimulationLoading(false));
  }, [API_BASE_URL, token, selectedInvestment, simulationYears]);

  // Scroll simulation table into view when dynamic results arrive
  useEffect(() => {
    if (simulationResults && simulationRef.current) {
      simulationRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simulationResults]);

  useEffect(() => {
    if (!token || !simulationYears) return;
    setPortfolioSimulation(null);
    setPortfolioSimLoading(true);
    const authHeader = { Authorization: `Bearer ${token}` };
    axios
      .get(`${API_BASE_URL}/api/investments/estimated_dividend_returns`, {
        headers: authHeader,
        params: { years: simulationYears }
      })
      .then(res => setPortfolioSimulation(res.data.results))
      .catch(err => {
        console.error('Estimated dividend returns fetch error:', err);
        setError('Failed to load estimated dividend returns');
      })
      .finally(() => setPortfolioSimLoading(false));
  }, [API_BASE_URL, token, simulationYears]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={{
            border: '4px solid rgba(66, 153, 225, 0.2)',
            borderTopColor: '#4299e1',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite',
          }} />
          <div>Loading investment data...</div>
        </div>
      </div>
    );
  }

  if (!data || !btcData) {
    return (
      <div style={styles.container}>
        {error && <div style={styles.error}>{error}</div>}
        <div>No data available</div>
      </div>
    );
  }

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const weeks = i + 1;
    const totalShares = Object.values(shareTotalsBySymbol).reduce((sum, v) => sum + v, 0);
    return {
      week: `W${weeks}`,
      shares: (totalShares / 12) * weeks,
      dividends: (totalDividendsAll / 12) * weeks
    };
  });

  const performanceData = [
    { name: 'Investment', value: data.totalInvestmentUsd },
    { name: 'Current', value: data.totalInvestmentUsd + data.profitOrLossUsd }
  ];

  const COLORS = ['#8884d8', '#82ca9d'];

  const profitPerShare = data.profitOrLossUsd / data.totalShares;


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <FaChartLine size={32} color="#4299e1" />
        <h1 style={styles.heading}>Investment Portfolio</h1>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Add investment form */}
      <div className="mb-4">
        <h2 className="h5">Add Investment</h2>
        <div className="row gx-2 gy-3 align-items-end">
          <div className="col-auto">
            <label htmlFor="symbol" className="form-label">Symbol</label>
            <input
              id="symbol"
              type="text"
              className="form-control"
              value={newSymbol}
              onChange={e => setNewSymbol(e.target.value.toUpperCase())}
            />
          </div>
          <div className="col-auto">
            <label htmlFor="investmentType" className="form-label">Type</label>
            <select
              id="investmentType"
              className="form-select"
              value={investmentType}
              onChange={e => setInvestmentType(e.target.value)}
            >
              <option value="stock">Stock</option>
              <option value="etf">ETF</option>
            </select>
          </div>
          <div className="col-auto">
            <label htmlFor="newInvestedAt" className="form-label">Date</label>
            <input
              id="newInvestedAt"
              type="date"
              className="form-control"
              value={newInvestedAt}
              onChange={e => setNewInvestedAt(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <label htmlFor="newUsdValue" className="form-label">USD Value</label>
            <input
              id="newUsdValue"
              type="number"
              step="any"
              className="form-control"
              value={newUsdValue}
              onChange={e => { setLastChanged('usd'); setNewUsdValue(e.target.value); }}
              disabled={calcLoading}
            />
          </div>
          <div className="col-auto">
            <label htmlFor="shares" className="form-label">Shares</label>
            <input
              id="shares"
              type="number"
              step="any"
              className="form-control"
              value={newShares}
              onChange={e => { setLastChanged('shares'); setNewShares(e.target.value); }}
              disabled={calcLoading}
            />
          </div>
          <div className="col-auto form-check">
            <input
              id="trackDividends"
              type="checkbox"
              className="form-check-input"
              checked={newTrackDividends}
              onChange={e => setNewTrackDividends(e.target.checked)}
            />
            <label htmlFor="trackDividends" className="form-check-label">Track Dividends</label>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await axios.post(`${API_BASE_URL}/api/investments`, {
                    symbol: newSymbol,
                    shares: parseFloat(newShares),
                    invested_at: newInvestedAt,
                    track_dividends: newTrackDividends
                  });
                  setNewSymbol(''); setNewShares(''); setNewInvestedAt(''); setNewTrackDividends(true);
                  fetchData();
                } catch (err) {
                  console.error('Add investment error:', err);
                  setError('Failed to save investment');
                }
              }}
              disabled={!newSymbol || !newInvestedAt || !newShares || calcLoading}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Filter by date range */}
      <div className="mb-4">
        <h2 className="h5">Filter Data</h2>
        <div className="row gx-2 gy-3 align-items-end">
          <div className="col-auto">
            <label htmlFor="startDate" className="form-label">Start Date</label>
            <input
              id="startDate"
              type="date"
              className="form-control"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <label htmlFor="endDate" className="form-label">End Date</label>
            <input
              id="endDate"
              type="date"
              className="form-control"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <button className="btn btn-secondary" onClick={fetchData}>
              Load Data
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="simulationYears" className="form-label">Years to Simulate</label>
        <input
          id="simulationYears"
          type="number"
          min="1"
          className="form-control"
          style={styles.input}
          value={simulationYears}
          onChange={e => setSimulationYears(Number(e.target.value) || 0)}
        />
      </div>

      {selectedInvestment && (
        simulationLoading ? (
          <div>Loading simulation...</div>
        ) : simulationResults ? (
          <div ref={simulationRef} className="table-container mb-4" style={styles.tableContainer}>
            <h3>Dividend Simulation for {selectedInvestment.symbol} ({simulationYears} yrs)</h3>
            <p>{selectedInvestment.shares} shares invested on {selectedInvestment.investedAt || selectedInvestment.invested_at?.split('T')[0]}</p>
            <table className={`table table-striped table-sm ${theme === 'dark' ? 'table-dark' : ''}`}>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Shares</th>
                  <th>Dividends ($)</th>
                  <th>Value ($)</th>
                </tr>
              </thead>
              <tbody>
                {simulationResults.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.year}</td>
                    <td>{row.totalShares.toFixed(4)}</td>
                    <td>{row.estimatedDividends.toFixed(2)}</td>
                    <td>{row.portfolioValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null
      )}

      {/* User Investments Table and Stats Grid with spacing */}
      <div>
        <h3>User Investments</h3>
        <div className="table-container" style={styles.tableContainer}>
          <table className={`table table-striped ${theme === 'dark' ? 'table-dark' : ''}`}>
            <thead>
              <tr>
                <th></th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Shares</th>
                <th>USD Value at Purchase</th>
                <th>USD Value</th>
                <th>Total Dividends</th>
                <th>Avg Dividend/Share</th>
                <th>Date</th>
                <th>Share P/L ($)</th>
                <th>Dividend P/L ($)</th>
                <th>Track Dividends</th>
              </tr>
            </thead>
            <tbody>
              {userInvestments.map((inv, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="radio"
                      name="selectedInvestment"
                      checked={selectedInvestment === inv}
                      onChange={() => setSelectedInvestment(inv)}
                    />
                  </td>
                <td onClick={() => setSelectedInvestment(inv)} style={{ cursor: 'pointer' }}>
                  {inv.symbol}
                </td>
                <td>{inv.type}</td>
                <td>{inv.shares}</td>
                <td>
                  ${(inv.usdInvested ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
                <td>
                  <span style={((inv.usdValue ?? 0) - (inv.usdInvested ?? 0)) >= 0 ? styles.profit : styles.loss}>
                    ${(inv.usdValue ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </td>
                <td>
                  ${(inv.totalDividends ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
                <td>
                  ${((inv.totalDividends ?? 0) / inv.shares).toFixed(4)}
                </td>
                <td>{inv.investedAt || inv.invested_at?.split('T')[0]}</td>
                <td>
                  <span style={inv.profitOrLossUsd >= 0 ? styles.profit : styles.loss}>
                    ${inv.profitOrLossUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {inv.profitOrLossUsd >= 0 ? ' ▲' : ' ▼'}
                  </span>
                </td>
                <td>
                  <span style={inv.annualDividendUsd >= 0 ? styles.profit : styles.loss}>
                    ${Math.abs(inv.annualDividendUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </td>
                <td>{inv.track_dividends === 1 || inv.track_dividends === true ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <div style={styles.statsGrid}>
            {Object.entries(shareTotalsBySymbol).map(([symbol, totalShares]) => (
              <div style={styles.statCard} className="card" key={symbol}>
                <div style={styles.statTitle}>
                  <FaExchangeAlt /> {symbol} Total Shares
                </div>
                <div style={{ ...styles.statValue, color: styles.statTitle.color }}>
                  {totalShares.toLocaleString(undefined, {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 4
                  })}
                </div>
              </div>
            ))}

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Total Dividends
              </div>
              <div style={{ ...styles.statValue, color: styles.statTitle.color }}>
                ${totalDividendsAll.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Avg Dividend/Share
              </div>
              <div style={{ ...styles.statValue, color: styles.statTitle.color }}>
                ${data.weeklyDividendPerShare.toFixed(4)}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Profit/Loss
              </div>
              <div style={{ 
                ...styles.statValue,
                ...(data.profitOrLossUsd >= 0 ? styles.profit : styles.loss)
              }}>
                ${Math.abs(data.profitOrLossUsd).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
                {data.profitOrLossUsd >= 0 ? ' ▲' : ' ▼'}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Profit/Loss per Share
              </div>
              <div style={{ 
                ...styles.statValue,
                ...(profitPerShare >= 0 ? styles.profit : styles.loss)
              }}>
                ${profitPerShare.toFixed(2)}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Dividend Returns
              </div>
              <div style={{ ...styles.statValue, color: styles.statTitle.color }}>
                ${totalDividendsAll.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ({(
                  totalDividendsAll /
                  Object.values(shareTotalsBySymbol).reduce((a, b) => a + b, 0)
                ).toFixed(2)} per share)
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Estimated Dividend Returns
              </div>
              <div style={{ ...styles.statValue, color: styles.statTitle.color }}>
                {portfolioSimLoading || !portfolioSimulation ? (
                  'Loading...'
                ) : (
                  <>
                    ${portfolioSimulation[simulationYears - 1].estimatedDividends.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    ({(
                      portfolioSimulation[simulationYears - 1].estimatedDividends /
                      portfolioSimulation[simulationYears - 1].totalShares
                    ).toFixed(2)} per share over {simulationYears} years)
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.chartContainer} className="card">
        <h2 style={styles.chartTitle}>
          <FaChartLine /> Investment Growth
        </h2>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="week" 
                tick={{ fill: '#4a5568' }}
                axisLine={{ stroke: '#cbd5e0' }}
              />
              <YAxis 
                tick={{ fill: '#4a5568' }}
                axisLine={{ stroke: '#cbd5e0' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'dividends' ? `$${value.toFixed(2)}` : value.toFixed(2),
                  name === 'dividends' ? 'Dividends' : 'Shares'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="shares"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Shares"
              />
              <Line
                type="monotone"
                dataKey="dividends"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Dividends ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.chartContainer} className="card">
        <h2 style={styles.chartTitle}>
          <FaChartLine /> Investment Performance
        </h2>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#4a5568' }}
                axisLine={{ stroke: '#cbd5e0' }}
              />
              <YAxis 
                tick={{ fill: '#4a5568' }}
                axisLine={{ stroke: '#cbd5e0' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="value" name="Value">
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.tableContainer} className="table-container">
        <h2 style={styles.chartTitle}>
          <FaBitcoin /> BTC Wallets
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nickname</th>
                <th style={styles.th}>Wallet Address</th>
                <th style={styles.th}>BTC Balance</th>
                <th style={styles.th}>Current Price</th>
                <th style={styles.th}>Total Value</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {btcData.wallets.map((wallet, index) => (
                <tr key={index} style={styles.trHover}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FaWallet style={styles.walletIcon} />
                      {wallet.nickname || 'Unnamed Wallet'}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}
                  </td>
                  <td style={styles.td}>{wallet.balanceBtc.toFixed(8)}</td>
                  <td style={styles.td}>
                    ${wallet.currentPriceUsd.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td style={styles.td}>
                    ${wallet.totalValueUsd.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        style={{ maxWidth: '150px' }}
                        value={nicknames[wallet.walletAddress] || ''}
                        onChange={(e) => handleNicknameChange(wallet.walletAddress, e.target.value)}
                        placeholder="Wallet name"
                        maxLength={50}
                      />
                      <button
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => updateNickname(wallet.walletAddress)}
                        disabled={!nicknames[wallet.walletAddress]?.trim()}
                      >
                        <FaEdit /> Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr style={styles.totalRow}>
                <td style={styles.td} colSpan="2">Total</td>
                <td style={styles.td}>{btcData.totalBtc.toFixed(8)}</td>
                <td style={styles.td}>
                  ${btcData.currentPriceUsd.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
                <td style={styles.td} colSpan="2">
                  ${btcData.totalValueUsd.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InvestPage;