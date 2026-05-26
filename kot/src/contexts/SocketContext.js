import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_API_URL || 
      (process.env.REACT_APP_API ? process.env.REACT_APP_API.replace('/api', '') : 'http://localhost:5001');

    console.log("KOT Display: Connecting socket to URL:", socketUrl);
    const s = io(socketUrl);

    s.on("connect", () => {
      console.log("KOT Display: Socket connected successfully with ID:", s.id);
      if (currentUser) {
        console.log("KOT Display: Registering role KOT for user ID:", currentUser._id);
        s.emit("register", {
          userId: currentUser._id,
          role: "KOT",
        });
      }
    });

    s.on("disconnect", (reason) => {
      console.log("KOT Display: Socket disconnected. Reason:", reason);
    });

    setSocket(s);

    return () => {
      console.log("KOT Display: Disconnecting socket...");
      s.disconnect();
    };
  }, [currentUser]);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};