import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

export const getOrderById = (orderId, token) => {
  return axios.get(`${API_URL}/order/get/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getUserTaxInfo = (token) => {
  return axios.get(`${API_URL}/user/get`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
