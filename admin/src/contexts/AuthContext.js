// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { setCurrentUser as setReduxUser } from 'auth/authSlice';
import { plans } from '../config/plansConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const history = useHistory();
    const dispatch = useDispatch();
    const [currentUser, setCurrentUser] = useState(null);
    const [activePlans, setActivePlans] = useState([])
    const [isLogin, setIsLogin] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchUserSubscriptions = async (userData) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API}/subscription/get`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            
            let allPlans = [];
            if (response.data?.data?.length > 0) {
                const fetchActivePlans = response.data.data.filter(
                    (plan) => plan.status === "active"
                );
                allPlans = fetchActivePlans.map((plan) => plan.plan_name);
            }

            const userTier = userData?.purchasedPlan || 'QSR';
            const activePlanObj = plans.find(p => p.name === `${userTier} Plan` || p.name === userTier) || plans[0];
            
            const checkFeats = new Set([
                ...allPlans,
                ...(activePlanObj?.features?.billing || []),
                ...(activePlanObj?.features?.addons || []),
                ...(activePlanObj?.features?.loyalty || []),
                ...(activePlanObj?.features?.advanced || []),
                ...(activePlanObj?.features?.support || []),
            ]);
            
            setActivePlans(Array.from(checkFeats));
        } catch (error) {
            console.error("Error fetching subscription plans:", error);
        }
    };

    // Load user from token on initial load
    useEffect(() => {
        const token = localStorage.getItem("token");
        console.log(token);
        if (token) {
            axios.get(`${process.env.REACT_APP_API}/user/get`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then(async (res) => {
                    if (res.data === "Null") {
                        console.log("Null Token Expired");
                        localStorage.removeItem("token");
                        setCurrentUser(null);
                        setIsLogin(false);
                        toast.error("Session Expired");
                    }
                    console.log(res.data);
                    setCurrentUser(res.data);
                    setIsLogin(true);
                    dispatch(setReduxUser(res.data));
                    await fetchUserSubscriptions(res.data);
                })
                .catch(() => {
                    localStorage.removeItem("token");
                    setCurrentUser(null);
                    setIsLogin(false);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            console.log("No Token Found");
            history.push("/login");
            setLoading(false);
        }
    }, []);


    const login = async (token, userData) => {
        try {
            localStorage.setItem("token", token);
            setCurrentUser(userData);
            setIsLogin(true);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Login failed" };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setCurrentUser(null);
        setIsLogin(false);
    };

    return (
        <AuthContext.Provider value={{ currentUser, activePlans, isLogin, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
