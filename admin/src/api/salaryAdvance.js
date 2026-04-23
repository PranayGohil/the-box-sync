import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

const authHeader = () => {
    return {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    };
};

export const getSalaryAdvances = async (status = 'all') => {
    const response = await axios.get(`${API_URL}/salary-advance?status=${status}`, authHeader());
    return response.data;
};

export const addSalaryAdvance = async (data) => {
    const response = await axios.post(`${API_URL}/salary-advance`, data, authHeader());
    return response.data;
};

export const updateSalaryAdvance = async (id, data) => {
    const response = await axios.put(`${API_URL}/salary-advance/${id}`, data, authHeader());
    return response.data;
};
