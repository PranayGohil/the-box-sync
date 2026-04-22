import axios from 'axios';

const API_URL = process.env.REACT_APP_API || 'http://localhost:5000/api';

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

// ── Existing Stock APIs ──────────────────────────────────────────────────────
export const useInventoryStock = async (payload) => {
  return await axios.post(`${API_URL}/inventory/use`, payload, getHeaders());
};

export const getCurrentStock = async () => {
  return await axios.get(`${API_URL}/inventory/stock`, getHeaders());
};

// ── Item Settings (threshold & tracking level) ───────────────────────────────
export const updateItemSettings = async (payload) => {
  return await axios.put(`${API_URL}/daily-stock/item/threshold`, payload, getHeaders());
};

// ── Daily Stock Logs ─────────────────────────────────────────────────────────
export const getTodayLog = async () => {
  return await axios.get(`${API_URL}/daily-stock/today`, getHeaders());
};

export const saveOpeningStock = async (payload) => {
  return await axios.post(`${API_URL}/daily-stock/open`, payload, getHeaders());
};

export const saveClosingStock = async (payload) => {
  return await axios.post(`${API_URL}/daily-stock/close`, payload, getHeaders());
};

export const getDailyLogHistory = async (params = {}) => {
  return await axios.get(`${API_URL}/daily-stock/history`, { ...getHeaders(), params });
};

export const updateDailyLog = async (id, payload) => {
  return await axios.put(`${API_URL}/daily-stock/${id}`, payload, getHeaders());
};

export const autoGenerateOpening = async () => {
  return await axios.get(`${API_URL}/daily-stock/auto-open`, getHeaders());
};

// ── Wastage ──────────────────────────────────────────────────────────────────
export const logWastage = async (payload) => {
  return await axios.post(`${API_URL}/daily-stock/log-wastage`, payload, getHeaders());
};

export const getWastageLog = async (params = {}) => {
  return await axios.get(`${API_URL}/daily-stock/wastage`, { ...getHeaders(), params });
};

export const deleteWastageEntry = async (id) => {
  return await axios.delete(`${API_URL}/daily-stock/wastage/${id}`, getHeaders());
};

// ── Reports ──────────────────────────────────────────────────────────────────
export const getDailyReport = async (params = {}) => {
  return await axios.get(`${API_URL}/daily-stock/report`, { ...getHeaders(), params });
};

export const exportDailyReportExcel = async (params = {}) => {
  return await axios.get(`${API_URL}/daily-stock/report/export`, {
    ...getHeaders(),
    params,
    responseType: 'blob',
  });
};
