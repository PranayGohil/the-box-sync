import axios from 'axios';

const API_URL = process.env.REACT_APP_API || 'http://localhost:5000/api';

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

export const useInventoryStock = async (payload) => {
  return await axios.post(`${API_URL}/inventory/use`, payload, getHeaders());
};

export const exportInventoryExcel = async () => {
  return await axios.get(`${API_URL}/inventory/export`, {
    ...getHeaders(),
    responseType: 'blob', // Important: Tells axios to treat response as binary data
  });
};

export const importInventoryExcel = async (file) => {
  const formData = new FormData();
  formData.append('inventory_excel', file);
  
  const config = getHeaders();
  config.headers['Content-Type'] = 'multipart/form-data';
  
  return await axios.post(`${API_URL}/inventory/import`, formData, config);
};

export const getCurrentStock = async () => {
  return await axios.get(`${API_URL}/inventory/stock`, getHeaders());
};
