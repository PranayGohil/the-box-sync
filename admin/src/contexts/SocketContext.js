import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { Modal, Button, Table, Badge, Alert } from "react-bootstrap";
import { AuthContext } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// Order Modal Component
const OrderModal = ({ order, onClose, onApprove, onReject }) => {
  const audioRef = React.useRef(null);
  const timeoutRef = React.useRef(null);
  const [audioError, setAudioError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      // Store user interaction in localStorage
      localStorage.setItem('audioInteractionGranted', 'true');
      console.log("Audio interaction granted!");

      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setAudioError(false);

          // Stop audio after 30 seconds
          timeoutRef.current = setTimeout(() => {
            stopAudio();
          }, 30000);
        })
        .catch(err => {
          console.error("Audio play failed:", err);
          setAudioError(true);
        });
    }
  };

  React.useEffect(() => {
    if (order) {
      // Check if user has previously interacted
      const hasInteracted = localStorage.getItem('audioInteractionGranted') === 'true';

      if (hasInteracted) {
        // User has interacted before, try autoplay
        playAudio();
      } else {
        // First time - audio will likely be blocked
        playAudio();
      }

      // Also try to show browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("New Web Order Received!", {
          body: `Order from ${order.customer_name || 'Customer'} - ₹${order.total_amount?.toFixed(2) || '0.00'}`,
          icon: "/logo192.png", // Make sure you have a logo in public folder
          badge: "/logo192.png",
          tag: "order-notification",
          requireInteraction: true
        });
      }
    }

    // Cleanup function
    return () => {
      stopAudio();
    };
  }, [order]);

  return (
    <>
      {/* Audio element - hidden */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

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
          <Modal.Title className="d-flex align-items-center gap-2">
            New Web Order Received 🔔
            {!isPlaying && audioError && (
              <Button
                size="sm"
                variant="warning"
                onClick={playAudio}
                className="ms-auto"
              >
                🔊 Play Alert Sound
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
              {audioError && (
                <Alert variant="warning" dismissible onClose={() => setAudioError(false)}>
                  <small>Click the "Play Alert Sound" button to enable audio notifications for new orders.</small>
                </Alert>
              )}

              {/* Order ID and Status */}
              <div className="mb-4 p-3 bg-light rounded">
                <div className="row">
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block">Order ID</small>
                    <strong>{order._id || "N/A"}</strong>
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
    </>
  );
};

// Audio Enabler Component - One-time interaction to enable autoplay
const AudioEnabler = () => {
  const [dismissed, setDismissed] = useState(false);
  const hasInteracted = localStorage.getItem('audioInteractionGranted') === 'true';

  const enableAudio = () => {
    // Create a silent audio and play it to enable autoplay
    const silentAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');

    silentAudio.play()
      .then(() => {
        localStorage.setItem('audioInteractionGranted', 'true');
        console.log('Audio notifications enabled! You will now hear alerts for new orders.');
        setDismissed(true);
      })
      .catch(err => {
        console.error('Failed to enable audio:', err);
        toast.error('Please allow audio in your browser settings.');
      });
  };

  if (hasInteracted || dismissed) {
    return null;
  }

  return (
    <Alert variant="warning" className="m-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <strong>🔔 Enable Audio Alerts</strong>
          <p className="mb-0 small">Click to enable sound notifications for new orders. This needs to be done once.</p>
        </div>
        <div className="d-flex gap-2">
          <Button size="sm" variant="warning" onClick={enableAudio}>
            Enable Audio
          </Button>
          <Button size="sm" variant="outline-secondary" onClick={() => setDismissed(true)}>
            Dismiss
          </Button>
        </div>
      </div>
    </Alert>
  );
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const { currentUser } = useContext(AuthContext);

  const handleApprove = async () => {
    if (currentOrder && socket) {
      // Emit approval event to server
      socket.emit("approve_order", {
        orderId: currentOrder._id,
        adminId: currentUser._id,
      });

      toast.success("Order approved successfully!");
      setCurrentOrder(null);
    }
  };

  const handleReject = async () => {
    if (currentOrder && socket) {
      // Emit rejection event to server
      socket.emit("reject_order", {
        orderId: currentOrder._id,
        adminId: currentUser._id,
      });

      toast.error("Order rejected!");
      setCurrentOrder(null);
    }
  };

  useEffect(() => {
    const s = io(process.env.REACT_APP_API_URL);
    console.log("User : ", currentUser);

    s.on("connect", () => {
      if (currentUser) {
        s.emit("register", {
          userId: currentUser._id,
          role: "Admin",
        });
        console.log("Connected to the server");
      }
    });

    s.on("new_inventory_request", (notification) => {
      console.log("New Notification:", notification);
      setNotifications((prev) => [...prev, notification]);
    });

    s.on("web_order_recieved", (notification) => {
      console.log("New Order received:", notification);
      setNotifications((prev) => [...prev, notification]);

      // The notification object itself contains the order data
      setCurrentOrder(notification.data);
      toast.info("New web order received!");
    });

    setSocket(s);

    return () => s.disconnect();
  }, [currentUser]);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
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