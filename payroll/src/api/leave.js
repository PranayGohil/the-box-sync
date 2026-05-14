import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

const authHeader = () => {
    return {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    };
};

export const getLeaveBalances = async (year) => {
    const response = await axios.get(`${API_URL}/leave/balances?year=${year}`, authHeader());
    return response.data;
};

export const initLeaveBalances = async (staffId, year) => {
    const response = await axios.post(`${API_URL}/leave/balances/init`, { staff_id: staffId, year }, authHeader());
    return response.data;
};

export const getLeaveRequests = async (status = 'all') => {
    const response = await axios.get(`${API_URL}/leave/requests?status=${status}`, authHeader());
    return response.data;
};

export const applyForLeave = async (data) => {
    const response = await axios.post(`${API_URL}/leave/requests`, data, authHeader());
    return response.data;
};

export const updateLeaveStatus = async (id, status, rejection_reason = '') => {
    const response = await axios.put(`${API_URL}/leave/requests/${id}/status`, { status, rejection_reason }, authHeader());
    return response.data;
};
