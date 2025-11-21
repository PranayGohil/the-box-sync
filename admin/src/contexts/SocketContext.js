// SocketContext.jsx
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
    const s = io(process.env.REACT_APP_API_URL);
    console.log("User : ", currentUser)
    s.on("connect", () => {
      if (currentUser) {
        s.emit("register", {
          userId: currentUser._id,
          role: "Admin"
        });
        console.log("Connected to the server");
      }
    });

    s.on("new_inventory_request", (notification) => {
      console.log("New Notification:", notification);
    });

    setSocket(s);

    return () => s.disconnect();
  }, [currentUser]);


  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};
