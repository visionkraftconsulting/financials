import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { FaChartPie } from 'react-icons/fa';
import { AuthContext } from './AuthProvider';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4004';

const chainLabels = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  bsc: 'Binance Smart Chain',
  polygon: 'Polygon',
  avalanche: 'Avalanche',
  base: 'Base',
  solana: 'Solana'
};

const chainIdToKey = {
  '0x1': 'ethereum',
  '0x38': 'bsc',
  '0x89': 'polygon',
  '0xa86a': 'avalanche',
  '0x8453': 'base'
};

const coingeckoIds = {
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

function PortfolioPage() {
  const { logout } = useContext(AuthContext);
  const [invSummary, setInvSummary] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [walletSummaries, setWalletSummaries] = useState({});
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const [invRes, walRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/investments/summary`),
        axios.get(`${API_BASE_URL}/api/wallets`)
      ]);
      setInvSummary(invRes.data);
      const userWallets = walRes.data;
      setWallets(userWallets);

      // compute wallet summaries per chain
      const groups = userWallets.reduce((acc, w) => {
        acc[w.chain] = acc[w.chain] || [];
        acc[w.chain].push(w);
        return acc;
      }, {});
      const newSummaries = {};
      let walletsTotal = 0;
      for (const chainKey of Object.keys(groups)) {
        const group = groups[chainKey];
        if (chainKey === 'bitcoin') {
          const res = await axios.get(`${API_BASE_URL}/api/btc/summary`);
          newSummaries[chainKey] = { totalValueUsd: res.data.totalValueUsd };
          walletsTotal += res.data.totalValueUsd;
        } else if (chainKey === 'solana') {
          let totalLamports = 0;
          for (const w of group) {
            const resp = await fetch(SOLANA_RPC_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [w.walletAddress, { commitment: 'finalized' }] }),
            });
            const data = await resp.json();
            const bal = data.result.value;
            totalLamports += bal;
          }
          const solBal = totalLamports / LAMPORTS_PER_SOL;
          const priceRes = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`
          );
          const usd = solBal * priceRes.data.solana.usd;
          newSummaries[chainKey] = { totalValueUsd: usd };
          walletsTotal += usd;
        } else {
          const provider = ethers.getDefaultProvider(chainKey === 'ethereum' ? 'homestead' : chainKey);
          let totalWei = 0n;
          for (const w of group) {
            const balWei = await provider.getBalance(w.walletAddress);
            totalWei += balWei;
          }
          const bal = parseFloat(ethers.formatEther(totalWei));
          const cgId = coingeckoIds[chainKey];
          const priceRes = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`
          );
          const usd = bal * priceRes.data[cgId].usd;
          newSummaries[chainKey] = { totalValueUsd: usd };
          walletsTotal += usd;
        }
      }
      setWalletSummaries(newSummaries);
      const invTotal = invRes.data.totalValueUsd || 0;
      setTotalValue(invTotal + walletsTotal);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) logout();
      else {
        console.error('Fetch portfolio error:', err);
        setError('Failed to load portfolio');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-5">Loading portfolio...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container py-4">
      <h1 className="mb-4">Portfolio Overview</h1>
      <div className="row gx-3 gy-3 mb-4">
        <div className="col-md-4">
          <div className="card p-3">
            <div className="text-muted">Investments</div>
            <div className="fs-4 fw-bold">${(invSummary.totalValueUsd || 0).toLocaleString()}</div>
          </div>
        </div>
        {Object.entries(walletSummaries).map(([chainKey, data]) => (
          <div className="col-md-4" key={chainKey}>
            <div className="card p-3">
              <div className="text-muted">{chainLabels[chainKey]} Wallets</div>
              <div className="fs-4 fw-bold">${data.totalValueUsd.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card p-4 text-center">
        <FaChartPie className="me-2" />
        <span className="fs-3 fw-bold">Total Portfolio Value: ${totalValue.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default PortfolioPage;