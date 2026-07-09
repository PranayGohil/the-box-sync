// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const history = useHistory();
  const [currentUser, setCurrentUser] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [kotUserExists, setKotUserExists] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(true);

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
      let allPlans = [];
      if (response.data?.data?.length > 0) {
        const active = response.data.data.filter((plan) => plan.status === 'active');
        allPlans = active.map((plan) => plan.plan_name);
      }
      setActivePlans(allPlans);

      if (allPlans.includes('KOT Panel')) {
        try {
          const res = await axios.get(
            `${process.env.REACT_APP_API}/panel-user/KOT Panel`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );
          setKotUserExists(res.data?.exists || false);
        } catch (error) {
          console.error('Error checking KOT panel user existence:', error);
          setKotUserExists(false);
        }
      } else {
        setKotUserExists(false);
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
      fetchUserSubscriptions();
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
      await fetchUserSubscriptions();
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

  return <AuthContext.Provider value={{ currentUser, activePlans, kotUserExists, isLogin, loading, login, logout }}>{children}</AuthContext.Provider>;
};
