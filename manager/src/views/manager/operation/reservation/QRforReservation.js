import React, { useState, useRef, useContext, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { AuthContext } from 'contexts/AuthContext';

const API = process.env.REACT_APP_API;
const LANDING_BASE = process.env.REACT_APP_HOME_URL; // e.g. https://yourapp.com

const customStyles = `
  .qrfor-reservation-glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .qrfor-reservation-qr-container-box {
    background: #f8fafc;
    border-radius: 1.5rem;
    padding: 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid #eef2f6;
  }
  .qrfor-reservation-qr-frame {
    background: #ffffff;
    padding: 1.5rem;
    border-radius: 1.25rem;
    box-shadow: 0 15px 35px rgba(35, 179, 244, 0.08);
    border: 1px solid #eef2f6;
    transition: transform 0.3s ease;
  }
  .qrfor-reservation-qr-frame:hover {
    transform: scale(1.02);
  }
  .qrfor-reservation-url-pill {
    background: #ffffff;
    border-radius: 50px;
    padding: 0.6rem 1.5rem;
    border: none !important;
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 500;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }
  .qrfor-reservation-custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .qrfor-reservation-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .qrfor-reservation-custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .qrfor-reservation-custom-btn-solid {
    background-color: #23b3f4 !important;
    border: 1px solid #23b3f4 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .qrfor-reservation-custom-btn-solid:hover {
    background-color: #179edb !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.3) !important;
  }
`;

const QRforReservation = () => {
    const { currentUser, setCurrentUser } = useContext(AuthContext);
    const qrRef = useRef(null);

    const existingToken = currentUser?.restaurant_token || currentUser?.feedbackToken || null;
    const [token, setToken] = useState(existingToken);
    const [generating, setGenerating] = useState(false);
    const [copying, setCopying] = useState(false);
    const [loading, setLoading] = useState(true);

    const reservationUrl = token ? `${LANDING_BASE}/reservation.html?token=${token}` : null;

    useEffect(() => {
        if (currentUser?.restaurant_token) {
            setToken(currentUser.restaurant_token);
        }
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, [currentUser]);

    const handleGenerate = async () => {
        if (token && !window.confirm(
            'Regenerating the token will invalidate the existing QR code and URL.\n\n' +
            'Any printed QR codes will stop working. Continue?'
        )) return;

        setGenerating(true);
        try {
            const res = await axios.post(
                `${API}/reservation/generate-token`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            const newToken = res.data.restaurant_token;
            setToken(newToken);
            setCurrentUser?.((u) => ({ ...u, restaurant_token: newToken }));
            toast.success('New reservation token generated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate token.');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!reservationUrl) return;
        setCopying(true);
        try {
            await navigator.clipboard.writeText(reservationUrl);
            toast.success('URL copied to clipboard!');
        } catch {
            toast.error('Failed to copy URL.');
        } finally {
            setTimeout(() => setCopying(false), 600);
        }
    };

    const handlePrint = () => {
        if (!qrRef.current) return;
        const win = window.open('', '_blank');
        win.document.write(`
          <html>
          <head>
            <title>Reservation QR Code — ${currentUser?.name || 'Restaurant'}</title>
            <style>
              body { text-align: center; font-family: 'Inter', sans-serif; padding: 40px; }
              .print-container { border: 2px solid #f0f0f0; padding: 40px; border-radius: 20px; display: inline-block; }
              h2 { color: #23b3f4; margin-bottom: 30px; font-size: 24px; }
              .url { color: #64748b; margin-top: 20px; font-size: 14px; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="print-container">
              <h2>Scan to Reserve a Table</h2>
              ${qrRef.current.innerHTML}
              <div class="url">${reservationUrl}</div>
            </div>
          </body>
          </html>
        `);
        win.document.close();
        win.print();
        win.close();
    };

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center py-5">
                <Spinner animation="border" style={{ color: '#23b3f4' }} />
            </div>
        );
    }

    return (
        <div className="container-fluid px-lg-5 pb-5">
            <style>{customStyles}</style>

            <div className="page-title-container mb-4 mt-5 mt-lg-0 text-start">
                <Row className="g-0 align-items-center">
                    <Col xs="auto" className="me-auto text-start">
                        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>Reservation QR Code</h1>
                        <div className="text-muted mt-1 small">Generate and share your restaurant's feedback link</div>
                    </Col>
                </Row>
            </div>

            <Row className="justify-content-center mt-5">
                <Col lg={8} xl={7}>
                    <Card className="qrfor-reservation-glass-card border-0 overflow-hidden">
                        <Card.Body className="p-0">
                            <div className="qrfor-reservation-qr-container-box p-4 p-md-5">
                                {token ? (
                                    <>
                                        <div className="text-center mb-5">
                                            <h4 className="fw-bold text-dark mb-2">Table Booking QR</h4>
                                            <p className="text-muted small">Scan the QR code to reserve a table:</p>
                                        </div>

                                        <div className="qrfor-reservation-qr-frame mb-4" ref={qrRef}>
                                            <QRCodeSVG
                                                value={reservationUrl}
                                                size={220}
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>

                                        <div className="w-100 mb-5 text-center">
                                            <div className="qrfor-reservation-url-pill d-inline-block px-4 mx-auto shadow-sm">
                                                <CsLineIcons icon="link" size="14" className="me-2" style={{ color: '#23b3f4' }} />
                                                {reservationUrl}
                                            </div>
                                        </div>

                                        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 w-100 px-md-5 mb-5">
                                            <Button
                                                className="qrfor-reservation-custom-btn-outline px-4 py-2 flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                                                onClick={handlePrint}
                                                disabled={generating}
                                            >
                                                <CsLineIcons icon="print" size="18" />
                                                Print QR Code
                                            </Button>

                                            <Button
                                                className="qrfor-reservation-custom-btn-outline px-4 py-2 flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                                                onClick={handleCopy}
                                                disabled={copying || generating}
                                            >
                                                {copying ? (
                                                    <>
                                                        <Spinner animation="border" size="sm" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <CsLineIcons icon="copy" size="18" />
                                                        Copy URL
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <div className="text-center w-100 pt-4 border-top">
                                            <Alert variant="warning" className="text-start mx-auto d-flex mb-4" style={{ maxWidth: 480 }}>
                                                <div className="d-flex align-items-center">
                                                    <CsLineIcons icon="warning-hexagon" className="me-2 text-warning" />
                                                </div>
                                                <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                    <strong>Regenerating</strong> will invalidate this QR code and URL.
                                                    Update or reprint any physical QR codes after regenerating.
                                                </small>
                                            </Alert>

                                            <Button
                                                className="qrfor-reservation-custom-btn-solid px-5 py-2 d-inline-flex align-items-center gap-2"
                                                onClick={handleGenerate}
                                                disabled={generating}
                                            >
                                                {generating ? (
                                                    <>
                                                        <Spinner animation="border" size="sm" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CsLineIcons icon="refresh-horizontal" size="18" />
                                                        Regenerate QR Code
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-5">
                                        <CsLineIcons icon="calendar-check" size="48" className="mb-3" style={{ color: '#23b3f4' }} />
                                        <h5 className="fw-bold">No QR Code Generated</h5>
                                        <p className="text-muted mb-4">You haven't generated a table booking QR code yet.</p>
                                        <Button
                                            className="qrfor-reservation-custom-btn-solid px-5 py-2"
                                            onClick={handleGenerate}
                                            disabled={generating}
                                        >
                                            {generating ? <Spinner animation="border" size="sm" /> : 'Create Reservation QR Code'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default QRforReservation;