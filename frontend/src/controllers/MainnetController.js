import { clusterApiUrl } from '@solana/web3.js';

/**
 * Configuration for supported Mainnet chains and their RPC endpoints.
 */
export const MAINNET_CHAINS_CONFIG = {
  ethereum: {
    chainType: 'evm',
    name: 'Ethereum',
    url: process.env.REACT_APP_RPC_ETHEREUM_URL || 'https://eth.llamarpc.com',
    network: { name: 'ethereum', chainId: 1 },
    tokenList: []
  },
  'binance-smart-chain': {
    chainType: 'evm',
    name: 'Binance Smart Chain',
    url: process.env.REACT_APP_RPC_BSC_URL || 'https://bsc.publicnode.com',
    network: { name: 'binance-smart-chain', chainId: 56 },
    tokenList: []
  },
  polygon: {
    chainType: 'evm',
    name: 'Polygon',
    url: process.env.REACT_APP_RPC_POLYGON_URL || 'https://polygon-rpc.com',
    network: { name: 'polygon', chainId: 137 },
    tokenList: []
  },
  avalanche: {
    chainType: 'evm',
    name: 'Avalanche C-Chain',
    url: process.env.REACT_APP_RPC_AVALANCHE_URL || 'https://api.avax.network/ext/bc/C/rpc',
    network: { name: 'avalanche', chainId: 43114 },
    tokenList: []
  },
  'arbitrum-one': {
    chainType: 'evm',
    name: 'Arbitrum One',
    url: process.env.REACT_APP_RPC_ARBITRUM_URL || 'https://arb1.arbitrum.io/rpc',
    network: { name: 'arbitrum-one', chainId: 42161 },
    tokenList: []
  },
  optimism: {
    chainType: 'evm',
    name: 'Optimism',
    url: process.env.REACT_APP_RPC_OPTIMISM_URL || 'https://mainnet.optimism.io',
    network: { name: 'optimism', chainId: 10 },
    tokenList: []
  },
  base: {
    chainType: 'evm',
    name: 'Base',
    url: process.env.REACT_APP_RPC_BASE_URL || 'https://mainnet.base.org',
    network: { name: 'base', chainId: 8453 },
    tokenList: []
  },
  fantom: {
    chainType: 'evm',
    name: 'Fantom Opera',
    url: process.env.REACT_APP_RPC_FANTOM_URL || 'https://rpc.ftm.tools',
    network: { name: 'fantom', chainId: 250 },
    tokenList: []
  },
  gnosis: {
    chainType: 'evm',
    name: 'Gnosis Chain',
    url: process.env.REACT_APP_RPC_GNOSIS_URL || 'https://rpc.gnosischain.com',
    network: { name: 'gnosis', chainId: 100 },
    tokenList: []
  },
  cronos: {
    chainType: 'evm',
    name: 'Cronos',
    url: process.env.REACT_APP_RPC_CRONOS_URL || 'https://evm-cronos.crypto.org',
    network: { name: 'cronos', chainId: 25 },
    tokenList: []
  },
  zksync: {
    chainType: 'evm',
    name: 'zkSync Era',
    url: process.env.REACT_APP_RPC_ZKSYNC_URL || 'https://mainnet.era.zksync.io',
    network: { name: 'zksync', chainId: 324 },
    tokenList: []
  },
  linea: {
    chainType: 'evm',
    name: 'Linea',
    url: process.env.REACT_APP_RPC_LINEA_URL || 'https://linea-mainnet.infura.io/v3',
    network: { name: 'linea', chainId: 59144 },
    tokenList: []
  },
  mantle: {
    chainType: 'evm',
    name: 'Mantle',
    url: process.env.REACT_APP_RPC_MANTLE_URL || 'https://rpc.mantle.xyz',
    network: { name: 'mantle', chainId: 5000 },
    tokenList: []
  },
  harmony: {
    chainType: 'evm',
    name: 'Harmony',
    url: process.env.REACT_APP_RPC_HARMONY_URL || 'https://api.harmony.one',
    network: { name: 'harmony', chainId: 1666600000 },
    tokenList: []
  },
  solana: {
    chainType: 'solana',
    name: 'Solana',
    url: process.env.REACT_APP_RPC_SOLANA_URL || clusterApiUrl('mainnet-beta'),
    network: { name: 'mainnet-beta' }
  },
  bitcoin: {
    chainType: 'bitcoin',
    name: 'Bitcoin',
    namespace: 'bip122',
    reference: '000000000019d6689c085ae165831e93'
  },
  xrpl: {
    chainType: 'xrpl',
    name: 'XRPL Livenet',
    namespace: 'xrpl',
    reference: '0'
  }
};

/** Lists of chain keys */
export const MAINNET_CHAINS = Object.keys(MAINNET_CHAINS_CONFIG);
export const EVM_CHAINS = MAINNET_CHAINS.filter(key => MAINNET_CHAINS_CONFIG[key].chainType === 'evm');

/**
 * Returns the token list for an EVM chain from config (array of { address, symbol, decimals }).
 */
export function getTokenList(chain) {
  const cfg = MAINNET_CHAINS_CONFIG[chain];
  return cfg && cfg.chainType === 'evm' && Array.isArray(cfg.tokenList) ? cfg.tokenList : [];
}