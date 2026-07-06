import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useRestaurant } from './RestaurantContext';

// ─── Cart Context ───────────────────────────────────────────────
const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, qty: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'UPDATE_QTY':
      if (action.payload.qty <= 0) {
        return { ...state, items: state.items.filter(i => i.id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const { settings } = useRestaurant();
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, init => {
    try {
      const saved = localStorage.getItem('ember-cart');
      return saved ? JSON.parse(saved) : init;
    } catch { return init; }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('ember-cart', JSON.stringify(state));
  }, [state]);

  const addItem    = (item)      => dispatch({ type: 'ADD_ITEM',    payload: item });
  const removeItem = (id)        => dispatch({ type: 'REMOVE_ITEM', payload: id });
  const updateQty  = (id, qty)   => dispatch({ type: 'UPDATE_QTY',  payload: { id, qty } });
  const clearCart  = ()          => dispatch({ type: 'CLEAR_CART' });

  const cgstRate = settings?.taxInfo?.cgst || 0;
  const sgstRate = settings?.taxInfo?.sgst || 0;
  const vatRate = settings?.taxInfo?.vat || 0;
  const totalTaxRatePercent = cgstRate + sgstRate + vatRate;

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
  const subtotal   = state.items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax        = subtotal * (totalTaxRatePercent / 100);
  const delivery   = subtotal > 0 ? (subtotal > 50 ? 0 : 4.99) : 0;
  const total      = subtotal + tax + delivery;

  return (
    <CartContext.Provider value={{
      items: state.items,
      totalItems, subtotal, tax, delivery, total,
      totalTaxRatePercent, cgstRate, sgstRate, vatRate,
      addItem, removeItem, updateQty, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};

// ─── Theme Context ──────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useReducer(
    prev => !prev,
    true,  // default dark
    init => {
      try {
        const saved = localStorage.getItem('ember-theme');
        return saved ? saved === 'dark' : init;
      } catch { return init; }
    }
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem('ember-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// ─── Auth Context ───────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ember-user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = async (email, password, restaurantCode) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const res = await fetch(`${API_URL}/web-customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, restaurant_code: restaurantCode }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }
    const userData = {
      ...data.data,
      since: new Date(data.data.createdAt || Date.now()).getFullYear()
    };
    setUser(userData);
    localStorage.setItem('ember-user', JSON.stringify(userData));
    localStorage.setItem('ember-token', data.token);
    return userData;
  };

  const signup = async (name, email, phone, password, restaurantCode) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const res = await fetch(`${API_URL}/web-customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, restaurant_code: restaurantCode }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Registration failed');
    }
    const userData = {
      ...data.data,
      since: new Date(data.data.createdAt || Date.now()).getFullYear()
    };
    setUser(userData);
    localStorage.setItem('ember-user', JSON.stringify(userData));
    localStorage.setItem('ember-token', data.token);
    return userData;
  };

  const refreshUser = async () => {
    if (!user?._id) return;
    try {
      const token = localStorage.getItem('ember-token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${API_URL}/web-customer/get/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const userData = {
          ...data.data,
          since: user.since || new Date().getFullYear()
        };
        setUser(userData);
        localStorage.setItem('ember-user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error('Error refreshing user details:', err);
    }
  };

  const requestOtp = async (email, restaurantCode) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const res = await fetch(`${API_URL}/web-customer/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, restaurant_code: restaurantCode }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to send OTP');
    }
    return data;
  };

  const verifyOtp = async (email, code, restaurantCode) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const res = await fetch(`${API_URL}/web-customer/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, restaurant_code: restaurantCode }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Verification failed');
    }
    const userData = {
      ...data.data,
      since: new Date(data.data.createdAt || Date.now()).getFullYear()
    };
    setUser(userData);
    localStorage.setItem('ember-user', JSON.stringify(userData));
    localStorage.setItem('ember-token', data.token);
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ember-user');
    localStorage.removeItem('ember-token');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, requestOtp, verifyOtp, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
