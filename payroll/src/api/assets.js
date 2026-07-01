import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

const authHeader = () => {
    return {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    };
};

export const getAssets = async () => {
    const response = await axios.get(`${API_URL}/assets`, authHeader());
    return response.data;
};

export const addAsset = async (data) => {
    const response = await axios.post(`${API_URL}/assets`, data, authHeader());
    return response.data;
};

export const updateAsset = async (id, data) => {
    const response = await axios.put(`${API_URL}/assets/${id}`, data, authHeader());
    return response.data;
};

export const deleteAsset = async (id) => {
    const response = await axios.delete(`${API_URL}/assets/${id}`, authHeader());
    return response.data;
};

export const getAssetRequests = async () => {
    const response = await axios.get(`${API_URL}/assets/requests`, authHeader());
    return response.data;
};

export const updateAssetRequestStatus = async (id, data) => {
    const response = await axios.put(`${API_URL}/assets/requests/${id}/status`, data, authHeader());
    return response.data;
};
