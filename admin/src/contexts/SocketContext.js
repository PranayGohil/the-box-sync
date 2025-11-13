// SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("adminUser"));
    const s = io(process.env.REACT_APP_API_URL);
    setSocket(s);

    if (storedUser) {
      s.emit("register", storedUser._id);
    }

    // Listen for updated task
    s.on("subtask_updated", (notification) => {
      toast.info(`${notification.title}`);
      setNotifications((prev) => [notification, ...prev]);
    });

    // Listen for new comment
    s.on("comment", (notification) => {
      toast.info(`${notification.title}`);
      setNotifications((prev) => [notification, ...prev]);
    });

    // Listen for new media upload
    s.on("media_upload", (notification) => {
      toast.info(`${notification.title}`);
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};
