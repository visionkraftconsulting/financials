import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { FaChartPie } from 'react-icons/fa';
import { AuthContext } from './AuthProvider';

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
  const { logout, user } = useContext(AuthContext);
  const [invSummary, setInvSummary] = useState(null);
  const [userInvestments, setUserInvestments] = useState([]);
  const [cryptoInvestments, setCryptoInvestments] = useState([]);
  const [cryptoTotalValue, setCryptoTotalValue] = useState(0);
  const [wallets, setWallets] = useState([]);
  const [walletSummaries, setWalletSummaries] = useState({});
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) fetchPortfolio();
  }, [user]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const [invRes, walRes, cryptoRes, userInvRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/investments/summary`),
        axios.get(`${API_BASE_URL}/api/wallets`),
        axios.get(`${API_BASE_URL}/api/investments/user_crypto_investments`, { params: { email: user.email } }),
        axios.get(`${API_BASE_URL}/api/investments/user_investments`, { params: { email: user.email } }),
      ]);
      setInvSummary(invRes.data);
      setUserInvestments(userInvRes.data);
      setCryptoInvestments(cryptoRes.data);
      const cryptoSum = cryptoRes.data.reduce((sum, inv) => sum + (inv.usdValue || 0), 0);
      setCryptoTotalValue(cryptoSum);
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
      setTotalValue(invTotal + cryptoSum + walletsTotal);
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
        <div className="col-md-4">
          <div className="card p-3">
            <div className="text-muted">Crypto Investments</div>
            <div className="fs-4 fw-bold">${cryptoTotalValue.toLocaleString()}</div>
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

      <div className="mt-5">
        <h2 className="mb-3">Asset Details</h2>

        {userInvestments.length > 0 && (
          <div className="table-responsive mb-4">
            <table className="table table-dark table-striped table-hover">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Invested (USD)</th>
                  <th>Current Value (USD)</th>
                  <th>Profit/Loss (USD)</th>
                </tr>
              </thead>
              <tbody>
                {userInvestments.map(inv => (
                  <tr key={`${inv.symbol}-${inv.investedAt}`}>
                    <td>{inv.symbol}</td>
                    <td>{inv.type}</td>
                    <td>{inv.shares}</td>
                    <td>{inv.usdInvested?.toLocaleString()}</td>
                    <td>{inv.usdValue?.toLocaleString()}</td>
                    <td className={inv.profitOrLossUsd >= 0 ? 'text-success' : 'text-danger'}>
                      {inv.profitOrLossUsd?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {cryptoInvestments.length > 0 && (
          <div className="table-responsive mb-4">
            <table className="table table-dark table-striped table-hover">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Amount</th>
                  <th>Invested (USD)</th>
                  <th>Current Value (USD)</th>
                  <th>Profit/Loss (USD)</th>
                </tr>
              </thead>
              <tbody>
                {cryptoInvestments.map(inv => (
                  <tr key={`${inv.symbol}-${inv.investedAt}`}>
                    <td>{inv.symbol}</td>
                    <td>{inv.amount}</td>
                    <td>{inv.usdInvested?.toLocaleString()}</td>
                    <td>{inv.usdValue?.toLocaleString()}</td>
                    <td className={inv.profitOrLossUsd >= 0 ? 'text-success' : 'text-danger'}>
                      {inv.profitOrLossUsd?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {Object.entries(walletSummaries).length > 0 && (
          <div className="table-responsive">
            <table className="table table-dark table-striped table-hover">
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Value (USD)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(walletSummaries).map(([chainKey, data]) => (
                  <tr key={chainKey}>
                    <td>{chainLabels[chainKey]} Wallets</td>
                    <td>${data.totalValueUsd.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

export default PortfolioPage;