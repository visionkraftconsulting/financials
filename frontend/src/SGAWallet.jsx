import React, { useContext, useState } from 'react';
import { ethers } from 'ethers';
import { Keypair } from '@solana/web3.js';
import { ThemeContext } from './ThemeContext';
import ecc from './ecc';
import * as wif from 'wif';
import { Buffer } from 'buffer';
import * as rippleKeypairs from 'ripple-keypairs';
import { payments, networks } from 'bitcoinjs-lib';

const CHAINS = [
  { value: 'eip155:1', label: 'Ethereum Mainnet (eip155:1)' },
  { value: 'eip155:56', label: 'Binance Smart Chain Mainnet (eip155:56)' },
  { value: 'eip155:137', label: 'Polygon Mainnet (eip155:137)' },
  { value: 'eip155:43114', label: 'Avalanche C-Chain Mainnet (eip155:43114)' },
  { value: 'eip155:42161', label: 'Arbitrum One (eip155:42161)' },
  { value: 'eip155:10', label: 'Optimism Mainnet (eip155:10)' },
  { value: 'eip155:8453', label: 'Base Mainnet (eip155:8453)' },
  { value: 'eip155:250', label: 'Fantom Opera (eip155:250)' },
  { value: 'eip155:100', label: 'Gnosis Chain (eip155:100)' },
  { value: 'eip155:25', label: 'Cronos Mainnet (eip155:25)' },
  { value: 'eip155:324', label: 'zkSync Era (eip155:324)' },
  { value: 'eip155:59144', label: 'Linea Mainnet (eip155:59144)' },
  { value: 'eip155:5000', label: 'Mantle Mainnet (eip155:5000)' },
  { value: 'eip155:1666600000', label: 'Harmony Mainnet (eip155:1666600000)' },
  { value: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', label: 'Solana Mainnet (solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp)' },
  { value: 'bip122:000000000019d6689c085ae165831e93', label: 'Bitcoin Mainnet (bip122:000000000019d6689c085ae165831e93)' },
  { value: 'xrpl:0', label: 'XRPL Livenet (xrpl:0)' },
];

function SGAWallet() {
  const { theme } = useContext(ThemeContext);
  const [chain, setChain] = useState(CHAINS[0].value);
  const [address, setAddress] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [mnemonic, setMnemonic] = useState('');



  const generateWallet = () => {
    let walletAddress = '';
    let secret = '';
    let phrase = '';

    if (chain.startsWith('eip155')) {
      const wallet = ethers.Wallet.createRandom();
      walletAddress = wallet.address;
      secret = wallet.privateKey;
      phrase = wallet.mnemonic.phrase;
    } else if (chain.startsWith('solana')) {
      const keypair = Keypair.generate();
      walletAddress = keypair.publicKey.toBase58();
      secret = Array.from(keypair.secretKey)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      phrase = '';
    } else if (chain.startsWith('bip122')) {
      const privKeyBytes = window.crypto.getRandomValues(new Uint8Array(32));
      const pubkeyBytes = ecc.pointFromScalar(privKeyBytes, true);
      const pubkey = Buffer.from(pubkeyBytes);
      walletAddress = payments.p2pkh({ pubkey, network: networks.bitcoin }).address;
      secret = wif.encode({ privateKey: privKeyBytes, compressed: true, version: networks.bitcoin.wif });
      phrase = '';
    } else if (chain.startsWith('xrpl')) {
      const seed = rippleKeypairs.generateSeed();
      const keypair = rippleKeypairs.deriveKeypair(seed);
      walletAddress = rippleKeypairs.deriveAddress(keypair.publicKey);
      secret = seed;
      phrase = '';
    }

    setAddress(walletAddress);
    setPrivateKey(secret);
    setMnemonic(phrase);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Gracefully log and suppress clipboard error only in development mode
      if (
        process.env.NODE_ENV === 'development' ||
        (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname.includes('localhost'))
      ) {
        console.warn('Connection interrupted (dev mode):', err.message);
      } else {
        console.error('Subscription failed:', err);
      }
    }
  };

  return (
    <div className={`container py-4 ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
      <h1 className="mb-4">SGA Multi-Chain Wallet Generator</h1>
      <div className="mb-3">
        <label htmlFor="chainSelect" className="form-label">
          Select Chain
        </label>
        <select
          id="chainSelect"
          className="form-select"
          value={chain}
          onChange={(e) => setChain(e.target.value)}
        >
          {CHAINS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <button className="btn btn-primary" onClick={generateWallet}>
          Generate Wallet
        </button>
      </div>
      {address && (
        <div className="mt-4">
          <h2>Wallet Details</h2>
          <div className="mb-2">
            <label className="form-label">Address</label>
            <input type="text" readOnly className="form-control" value={address} />
          </div>
          <div className="mb-2">
            <label className="form-label">Private Key</label>
            <textarea readOnly className="form-control" rows={3} value={privateKey} />
          </div>
          {mnemonic && (
            <div className="mb-2">
              <label className="form-label">Mnemonic Phrase</label>
              <textarea readOnly className="form-control" rows={2} value={mnemonic} />
            </div>
          )}
          <div className="mb-2">
            <small className="text-danger">
              Please save your private key and mnemonic phrase securely. These are not stored on this server.
            </small>
          </div>
          <div>
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              onClick={() => copyToClipboard(address)}
            >
              Copy Address
            </button>
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              onClick={() => copyToClipboard(privateKey)}
            >
              Copy Private Key
            </button>
            {mnemonic && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => copyToClipboard(mnemonic)}
              >
                Copy Mnemonic
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SGAWallet;