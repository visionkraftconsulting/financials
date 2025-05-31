import { executeQuery } from '../utils/db.js';

// Fetch all user wallets (BTC and other chains)
export const getUserWallets = async (req, res) => {
  const { email } = req.user;
  try {
    // Bitcoin wallets
    const btcRows = await executeQuery(
      'SELECT id, wallet_address, nickname FROM user_btc_wallets WHERE email = ?',
      [email]
    );
    const btcWallets = btcRows.map(r => ({
      id: r.id,
      chain: 'bitcoin',
      walletAddress: r.wallet_address,
      nickname: r.nickname || ''
    }));

    // Other chains
    const otherRows = await executeQuery(
      'SELECT id, chain, wallet_address, nickname FROM user_wallets WHERE email = ?',
      [email]
    );
    const otherWallets = otherRows.map(r => ({
      id: r.id,
      chain: r.chain,
      walletAddress: r.wallet_address,
      nickname: r.nickname || ''
    }));

    return res.json([...btcWallets, ...otherWallets]);
  } catch (err) {
    console.error('[❌] Failed to fetch user wallets:', err.message);
    return res.status(500).json({ error: 'Failed to fetch wallets' });
  }
};

// Add a new wallet (manual or dynamic connect)
export const addWallet = async (req, res) => {
  const { chain, walletAddress, nickname } = req.body;
  const { email } = req.user;
  if (!chain || !walletAddress) {
    return res.status(400).json({ error: 'chain and walletAddress are required' });
  }
  try {
    if (chain === 'bitcoin') {
      await executeQuery(
        'INSERT IGNORE INTO user_btc_wallets (email, wallet_address, nickname) VALUES (?, ?, ?)',
        [email, walletAddress, nickname || null]
      );
    } else {
      await executeQuery(
        'INSERT IGNORE INTO user_wallets (email, chain, wallet_address, nickname) VALUES (?, ?, ?, ?)',
        [email, chain, walletAddress, nickname || null]
      );
    }
    return res.json({ message: 'Wallet added successfully' });
  } catch (err) {
    console.error('[❌] Failed to add wallet:', err.message);
    return res.status(500).json({ error: 'Failed to add wallet' });
  }
};

// Update an existing wallet's nickname
export const updateWalletNickname = async (req, res) => {
  const { id } = req.params;
  const { chain, nickname } = req.body;
  const { email } = req.user;
  if (!chain || nickname == null) {
    return res.status(400).json({ error: 'chain and nickname are required' });
  }
  try {
    let result;
    if (chain === 'bitcoin') {
      result = await executeQuery(
        'UPDATE user_btc_wallets SET nickname = ? WHERE email = ? AND id = ?',
        [nickname, email, id]
      );
    } else {
      result = await executeQuery(
        'UPDATE user_wallets SET nickname = ? WHERE email = ? AND id = ?',
        [nickname, email, id]
      );
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    return res.json({ message: 'Nickname updated successfully' });
  } catch (err) {
    console.error('[❌] Failed to update wallet nickname:', err.message);
    return res.status(500).json({ error: 'Failed to update nickname' });
  }
};