import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Loading from "../components/Loading";
export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [activePlans, setActivePlans] = useState([]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_ADMIN_API}/user/userdata`,
        { withCredentials: true }
      );
      if (response.data === "Null") {
        navigate("/login");
      } else {
        console.log("User Data : ", response.data);
        setUser(response.data);
      }
    } catch (error) {
      console.log("Error fetching user data:", error);
    }
  };

  const fetchUserSubscriptions = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_ADMIN_API}/subscription/getusersubscriptioninfo`,
        { withCredentials: true }
      );
      if (response.data.length > 0) {
        setUserSubscriptions(response.data);
        const fetchActivePlans = response.data.filter(
          (plan) => plan.status === "active"
        );
        setActivePlans(fetchActivePlans.map((plan) => plan.plan_name));
      } else {
        navigate("/select-plan");
      }
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchUserData(), fetchUserSubscriptions()]);
      setIsLoading(false); // ✅ Done after both API calls complete
    };
    init();
  }, []);

  const value = {
    user,
    userSubscriptions,
    activePlans,
    isLoading,
  };

  if (isLoading) {
    return <Loading />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
