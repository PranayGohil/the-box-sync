import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { Modal, Button, Table, Badge, Alert } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { addNotification } from "layout/nav/notifications/notificationSlice";
import { AuthContext } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// Global Audio Manager
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

// Audio Enabler Component
const AudioEnabler = () => {
  const { currentUser } = useContext(AuthContext);
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Show banner if audio not yet enabled
    if (!AudioManager.isEnabled()) {
      setShow(true);
    }
  }, []);

  const handleEnableAudio = async () => {
    setTesting(true);
    const success = await AudioManager.play();

    if (success) {
      toast.success('🔊 Audio enabled! You will hear alerts for notifications.');
      setTimeout(() => {
        AudioManager.stop();
        setShow(false);
      }, 2000); // Stop test audio after 2 seconds
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
          <strong>🔔 Enable Audio Alerts for Notifications</strong>
          {/* <p className="mb-0 small mt-1">
            Click the button to enable sound notifications. You'll hear a test sound, then audio will work automatically for all new notifications.
          </p> */}
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
  const dispatch = useDispatch();

  const stopAudio = () => {
    AudioManager.stop();
  };

  useEffect(() => {
    const s = io(process.env.REACT_APP_API_URL);

    s.on("connect", () => {
      if (currentUser) {
        s.emit("register", {
          userId: currentUser._id,
          role: "Admin",
        });
      }
    });

    s.on("new_inventory_request", (notification) => {
      console.log("SocketContext: Received new_inventory_request socket event:", notification);
      setNotifications((prev) => [...prev, notification]);
      dispatch(addNotification(notification));
      if (AudioManager.isEnabled()) {
        AudioManager.play();
      }
      toast.info("New inventory request received!");

      // Native browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("New Inventory Request!", {
          body: `Request from Manager - Total: ₹${notification.data?.total_amount || 0}`,
          icon: "/logo192.png",
          requireInteraction: true
        });
      }
    });

    setSocket(s);

    return () => s.disconnect();
  }, [currentUser, dispatch]);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications, stopAudio }}>
      <AudioEnabler />
      {children}
    </SocketContext.Provider>
  );
};