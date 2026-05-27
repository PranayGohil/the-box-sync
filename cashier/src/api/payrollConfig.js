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
