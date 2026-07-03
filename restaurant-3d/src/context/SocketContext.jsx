import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AppContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const socketUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : (API_URL.endsWith('/api/') ? API_URL.slice(0, -5) : API_URL);
    console.log('Resolving website socket connection to:', socketUrl);

    const s = io(socketUrl);

    s.on('connect', () => {
      console.log('Website socket connected:', s.id);
      if (user?._id) {
        s.emit('join_customer_room', user._id);
        console.log(`Subscribed customer to room: customer_${user._id}`);
      }
    });

    s.on('order_updated', (order) => {
      console.log('Order updated socket event received:', order);

      // Play alert sound for any status change other than the initial request
      if (order && order.order_status !== 'Requested') {
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.play().catch(() => {});
        } catch (err) {}
      }

      let statusLabel = order.order_status;
      if (order.order_status === 'KOT') statusLabel = 'Preparing 🍳';
      else if (order.order_status === 'Out for Delivery') statusLabel = 'Out for Delivery 🚴';
      else if (order.order_status === 'Delivered') statusLabel = 'Delivered 🍔';
      else if (order.order_status === 'Paid') statusLabel = 'Paid & Completed ✅';
      else if (order.order_status === 'Cancelled') statusLabel = 'Cancelled ❌';

      toast(`Order status updated to: ${statusLabel}`, {
        icon: '🔔',
        duration: 5000,
        style: {
          background: '#1A1A1A',
          color: '#fff',
          border: '1px solid rgba(242,122,26,0.3)',
          borderRadius: '12px'
        }
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}
