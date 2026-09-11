import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('pms_token');
      if (token) {
        try {
          const res = await fetchAPI('/auth/me');
          if (res.success) {
            setUser(res.user);
          } else {
            localStorage.removeItem('pms_token');
          }
        } catch (err) {
          console.error('Session restore failed:', err);
          localStorage.removeItem('pms_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success) {
      localStorage.setItem('pms_token', res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message);
  };

  const logout = async () => {
    try {
      await fetchAPI('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore logout api failure
    }
    localStorage.removeItem('pms_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
