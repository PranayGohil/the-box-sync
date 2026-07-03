import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { Alert, Button } from "react-bootstrap";
import { AuthContext } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// Global Audio Manager for Notification Sounds
const AudioManager = {
  audio: null,
  initialized: false,
  timeout: null,

  init() {
    if (!this.audio) {
      this.audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      this.audio.loop = false;
      this.audio.preload = "auto";
    }
  },

  async play() {
    this.init();
    try {
      await this.audio.play();
      this.initialized = true;
      localStorage.setItem('audioEnabled', 'true');

      // Auto-stop after 30 seconds
      this.timeout = setTimeout(() => {
        this.stop();
      }, 30000);

      return true;
    } catch (err) {
      console.error("Audio play failed:", err);
      return false;
    }
  },

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  },

  isEnabled() {
    return localStorage.getItem('audioEnabled') === 'true';
  }
};

// UI Audio Enabler Banner
const AudioEnabler = () => {
  const { currentUser } = useContext(AuthContext);
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!AudioManager.isEnabled()) {
      setShow(true);
    }
  }, []);

  const handleEnableAudio = async () => {
    setTesting(true);
    const success = await AudioManager.play();

    if (success) {
      toast.success('🔊 Audio alerts enabled! You will hear sounds for new orders.');
      setTimeout(() => {
        AudioManager.stop();
        setShow(false);
      }, 2000);
    } else {
      toast.error('Failed to enable audio. Please check browser permissions.');
    }
    setTesting(false);
  };

  if (!show || !currentUser) return null;

  return (
    <Alert variant="danger" className="position-absolute bg-white m-3 shadow-sm" style={{ zIndex: "10000", top: "10px", right: "10px" }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <strong>🔔 Enable Sound Alerts for Orders</strong>
        </div>
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="warning"
            onClick={handleEnableAudio}
            disabled={testing}
          >
            {testing ? '🔊 Playing Test...' : '🔊 Enable Audio'}
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setShow(false)}
          >
            Later
          </Button>
        </div>
      </div>
    </Alert>
  );
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    const rawApi = process.env.REACT_APP_API || "http://localhost:5001/api";
    const backendUrl = rawApi.endsWith('/api') ? rawApi.slice(0, -4) : (rawApi.endsWith('/api/') ? rawApi.slice(0, -5) : rawApi);
    console.log('Resolving manager socket connection to:', backendUrl);
    const s = io(backendUrl);

    s.on("connect", () => {
      if (currentUser) {
        s.emit("register", {
          userId: currentUser._id,
          role: "Manager",
        });
        s.emit("join_restaurant_room", currentUser._id);
      }
    });

    s.on("kot_update", (order) => {
      console.log("Socket: Received kot_update", order);
    });

    s.on("order_updated", (order) => {
      console.log("Socket: Received order_updated", order);
      if (order) {
        if (AudioManager.isEnabled() && order.order_status === "Requested") {
          AudioManager.play();
        }
        if (order.order_status === "Requested") {
          toast.info("New online order request received!");
        } else {
          toast.info(`Order #${order._id.substring(18).toUpperCase()} updated: ${order.order_status}`);
        }
      }
    });

    setSocket(s);

    return () => s.disconnect();
  }, [currentUser]);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
      <AudioEnabler />
      {children}
    </SocketContext.Provider>
  );
};