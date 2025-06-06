import { executeQuery } from '../utils/db.js';

// GET /api/admin/users
// List all registered users (Super Admins only)
export const getAllUsers = async (req, res) => {
  if (!req.user || req.user.role !== 'Super Admin') {
    return res.status(403).json({ msg: 'Forbidden: Super Admins only' });
  }
  try {
    const rows = await executeQuery(
      'SELECT id, email, name, phone, country, role, created_at FROM users'
    );
    return res.json(rows);
  } catch (err) {
    console.error('[❌] Error fetching users:', err);
    return res.status(500).json({ msg: 'Server error fetching users' });
  }
};

// PUT /api/admin/users/:id
// Update user role (Super Admins only)
// PUT /api/admin/users/:id
// Update user fields (email, name, phone, country, role) (Super Admins only)
export const updateUser = async (req, res) => {
  if (!req.user || req.user.role !== 'Super Admin') {
    return res.status(403).json({ msg: 'Forbidden: Super Admins only' });
  }
  const { id } = req.params;
  const { email, name, phone, country, role } = req.body;
  if (
    email === undefined &&
    name === undefined &&
    phone === undefined &&
    country === undefined &&
    role === undefined
  ) {
    return res.status(400).json({ msg: 'At least one field (email, name, phone, country, role) is required' });
  }
  // If email is changing, prevent conflicts; DB ON UPDATE CASCADE will handle propagation of child records
  if (email !== undefined) {
    const exist = await executeQuery('SELECT email FROM users WHERE id = ?', [id]);
    if (exist.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const oldEmail = exist[0].email;
    if (oldEmail !== email) {
      const childTables = [
        'subscriptions',
        'user_investments',
        'user_btc_wallets',
        'user_wallets',
        'user_crypto_investments',
        'user_investment_summaries'
      ];
      // Prevent collisions when both old and new emails have records
      for (const tbl of childTables) {
        const [{ cnt: oldCount }] = await executeQuery(
          `SELECT COUNT(*) AS cnt FROM ${tbl} WHERE email = ?`,
          [oldEmail]
        );
        const [{ cnt: newCount }] = await executeQuery(
          `SELECT COUNT(*) AS cnt FROM ${tbl} WHERE email = ?`,
          [email]
        );
        if (oldCount > 0 && newCount > 0) {
          return res.status(400).json({
            msg: `Cannot change email: both users have records in '${tbl}'. ` +
                 `Merge or remove conflicting records before updating.`
          });
        }
      }
    }
  }
  const fields = [];
  const values = [];
  if (email !== undefined) {
    fields.push('email = ?'); values.push(email);
  }
  if (name !== undefined) {
    fields.push('name = ?'); values.push(name);
  }
  if (phone !== undefined) {
    fields.push('phone = ?'); values.push(phone);
  }
  if (country !== undefined) {
    fields.push('country = ?'); values.push(country);
  }
  if (role !== undefined) {
    fields.push('role = ?'); values.push(role);
  }
  values.push(id);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  try {
    await executeQuery(sql, values);
    return res.json({ msg: 'User updated' });
  } catch (err) {
    console.error('[❌] Error updating user:', err);
    return res.status(500).json({ msg: 'Server error updating user' });
  }
};

// DELETE /api/admin/users/:id
// Delete a user (Super Admins only)
export const deleteUser = async (req, res) => {
  if (!req.user || req.user.role !== 'Super Admin') {
    return res.status(403).json({ msg: 'Forbidden: Super Admins only' });
  }
  const { id } = req.params;
  try {
    await executeQuery('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error('[❌] Error deleting user:', err);
    return res.status(500).json({ msg: 'Server error deleting user' });
  }
};