import axios from 'axios';

const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const getStaffList = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API}/staff/get-all`, authHeader());
    return { success: true, data: res.data.data };
};
