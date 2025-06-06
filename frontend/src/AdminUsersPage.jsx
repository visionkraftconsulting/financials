import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthProvider';

const AdminUsersPage = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    if (user?.role === 'Super Admin') {
      axios
        .get('/api/admin/users')
        .then((res) => {
          setUsers(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch users:', err);
          setError(err.response?.data?.msg || err.message);
          setLoading(false);
        });
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'Super Admin') {
    return <Navigate to="/" replace />;
  }

  const handleRoleChange = (id, newRole) => {
    axios
      .put(`/api/admin/users/${id}`, { role: newRole })
      .then(() => {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
      })
      .catch((err) => {
        console.error('Error updating role:', err);
        alert('Failed to update role: ' + (err.response?.data?.msg || err.message));
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    axios
      .delete(`/api/admin/users/${id}`)
      .then(() => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      })
      .catch((err) => {
        console.error('Error deleting user:', err);
        alert('Failed to delete user: ' + (err.response?.data?.msg || err.message));
      });
  };

  const handleEditClick = (user) => {
    setEditUserId(user.id);
    setEditFormData({
      email: user.email || '',
      name: user.name || '',
      phone: user.phone || '',
      country: user.country || '',
      role: user.role || 'User',
    });
  };

  const handleCancelEdit = () => {
    setEditUserId(null);
    setEditFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    try {
      await axios.put(`/api/admin/users/${id}`, editFormData);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...editFormData } : u)));
      handleCancelEdit();
    } catch (err) {
      console.error('Error saving user:', err);
      alert('Failed to save user: ' + (err.response?.data?.msg || err.message));
    }
  };

  if (loading) {
    return (
      <div className="container mt-4 admin-users-container">
        <p>Loading users...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mt-4 admin-users-container">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mt-4 admin-users-container">
      <h2>Manage Registered Users</h2>
      <table className="table table-dark table-bordered text-light mt-3">
        <thead className="thead-dark">
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Country</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="8">No users found.</td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                {editUserId === u.id ? (
                  <>
                    <td>
                      <input
                        name="email"
                        value={editFormData.email}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <input
                        name="name"
                        value={editFormData.name}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <input
                        name="phone"
                        value={editFormData.phone}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <input
                        name="country"
                        value={editFormData.country}
                        onChange={handleFormChange}
                        className="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <select
                        name="role"
                        value={editFormData.role}
                        onChange={handleFormChange}
                        className="form-select form-select-sm"
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                        <option value="Super Admin">Super Admin</option>
                      </select>
                    </td>
                    <td>{new Date(u.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => handleSave(u.id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{u.email}</td>
                    <td>{u.name}</td>
                    <td>{u.phone}</td>
                    <td>{u.country}</td>
                    <td>
                      <select
                        value={u.role}
                        className="form-select form-select-sm"
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                        <option value="Super Admin">Super Admin</option>
                      </select>
                    </td>
                    <td>{new Date(u.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm me-2"
                        onClick={() => handleEditClick(u)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsersPage;