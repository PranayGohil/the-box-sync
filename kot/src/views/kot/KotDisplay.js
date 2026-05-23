import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Form, Spinner, Table } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import axios from 'axios';
import { useSocket } from 'contexts/SocketContext';

const customStyles = `
  .kot-display-window {
    background: #f0f7ff !important;
    min-height: 100vh;
    margin: -1.5rem -1.5rem -5rem -1.5rem !important;
    padding: 1.5rem 1.5rem 5rem 1.5rem !important;
  }
  .glass-card.card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 1.5px solid #e2e8f0 !important;
    border-radius: 1.25rem !important;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.05) !important;
  }
  .preparing-container {
    background-color: #fffbeb !important;
    border-radius: 1.25rem !important;
    padding: 1.5rem !important;
    transition: all 0.3s ease;
    border: 1.5px solid rgba(217, 119, 6, 0.12) !important;
    box-shadow: inset 0 4px 12px rgba(217, 119, 6, 0.05), 0 2px 4px rgba(0, 0, 0, 0.01) !important;
  }
  .ready-container {
    background-color: #f0fdf4 !important;
    border-radius: 1.25rem !important;
    padding: 1.5rem !important;
    transition: all 0.3s ease;
    border: 1.5px solid rgba(21, 128, 61, 0.12) !important;
    box-shadow: inset 0 4px 12px rgba(21, 128, 61, 0.05), 0 2px 4px rgba(0, 0, 0, 0.01) !important;
  }
  .preparing-container .border-end {
    border-right: 1.5px solid rgba(217, 119, 6, 0.15) !important;
  }
  .ready-container .border-end {
    border-right: 1.5px solid rgba(21, 128, 61, 0.15) !important;
  }
  
  /* 3D Tactile Card Styling */
  .order-card-3d {
    background: #ffffff !important;
    border-radius: 1rem !important;
    padding: 0.5rem 1rem !important;
    margin-bottom: 0.75rem !important;
    transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
  }
  
  /* Preparing 3D Card Base */
  .preparing-container .order-card-3d {
    border-bottom: 5px solid #d97706 !important;
  }
  .preparing-container .order-card-3d:hover {
    transform: translateY(-6px) translateZ(0) !important;
    box-shadow: 0 15px 30px rgba(217, 119, 6, 0.12), 0 4px 8px rgba(217, 119, 6, 0.06) !important;
    border-bottom: 5px solid #b45309 !important;
  }

  /* Ready 3D Card Base */
  .ready-container .order-card-3d {
    border-bottom: 5px solid #10b981 !important;
  }
  .ready-container .order-card-3d:hover {
    transform: translateY(-6px) translateZ(0) !important;
    box-shadow: 0 15px 30px rgba(21, 128, 61, 0.12), 0 4px 8px rgba(21, 128, 61, 0.06) !important;
    border-bottom: 5px solid #059669 !important;
  }

  /* Fullscreen Mode 3D Card Scaling */
  .glass-card:fullscreen .order-card-3d {
    padding: 1.25rem 1.5rem !important;
    margin-bottom: 1.25rem !important;
    border-radius: 1.25rem !important;
  }
  .display-table {
    margin-bottom: 0;
    border: none !important;
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
    border-bottom: 1px solid #f1f5f9 !important;
    text-align: center;
  }
  .display-table tr:last-child td {
    border-bottom: none !important;
  }
  .table-responsive {
    border: none !important;
    box-shadow: none !important;
  }
  .display-row:hover {
    background-color: #f8fafc;
  }
  .badge-preparing {
    background: transparent !important;
    color: #d97706 !important;
    border: none !important;
    font-weight: 800;
    font-size: 1.1rem;
    padding: 0.25rem 0 !important;
    border-radius: 0 !important;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: none !important;
  }
  .badge-completed {
    background: transparent !important;
    color: #15803d !important;
    border: none !important;
    font-weight: 800;
    font-size: 1.1rem;
    padding: 0.25rem 0 !important;
    border-radius: 0 !important;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: none !important;
  }
  @keyframes blink-dot {
    0% { opacity: 0.3; }
    50% { opacity: 1; }
    100% { opacity: 0.3; }
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

  /* Fullscreen Mode Styling (Obsidian Midnight Dark Theme) */
  .glass-card:fullscreen {
    background: #0b0f19 !important;
    padding: 2.5rem !important;
    overflow: hidden !important;
    height: 100vh !important;
    width: 100vw !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .glass-card:fullscreen .text-dark {
    color: #f8fafc !important;
  }
  .glass-card:fullscreen .border-bottom {
    border-bottom: 1.5px solid rgba(255, 255, 255, 0.08) !important;
  }
  .glass-card:fullscreen .border-end {
    border-right: 1.5px solid rgba(255, 255, 255, 0.08) !important;
  }
  .glass-card:fullscreen .preparing-container {
    background-color: rgba(217, 119, 6, 0.06) !important;
    border: 1.5px solid rgba(217, 119, 6, 0.3) !important;
    box-shadow: inset 0 4px 16px rgba(217, 119, 6, 0.08) !important;
  }
  .glass-card:fullscreen .ready-container {
    background-color: rgba(16, 185, 129, 0.06) !important;
    border: 1.5px solid rgba(16, 185, 129, 0.3) !important;
    box-shadow: inset 0 4px 16px rgba(16, 185, 129, 0.08) !important;
  }
  .glass-card:fullscreen .order-card-3d {
    background: #1e293b !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
  }
  .glass-card:fullscreen .order-identifier {
    font-size: 3.2rem !important;
    gap: 15px !important;
    color: #f8fafc !important;
  }
  .glass-card:fullscreen .order-card-3d:hover {
    background: #334155 !important;
  }
  .glass-card:fullscreen .preparing-container .order-card-3d:hover {
    box-shadow: 0 15px 30px rgba(217, 119, 6, 0.2) !important;
  }
  .glass-card:fullscreen .ready-container .order-card-3d:hover {
    box-shadow: 0 15px 30px rgba(16, 185, 129, 0.2) !important;
  }
  .glass-card:fullscreen .badge-preparing,
  .glass-card:fullscreen .badge-completed {
    font-size: 2.2rem !important;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    border-radius: 0 !important;
    gap: 14px !important;
  }
  .glass-card:fullscreen .badge-preparing span,
  .glass-card:fullscreen .badge-completed span {
    width: 18px !important;
    height: 18px !important;
  }
  .glass-card:fullscreen .fullscreen-btn {
    border: 1.5px solid rgba(255, 255, 255, 0.2) !important;
    background: rgba(255, 255, 255, 0.05) !important;
    color: #ffffff !important;
  }
  .glass-card:fullscreen .fullscreen-btn svg,
  .glass-card:fullscreen .fullscreen-btn .cs-icon {
    color: #ffffff !important;
    opacity: 0.9 !important;
  }
  .glass-card:fullscreen .fullscreen-btn:hover {
    background: #ffffff !important;
    color: #0b0f19 !important;
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15) !important;
  }
  .glass-card:fullscreen .fullscreen-btn:hover svg,
  .glass-card:fullscreen .fullscreen-btn:hover .cs-icon {
    color: #0b0f19 !important;
  }
  .fullscreen-btn {
    border: 1.5px solid rgba(35, 179, 244, 0.2);
    background: rgba(35, 179, 244, 0.05);
    color: #23b3f4;
    transition: all 0.2s ease;
    width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
    line-height: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .fullscreen-btn:hover {
    background: #23b3f4;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25);
  }
  .fullscreen-btn svg,
  .fullscreen-btn .cs-icon {
    color: #23b3f4 !important;
    opacity: 0.8 !important;
    transition: all 0.2s ease;
    margin: 0 !important;
    display: inline-block !important;
  }
  .fullscreen-btn:hover svg,
  .fullscreen-btn:hover .cs-icon {
    color: #ffffff !important;
    opacity: 1 !important;
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

    const preparingOrders = [];
    const completedOrders = [];

    filteredKOTs.forEach((kot) => {
        const activeItems = (kot.order_items || []).filter((i) => i.special_notes !== 'Parcel Charge');
        const allCompleted = activeItems.length > 0 && activeItems.every((i) => i.status === 'Completed');
        if (allCompleted) {
            completedOrders.push(kot);
        } else {
            preparingOrders.push(kot);
        }
    });

    const getSubColumns = (orders) => {
        // If maximized, limit to 8 items max
        const visibleOrders = isFullscreen ? orders.slice(0, 8) : orders;

        if (isFullscreen && visibleOrders.length > 4) {
            // Split into 2 columns
            const col1 = visibleOrders.slice(0, 4);
            const col2 = visibleOrders.slice(4, 8);
            return { split: true, col1, col2 };
        }

        return { split: false, col1: visibleOrders };
    };

    const renderOrderCard = (kot) => (
        <div key={kot._id} className="order-card-3d">
            <div className="order-identifier justify-content-center" style={{ fontSize: isFullscreen ? '3.2rem' : '1.25rem', padding: isFullscreen ? '1.5rem 0' : '0.5rem 0' }}>
                {kot.order_type === 'Dine In' && kot.table_no ? (
                    <span>Table {kot.table_no}</span>
                ) : (
                    <span>Token #{kot.token || 'N/A'}</span>
                )}
            </div>
        </div>
    );

    const renderOrdersColumn = (orders) => {
        const { split, col1, col2 } = getSubColumns(orders);
        
        if (split) {
            return (
                <Row className="g-3">
                    <Col xs={6} className="border-end">
                        <div className="d-flex flex-column gap-2 pe-1">
                            {col1.map((kot) => renderOrderCard(kot))}
                        </div>
                    </Col>
                    <Col xs={6}>
                        <div className="d-flex flex-column gap-2 ps-1">
                            {col2.map((kot) => renderOrderCard(kot))}
                        </div>
                    </Col>
                </Row>
            );
        }
        
        return (
            <div className="d-flex flex-column gap-2">
                {col1.map((kot) => renderOrderCard(kot))}
            </div>
        );
    };

    return (
        <div className="kot-display-window container-fluid pb-5 mb-5">
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
                    <div className="position-relative d-flex align-items-center justify-content-center px-4 pt-4 pb-2 border-bottom">
                        <h4 className="fw-bold mb-0 text-dark text-uppercase text-center" style={{ fontSize: isFullscreen ? '2.5rem' : '1.25rem', letterSpacing: '1px' }}>
                            Active Orders Board
                        </h4>
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="btn rounded-circle fullscreen-btn position-absolute mb-3"
                            style={{ right: '1.5rem' }}
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        >
                            <CsLineIcons icon={isFullscreen ? "shrink-diagonal-2" : "expand-diagonal-2"} size="18" className="text-primary opacity-75" />
                        </button>
                    </div>
                    <Card.Body className="p-4">
                        <Row className="g-4">
                            {/* Left Side: Preparing */}
                            <Col xs={12} md={6}>
                                <div className="preparing-container text-center h-100">
                                    <div className="d-flex align-items-center justify-content-center mb-3 pb-2 border-bottom border-warning border-opacity-25 rounded-md">
                                        <span className="badge-preparing px-4 py-2" style={{ fontSize: isFullscreen ? '2.2rem' : '1rem' }}>
                                            <span style={{ width: isFullscreen ? '18px' : '10px', height: isFullscreen ? '18px' : '10px', background: '#d97706', borderRadius: '50%', animation: 'blink-dot 1.5s infinite ease-in-out' }} />
                                            Preparing
                                        </span>
                                    </div>
                                    {preparingOrders.length === 0 ? (
                                        <div className="py-5 text-muted fw-bold" style={{ fontSize: isFullscreen ? '2.2rem' : '1.1rem' }}>No orders preparing</div>
                                    ) : (
                                        renderOrdersColumn(preparingOrders)
                                    )}
                                </div>
                            </Col>

                            {/* Right Side: Ready */}
                            <Col xs={12} md={6}>
                                <div className="ready-container text-center h-100">
                                    <div className="d-flex align-items-center justify-content-center mb-3 pb-2 border-bottom border-success border-opacity-25 rounded-md">
                                        <span className="badge-completed px-4 py-2" style={{ fontSize: isFullscreen ? '2.2rem' : '1rem' }}>
                                            <span style={{ width: isFullscreen ? '18px' : '10px', height: isFullscreen ? '18px' : '10px', background: '#15803d', borderRadius: '50%' }} />
                                            Ready
                                        </span>
                                    </div>
                                    {completedOrders.length === 0 ? (
                                        <div className="py-5 text-muted fw-bold" style={{ fontSize: isFullscreen ? '2.2rem' : '1.1rem' }}>No orders ready</div>
                                    ) : (
                                        renderOrdersColumn(completedOrders)
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default KotDisplay;
