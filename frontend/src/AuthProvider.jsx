import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const getInitialToken = () => {
    const saved = localStorage.getItem('token');
    const expiry = Number(localStorage.getItem('token_expiry'));
    if (saved && expiry && Date.now() < expiry) {
      return saved;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('token_expiry');
    return null;
  };
  const [token, setToken] = useState(getInitialToken);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      let expiry = Number(localStorage.getItem('token_expiry'));
      if (!expiry) {
        expiry = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem('token_expiry', expiry.toString());
      }
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Decode JWT to extract user info (id, email, role)
      try {
        const base64Url = token.split('.')[1] || '';
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        setUser(decoded);
      } catch (err) {
        console.error('Failed to decode JWT token:', err);
        setUser(null);
      }
      const timeout = expiry - Date.now();
      const timerId = setTimeout(() => setToken(null), timeout);
      return () => clearTimeout(timerId);
    }

    // Clear token and user on logout or expiry
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('token_expiry');
    delete axios.defaults.headers.common.Authorization;
  }, [token]);

  const login = (newToken) => setToken(newToken);
  const logout = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};