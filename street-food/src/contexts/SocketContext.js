import React, { createContext, useContext, useState } from "react";
import { AuthContext } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  // Provide a dummy socket object so components calling socket.emit don't crash
  const [socket] = useState({
    emit: () => {},
    on: () => {},
    off: () => {},
    disconnect: () => {}
  });
  const [notifications, setNotifications] = useState([]);
  
  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};