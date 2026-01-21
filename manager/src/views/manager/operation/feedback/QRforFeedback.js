import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from 'contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const QRforFeedback = () => {
  const [feedbackToken, setFeedbackToken] = useState('');
  const [copying, setCopying] = useState(false);
  const qrCodeRef = useRef(null);

  const { currentUser, userSubscriptions, activePlans } = useContext(AuthContext);

  useEffect(() => {
    if (currentUser.feedbackToken) {
      setFeedbackToken(currentUser.feedbackToken);
    }
  }, [currentUser]);

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
              <h2 style="margin-bottom: 25px;">Scan the QR Code to Give Feedback</h2>
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
      await navigator.clipboard.writeText(`${process.env.REACT_APP_HOME_URL}/feedback/${feedbackToken}`);
      toast.success('URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy URL');
    } finally {
      setTimeout(() => setCopying(false), 500);
    }
  };

  // if (!activePlans.includes('Feedback')) {
  //   return (
  //     <Card className="mb-5">
  //       <Card.Body className="text-center">
  //         <CsLineIcons icon="blocked" className="text-danger" size={48} />
  //         <h4 className="mt-3">Feedback Plan Required</h4>
  //         <p className="text-muted">You need to purchase or renew the Feedback plan to access this feature.</p>
  //       </Card.Body>
  //     </Card>
  //   );
  // }

  return (
    <Row className="justify-content-center">
      <Col>
        <Card className="mb-5">
          <Card.Header>
            <Card.Title className="mb-0">Feedback QR Code</Card.Title>
          </Card.Header>
          <Card.Body className="text-center">
            {feedbackToken && (
              <>
                <div className="mb-4">
                  <p className="text-muted mb-2">Scan the QR code to provide feedback:</p>
                  <div ref={qrCodeRef} className="mb-3">
                    <QRCodeSVG size={250} value={`${process.env.REACT_APP_HOME_URL}/feedback/${feedbackToken}`} className="border rounded" />
                  </div>
                  <div className="small text-muted mb-3">Feedback URL: {`${process.env.REACT_APP_HOME_URL}/feedback/${feedbackToken}`}</div>
                </div>

                <div className="d-flex justify-content-center gap-2 mb-4">
                  <Button variant="outline-primary" onClick={printQRCode}>
                    <CsLineIcons icon="print" className="me-2" />
                    Print QR Code
                  </Button>

                  <Button variant="outline-secondary" onClick={copyToClipboard} disabled={copying}>
                    {copying ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
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
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default QRforFeedback;
