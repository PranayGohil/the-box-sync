import React, { createContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCurrentUser as setReduxUser } from 'auth/authSlice';
/* eslint-disable import/no-extraneous-dependencies */
import { jwtDecode } from 'jwt-decode';
/* eslint-enable import/no-extraneous-dependencies */

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const history = useHistory();
    const dispatch = useDispatch();
    const [currentUser, setCurrentUser] = useState(null);
    const [isLogin, setIsLogin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    throw new Error("Token expired");
                }
                setCurrentUser(decoded);
                setIsLogin(true);
                dispatch(setReduxUser(decoded));
            } catch (err) {
                console.error("Invalid or expired token", err);
                localStorage.removeItem("token");
                setCurrentUser(null);
                setIsLogin(false);
                history.push("/login");
            }
        } else {
            history.push("/login");
        }
        setLoading(false);
    }, [history, dispatch]);

    const login = (token, userData) => {
        localStorage.setItem("token", token);
        setCurrentUser(userData);
        setIsLogin(true);
        dispatch(setReduxUser(userData));
    };

    const logout = () => {
        localStorage.removeItem("token");
        setCurrentUser(null);
        setIsLogin(false);
        dispatch(setReduxUser({}));
        history.push("/login");
    };

    return (
        <AuthContext.Provider value={{ currentUser, isLogin, loading, login, logout, activePlans: [] }}>
            {children}
        </AuthContext.Provider>
    );
};
