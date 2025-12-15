import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from 'contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const QRforMenu = ({ setSection }) => {
  const [loading, setLoading] = useState(true);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [copying, setCopying] = useState(false);
  const qrCodeRef = useRef(null);

  const { currentUser, userSubscriptions, activePlans } = useContext(AuthContext);
  const restaurant_code = currentUser?.restaurant_code;

  useEffect(() => {
    setLoading(true);
    // Simulate loading for better UX
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const printQRCode = () => {
    const printContent = qrCodeRef.current.innerHTML;
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body { text-align: center; font-family: Arial, sans-serif; }
            .qr-container { padding: 20px; }
            .qr-container h2 { font-size: 18px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2 style="margin-bottom: 25px;">Scan the QR Code to View Menu</h2>
            ${printContent}
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();
    newWindow.print();
    newWindow.close();
  };

  const menuLink = `${process.env.REACT_APP_HOME_URL}/${restaurant_code}`;

  const copyToClipboard = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(menuLink);
      toast.success('URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy URL');
    } finally {
      setTimeout(() => setCopying(false), 500);
    }
  };

  if (loading) {
    return (
      <Row className="justify-content-center">
        <Col>
          <Card className="mb-5">
            <Card.Body className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Loading Menu QR Code...</h5>
              <p className="text-muted">Please wait a moment</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  }

  // if (!activePlans.includes('Scan For Menu')) {
  //   return (
  //     <Card className="mb-5">
  //       <Card.Body className="text-center">
  //         <CsLineIcons icon="blocked" className="text-danger" size={48} />
  //         <h4 className="mt-3">Menu Plan Required</h4>
  //         <p className="text-muted">You need to purchase or renew the Scan For Menu plan to access this feature.</p>
  //       </Card.Body>
  //     </Card>
  //   );
  // }

  return (
    <Row className="justify-content-center">
      <Col>
        <Card className="mb-5">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title className="mb-0">Menu QR Code</Card.Title>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setSection("ViewMenu")}
              disabled={generatingQR}
            >
              <CsLineIcons icon="eye" className="me-2" />
              View Menu
            </Button>
          </Card.Header>
          <Card.Body className="text-center">
            {restaurant_code ? (
              <>
                <div className="mb-4">
                  <p className="text-muted mb-2">Scan the QR code to view your restaurant menu:</p>
                  <div ref={qrCodeRef} className="mb-3">
                    <QRCodeSVG size={250} value={menuLink} className="border rounded" />
                  </div>
                  <div className="small text-muted mb-3">Menu URL: {menuLink}</div>
                </div>

                <div className="d-flex justify-content-center gap-2">
                  <Button
                    variant="outline-primary"
                    onClick={printQRCode}
                    disabled={generatingQR}
                  >
                    <CsLineIcons icon="print" className="me-2" />
                    Print QR Code
                  </Button>

                  <Button
                    variant="outline-secondary"
                    onClick={copyToClipboard}
                    disabled={copying || generatingQR}
                  >
                    {copying ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Copying...
                      </>
                    ) : (
                      <>
                        <CsLineIcons icon="copy" className="me-2" />
                        Copy URL
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <Alert variant="warning" className="text-center">
                <CsLineIcons icon="warning" className="me-2" />
                Restaurant code not found. Please contact support.
              </Alert>
            )}

            {/* Loading overlay for any async operations */}
            {generatingQR && (
              <div className="mt-4">
                <Alert variant="light" className="d-inline-flex align-items-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <small>Generating QR code...</small>
                </Alert>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default QRforMenu;