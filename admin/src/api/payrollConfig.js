import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

const authHeader = () => {
    return {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    };
};

export const getPayrollConfig = async () => {
    const response = await axios.get(`${API_URL}/payroll-config`, authHeader());
    return response.data;
};

export const updatePayrollConfig = async (configData) => {
    const response = await axios.put(`${API_URL}/payroll-config`, configData, authHeader());
    return response.data;
};

// ── Holidays ────────────────────────────────────────────────────────────────
export const getHolidays = async (year) => {
    const response = await axios.get(`${API_URL}/holidays?year=${year}`, authHeader());
    return response.data;
};

export const addHoliday = async (data) => {
    const response = await axios.post(`${API_URL}/holidays`, data, authHeader());
    return response.data;
};

export const updateHoliday = async (id, data) => {
    const response = await axios.put(`${API_URL}/holidays/${id}`, data, authHeader());
    return response.data;
};

export const deleteHoliday = async (id) => {
    const response = await axios.delete(`${API_URL}/holidays/${id}`, authHeader());
    return response.data;
};

// ── Leave Policy ────────────────────────────────────────────────────────────
export const getLeavePolicy = async () => {
    const response = await axios.get(`${API_URL}/leave-policy`, authHeader());
    return response.data;
};

export const updateLeavePolicy = async (data) => {
    const response = await axios.put(`${API_URL}/leave-policy`, data, authHeader());
    return response.data;
};
