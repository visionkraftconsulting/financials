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
import { BrowserProvider, JsonRpcProvider, formatEther } from 'ethers';
import EthereumProvider from '@walletconnect/ethereum-provider';
import UniversalProvider from '@walletconnect/universal-provider';
import { PhantomWalletName, WalletConnectWalletName } from '@solana/wallet-adapter-wallets';

// Solana
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

// Import mainnet chain configs for scalability
import {
  MAINNET_CHAINS_CONFIG,
  MAINNET_CHAINS,
  EVM_CHAINS,
  getTokenList
} from './controllers/MainnetController';
import { Contract, formatUnits } from 'ethers';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

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
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
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
    color: '#f0f0f0',
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
    padding: '1rem',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    overflowX: 'auto',
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
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    overflowX: 'auto',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: '#2d2d2d',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#e2e8f0',
    borderBottom: '1px solid #2a2a2a',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #2a2a2a',
    color: '#f0f0f0',
    backgroundColor: '#1e1e1e',
  },
  trHover: {
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2a2a2a',
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
    backgroundColor: '#333b4f',
  },
};

function InvestPage() {
  // User Investments state and fetch logic
  const [userInvestments, setUserInvestments] = useState_([]);
  const [lastUpdateTime, setLastUpdateTime] = useState_(null);
  const navigate = useNavigate();
  const { logout, user, token } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  // Solana wallet adapter
  const wallet = useWallet();

  // derive email from authenticated user
  const userEmail = user?.email;

  // Crypto investments state and options
  const [cryptoOptions, setCryptoOptions] = useState_([]);
  const [userCryptoInvestments, setUserCryptoInvestments] = useState_([]);
  const [cryptoLastUpdateTime, setCryptoLastUpdateTime] = useState_(null);
  const [newCryptoSymbol, setNewCryptoSymbol] = useState_('');
  const [newCryptoAmount, setNewCryptoAmount] = useState_('');
  const [newCryptoUsdValue, setNewCryptoUsdValue] = useState_('');
  const [newCryptoInvestedAt, setNewCryptoInvestedAt] = useState_('');
  const [cryptoLastChanged, setCryptoLastChanged] = useState_(null);
  const [cryptoCalcLoading, setCryptoCalcLoading] = useState_(false);
  const cryptoUsdValueRef = useRef(null);
  const cryptoAmountRef = useRef(null);
  const [selectedChain, setSelectedChain] = useState_('');
  // track multiple wallet connections per chain
  const [walletConnections, setWalletConnections] = useState_([]);
  // on-chain balances for each connected wallet
  const [walletAssets, setWalletAssets] = useState_([]);
  const [providerType, setProviderType] = useState_('metamask');

  /**
   * Return available wallet provider options based on selected chain.
   */
  const getProviderOptions = (chain) => {
    if (EVM_CHAINS.includes(chain)) {
      return [
        { value: 'metamask', label: 'MetaMask / WalletConnect' },
        { value: 'walletconnect', label: 'MetaMask / WalletConnect' }
      ];
    }
    if (chain === 'solana') {
      return [
        { value: 'solana-wallet-adapter', label: 'Phantom / Solflare' },
        { value: 'walletconnect-solana', label: 'WalletConnect (Solana)' }
      ];
    }
    if (chain === 'bitcoin') {
      return [
        { value: 'walletconnect-bitcoin', label: 'WalletConnect (BTC)' },
        { value: 'xverse', label: 'Xverse SDK' }
      ];
    }
    if (chain === 'xrpl') {
      return [
        { value: 'walletconnect-xrpl', label: 'WalletConnect (XRPL)' }
      ];
    }
    return [];
  };

  useEffect_(() => {
    const stored = localStorage.getItem('walletConnections');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWalletConnections(parsed);
        parsed.forEach(async ({ chain, address }) => {
          const { url, network } = MAINNET_CHAINS_CONFIG[chain];
          const rpcProvider = new JsonRpcProvider(url, network);
          await loadEVMAssets(rpcProvider, address, chain);
        });
        }
      } catch {}
    }
  }, []);

  useEffect_(() => {
    localStorage.setItem('walletConnections', JSON.stringify(walletConnections));
  }, [walletConnections]);
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Set up dynamic BASE_URL based on environment
  const BASE_URL =
    process.env.NODE_ENV === 'production'
      ? 'https://smartgrowthassets.com'
      : 'http://52.25.19.40:4005';
  const API_BASE_URL = BASE_URL;

  // Edit a user investment record via prompts
  const handleEdit = async (inv) => {
    const newShares = window.prompt('Enter new shares amount', inv.shares);
    if (newShares === null) return;
    const newDate = window.prompt('Enter new date (YYYY-MM-DD)', inv.investedAt);
    if (newDate === null) return;
    const track = window.confirm('Track dividends? OK = Yes, Cancel = No.');
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/investments/user_investments/${inv.symbol}/${inv.investedAt}`,
        {
          shares: parseFloat(newShares),
          invested_at: newDate,
          track_dividends: track,
        }
      );
      setUserInvestments((prev) =>
        prev.map((u) =>
          u.symbol === res.data.symbol && u.investedAt === res.data.invested_at ? res.data : u
        )
      );
      alert('Investment updated');
    } catch (err) {
      console.error('Failed to update investment', err);
      alert('Failed to update investment');
    }
  };

  useEffect_(() => {
    if (!userEmail) return;
    const fetchUserInvestments = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/investments/user_investments`, {
          params: { email: userEmail },
        });
        setUserInvestments(res.data);
        {
          const latest = res.data.reduce((max, inv) => inv.updated_at > max ? inv.updated_at : max, '');
          setLastUpdateTime(latest);
        }
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

  useEffect_(() => {
    if (!userEmail || lastUpdateTime === null) return;
    axios.post(`${API_BASE_URL}/api/investments/recalculate_user_investments`, { email: userEmail })
      .catch(err => console.error('Recalc trigger error:', err));

    const intervalId = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/investments/user_investments`, {
          params: { email: userEmail }
        });
        const latest = res.data.reduce((max, inv) => inv.updated_at > max ? inv.updated_at : max, '');
        if (latest !== lastUpdateTime) {
          setUserInvestments(res.data);
          setLastUpdateTime(latest);
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Polling user investments error:', err);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [API_BASE_URL, userEmail, lastUpdateTime]);

  // Fetch available crypto symbols for dropdown
  useEffect_(() => {
    if (!userEmail) return;
    const fetchCryptoOptions = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/crypto/investments`);
        setCryptoOptions(res.data);
      } catch (err) {
        console.error('Failed to load crypto options:', err);
      }
    };
    fetchCryptoOptions();
  }, [API_BASE_URL, userEmail]);

  // User Crypto Investments state and fetch logic
  useEffect_(() => {
    if (!userEmail) return;
    const fetchUserCrypto = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/investments/user_crypto_investments`,
          { params: { email: userEmail } }
        );
        setUserCryptoInvestments(res.data);
        const latest = res.data.reduce((max, inv) => inv.updated_at > max ? inv.updated_at : max, '');
        setCryptoLastUpdateTime(latest);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        console.error('Failed to load user crypto investments:', err);
      }
    };
    fetchUserCrypto();
  }, [API_BASE_URL, userEmail, logout, navigate]);

  // Trigger and poll crypto recalculation for profit/loss
  useEffect_(() => {
    if (!userEmail || cryptoLastUpdateTime === null) return;
    axios.post(
      `${API_BASE_URL}/api/investments/recalculate_user_crypto_investments`,
      { email: userEmail }
    ).catch(err => console.error('Recalc crypto trigger error:', err));

    const intervalId = setInterval(async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/investments/user_crypto_investments`,
          { params: { email: userEmail } }
        );
        const latest = res.data.reduce((max, inv) => inv.updated_at > max ? inv.updated_at : max, '');
        if (latest !== cryptoLastUpdateTime) {
          setUserCryptoInvestments(res.data);
          setCryptoLastUpdateTime(latest);
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Polling user crypto investments error:', err);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [API_BASE_URL, userEmail, cryptoLastUpdateTime, logout, navigate]);

  // Auto-calculate crypto USD value or amount based on historical price
  useEffect_(() => {
    if (!newCryptoSymbol || !newCryptoInvestedAt || !cryptoLastChanged) return;
    const investedDate = new Date(newCryptoInvestedAt);
    const todayDate = new Date(todayStr);
    if (investedDate > todayDate) {
      console.warn('Skipping crypto price fetch for future date', newCryptoInvestedAt);
      setCryptoCalcLoading(false);
      setCryptoLastChanged(null);
      return;
    }
    setCryptoCalcLoading(true);
    const fetchPrice = investedDate.getTime() === todayDate.getTime()
      ? axios.get(`${API_BASE_URL}/api/crypto/price/current`, { params: { symbol: newCryptoSymbol } })
      : axios.get(`${API_BASE_URL}/api/crypto/price/history`, { params: { symbol: newCryptoSymbol, date: newCryptoInvestedAt } });
    fetchPrice
      .then(res => {
        const price = res.data.price;
        if (cryptoLastChanged === 'usd' && newCryptoUsdValue) {
          setNewCryptoAmount((parseFloat(newCryptoUsdValue) / price).toFixed(8));
        } else if (cryptoLastChanged === 'amount' && newCryptoAmount) {
          setNewCryptoUsdValue((parseFloat(newCryptoAmount) * price).toFixed(2));
        }
      })
      .catch(err => {
        console.error('Crypto price fetch error:', err);
      })
      .finally(() => {
        setCryptoCalcLoading(false);
        setCryptoLastChanged(null);
      });
  }, [API_BASE_URL, newCryptoSymbol, newCryptoInvestedAt, newCryptoAmount, newCryptoUsdValue, cryptoLastChanged, todayStr]);

  // Auto-focus on the crypto last changed input field (usd or amount)
  useEffect(() => {
    if (cryptoLastChanged === 'usd') {
      cryptoUsdValueRef.current?.focus();
    } else if (cryptoLastChanged === 'amount') {
      cryptoAmountRef.current?.focus();
    }
  }, [cryptoLastChanged]);

  const connectWallet = async () => {
    if (!selectedChain) {
      alert('Please select a chain first.');
      return;
    }
    try {
      // ── Solana via adapter or WalletConnect Universal ──
      if (selectedChain === 'solana') {
        if (providerType === 'solana-wallet-adapter') {
          wallet.select(PhantomWalletName);
        } else {
          wallet.select(WalletConnectWalletName);
        }
        try {
          await wallet.connect();
        } catch (e) {
          if (e?.message?.includes('Unauthorized: origin not allowed')) {
            alert(
              `WalletConnect error: Unauthorized origin. Please whitelist ${window.location.origin} in your WalletConnect Cloud project settings.`
            );
            return;
          }
          throw e;
        }
        const addr = wallet.publicKey.toString();
        setWalletConnections(prev => [...prev, { chain: 'solana', address: addr }]);
        await loadSolanaAssets(addr);
        return;
      }

      // ── XRPL via WalletConnect Universal ──
      if (selectedChain === 'xrpl') {
        let addr;
        if (providerType === 'walletconnect-xrpl') {
          const xrpWc = await UniversalProvider.init({
            projectId: process.env.REACT_APP_WC_PROJECT_ID,
            metadata: { name: 'Smart Growth Assets', url: window.location.origin }
          });
        try {
          await xrpWc.connect({ chains: ['xrpl:0'] });
        } catch (e) {
          if (e?.message?.includes('Unauthorized: origin not allowed')) {
            alert(
              `WalletConnect error: Unauthorized origin. Please whitelist ${window.location.origin} in your WalletConnect Cloud project settings.`
            );
            return;
          }
          throw e;
        }
          const acct = xrpWc.accounts.find(a => a.startsWith('xrpl:'));
          addr = acct.split(':').pop();
        } else {
          alert('Please select WalletConnect for XRPL provider.');
          return;
        }
        setWalletConnections(prev => [...prev, { chain: 'xrpl', address: addr }]);
        await loadXRPLAssets(addr);
        return;
      }

      // ── Bitcoin via WalletConnect Universal or Xverse SDK ──
      if (selectedChain === 'bitcoin') {
        let addr;
        if (providerType === 'walletconnect-bitcoin') {
          const btcWc = await UniversalProvider.init({
            projectId: process.env.REACT_APP_WC_PROJECT_ID,
            metadata: { name: 'Smart Growth Assets', url: window.location.origin }
          });
          try {
            await btcWc.connect();
          } catch (e) {
            if (e?.message?.includes('Unauthorized: origin not allowed')) {
              alert(
                `WalletConnect error: Unauthorized origin. Please whitelist ${window.location.origin} in your WalletConnect Cloud project settings.`
              );
              return;
            }
            throw e;
          }
          const btcAccounts = btcWc.accounts.filter(a => a.startsWith('bip122:000000000019d6689c085ae165831e93'));
          addr = btcAccounts[0].split(':').pop();
          setWalletConnections(prev => [...prev, { chain: 'bitcoin', address: addr }]);
          await loadBitcoinAssets(addr);
          return;
        } else {
          let addr;
          try {
            const { default: XverseConnectModal } = await import('@xverse/connect');
            const xverseModal = new XverseConnectModal({
              appName: 'Smart Growth Assets',
              appIcon: 'https://smartgrowthassets.',
              network: 'mainnet'
            });
            await xverseModal.connect();
            addr = xverseModal.walletAddress || xverseModal.publicKey || xverseModal.address;
          } catch {
            if (window.xverse) {
              addr = await window.xverse.getAddress();
            } else {
              alert('Xverse Wallet not detected. Please install the Xverse browser extension or configure @xverse/connect.');
              return;
            }
          }
          setWalletConnections(prev => [...prev, { chain: 'bitcoin', address: addr }]);
          await loadBitcoinAssets(addr);
          return;
        }
      }

      let web3Provider;
      if (providerType === 'walletconnect') {
        // WalletConnect v2 provider (EIP-1193)
        const wcProvider = await EthereumProvider.init({
          projectId: process.env.REACT_APP_WC_PROJECT_ID,
          chains: [MAINNET_CHAINS_CONFIG[selectedChain].network.chainId],
          showQrModal: true,
        });
        await wcProvider.connect();
        await wcProvider.request({ method: 'eth_requestAccounts' });
        web3Provider = new BrowserProvider(
          wcProvider,
          MAINNET_CHAINS_CONFIG[selectedChain].network
        );
      } else {
        if (!window.ethereum) {
          alert('MetaMask not detected. Please install MetaMask to connect your wallet.');
          return;
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        web3Provider = new BrowserProvider(
          window.ethereum,
          MAINNET_CHAINS_CONFIG[selectedChain].network
        );
      }
      const signer = await web3Provider.getSigner();
      const address = await signer.getAddress();
      
      let ensName = null;
      if (selectedChain === 'ethereum') {
        try {
          const rpcProvider = new JsonRpcProvider(
            MAINNET_CHAINS_CONFIG.ethereum.url,
            MAINNET_CHAINS_CONFIG.ethereum.network
          );
          ensName = await rpcProvider.lookupAddress(address);
        } catch {}
      }
      setWalletConnections(prev => {
        if (prev.some(c => c.chain === selectedChain && c.address === address)) {
          return prev;
        }
        return [...prev, { chain: selectedChain, address, ensName }];
      });
      
      for (const chain of EVM_CHAINS) {
        const { url, network } = MAINNET_CHAINS_CONFIG[chain];
        const rpcProvider = new JsonRpcProvider(url, network);
        await loadEVMAssets(rpcProvider, address, chain);
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
    }
  };

  /** remove a specific wallet connection and its assets */
  const disconnectWallet = (chain, address) => {
    setWalletConnections(prev => prev.filter(c => !(c.chain === chain && c.address === address)));
    setWalletAssets(prev => prev.filter(a => !(a.chain === chain && a.address === address)));
  };

  const combinedCryptoInvestments = useMemo(
    () => [...userCryptoInvestments, ...walletAssets],
    [userCryptoInvestments, walletAssets]
  );

// Minimal ERC-20 ABI for balance queries
const ERC20_ABI = ['function balanceOf(address owner) view returns (uint256)'];
/**
 * Load native balance and configured ERC-20 token balances for an EVM chain.
 */
const loadEVMAssets = async (provider, address, chain) => {
  try {
    // Native balance
    const balance = await provider.getBalance(address);
    const amount = parseFloat(formatEther(balance));
    let symbol = 'ETH';
    if (chain === 'binance-smart-chain') symbol = 'BNB';
    else if (chain === 'polygon') symbol = 'MATIC';
    const priceRes = await axios.get(
      `${API_BASE_URL}/api/crypto/price/current`,
      { params: { symbol } }
    );
    const price = priceRes.data.price;
    setWalletAssets(prev => [
      ...prev,
      { chain, address, symbol, amount, usdInvested: 0, usdValue: amount * price, profitOrLossUsd: 0, profitOrLossPerUnit: 0, investedAt: '' },
    ]);
    // ERC-20 tokens configured for this chain
    const tokenList = getTokenList(chain);
    for (const tokenInfo of tokenList) {
      try {
        const tokenContract = new Contract(tokenInfo.address, ERC20_ABI, provider);
        const raw = await tokenContract.balanceOf(address);
        if (raw.gt(0)) {
          const amt = parseFloat(formatUnits(raw, tokenInfo.decimals));
          const pr = await axios.get(
            `${API_BASE_URL}/api/crypto/price/current`,
            { params: { symbol: tokenInfo.symbol } }
          );
          const p = pr.data.price;
          setWalletAssets(prev => [
            ...prev,
            { chain, address, symbol: tokenInfo.symbol, amount: amt, usdInvested: 0, usdValue: amt * p, profitOrLossUsd: 0, profitOrLossPerUnit: 0, investedAt: '' },
          ]);
        }
      } catch (err) {
        console.warn(`Skipping token ${tokenInfo.symbol} on ${chain} due to error:`, err);
      }
    }
  } catch (err) {
    console.warn(`Skipping ${chain} assets due to error:`, err);
  }
};

/**
 * Load SOL balance for a Solana address via RPC and fetch USD price.
 */
const loadSolanaAssets = async (address) => {
  try {
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    const lamports = await connection.getBalance(new PublicKey(address));
    const sol = lamports / 1e9;
    const priceRes = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`
    );
    const price = priceRes.data.solana.usd;
    setWalletAssets(prev => [
      ...prev,
      { chain: 'solana', address, symbol: 'SOL', amount: sol, usdInvested: 0, usdValue: sol * price, profitOrLossUsd: 0, profitOrLossPerUnit: 0, investedAt: '' },
    ]);
    // SPL token balances
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(address),
      { programId: TOKEN_PROGRAM_ID }
    );
    for (const { account: { data: { parsed: { info } } } } of tokenAccounts.value) {
      const amt = info.tokenAmount.uiAmount;
      const mint = info.mint;
      if (amt > 0) {
        try {
          const tkRes = await axios.get(
            `https://api.coingecko.com/api/v3/simple/token_price/solana`,
            { params: { contract_addresses: mint, vs_currencies: 'usd' } }
          );
          const priceToken = tkRes.data[mint.toLowerCase()]?.usd || 0;
          setWalletAssets(prev => [
            ...prev,
            { chain: 'solana', address, symbol: mint.slice(0, 6), amount: amt, usdInvested: 0, usdValue: amt * priceToken, profitOrLossUsd: 0, profitOrLossPerUnit: 0, investedAt: '' },
          ]);
        } catch (err) {
          console.warn('Skipping SPL token', mint, 'due to error:', err);
        }
      }
    }
  } catch (err) {
    console.warn('Skipping solana assets due to error:', err);
  }
};

