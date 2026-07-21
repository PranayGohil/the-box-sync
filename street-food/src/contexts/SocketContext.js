import React, { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useContext(AuthContext);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (currentUser) {
      // Connect to the API server URL
      const SOCKET_URL = process.env.REACT_APP_API ? process.env.REACT_APP_API.replace('/api', '') : 'http://localhost:5001';
      
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        
        const userId = currentUser._id || currentUser.id;
        if (userId) {
           // Register with the exact object signature expected by backend index.js
           newSocket.emit("register", { userId, role: "Manager" });
           
           // Join the restaurant room correctly using the expected event name
           newSocket.emit("join_restaurant_room", userId);
           console.log("Registered socket for:", userId);
        }
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [currentUser]);

  // Fallback dummy for before connection is established
  const dummySocket = {
    emit: () => {},
    on: () => {},
    off: () => {},
    disconnect: () => {}
  };

  return (
    <SocketContext.Provider value={{ socket: socket || dummySocket, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};