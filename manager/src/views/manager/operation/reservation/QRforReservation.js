
import React, { useState, useRef, useContext } from 'react';
import { Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { AuthContext } from 'contexts/AuthContext';

const API = process.env.REACT_APP_API;
const LANDING_BASE = process.env.REACT_APP_HOME_URL; // e.g. https://yourapp.com

const QRforReservation = () => {
    const { currentUser, setCurrentUser } = useContext(AuthContext);
    const qrRef = useRef(null);

    // Use restaurant_token; fall back to feedbackToken during migration
    const existingToken = currentUser.restaurant_token || currentUser.feedbackToken || null;
    const [token, setToken] = useState(existingToken);
    const [generating, setGenerating] = useState(false);
    const [copying, setCopying] = useState(false);

    const reservationUrl = token ? `${LANDING_BASE}/reservation.html?token=${token}` : null;

    // ── Generate / Regenerate token ─────────────────────────────────────────
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
            // Update AuthContext so the rest of the app sees the new token
            setCurrentUser?.((u) => ({ ...u, restaurant_token: newToken }));
            toast.success('New reservation token generated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate token.');
        } finally {
            setGenerating(false);
        }
    };

    // ── Copy URL ─────────────────────────────────────────────────────────────
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

    // ── Print ────────────────────────────────────────────────────────────────
    const handlePrint = () => {
        if (!qrRef.current) return;
        const win = window.open('', '_blank');
        win.document.write(`
      <html>
      <head>
        <title>Reservation QR Code — ${currentUser.name || 'Restaurant'}</title>
        <style>
          body { text-align: center; font-family: Georgia, serif; padding: 40px; }
          h1  { font-size: 22px; margin-bottom: 6px; }
          p   { color: #555; margin-bottom: 24px; font-size: 14px; }
          .url { font-size: 11px; color: #888; margin-top: 16px; word-break: break-all; }
        </style>
      </head>
      <body>
        <h1>${currentUser.name || 'Reserve a Table'}</h1>
        <p>Scan to reserve your table online</p>
        ${qrRef.current.innerHTML}
        <div class="url">${reservationUrl}</div>
      </body>
      </html>
    `);
        win.document.close();
        win.print();
        win.close();
    };

    return (
        <Row className="justify-content-center">
            <Col>
                <Card className="mb-5">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <Card.Title className="mb-0">
                            <CsLineIcons icon="calendar-check" className="me-2 text-primary" />
                            Reservation QR Code
                        </Card.Title>
                        {token && (
                            <Badge bg="success" className="fw-normal">Active</Badge>
                        )}
                    </Card.Header>

                    <Card.Body className="text-center">
                        {!token ? (
                            // ── No token yet ──────────────────────────────────────────
                            <div className="py-4">
                                <CsLineIcons icon="qr-code" size={48} className="text-muted d-block mx-auto mb-3" />
                                <h5 className="mb-2">No Reservation Link Yet</h5>
                                <p className="text-muted mb-4">
                                    Generate a unique QR code that customers scan to book a table
                                    directly from your restaurant page.
                                </p>
                                <Button className='btn-icon' variant="primary" onClick={handleGenerate} disabled={generating}>
                                    {generating
                                        ? <><Spinner size="sm" className="me-2" />Generating…</>
                                        : <><CsLineIcons icon="lightning" className="me-2" />Generate QR Code</>
                                    }
                                </Button>
                            </div>
                        ) : (
                            // ── Token exists — show QR ─────────────────────────────────
                            <>
                                <p className="text-muted mb-3">
                                    Customers scan this code to open your reservation form.
                                </p>

                                <div ref={qrRef} className="d-inline-block mb-3 p-3 border rounded bg-white">
                                    <QRCodeSVG
                                        value={reservationUrl}
                                        size={220}
                                        level="M"
                                        includeMargin={false}
                                    />
                                </div>

                                <div className="small text-muted mb-4 px-3" style={{ wordBreak: 'break-all' }}>
                                    {reservationUrl}
                                </div>

                                {/* Actions */}
                                <div className="d-flex justify-content-center flex-wrap gap-2 mb-4">
                                    <Button className='btn-icon' variant="outline-primary" onClick={handlePrint}>
                                        <CsLineIcons icon="print" className="me-2" />
                                        Print QR Code
                                    </Button>

                                    <Button className='btn-icon' variant="outline-secondary" onClick={handleCopy} disabled={copying}>
                                        {copying
                                            ? <><Spinner size="sm" className="me-2" />Copying…</>
                                            : <><CsLineIcons icon="duplicate" className="me-2" />Copy URL</>
                                        }
                                    </Button>

                                    <Button className='btn-icon' variant="outline-danger" onClick={handleGenerate} disabled={generating}>
                                        {generating
                                            ? <><Spinner size="sm" className="me-2" />Regenerating…</>
                                            : <><CsLineIcons icon="refresh-horizontal" className="me-2" />Regenerate</>
                                        }
                                    </Button>
                                </div>

                                <Alert variant="warning" className="text-start mx-auto d-flex" style={{ maxWidth: 480 }}>
                                    <div className="d-flex align-items-center">
                                        <CsLineIcons icon="warning-hexagon" className="me-2" />
                                    </div>
                                    <small>
                                        <strong>Regenerating</strong> will invalidate this QR code and URL.
                                        Update or reprint any physical QR codes after regenerating.
                                    </small>
                                </Alert>
                            </>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default QRforReservation;