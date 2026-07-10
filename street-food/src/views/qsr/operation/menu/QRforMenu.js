import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from 'contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import axios from 'axios';
import { toast } from 'react-toastify';

const customStyles = `
  .qrfor-menu-glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .qrfor-menu-qr-container-box {
    background: #f8fafc;
    border-radius: 1.5rem;
    padding: 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid #eef2f6;
  }
  .qrfor-menu-qr-frame {
    background: #ffffff;
    padding: 1.5rem;
    border-radius: 1.25rem;
    box-shadow: 0 15px 35px rgba(35, 179, 244, 0.08);
    border: 1px solid #eef2f6;
    transition: transform 0.3s ease;
  }
  .qrfor-menu-qr-frame:hover {
    transform: scale(1.02);
  }
  .qrfor-menu-url-pill {
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
  .qrfor-menu-custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .qrfor-menu-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .qrfor-menu-custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  @media (max-width: 768px) {
    .qrfor-menu-qr-container-box {
      padding: 1.5rem !important;
    }
  }
`;

const QRforMenu = ({ setSection }) => {
  const [loading, setLoading] = useState(true);
  const [restaurantToken, setRestaurantToken] = useState('');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [copying, setCopying] = useState(false);
  const qrCodeRef = useRef(null);

  const { currentUser } = useContext(AuthContext);

  const menuLink = `${process.env.REACT_APP_HOME_URL}/menu.html?token=${restaurantToken}`;

  useEffect(() => {
    if (currentUser?.restaurant_token) {
      setRestaurantToken(currentUser.restaurant_token);
    }
  }, [currentUser]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerateToken = async () => {
    setGeneratingQR(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API}/reservation/generate-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (res.data.success && res.data.restaurant_token) {
        setRestaurantToken(res.data.restaurant_token);
        toast.success('QR Code generated successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(res.data.message || 'Failed to generate token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      toast.error(error.response?.data?.message || 'Failed to generate QR Code. Please try again.');
    } finally {
      setGeneratingQR(false);
    }
  };

  const printQRCode = () => {
    if (!qrCodeRef.current) return;
    const printContent = qrCodeRef.current.innerHTML;
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head>
          <title>Print Menu QR Code</title>
          <style>
            body { text-align: center; font-family: 'Inter', sans-serif; padding: 40px; }
            .print-container { border: 2px solid #f0f0f0; padding: 40px; border-radius: 20px; display: inline-block; }
            h2 { color: #23b3f4; margin-bottom: 30px; font-size: 24px; }
            .url { color: #64748b; margin-top: 20px; font-size: 14px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="print-container">
            <h2>Scan to View Menu</h2>
            ${printContent}
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();
    newWindow.print();
    newWindow.close();
  };

  const copyToClipboard = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(menuLink);
      toast.success('URL copied successfully!');
    } catch (error) {
      toast.error('Failed to copy URL');
    } finally {
      setTimeout(() => setCopying(false), 500);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <Spinner animation="border" style={{ color: '#23b3f4' }} />
      </div>
    );
  }

  return (
    <div className="container-fluid qsr-page-container">
      <style>{customStyles}</style>

      <div className="qsr-page-title-container text-start">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto text-start">
            <h1 className="qsr-page-title">Menu QR Code</h1>
            <div className="text-muted mt-1 small">Generate and share your restaurant's digital menu</div>
          </Col>
          <Col xs="auto">
            {setSection && (
              <Button className="qrfor-menu-custom-btn-outline px-4 py-2 d-flex align-items-center gap-2" onClick={() => setSection('ViewMenu')}>
                <CsLineIcons icon="eye" size="18" />
                View Menu
              </Button>
            )}
          </Col>
        </Row>
      </div>

      <Row className="justify-content-center mt-5">
        <Col lg={8} xl={7}>
          <Card className="qrfor-menu-glass-card border-0 overflow-hidden">
            <Card.Body className="p-0">
              <div className="qrfor-menu-qr-container-box p-4 p-md-5">
                {restaurantToken ? (
                  <>
                    <div className="text-center mb-5">
                      <h4 className="fw-bold text-dark mb-2">Digital Menu QR</h4>
                      <p className="text-muted small">Customers can scan this code to view your menu instantly</p>
                    </div>

                    <div className="qrfor-menu-qr-frame mb-4" ref={qrCodeRef}>
                      <QRCodeSVG size={220} value={menuLink} level="H" includeMargin={false} />
                    </div>

                    <div className="w-100 mb-5 text-center">
                      <div className="qrfor-menu-url-pill d-inline-block px-4 mx-auto shadow-sm">
                        <CsLineIcons icon="link" size="14" className="me-2" style={{ color: '#23b3f4' }} />
                        {menuLink}
                      </div>
                    </div>

                    <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 w-100 px-md-5">
                      <Button
                        className="qrfor-menu-custom-btn-outline px-4 py-2 flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                        onClick={printQRCode}
                      >
                        <CsLineIcons icon="print" size="18" />
                        Print QR Code
                      </Button>

                      <Button
                        className="qrfor-menu-custom-btn-outline px-4 py-2 flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                        onClick={copyToClipboard}
                        disabled={copying}
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
                  </>
                ) : (
                  <div className="text-center py-5">
                    <CsLineIcons icon="grid" size="48" className="text-primary mb-3" />
                    <h4 className="fw-bold text-dark mb-2">No Active QR Code</h4>
                    <p className="text-muted mb-4">
                      You haven't generated a digital menu link yet. Click the button below to generate a unique QR code for your menu.
                    </p>
                    <Button
                      className="btn-primary rounded-pill px-5 py-2 d-inline-flex align-items-center gap-2"
                      onClick={handleGenerateToken}
                      disabled={generatingQR}
                    >
                      {generatingQR ? (
                        <>
                          <Spinner animation="border" size="sm" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <CsLineIcons icon="plus" size="16" />
                          Generate QR Code
                        </>
                      )}
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

export default QRforMenu;
