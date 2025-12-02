import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// Order Modal Component
const OrderModal = ({ order, onClose, onApprove, onReject }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full h-full md:w-11/12 md:h-5/6 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">New Web Order Received</h2>
          <button
            onClick={onClose}
            type="button"
            className="hover:bg-blue-700 rounded-full p-2 transition"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Order ID and Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="text-lg font-semibold">{order.orderId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="text-lg font-semibold">
                    {order.orderDate ? new Date(order.orderDate).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            {order.customer && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{order.customer.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{order.customer.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{order.customer.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{order.customer.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-3">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Item</th>
                        <th className="px-4 py-2 text-left">Quantity</th>
                        <th className="px-4 py-2 text-left">Price</th>
                        <th className="px-4 py-2 text-left">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-3">{item.name || "N/A"}</td>
                          <td className="px-4 py-3">{item.quantity || 0}</td>
                          <td className="px-4 py-3">${item.price?.toFixed(2) || "0.00"}</td>
                          <td className="px-4 py-3">
                            ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${order.subtotal?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">${order.tax?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">${order.shipping?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-blue-600">${order.total?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {order.notes && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-3">Additional Notes</h3>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="bg-gray-100 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={onReject}
            type="button"
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Reject Order
          </button>
          <button
            onClick={onApprove}
            type="button"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            Approve Order
          </button>
        </div>
      </div>
    </div>
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
        orderId: currentOrder.orderId,
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
        orderId: currentOrder.orderId,
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
      console.log("New Order:", notification);
      setNotifications((prev) => [...prev, notification]);

      // Show the modal with order data
      if (notification.data) {
        setCurrentOrder(notification.data);
        toast.info("New web order received!");
      }
    });

    setSocket(s);

    return () => s.disconnect();
  }, [currentUser]);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications }}>
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