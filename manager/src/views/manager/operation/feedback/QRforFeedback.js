import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from 'contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const customStyles = `
    .feedback-container {
      background: #f9f9fb;
      min-height: 100vh;
      padding-bottom: 5rem;
    }
    .page-card {
      background: #ffffff !important;
      border-radius: 2rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02) !important;
      overflow: hidden;
    }
    .modern-btn {
      border-radius: 50px !important;
      padding: 0.75rem 1.75rem !important;
      font-weight: 700 !important;
      border-width: 2px !important;
      transition: all 0.3s ease !important;
    }
    .modern-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(35, 179, 244, 0.15) !important;
    }
`;

const QRforFeedback = () => {
  const [feedbackToken, setFeedbackToken] = useState('');
  const [copying, setCopying] = useState(false);
  const qrCodeRef = useRef(null);

  const { currentUser, userSubscriptions, activePlans } = useContext(AuthContext);

  useEffect(() => {
    if (currentUser.restaurant_token) {
      setFeedbackToken(currentUser.restaurant_token);
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
      await navigator.clipboard.writeText(`${process.env.REACT_APP_HOME_URL}/feedback.html?token=${feedbackToken}`);
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
    <div className="feedback-container">
      <style>{customStyles}</style>
      <div className="container-fluid px-lg-5">
        <div className="page-title-container mb-5 pt-4">
          <Row className="g-3 align-items-center">
            <Col>
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>Feedback QR Code</h1>
              <div className="text-muted mt-1">Generate and share your restaurant's feedback link.</div>
            </Col>
            <Col xs="auto">
              <Button variant="outline-secondary" onClick={() => window.history.back()} className="modern-btn border-2">
                <CsLineIcons icon="arrow-left" size="14" className="me-2" /> Back
              </Button>
            </Col>
          </Row>
        </div>

        <Row className="justify-content-center">
          <Col lg={6} xl={5}>
            <Card className="page-card border-0 shadow-sm">
              <Card.Body className="p-5 text-center">
                {feedbackToken ? (
                  <>
                    <div className="mb-4">
                      <div className="bg-light-subtle rounded-4 p-4 mb-4 d-inline-block border border-light-subtle shadow-sm" ref={qrCodeRef}>
                        <QRCodeSVG size={200} value={`${process.env.REACT_APP_HOME_URL}/feedback.html?token=${feedbackToken}`} />
                      </div>
                      <h4 className="fw-bold text-dark mb-3">Scan to Provide Feedback</h4>
                      <div className="bg-light rounded-3 p-3 mb-4 text-break small fw-bold text-muted border border-dashed border-primary border-opacity-25">
                        <CsLineIcons icon="link" size="14" className="me-2 text-primary" />
                        {process.env.REACT_APP_HOME_URL}/feedback.html?token={feedbackToken}
                      </div>
                    </div>

                    <div className="d-grid gap-3">
                      <Button variant="primary" className="modern-btn py-3 shadow-sm" onClick={printQRCode}>
                        <CsLineIcons icon="print" className="me-2" />
                        Print QR Material
                      </Button>

                      <Button variant="outline-primary" className="modern-btn py-3 border-2" onClick={copyToClipboard} disabled={copying}>
                        {copying ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Copying...
                          </>
                        ) : (
                          <>
                            <CsLineIcons icon="copy" className="me-2" />
                            Copy Link to Clipboard
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-5">
                    <Spinner animation="border" variant="primary" />
                    <div className="mt-3 text-muted fw-bold">Generating Token...</div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default QRforFeedback;
