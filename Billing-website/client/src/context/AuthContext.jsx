import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const loadCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
        const bizList = res.data.data.businesses || [];
        setBusinesses(bizList);

        const savedBizId = localStorage.getItem('activeBusinessId');
        let matched = bizList.find(b => b.id === savedBizId);
        if (!matched && bizList.length > 0) {
          matched = bizList[0];
          localStorage.setItem('activeBusinessId', matched.id);
        }
        setActiveBusiness(matched || null);
      }
    } catch (err) {
      console.error('[Auth Error]: Failed to load user profile', err);
      localStorage.removeItem('token');
      localStorage.removeItem('activeBusinessId');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token);
        setUser(res.data.data.user);
        setBusinesses(res.data.data.businesses || []);

        const activeBiz = res.data.data.activeBusiness;
        if (activeBiz) {
          localStorage.setItem('activeBusinessId', activeBiz.id);
          setActiveBusiness(activeBiz);
        }
        addToast(`Welcome back, ${res.data.data.user.name}!`, 'success');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      addToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token);
        setUser(res.data.data.user);
        const newBiz = res.data.data.business;
        if (newBiz) {
          localStorage.setItem('activeBusinessId', newBiz.id);
          setActiveBusiness(newBiz);
          setBusinesses([newBiz]);
        }
        addToast('Registration successful! Welcome to Zenith ERP.', 'success');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      addToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const switchBusiness = (businessId) => {
    const matched = businesses.find(b => b.id === businessId);
    if (matched) {
      localStorage.setItem('activeBusinessId', matched.id);
      setActiveBusiness(matched);
      addToast(`Switched to business: ${matched.name}`, 'info');
      window.location.reload(); // Reload context for fresh tenant queries
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeBusinessId');
    setUser(null);
    setBusinesses([]);
    setActiveBusiness(null);
    addToast('Logged out successfully', 'info');
  };

  const hasPermission = (moduleName, action = 'view') => {
    if (!activeBusiness) return false;
    if (activeBusiness.role === 'owner') return true;
    return activeBusiness.permissions?.[moduleName]?.[action] === true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        businesses,
        activeBusiness,
        loading,
        login,
        register,
        logout,
        switchBusiness,
        hasPermission,
        refreshProfile: loadCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
