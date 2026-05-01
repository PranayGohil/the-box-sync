import { createContext, useContext, useReducer, useEffect, useState } from 'react';

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

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
  const subtotal   = state.items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax        = subtotal * 0.1;
  const delivery   = subtotal > 0 ? (subtotal > 50 ? 0 : 4.99) : 0;
  const total      = subtotal + tax + delivery;

  return (
    <CartContext.Provider value={{
      items: state.items,
      totalItems, subtotal, tax, delivery, total,
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

  const login = (email) => {
    const newUser = { email, name: email.split('@')[0], since: new Date().getFullYear() };
    setUser(newUser);
    localStorage.setItem('ember-user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ember-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
