import React, { createContext, useContext, useState, useEffect } from 'react';
import client, { setAccessToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyToken = (newToken, newUser) => {
    setTokenState(newToken);
    setUser(newUser);
    setAccessToken(newToken);
  };

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    applyToken(res.data.accessToken, res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } catch (e) {
      console.error('Logout error', e);
    }
    applyToken(null, null);
  };

  const refreshToken = async () => {
    try {
      const res = await client.post('/auth/refresh');
      const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
      applyToken(res.data.accessToken, { id: payload.id, email: payload.email, role: payload.role });
      return true;
    } catch (e) {
      applyToken(null, null);
      return false;
    }
  };

  // Initial load
  useEffect(() => {
    refreshToken().finally(() => setLoading(false));
  }, []);

  // Silent refresh every 14 minutes
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        refreshToken();
      }, 14 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, accessToken: token, isAuthenticated: !!token, loading, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
