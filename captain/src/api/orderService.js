import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

export const createOrUpdateDineInOrder = (payload, token) => {
  return axios.post(`${API_URL}/order/dine-in`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createOrUpdateTakeawayOrder = (payload, token) => {
  return axios.post(`${API_URL}/order/takeaway`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createOrUpdateDeliveryOrder = (payload, token) => {
  return axios.post(`${API_URL}/order/delivery`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getOrderById = (orderId, token) => {
  return axios.get(`${API_URL}/order/get/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getTableById = (tableId, token) => {
  return axios.get(`${API_URL}/table/get/${tableId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getMenuData = (params, token) => {
  return axios.get(`${API_URL}/menu/get`, {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getCategories = (token) => {
  return axios.get(`${API_URL}/menu/get-categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getUserTaxInfo = (token) => {
  return axios.get(`${API_URL}/user/get`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
