import React, { useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Spinner, Button } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSocket } from 'contexts/SocketContext';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1.25rem !important;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.05) !important;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .glass-card:hover { 
    transform: translateY(-5px); 
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.1) !important;
  }
  .token-badge {
    background: #1b3a6b !important;
    color: #fff !important;
    font-weight: 800;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 1.3rem;
    box-shadow: 0 4px 12px rgba(27, 58, 107, 0.3);
  }
  .status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.85rem;
  }
  .status-preparing { background: #fef3c7; color: #d97706; }
  .status-completed { background: #d1fae5; color: #059669; }
  
  .dish-item {
    border-bottom: 1px dashed #e2e8f0;
    padding: 12px 0;
  }
  .dish-item:last-child {
    border-bottom: none;
  }
  
  .complete-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s;
  }
  .complete-btn:hover {
    background: #059669;
    transform: scale(1.05);
  }

  .order-card-header {
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }
`;

const StreetFoodDashboard = () => {
  const title = 'Orders';
  const description = 'Real-time dashboard for self-service customer orders';
  const { socket } = useSocket();
  const history = useHistory();

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: '', title: 'Street Food Dashboard' },
  ];

  const [kotData, setKotData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      // Fetch only Restaurant Website (Street food self-service) orders
      const response = await axios.get(`${process.env.REACT_APP_API}/kot/show?order_source=Restaurant Website`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setKotData(response.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (socket) {
      // Listen for new web orders
      const handleNewOrder = (notification) => {
        if (notification && notification.data) {
          const order = notification.data;
          if (order.order_source === 'Restaurant Website') {
            // Play a sound or show toast
            toast.info(`New Order Received! #${order.order_no}`);

            setKotData((prev) => {
              // Check if already exists to prevent duplicates
              if (prev.some(k => k._id === order._id)) return prev;
              return [order, ...prev];
            });
          }
        }
      };

      const handleOrderUpdate = (order) => {
        if (order.order_source === 'Restaurant Website') {
          setKotData((prev) => prev.map(k => k._id === order._id ? order : k));
        }
      };

      socket.on('web_order_recieved', handleNewOrder);
      socket.on('order_updated', handleOrderUpdate);
      socket.on('kot_update', handleOrderUpdate);

      return () => {
        socket.off('web_order_recieved', handleNewOrder);
        socket.off('order_updated', handleOrderUpdate);
        socket.off('kot_update', handleOrderUpdate);
      };
    }
  }, [socket]);

  const completeAllDishes = async (orderId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API}/kot/dish/update-all-status`,
        { orderSource: 'Restaurant Website', orderId, status: 'Completed' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Order Completed!');

      // Update local state instantly for better UX
      setKotData(prev => prev.filter(k => k._id !== orderId));
    } catch (err) {
      toast.error('Failed to complete order.');
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API}/order/update-status/${orderId}`,
        { status: 'Preparing', isAcceptance: true },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Order Accepted!');
      // Wait for socket to refresh the data automatically
    } catch (err) {
      toast.error('Failed to accept order.');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await axios.put(
        `${process.env.REACT_APP_API}/order/update-status/${orderId}`,
        { status: 'Cancelled' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.info('Order Cancelled');
      setKotData(prev => prev.filter(k => k._id !== orderId));
    } catch (err) {
      toast.error('Failed to cancel order.');
    }
  };

  const getPendingItems = (items) => {
    return items.filter(i => i.status !== 'Completed');
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" style={{ color: '#1b3a6b' }} />
      </div>
    );
  }

  // Filter out completely finished orders locally just in case
  const activeOrders = kotData.filter(kot => getPendingItems(kot.order_items).length > 0);

  return (
    <div className="container-fluid pb-5 mb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4 mt-4 mt-lg-2 text-start">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto text-start">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1b3a6b' }}>
              {title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      <Row className="g-4">
        {activeOrders.length === 0 ? (
          <Col xs="12">
            <div className="text-center py-5 glass-card">
              <h2 className="text-muted">No pending orders</h2>
              <p>Waiting for customers to place orders...</p>
            </div>
          </Col>
        ) : (
          activeOrders.map((kot) => (
            <Col xs="12" md="6" lg="4" xl="3" key={kot._id}>
              <div className="glass-card p-3 h-100 d-flex flex-column">

                <div className="order-card-header d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <div className="token-badge">
                      {kot.token ? kot.token : (kot.order_no ? kot.order_no.split('-')[1] : 'New')}
                    </div>
                    <div>
                      <h4 className="mb-1 fw-bold text-dark">{kot.customer_name || 'Customer'}</h4>
                      <div className="text-muted small">
                        {new Date(kot.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="rounded shadow-sm"
                    onClick={() => history.push(`/order/new?orderId=${kot._id}`)}
                    title="Edit Order"
                  >
                    Edit
                  </Button>
                </div>

                <div className="flex-grow-1">
                  {getPendingItems(kot.order_items).map((item, idx) => (
                    <div key={item._id || idx} className="dish-item d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                          {item.quantity}x {item.dish_name}
                        </div>
                        {item.selected_variant && item.selected_variant.size_name && (
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Size: {item.selected_variant.size_name}</div>
                        )}
                        {item.selected_addons && item.selected_addons.length > 0 && (
                          <div className="text-muted small">
                            Addons: {item.selected_addons.map(a => a.addon_name).join(', ')}
                          </div>
                        )}
                      </div>
                      <span className="status-badge status-preparing">
                        Preparing
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                  <div className="fw-bold fs-5 text-dark">
                    ₹{kot.total_amount}
                  </div>
                  <div className="d-flex gap-2">
                    {!kot.order_no ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-danger px-3 py-2 fw-bold shadow-sm"
                          style={{ borderRadius: '8px' }}
                          onClick={() => cancelOrder(kot._id)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary px-3 py-2 fw-bold shadow-sm"
                          style={{ borderRadius: '8px', background: '#3b82f6' }}
                          onClick={() => acceptOrder(kot._id)}
                        >
                          <i className="fa-solid fa-fire-burner me-2" /> Preparing
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="complete-btn"
                        onClick={() => completeAllDishes(kot._id)}
                      >
                        <i className="fa-solid fa-check me-2" /> Ready to Serve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Col>
          ))
        )}
      </Row>
    </div>
  );
};

export default StreetFoodDashboard;