/**
 * Load BTC balance via WalletConnect Universal provider or Xverse.
 */
const loadBitcoinAssets = async (address) => {
  try {
    const priceRes = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
    );
    const price = priceRes.data.bitcoin.usd;
    const satoshis = await fetch(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`
    )
      .then(r => r.json())
      .then(d => d.final_balance);
    const btc = satoshis / 1e8;
    setWalletAssets(prev => [
      ...prev,
      { chain: 'bitcoin', address, symbol: 'BTC', amount: btc, usdInvested: 0, usdValue: btc * price, profitOrLossUsd: 0, profitOrLossPerUnit: 0, investedAt: '' },
    ]);
  } catch (err) {
    console.warn('Skipping bitcoin assets due to error:', err);
  }
};

/**
 * Load XRP and issued currencies via XRPL public API and fetch USD price.
 */
const loadXRPLAssets = async (address) => {
  try {
    const res = await axios.get(`https://data.ripple.com/v2/accounts/${address}/balances`);
    for (const b of res.data.balances) {
      const symbol = b.currency;
      const amount = parseFloat(b.value);
      let price = 0;
      if (symbol === 'XRP') {
        const pr = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price`,
          { params: { ids: 'ripple', vs_currencies: 'usd' } }
        );
        price = pr.data.ripple.usd;
      }
      setWalletAssets(prev => [
        ...prev,
        { chain: 'xrpl', address, symbol, amount, usdInvested: 0, usdValue: amount * price, profitOrLossUsd: 0, profitOrLossPerUnit: 0, investedAt: '' }
      ]);
    }
  } catch (err) {
    console.warn('Skipping xrpl assets due to error:', err);
  }
};

  const shareTotalsBySymbol = useMemo(() => {
    const totals = {};
    userInvestments.forEach(inv => {
      const qty = inv.adjustedShares ?? inv.shares;
      totals[inv.symbol] = (totals[inv.symbol] || 0) + qty;
    });
    return totals;
  }, [userInvestments]);

  const sumTotalDividendsUsd = useMemo(
    () => userInvestments.reduce((sum, inv) => sum + (inv.totalDividends || 0), 0),
    [userInvestments]
  );

  const sumProfitLossUsd = useMemo(
    () => userInvestments.reduce((sum, inv) => sum + (inv.profitOrLossUsd || 0), 0),
    [userInvestments]
  );

  const sumSharesAll = useMemo(
    () => Object.values(shareTotalsBySymbol).reduce((sum, v) => sum + v, 0),
    [shareTotalsBySymbol]
  );

  const sumAnnualDividendUsdAll = useMemo(
    () => userInvestments.reduce((sum, inv) => sum + (inv.annualDividendUsd || 0), 0),
    [userInvestments]
  );
  const sumStockUsdInvested = useMemo(
    () => userInvestments.reduce((sum, inv) => sum + (inv.usdInvested || 0), 0),
    [userInvestments]
  );
  const sumStockUsdValue = useMemo(
    () => userInvestments.reduce((sum, inv) => sum + (inv.usdValue || 0), 0),
    [userInvestments]
  );

  const cryptoTotalsBySymbol = useMemo(() => {
    const totals = {};
    userCryptoInvestments.forEach(inv => {
      totals[inv.symbol] = (totals[inv.symbol] || 0) + inv.amount;
    });
    return totals;
  }, [userCryptoInvestments]);

  const sumCryptoAmountAll = useMemo(
    () => Object.values(cryptoTotalsBySymbol).reduce((sum, v) => sum + v, 0),
    [cryptoTotalsBySymbol]
  );

  const sumCryptoUsdInvested = useMemo(
    () => userCryptoInvestments.reduce((sum, inv) => sum + (inv.usdInvested || 0), 0),
    [userCryptoInvestments]
  );

  const sumCryptoUsdValue = useMemo(
    () => userCryptoInvestments.reduce((sum, inv) => sum + (inv.usdValue || 0), 0),
    [userCryptoInvestments]
  );

  const sumCryptoProfitLossUsd = useMemo(
    () => userCryptoInvestments.reduce((sum, inv) => sum + (inv.profitOrLossUsd || 0), 0),
    [userCryptoInvestments]
  );

  const [portfolioSimulation, setPortfolioSimulation] = useState(null);
  const [portfolioSimLoading, setPortfolioSimLoading] = useState(false);
  const [estimatedUsdValue, setEstimatedUsdValue] = useState(0);
  const [estimatedUsdLoading, setEstimatedUsdLoading] = useState(false);

  const estimatedDividendReturnsAll = useMemo(
    () => portfolioSimulation
      ? portfolioSimulation.reduce((sum, r) => sum + (r.estimatedDividends || 0), 0)
      : 0,
    [portfolioSimulation]
  );

  const netProfitUsd = useMemo(
    () => sumTotalDividendsUsd + sumProfitLossUsd,
    [sumTotalDividendsUsd, sumProfitLossUsd],
  );

  const totalEstimatedReturnUsd = useMemo(
    () => estimatedDividendReturnsAll + estimatedUsdValue,
    [estimatedDividendReturnsAll, estimatedUsdValue],
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
  const [newInvestedAt, setNewInvestedAt] = useState(() => new Date().toISOString().slice(0, 10));
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

  // Refs for auto-focus on input fields
  const usdValueRef = useRef(null);
  const sharesRef = useRef(null);

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

  // Auto-focus on the last changed input field (usd or shares)
  useEffect(() => {
    if (lastChanged === 'usd') {
      usdValueRef.current?.focus();
    } else if (lastChanged === 'shares') {
      sharesRef.current?.focus();
    }
  }, [lastChanged]);

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

  useEffect(() => {
    if (!token || !simulationYears) return;
    setEstimatedUsdLoading(true);
    const authHeader = { Authorization: `Bearer ${token}` };
    axios
      .get(`${API_BASE_URL}/api/investments/estimated_usd_value`, {
        headers: authHeader,
        params: { years: simulationYears }
      })
      .then(res => setEstimatedUsdValue(res.data.totalValue))
      .catch(err => {
        console.error('Estimated USD value fetch error:', err);
        setError('Failed to load estimated USD value');
      })
      .finally(() => setEstimatedUsdLoading(false));
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
    dividends: (sumTotalDividendsUsd / 12) * weeks
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
        <button
          style={styles.button}
          onClick={() => { window.location.href = `${API_BASE_URL}/api/auth/schwab/login`; }}
        >
          Connect Charles Schwab
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Add investment form */}
      <div className="mb-4">
        <h2 className="h5">Add Investment</h2>
        <div className="row gx-3 gy-2 align-items-end">
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
              ref={usdValueRef}
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
              ref={sharesRef}
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
                    type: investmentType,
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

      {/* Add Crypto Investment form */}
      <div className="mb-4">
        <h2 className="h5">Add Crypto</h2>
        <div className="row gx-3 gy-2 align-items-end">
          <div className="col-auto">
            <label htmlFor="cryptoSymbol" className="form-label">Symbol</label>
            <select
              id="cryptoSymbol"
              className="form-select"
              value={newCryptoSymbol}
              onChange={e => setNewCryptoSymbol(e.target.value)}
            >
              <option value="">Select...</option>
              {cryptoOptions.map(opt => (
                <option key={opt.symbol} value={opt.symbol}>{opt.symbol} - {opt.name}</option>
              ))}
            </select>
          </div>
          <div className="col-auto">
            <label htmlFor="cryptoInvestedAt" className="form-label">Date</label>
            <input
              id="cryptoInvestedAt"
              type="date"
              className="form-control"
              value={newCryptoInvestedAt}
              onChange={e => {
                const v = e.target.value;
                if (new Date(v) > new Date(todayStr)) {
                  setNewCryptoInvestedAt(todayStr);
                } else {
                  setNewCryptoInvestedAt(v);
                }
              }}
              max={todayStr}
            />
          </div>
          <div className="col-auto">
            <label htmlFor="cryptoAmount" className="form-label">Amount</label>
            <input
              id="cryptoAmount"
              type="number"
              step="any"
              className="form-control"
              value={newCryptoAmount}
              onChange={e => { setCryptoLastChanged('amount'); setNewCryptoAmount(e.target.value); }}
              ref={cryptoAmountRef}
              disabled={cryptoCalcLoading}
            />
          </div>
          <div className="col-auto">
            <label htmlFor="cryptoUsdValue" className="form-label">USD Value</label>
            <input
              id="cryptoUsdValue"
              type="number"
              step="any"
              className="form-control"
              value={newCryptoUsdValue}
              onChange={e => { setCryptoLastChanged('usd'); setNewCryptoUsdValue(e.target.value); }}
              ref={cryptoUsdValueRef}
              disabled={cryptoCalcLoading}
            />
          </div>
          <div className="col-auto">
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await axios.post(`${API_BASE_URL}/api/investments/crypto`, {
                    symbol: newCryptoSymbol,
                    amount: parseFloat(newCryptoAmount),
                    invested_at: newCryptoInvestedAt
                  });
                  setNewCryptoSymbol('');
                  setNewCryptoAmount('');
                  setNewCryptoUsdValue('');
                  setNewCryptoInvestedAt('');
                  // Reload crypto investments
                  const res = await axios.get(
                    `${API_BASE_URL}/api/investments/user_crypto_investments`,
                    { params: { email: userEmail } }
                  );
                  setUserCryptoInvestments(res.data);
                  const latest = res.data.reduce((m, inv) => inv.updated_at > m ? inv.updated_at : m, '');
                  setCryptoLastUpdateTime(latest);
                } catch (err) {
                  console.error('Add crypto investment error:', err);
                  setError('Failed to save crypto investment');
                }
              }}
              disabled={
                !newCryptoSymbol ||
                !newCryptoInvestedAt ||
                !newCryptoAmount ||
                cryptoCalcLoading ||
                new Date(newCryptoInvestedAt) > new Date(todayStr)
              }
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Filter by date range */}
      <div className="mb-4">
        <h2 className="h5">Filter Data</h2>
        <div className="row gx-3 gy-2 align-items-end">
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
                  <th>$ Dividends</th>
                  <th>$ Value</th>
                </tr>
              </thead>
              <tbody>
                {simulationResults.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.year}</td>
                    <td>
                      {row.totalShares.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td>
                      {row.estimatedDividends.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td>
                      {row.portfolioValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
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
        <div className="table-responsive" style={styles.tableContainer}>
          <table
            className="user-investments-table table"
            style={{
              ...styles.table,
              backgroundColor: styles.tableContainer.backgroundColor,
            }}
          >
            <thead>
              <tr>
                <th style={styles.th} className="text-center align-middle"></th>
                <th style={styles.th} className="text-center align-middle">Symbol</th>
                <th style={styles.th} className="text-center align-middle">Type</th>
                <th style={styles.th} className="text-center align-middle">Shares</th>
                <th style={styles.th} className="text-center align-middle">Purchase USD Value</th>
                <th style={styles.th} className="text-center align-middle">USD Value</th>
                <th style={styles.th} className="text-center align-middle">Total Dividends</th>
                <th style={styles.th} className="text-center align-middle">Dividend/Share</th>
                <th style={styles.th} className="text-center align-middle">Date</th>
                <th style={styles.th} className="text-center align-middle">Share P/L ($)</th>
                <th style={styles.th} className="text-center align-middle">Dividend P/L ($)</th>
                <th style={styles.th} className="text-center align-middle">Track Dividends</th>
                <th style={styles.th} className="text-center align-middle">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userInvestments.map((inv, idx) => (
                <tr key={idx} style={styles.trHover}>
                  <td style={styles.td} className="text-center align-middle">
                    <input
                      type="radio"
                      name="selectedInvestment"
                      checked={selectedInvestment === inv}
                      onChange={() => setSelectedInvestment(inv)}
                    />
                  </td>
                  <td
                    style={{ ...styles.td, cursor: 'pointer' }}
                    className="text-center align-middle"
                    onClick={() => setSelectedInvestment(inv)}
                  >
                    {inv.symbol}
                  </td>
                  <td style={styles.td} className="text-center align-middle">{inv.type.toUpperCase()}</td>
                  <td style={styles.td} className="text-center align-middle">{Number(inv.shares).toFixed(2)}</td>
                  <td style={styles.td} className="text-center align-middle">
                    ${(inv.usdInvested ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td style={styles.td} className="text-center align-middle">
                    <span style={((inv.usdValue ?? 0) - (inv.usdInvested ?? 0)) >= 0 ? styles.profit : styles.loss}>
                      <strong>
                        ${(inv.usdValue ?? 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </strong>
                    </span>
                  </td>
                  <td style={styles.td} className="text-center align-middle">
                    <strong>
                      ${(inv.totalDividends ?? 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </strong>
                  </td>
                  <td style={styles.td} className="text-center align-middle">
                    ${(inv.avg_dividend_per_share ?? 0).toFixed(4)}
                  </td>
                  <td style={styles.td} className="text-center align-middle">{inv.investedAt || inv.invested_at?.split('T')[0]}</td>
                  <td style={styles.td} className="text-center align-middle">
                    <span style={inv.profitOrLossUsd >= 0 ? styles.profit : styles.loss}>
                      <strong>
                        ${inv.profitOrLossUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {inv.profitOrLossUsd >= 0 ? ' ▲' : ' ▼'}
                      </strong>
                    </span>
                  </td>
                  <td style={styles.td} className="text-center align-middle">
                    <span style={inv.totalDividends >= 0 ? styles.profit : styles.loss}>
                      <strong>
                        ${(inv.totalDividends ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </span>
                  </td>
                  <td style={styles.td} className="text-center align-middle">
                    {inv.track_dividends === 1 || inv.track_dividends === true ? 'Yes' : 'No'}
                  </td>
                  <td style={styles.td} className="text-center align-middle">
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(inv)}>
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Add spacing before Crypto Investments */}
        <div className="mt-5">
        {/* Crypto Investments Table */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
        <label htmlFor="chain-select" style={{ color: '#e2e8f0' }}>Select chain:</label>
        <select
          id="chain-select"
          value={selectedChain}
          onChange={e => setSelectedChain(e.target.value)}
        >
          <option value="">--Choose chain--</option>
          {MAINNET_CHAINS.map(key => (
            <option key={key} value={key}>
              {MAINNET_CHAINS_CONFIG[key].name}
            </option>
          ))}
        </select>
        <label htmlFor="provider-select" style={{ color: '#e2e8f0' }}>Provider:</label>
        <select
          id="provider-select"
          value={providerType}
          onChange={e => setProviderType(e.target.value)}
        >
          {getProviderOptions(selectedChain).map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          style={styles.button}
          onClick={connectWallet}
          disabled={!selectedChain}
        >
          <FaWallet /> Connect Wallet
        </button>
        {walletConnections.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {walletConnections.map(({ chain, address, ensName }, idx) => (
              <div
                key={`${chain}-${address}-${idx}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <button style={styles.button} disabled>
                  <FaWallet /> {chain}: {ensName || `${address.slice(0, 6)}...${address.slice(-4)}`}
                </button>
                <button
                  style={styles.button}
                  onClick={() => disconnectWallet(chain, address)}
                >
                  Disconnect
                </button>
                <button
                  style={styles.button}
                  disabled
                >
                  Provider: {providerType}
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
          <div
            className="table-responsive mb-4"
            style={{
              ...styles.tableContainer,
              backgroundColor: '#1e1e1e',
              padding: '1rem',
              borderRadius: '12px',
            }}
          >
            <h3 style={{ color: '#e2e8f0' }}>Crypto Investments</h3>
            <table
              className="table"
              style={{
                ...styles.table,
                backgroundColor: styles.tableContainer.backgroundColor,
              }}
            >
              <thead>
                <tr>
                  <th style={styles.th} className="text-center align-middle">Symbol</th>
                  <th style={styles.th} className="text-center align-middle">Amount</th>
                  <th style={styles.th} className="text-center align-middle">Purchase USD Value</th>
                  <th style={styles.th} className="text-center align-middle">USD Value</th>
                  <th style={styles.th} className="text-center align-middle">P/L USD</th>
                  <th style={styles.th} className="text-center align-middle">P/L per Unit</th>
                  <th style={styles.th} className="text-center align-middle">Date</th>
                </tr>
              </thead>
              <tbody>
                {combinedCryptoInvestments.map((inv, idx) => (
                  <tr key={idx} style={styles.trHover}>
                    <td style={styles.td} className="text-center align-middle">{inv.symbol}</td>
                    <td style={styles.td} className="text-center align-middle">{inv.amount.toFixed(6)}</td>
                    <td style={styles.td} className="text-center align-middle">
                      ${(inv.usdInvested ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={styles.td} className="text-center align-middle">
                      ${(inv.usdValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={styles.td} className="text-center align-middle">
                      <span style={inv.profitOrLossUsd >= 0 ? styles.profit : styles.loss}>
                        <strong>
                          ${inv.profitOrLossUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>
                      </span>
                    </td>
                    <td style={styles.td} className="text-center align-middle">
                      <span style={inv.profitOrLossPerUnit >= 0 ? styles.profit : styles.loss}>
                        <strong>{inv.profitOrLossPerUnit.toFixed(6)}</strong>
                      </span>
                    </td>
                    <td style={styles.td} className="text-center align-middle">{inv.investedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <div style={styles.statsGrid}>
            {Object.entries(cryptoTotalsBySymbol).map(([symbol, totalAmount]) => (
              <div style={styles.statCard} className="card" key={symbol}>
                <div style={styles.statTitle}>
                  <FaBitcoin /> {symbol} Total Amount
                </div>
                <div style={styles.statValue}>
                  {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </div>
              </div>
            ))}

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaBitcoin /> Total Crypto Amount
              </div>
              <div style={styles.statValue}>
                {sumCryptoAmountAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaWallet /> Total Invested USD
              </div>
              <div style={{ ...styles.statValue, ...(sumCryptoUsdInvested >= 0 ? styles.profit : styles.loss) }}>
                ${sumCryptoUsdInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaWallet /> Total Current USD
              </div>
              <div style={{ ...styles.statValue, ...(sumCryptoUsdValue >= 0 ? styles.profit : styles.loss) }}>
                ${sumCryptoUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaChartLine /> Total P/L USD
              </div>
              <div style={{ ...styles.statValue, ...(sumCryptoProfitLossUsd >= 0 ? styles.profit : styles.loss) }}>
                ${Math.abs(sumCryptoProfitLossUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {sumCryptoProfitLossUsd >= 0 ? ' ▲' : ' ▼'}
              </div>
            </div>
          </div>
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
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            ))}

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaWallet /> Total Invested USD
              </div>
              <div style={{ ...styles.statValue, ...(sumStockUsdInvested >= 0 ? styles.profit : styles.loss) }}>
                ${sumStockUsdInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaWallet /> Total Current USD
              </div>
              <div style={{ ...styles.statValue, ...(sumStockUsdValue >= 0 ? styles.profit : styles.loss) }}>
                ${sumStockUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>


            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Profit/Loss
              </div>
              <div style={{
                ...styles.statValue,
                ...(sumProfitLossUsd >= 0 ? styles.profit : styles.loss)
              }}>
                ${Math.abs(sumProfitLossUsd).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
                {sumProfitLossUsd >= 0 ? ' ▲' : ' ▼'}
              </div>
            </div>


            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Dividend Returns
              </div>
              <div style={{ ...styles.statValue, ...styles.profit }}>
                ${sumTotalDividendsUsd.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Estimated Dividend Returns
                <span style={{ fontWeight: 400, fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                  (over {simulationYears} yrs)
                </span>
              </div>
              <div style={{ ...styles.statValue, ...styles.profit }}>
                {portfolioSimLoading || !portfolioSimulation ? (
                  'Loading...'
                ) : (
                  <>
                    ${estimatedDividendReturnsAll.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </>
                )}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Estimated USD Value
                <span style={{ fontWeight: 400, fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                  (over {simulationYears} yrs)
                </span>
              </div>
              <div style={{ ...styles.statValue, ...styles.profit }}>
                {estimatedUsdLoading ? (
                  'Loading...'
                ) : (
                  <>
                    ${estimatedUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </>
                )}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Net Profit
              </div>
              <div style={{
                ...styles.statValue,
                ...(netProfitUsd >= 0 ? styles.profit : styles.loss),
              }}>
                ${Math.abs(netProfitUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {netProfitUsd >= 0 ? ' ▲' : ' ▼'}
              </div>
            </div>

            <div style={styles.statCard} className="card">
              <div style={styles.statTitle}>
                <FaExchangeAlt /> Total Estimated Return
                <span style={{ fontWeight: 400, fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                  (over {simulationYears} yrs)
                </span>
              </div>
              <div style={{
                ...styles.statValue,
                ...(totalEstimatedReturnUsd >= 0 ? styles.profit : styles.loss),
              }}>
                ${totalEstimatedReturnUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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