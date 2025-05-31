import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { FaPlus, FaEdit, FaLink } from 'react-icons/fa';
import { AuthContext } from './AuthProvider';
import { ThemeContext } from './ThemeContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const chainLabels = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  bsc: 'Binance Smart Chain',
  polygon: 'Polygon',
  avalanche: 'Avalanche',
  base: 'Base',
  solana: 'Solana'
};

const chainOptions = Object.entries(chainLabels).map(([value, label]) => ({ value, label }));

const chainIdToKey = {
  '0x1': 'ethereum',
  '0x38': 'bsc',
  '0x89': 'polygon',
  '0xa86a': 'avalanche',
  '0x8453': 'base'
};

const coingeckoIds = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  bsc: 'binancecoin',
  polygon: 'matic-network',
  avalanche: 'avalanche-2',
  base: 'base',
  solana: 'solana'
};

const LAMPORTS_PER_SOL = 1e9;
// Solana RPC endpoint for balance queries
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';

const styles = {
  tableContainer: {
    borderRadius: '8px',
    overflowX: 'auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    marginBottom: '2rem',
    width: '100%',
    maxWidth: '100%',
  },
};

function WalletPage() {
  const { logout } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [wallets, setWallets] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newChain, setNewChain] = useState('bitcoin');
  const [newAddress, setNewAddress] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [nicknames, setNicknames] = useState({});

  useEffect(() => {
    fetchWallets();
  }, []);

  useEffect(() => {
    if (!loading) fetchSummaries();
  }, [wallets]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/wallets`);
      setWallets(res.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) logout();
      else {
        console.error('Fetch wallets error:', err);
        setError('Failed to load wallets');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaries = async () => {
    const groups = wallets.reduce((acc, w) => {
      acc[w.chain] = acc[w.chain] || [];
      acc[w.chain].push(w);
      return acc;
    }, {});
    const newSummaries = {};
    for (const chainKey of Object.keys(groups)) {
      const group = groups[chainKey];
      try {
        if (chainKey === 'bitcoin') {
          const res = await axios.get(`${API_BASE_URL}/api/btc/summary`);
          newSummaries[chainKey] = res.data;
    } else if (chainKey === 'solana') {
      let totalLamports = 0;
      const walletsData = await Promise.all(
        group.map(async w => {
          const resp = await fetch(SOLANA_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [w.walletAddress, { commitment: 'finalized' }] }),
          });
          const data = await resp.json();
          const bal = data.result.value;
          totalLamports += bal;
          return { ...w, balance: bal / LAMPORTS_PER_SOL };
        })
      );
      const totalBalance = totalLamports / LAMPORTS_PER_SOL;
      const cgId = coingeckoIds[chainKey];
      const priceRes = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`
      );
      const priceUsd = priceRes.data[cgId].usd;
      newSummaries[chainKey] = { wallets: walletsData, totalBalance, priceUsd, totalValueUsd: totalBalance * priceUsd };
        } else {
          const provider = ethers.getDefaultProvider(chainKey === 'ethereum' ? 'homestead' : chainKey);
          let totalWei = 0n;
          const walletsData = await Promise.all(
            group.map(async w => {
              const balWei = await provider.getBalance(w.walletAddress);
              totalWei += balWei;
              return { ...w, balanceWei: balWei };
            })
          );
          const totalBalance = parseFloat(ethers.formatEther(totalWei));
          const cgId = coingeckoIds[chainKey];
          const priceRes = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`
          );
          const priceUsd = priceRes.data[cgId].usd;
          const walletsFmt = walletsData.map(w => {
            const bal = parseFloat(ethers.formatEther(w.balanceWei));
            return { ...w, balance: bal, totalValueUsd: bal * priceUsd };
          });
          newSummaries[chainKey] = { wallets: walletsFmt, totalBalance, priceUsd, totalValueUsd: totalBalance * priceUsd };
        }
      } catch (err) {
        console.error(`Error fetching summary for ${chainKey}:`, err);
        setError(`Failed to fetch ${chainLabels[chainKey]} summary`);
      }
    }
    setSummaries(newSummaries);
  };

  const handleAddWallet = async () => {
    if (!newChain || !newAddress.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}/api/wallets`, {
        chain: newChain,
        walletAddress: newAddress.trim(),
        nickname: newNickname.trim() || null
      });
      setNewAddress('');
      setNewNickname('');
      fetchWallets();
    } catch (err) {
      console.error('Add wallet error:', err);
      setError('Failed to add wallet');
    }
  };

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      setError('No Ethereum provider found');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainKey = chainIdToKey[chainId];
      if (!chainKey) {
        setError('Unsupported network');
        return;
      }
      for (const addr of accounts) {
        await axios.post(`${API_BASE_URL}/api/wallets`, { chain: chainKey, walletAddress: addr, nickname: null });
      }
      fetchWallets();
    } catch (err) {
      console.error('Connect wallet error:', err);
      setError('Failed to connect wallet');
    }
  };

  const handleNicknameChange = (id, value) => setNicknames(prev => ({ ...prev, [id]: value }));

  const handleUpdateNickname = async (id, chainKey) => {
    const nickname = nicknames[id];
    if (nickname == null) return;
    try {
      await axios.put(`${API_BASE_URL}/api/wallets/${id}`, { chain: chainKey, nickname });
      fetchWallets();
    } catch (err) {
      console.error('Update nickname error:', err);
      setError('Failed to update nickname');
    }
  };

  if (loading) return <div className="text-center py-5">Loading wallets...</div>;

  return (
    <div className={`container py-4 ${theme === 'dark' ? 'bg-dark' : ''}`}>
      <h1 className="mb-4">Wallets & Portfolio</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="mb-4">
        <h2 className="h5">Add Wallet</h2>
        <div className="row gx-2 gy-3 align-items-end">
          <div className="col-auto">
            <label htmlFor="chainSelect" className="form-label">Chain</label>
            <select id="chainSelect" className="form-select" value={newChain} onChange={e => setNewChain(e.target.value)}>
              {chainOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="col-auto">
            <label htmlFor="addressInput" className="form-label">Address</label>
            <input id="addressInput" type="text" className="form-control" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Wallet address" />
          </div>
          <div className="col-auto">
            <label htmlFor="nicknameInput" className="form-label">Nickname (optional)</label>
            <input id="nicknameInput" type="text" className="form-control" value={newNickname} onChange={e => setNewNickname(e.target.value)} placeholder="Nickname" />
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" disabled={!newChain || !newAddress.trim()} onClick={handleAddWallet}><FaPlus className="me-1"/>Add Wallet</button>
            {newChain !== 'bitcoin' && <button className="btn btn-outline-secondary ms-2" onClick={handleConnectWallet}><FaLink className="me-1"/>Connect</button>}
          </div>
        </div>
      </div>

      {Object.keys(summaries).map(chainKey => {
        const summary = summaries[chainKey];
        if (!summary) return null;
        return (
          <div key={chainKey} className="mb-5">
            <h2 className="h6 text-capitalize mb-3">{chainLabels[chainKey]} Summary</h2>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3 mb-3">
              <div className="col"><div className="card p-3"><div>Total {chainKey === 'bitcoin' ? 'BTC' : chainKey === 'solana' ? 'SOL' : 'Balance'}</div><div className="fs-4 fw-bold">{chainKey === 'bitcoin' ? summary.totalBtc?.toFixed(8) : summary.totalBalance.toFixed(4)}</div></div></div>
              <div className="col"><div className="card p-3"><div>Price (USD)</div><div className="fs-4 fw-bold">${summary.priceUsd?.toLocaleString()}</div></div></div>
              <div className="col"><div className="card p-3"><div>Total Value (USD)</div><div className="fs-4 fw-bold">${summary.totalValueUsd?.toLocaleString()}</div></div></div>
              <div className="col"><div className="card p-3"><div>Wallets Tracked</div><div className="fs-4 fw-bold">{summary.wallets.length}</div></div></div>
            </div>
            <div className="card">
              <div
                className="table-container table-responsive"
                style={styles.tableContainer}
              >
                <table className={`table table-hover mb-0 ${theme === 'dark' ? 'table-dark' : ''}`}>
                  <thead>
                    <tr>
                      <th>Nickname</th>
                      <th>Address</th>
                      <th>{chainKey === 'bitcoin' ? 'BTC Balance' : chainKey === 'solana' ? 'SOL Balance' : 'Balance'}</th>
                      <th>USD Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.wallets.map(w => (
                      <tr key={w.id}>
                        <td>{w.nickname || 'Unnamed'}</td>
                        <td><a href={`https://${chainKey === 'bitcoin' ? 'www.blockchain.com/explorer/addresses/btc' : chainKey === 'solana' ? 'explorer.solana.com/address' : `${chainKey}.etherscan.io/address`}/${w.walletAddress}`} target="_blank" rel="noopener noreferrer">{w.walletAddress.slice(0,6)}...{w.walletAddress.slice(-4)}</a></td>
                        <td>{(chainKey === 'bitcoin' ? w.balanceBtc : w.balance).toFixed(chainKey === 'bitcoin' ? 8 : 4)}</td>
                        <td>${((chainKey === 'bitcoin' ? w.totalValueUsd : w.totalValueUsd) || 0).toLocaleString()}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              style={{ maxWidth: '140px' }}
                              value={(nicknames[w.id] ?? w.nickname) || ''}
                              onChange={e => handleNicknameChange(w.id, e.target.value)}
                              placeholder="Nickname"
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={!nicknames[w.id]?.trim()}
                              onClick={() => handleUpdateNickname(w.id, chainKey)}
                            >
                              <FaEdit />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}

    </div>
  );
}

export default WalletPage;