// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const history = useHistory();
  const [currentUser, setCurrentUser] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cashierType, setCashierType] = useState('qsr');

  const fetchUserSubscriptions = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}/subscription/get`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (response.data?.data?.length > 0) {
        const active = response.data.data.filter((plan) => plan.status === 'active');
        setActivePlans(active.map((plan) => plan.plan_name));
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

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
            localStorage.removeItem('cashierType');
            setCurrentUser(null);
            setIsLogin(false);
          } else {
            setCurrentUser(res.data);
            setIsLogin(true);
            const savedCashierType = localStorage.getItem('cashierType');
            if (savedCashierType) {
              setCashierType(savedCashierType);
            }
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('cashierType');
          setCurrentUser(null);
          setIsLogin(false);
        })
        .finally(() => setLoading(false));
      fetchUserSubscriptions();
    } else {
      history.push('/login');
      setLoading(false);
    }
  }, []);

  const login = async (token, userData, cType = 'qsr') => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('cashierType', cType);
      setCurrentUser(userData);
      setCashierType(cType);
      setIsLogin(true);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cashierType');
    setCurrentUser(null);
    setIsLogin(false);
  };

  return <AuthContext.Provider value={{ currentUser, activePlans, isLogin, loading, cashierType, login, logout }}>{children}</AuthContext.Provider>;
};
