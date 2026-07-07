import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { Alert, Button, Modal, Badge, Table } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { addNotification } from "layout/nav/notifications/notificationSlice";
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
      this.audio.loop = true;
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
      }, 1000);
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


const OrderModal = ({ order, onClose, onApprove, onReject }) => {
  const [audioError, setAudioError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = async () => {
    if (!AudioManager.isEnabled()) return;
    const success = await AudioManager.play();
    if (success) {
      setIsPlaying(true);
      setAudioError(false);
    } else {
      setAudioError(true);
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    AudioManager.stop();
    setIsPlaying(false);
  };

  useEffect(() => {
    if (order) {
      // Try to play audio automatically
      playAudio();

      // Also try to show browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("New Web Order Received!", {
          body: `Order from ${order.customer_name || 'Customer'} - ₹${order.total_amount?.toFixed(2) || '0.00'}`,
          icon: "/logo192.png",
          badge: "/logo192.png",
          tag: "order-notification",
          requireInteraction: true
        });
      }
    }

    return () => {
      stopAudio();
    };
  }, [order]);

  return (
    <Modal
      show={!!order}
      onHide={() => {
        stopAudio();
        onClose();
      }}
      backdrop="static"
      keyboard={false}
      size="xl"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2 w-100">
          <span>New Web Order Received 🔔</span>
          {!isPlaying && audioError && (
            <Button
              size="sm"
              variant="warning"
              onClick={playAudio}
              className="ms-auto"
            >
              🔊 Play Sound
            </Button>
          )}
          {isPlaying && (
            <Button
              size="sm"
              variant="secondary"
              onClick={stopAudio}
              className="ms-auto"
            >
              🔇 Stop Sound
            </Button>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {order && (
          <>
            {audioError && !AudioManager.isEnabled() && (
              <Alert variant="warning" dismissible onClose={() => setAudioError(false)}>
                <small>
                  <strong>Audio blocked by browser.</strong> Click "Enable & Test Audio" in the yellow banner above to enable sound alerts.
                </small>
              </Alert>
            )}

            {/* Order ID and Status */}
            <div className="mb-4 p-3 bg-light rounded">
              <div className="row">
                <div className="col-md-4 mb-2">
                  <small className="text-muted d-block">Order No.</small>
                  <strong>{order.order_no || "N/A"}</strong>
                </div>
                <div className="col-md-4 mb-2">
                  <small className="text-muted d-block">Order Date</small>
                  <strong>{order.order_date ? new Date(order.order_date).toLocaleString() : "N/A"}</strong>
                </div>
                <div className="col-md-4 mb-2">
                  <small className="text-muted d-block">Status</small>
                  <Badge bg="warning" text="dark">{order.order_status}</Badge>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="mb-4">
              <h6 className="mb-3">Customer Information</h6>
              <div className="row">
                <div className="col-md-6 mb-2">
                  <small className="text-muted d-block">Customer Name</small>
                  <strong>{order.customer_name || "N/A"}</strong>
                </div>
                <div className="col-md-6 mb-2">
                  <small className="text-muted d-block">Customer ID</small>
                  <strong>{order.customer_id || "N/A"}</strong>
                </div>
                <div className="col-md-6 mb-2">
                  <small className="text-muted d-block">Order Type</small>
                  <Badge bg="info">{order.order_type}</Badge>
                </div>
                <div className="col-md-6 mb-2">
                  <small className="text-muted d-block">Order Source</small>
                  <strong>{order.order_source || "N/A"}</strong>
                </div>
              </div>
            </div>

            {/* Order Items */}
            {order.order_items && order.order_items.length > 0 && (
              <div className="mb-4">
                <h6 className="mb-3">Order Items</h6>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Dish Name</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Price</th>
                      <th className="text-end">Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_items.map((item, index) => (
                      <tr key={item._id || index}>
                        <td>
                          <div>
                            <strong>{item.dish_name || "N/A"}</strong>
                            {item.special_notes && (
                              <div className="text-muted small fst-italic">
                                Note: {item.special_notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-center">{item.quantity || 0}</td>
                        <td className="text-end">₹{item.dish_price?.toFixed(2) || "0.00"}</td>
                        <td className="text-end">
                          <strong>₹{((item.quantity || 0) * (item.dish_price || 0)).toFixed(2)}</strong>
                        </td>
                        <td>
                          <Badge bg="warning" text="dark">{item.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* Payment Information */}
            <div className="mb-4">
              <h6 className="mb-3">Payment Information</h6>
              <div>
                <small className="text-muted">Payment Type: </small>
                <Badge bg="success">{order.payment_type}</Badge>
              </div>
            </div>

            {/* Order Summary */}
            <div className="mb-4 p-3 bg-light rounded">
              <h6 className="mb-3">Order Summary</h6>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Sub Total:</span>
                <strong>₹{order.sub_total?.toFixed(2) || "0.00"}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Bill Amount:</span>
                <strong>₹{order.bill_amount?.toFixed(2) || "0.00"}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">CGST:</span>
                <strong>₹{order.cgst_amount?.toFixed(2) || "0.00"}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">SGST:</span>
                <strong>₹{order.sgst_amount?.toFixed(2) || "0.00"}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Discount:</span>
                <strong className="text-danger">-₹{order.discount_amount?.toFixed(2) || "0.00"}</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <span className="fw-bold">Total Amount:</span>
                <span className="fw-bold text-primary fs-5">₹{order.total_amount?.toFixed(2) || "0.00"}</span>
              </div>
            </div>

            {/* Additional Comments */}
            {order.comment && (
              <div className="mb-3">
                <h6 className="mb-2">Customer Comments</h6>
                <div className="p-3 bg-light rounded">
                  <p className="mb-0">{order.comment}</p>
                </div>
              </div>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="danger"
          onClick={() => {
            stopAudio();
            onReject();
          }}
        >
          Reject Order
        </Button>
        <Button
          variant="success"
          onClick={() => {
            stopAudio();
            onApprove();
          }}
        >
          Approve Order
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const dispatch = useDispatch();

  const handleApprove = async () => {
    if (currentOrder && socket) {
      socket.emit("approve_order", {
        orderId: currentOrder._id,
        managerId: currentUser._id,
      });

      toast.success("Order approved successfully!");
      setCurrentOrder(null);
    }
  };

  const handleReject = async () => {
    if (currentOrder && socket) {
      socket.emit("reject_order", {
        orderId: currentOrder._id,
        managerId: currentUser._id,
      });

      toast.error("Order rejected!");
      setCurrentOrder(null);
    }
  };

  const stopAudio = () => {
    AudioManager.stop();
  };

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

    s.on("web_order_recieved", (notification) => {
      console.log("SocketContext: Received web_order_recieved socket event:", notification);
      setNotifications((prev) => [...prev, notification]);
      dispatch(addNotification(notification));
      setCurrentOrder(notification.data);
      if (AudioManager.isEnabled()) {
        AudioManager.play();
      }
    });

    setSocket(s);

    return () => s.disconnect();
  }, [currentUser, dispatch]);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications, stopAudio }}>
      <AudioEnabler />
      {children}
      <OrderModal
        order={currentOrder}
        onClose={() => setCurrentOrder(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </SocketContext.Provider>
  );
};