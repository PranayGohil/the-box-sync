import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from 'contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';

const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1.25rem !important;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07) !important;
  }
  .custom-btn-outline {
    border: 1.5px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    font-weight: 700 !important;
    border-radius: 50px !important;
  }
  .custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .qr-box {
    background: #fff;
    padding: 2rem;
    border-radius: 1.5rem;
    display: inline-block;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    border: 1px solid #f0f0f0;
  }
`;

const QRforMenu = () => {
  const title = 'QR for Menu';
  const description = 'Generate and print menu QR code';
  
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/manage-menu', text: 'Manage Menu' },
    { to: 'operations/qr-for-menu', title: 'QR for Menu' },
  ];

  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const qrCodeRef = useRef(null);

  const { currentUser } = useContext(AuthContext);
  const restaurant_code = currentUser?.restaurant_code;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const printQRCode = () => {
    const printContent = qrCodeRef.current.innerHTML;
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head><title>Print QR Code</title><style>body { text-align: center; padding: 50px; font-family: Arial; }</style></head>
        <body><div class="qr-container"><h2>Scan to View Menu</h2>${printContent}</div><script>window.print();setTimeout(()=>window.close(),100);</script></body>
      </html>
    `);
    newWindow.document.close();
  };

  const menuLink = `${process.env.REACT_APP_HOME_URL}/menu/${restaurant_code}`;

  const copyToClipboard = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(menuLink);
      toast.success('URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy URL');
    } finally {
      setTimeout(() => setCopying(false), 500);
    }
  };

  const brandColor = '#23b3f4';

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" style={{ color: brandColor }} />
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      
      <div className="page-title-container mb-4">
        <h1 className="mb-0 pb-0 fw-800" style={{ color: brandColor, fontSize: '1.5rem' }}>{title}</h1>
        <BreadcrumbList items={breadcrumbs} />
      </div>

      <Row className="justify-content-center">
        <Col lg="6">
          <Card className="border-0 glass-card text-center">
            <Card.Body className="p-5">
              {restaurant_code ? (
                <>
                  <h4 className="fw-bold mb-4">Your Restaurant Menu QR Code</h4>
                  <div className="qr-box mb-4" ref={qrCodeRef}>
                    <QRCodeSVG size={220} value={menuLink} />
                  </div>
                  <div className="mb-5">
                    <p className="text-muted small mb-1 fw-bold text-uppercase">Menu Link</p>
                    <code className="d-block p-2 bg-light rounded text-primary fw-bold" style={{ fontSize: '0.85rem' }}>{menuLink}</code>
                  </div>

                  <div className="d-flex justify-content-center gap-3">
                    <Button variant="outline-primary" className="custom-btn-outline px-4" onClick={printQRCode}>
                      <CsLineIcons icon="print" className="me-2" /> Print QR
                    </Button>
                    <Button variant="outline-secondary" className="custom-btn-outline px-4" onClick={copyToClipboard} disabled={copying}>
                      {copying ? <Spinner size="sm" className="me-2" /> : <CsLineIcons icon="copy" className="me-2" />}
                      {copying ? 'Copying...' : 'Copy Link'}
                    </Button>
                  </div>
                </>
              ) : (
                <Alert variant="warning" className="rounded-xl border-0">
                  <CsLineIcons icon="warning" className="me-2" /> Restaurant code not found.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default QRforMenu;