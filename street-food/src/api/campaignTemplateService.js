import axios from 'axios';

const API_URL = process.env.REACT_APP_API || 'http://localhost:5000/api';

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

export const saveTemplate = async (data) => {
  return axios.post(`${API_URL}/campaign-template/add`, data, getHeaders());
};

export const getTemplates = async () => {
  return axios.get(`${API_URL}/campaign-template/list`, getHeaders());
};

export const deleteTemplate = async (id) => {
  return axios.delete(`${API_URL}/campaign-template/delete/${id}`, getHeaders());
};
