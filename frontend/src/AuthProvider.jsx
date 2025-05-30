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

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      let expiry = Number(localStorage.getItem('token_expiry'));
      if (!expiry) {
        expiry = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem('token_expiry', expiry.toString());
      }
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      const timeout = expiry - Date.now();
      const timerId = setTimeout(() => setToken(null), timeout);
      return () => clearTimeout(timerId);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('token_expiry');
    delete axios.defaults.headers.common.Authorization;
  }, [token]);

  const login = (newToken) => setToken(newToken);
  const logout = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};