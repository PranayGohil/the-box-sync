// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const history = useHistory();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user from token on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log(token);
    if (token) {
      axios
        .get(`${process.env.REACT_APP_API}/user/get`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          if (res.data === 'Null') {
            console.log('Null Token Expired');
            localStorage.removeItem('token');
            setCurrentUser(null);
            setIsLogin(false);
          }
          setCurrentUser(res.data);
          setIsLogin(true);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setCurrentUser(null);
          setIsLogin(false);
        })
        .finally(() => setLoading(false));
    } else {
      history.push('/login');
      setLoading(false);
    }
  }, []);

  const login = async (token, userData) => {
    try {
      localStorage.setItem('token', token);
      setCurrentUser(userData);
      setIsLogin(true);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsLogin(false);
  };

  return <AuthContext.Provider value={{ currentUser, isLogin, loading, login, logout }}>{children}</AuthContext.Provider>;
};
