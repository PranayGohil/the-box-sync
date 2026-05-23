import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Form, Spinner, Table } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import axios from 'axios';
import { useSocket } from 'contexts/SocketContext';

const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1.25rem !important;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.05) !important;
  }
  .display-table {
    margin-bottom: 0;
  }
  .display-table th {
    font-size: 0.85rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    border-bottom: 2px solid #e2e8f0;
    padding: 1.25rem 1.5rem;
    text-align: center;
  }
  .display-table td {
    padding: 1.25rem 1.5rem;
    vertical-align: middle;
    border-bottom: 1px solid #f1f5f9;
    text-align: center;
  }
  .display-table tr:last-child td {
    border-bottom: none;
  }
  .display-row:hover {
    background-color: #f8fafc;
  }
  .badge-preparing {
    background: rgba(35, 179, 244, 0.1) !important;
    color: #23b3f4 !important;
    border: 1px solid rgba(35, 179, 244, 0.25);
    font-weight: 800;
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
    border-radius: 50px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    animation: pulse-badge 2s infinite ease-in-out;
  }
  .badge-completed {
    background: rgba(16, 185, 129, 0.1) !important;
    color: #10b981 !important;
    border: 1px solid rgba(16, 185, 129, 0.25);
    font-weight: 800;
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
    border-radius: 50px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  @keyframes pulse-badge {
    0% {
      box-shadow: 0 0 0 0 rgba(35, 179, 244, 0.2);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(35, 179, 244, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(35, 179, 244, 0);
    }
  }
  .order-identifier {
    font-weight: 800;
    font-size: 1.1rem;
    color: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .order-type-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .order-type-dine-in {
    background: rgba(139, 92, 246, 0.1);
    color: #8b5cf6;
  }
  .order-type-takeaway {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }
  .order-type-delivery {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
  @media (min-width: 992px) {
    .page-title-container {
      margin-top: 0rem !important;
    }
  }
  @media (max-width: 768px) {
    .page-title-container {
      margin-top: 2.5rem !important;
    }
  }

  /* Fullscreen Mode Styling */
  .glass-card:fullscreen {
    background: #ffffff !important;
    padding: 2.5rem !important;
    overflow-y: auto !important;
    height: 100vh !important;
    width: 100vw !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .glass-card:fullscreen .display-table th {
    font-size: 1.4rem !important;
    padding: 1.75rem 2.5rem !important;
    color: #475569 !important;
    border-bottom: 3px solid #cbd5e1 !important;
  }
  .glass-card:fullscreen .display-table td {
    padding: 1.75rem 2.5rem !important;
    border-bottom: 1.5px solid #e2e8f0 !important;
  }
  .glass-card:fullscreen .order-identifier {
    font-size: 1.8rem !important;
    gap: 15px !important;
  }
  .glass-card:fullscreen .order-type-badge {
    font-size: 1.1rem !important;
    padding: 0.5rem 1rem !important;
    border-radius: 6px !important;
  }
  .glass-card:fullscreen .badge-preparing,
  .glass-card:fullscreen .badge-completed {
    font-size: 1.4rem !important;
    padding: 0.9rem 1.8rem !important;
    gap: 10px !important;
  }
  .glass-card:fullscreen .badge-preparing span,
  .glass-card:fullscreen .badge-completed span {
    width: 12px !important;
    height: 12px !important;
  }
  .fullscreen-btn {
    border: 1.5px solid rgba(35, 179, 244, 0.2);
    background: rgba(35, 179, 244, 0.05);
    color: #23b3f4;
    transition: all 0.2s ease;
    width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .fullscreen-btn:hover {
    background: #23b3f4;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25);
  }
`;

const KotDisplay = () => {
  const title = 'KOT Active Display';
  const description = 'Real-time kitchen order ticket tracking display';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: '', title: 'KOT Display' },
  ];

  const { socket } = useSocket();
  const [kotData, setKotData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cardRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (cardRef.current?.requestFullscreen) {
        cardRef.current.requestFullscreen();
      } else if (cardRef.current?.webkitRequestFullscreen) {
        cardRef.current.webkitRequestFullscreen();
      } else if (cardRef.current?.msRequestFullscreen) {
        cardRef.current.msRequestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/kot/display/show`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setKotData(response.data.data);
    } catch (err) {
      console.log('Error fetching order data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  useEffect(() => {
    if (!socket) return () => { };
    socket.on('kot_update', () => {
      fetchOrderData();
    });
    return () => {
      socket.off('kot_update');
    };
  }, [socket]);

  const filteredKOTs = kotData.filter(
    (kot) =>
      kot.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kot.order_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kot.token?.toString().includes(searchTerm) ||
      kot.table_no?.toString().includes(searchTerm)
  );

  return (
    <div className="container-fluid pb-5 mb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      {/* Header Section */}
      <div className="page-title-container mb-4 mt-4 mt-lg-2 text-start">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto text-start">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>
              {title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="auto" className="text-md-end mt-3 mt-md-0">
            <div className="text-muted fw-bold d-flex align-items-center justify-content-md-end">
              <span className="me-2">Last Update:</span>
              <span className="text-dark">{new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: 'numeric', second: 'numeric' })}</span>
            </div>
          </Col>
        </Row>
      </div>

      {/* Control Search bar */}
      <Row className="mb-4">
        <Col xs="12" md="6" lg="4">
          <div className="shadow-sm rounded-pill bg-white border d-flex align-items-center px-3" style={{ height: '45px' }}>
            <CsLineIcons icon="search" size="18" className="text-primary opacity-75" />
            <Form.Control
              type="text"
              placeholder="Search by Token or Table..."
              className="border-0 bg-transparent shadow-none flex-grow-1 ms-2"
              style={{ fontSize: '14px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Col>
      </Row>

      {/* KOT Display Table */}
      {loading ? (
        <div className="container-fluid py-5 text-center">
          <Spinner animation="border" style={{ color: '#23b3f4' }} />
        </div>
      ) : filteredKOTs.length === 0 ? (
        <Card className="border-0 glass-card py-5 text-center">
          <Card.Body>
            <CsLineIcons icon="inbox" size="18" className="text-primary opacity-75" />
            <h5 className="fw-bold text-muted">No Active KOT Orders</h5>
          </Card.Body>
        </Card>
      ) : (
        <Card ref={cardRef} className="border-0 glass-card overflow-hidden">
          <div className="d-flex justify-content-between align-items-center px-4 pt-4 pb-2 border-bottom border-light">
            <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: isFullscreen ? '1.8rem' : '1.25rem' }}>Active Orders List</h4>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="btn rounded-circle fullscreen-btn"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <CsLineIcons icon={isFullscreen ? "shrink-diagonal-2" : "expand-diagonal-2"} size="18" className="text-primary opacity-75" />
            </button>
          </div>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="display-table align-middle">
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>Token / Table Number</th>
                    <th style={{ width: '50%' }}>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKOTs.map((kot) => {
                    const activeItems = (kot.order_items || []).filter((i) => i.special_notes !== 'Parcel Charge');
                    const allCompleted = activeItems.length > 0 && activeItems.every((i) => i.status === 'Completed');
                    const orderTypeLabel = kot.order_type || 'Takeaway';

                    return (
                      <tr key={kot._id} className="display-row">
                        <td>
                          <div className="order-identifier">
                            {/* 
                                                        <span className={`order-type-badge ${
                                                            orderTypeLabel === 'Dine In' ? 'order-type-dine-in' :
                                                            orderTypeLabel === 'Takeaway' ? 'order-type-takeaway' : 'order-type-delivery'
                                                            }`}>
                                                            {orderTypeLabel}
                                                        </span> 
                                                        */}
                            {kot.order_type === 'Dine In' && kot.table_no ? (
                              <span>Table {kot.table_no}</span>
                            ) : (
                              <span>Token #{kot.token || 'N/A'}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {allCompleted ? (
                            <span className="badge-completed">
                              <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
                              Completed
                            </span>
                          ) : (
                            <span className="badge-preparing">
                              <span style={{ width: '8px', height: '8px', background: '#23b3f4', borderRadius: '50%', animation: 'pulse-badge 2s infinite ease-in-out' }} />
                              Preparing
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default KotDisplay;
