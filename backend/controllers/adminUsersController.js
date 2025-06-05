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
export const updateUserRole = async (req, res) => {
  if (!req.user || req.user.role !== 'Super Admin') {
    return res.status(403).json({ msg: 'Forbidden: Super Admins only' });
  }
  const { id } = req.params;
  const { role } = req.body;
  if (!role) {
    return res.status(400).json({ msg: 'Role is required' });
  }
  try {
    await executeQuery('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return res.json({ msg: 'User role updated' });
  } catch (err) {
    console.error('[❌] Error updating user role:', err);
    return res.status(500).json({ msg: 'Server error updating user role' });
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