import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from 'contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Card, Row, Col, Alert } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const QRforMenu = ({ setSection }) => {
  const [loading, setLoading] = useState(true);
  const qrCodeRef = useRef(null);

  const { currentUser, userSubscriptions, activePlans } = useContext(AuthContext);
  const restaurant_code = currentUser?.restaurant_code;

  useEffect(() => {
    setLoading(true);
    // if (!activePlans.includes('Scan For Menu')) {
    //   alert('You need to buy or renew to Scan For Menu plan to access this page.');
    //   window.location.reload();
    // }
    setLoading(false);
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

  if (loading) {
    return (
      <Row className="justify-content-center">
        <Col>
          <Card className="mb-5">
            <Card.Body className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading...</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  }

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
            >
              <CsLineIcons icon="eye" className="me-2" />
              View Menu
            </Button>
          </Card.Header>
          <Card.Body className="text-center">
            {restaurant_code && (
              <>
                <div className="mb-4">
                  <p className="text-muted mb-2">Scan the QR code to view your restaurant menu:</p>
                  <div ref={qrCodeRef} className="mb-3">
                    <QRCodeSVG size={250} value={menuLink} className="border rounded" />
                  </div>
                  <div className="small text-muted mb-3">Menu URL: {menuLink}</div>
                </div>

                <Button variant="outline-primary" onClick={printQRCode} className="me-2">
                  <CsLineIcons icon="print" className="me-2" />
                  Print QR Code
                </Button>

                <Button variant="outline-secondary" onClick={() => navigator.clipboard.writeText(menuLink)}>
                  <CsLineIcons icon="copy" className="me-2" />
                  Copy URL
                </Button>
              </>
            )}

            {!restaurant_code && (
              <Alert variant="warning" className="text-center">
                <CsLineIcons icon="warning" className="me-2" />
                Restaurant code not found. Please contact support.
              </Alert>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default QRforMenu;