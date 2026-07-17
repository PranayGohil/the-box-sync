import axios from 'axios';

const API_URL = process.env.REACT_APP_API || 'http://localhost:5000/api';

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

// ── Customer List (paginated, aggregated) ─────────────────────────────────────
export const getCustomerList = async (params = {}) => {
  return axios.get(`${API_URL}/customer/list`, { ...getHeaders(), params });
};

// ── All Orders for a specific customer (by phone) ─────────────────────────────
export const getCustomerOrders = async (phone, params = {}) => {
  return axios.get(`${API_URL}/customer/orders/${phone}`, { ...getHeaders(), params });
};
