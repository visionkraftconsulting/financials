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