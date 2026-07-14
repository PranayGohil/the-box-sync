import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from 'contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const QRforFeedback = () => {
  const [feedbackToken, setFeedbackToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copying, setCopying] = useState(false);
  const qrCodeRef = useRef(null);

  const { currentUser } = useContext(AuthContext);
  const feedbackLink = `${process.env.REACT_APP_HOME_URL}/feedback.html?token=${feedbackToken}`;

  useEffect(() => {
    if (currentUser.restaurant_token) {
      setFeedbackToken(currentUser.restaurant_token);
    }
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [currentUser]);

  const generateFeedbackQR = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/feedback/generate-token`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setFeedbackToken(response.data.restaurant_token);
      toast.success('QR Code generated successfully!');
    } catch (error) {
      console.error('Error generating feedback token:', error);
      toast.error('Failed to generate feedback token. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const printQRCode = () => {
    const printContent = qrCodeRef.current.innerHTML;
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head>
          <title>Print Feedback QR Code</title>
          <style>
            body { text-align: center; font-family: 'Inter', sans-serif; padding: 40px; }
            .print-container { border: 2px solid #f0f0f0; padding: 40px; border-radius: 20px; display: inline-block; }
            h2 { color: #1ea8e7; margin-bottom: 30px; font-size: 24px; }
            .url { color: #64748b; margin-top: 20px; font-size: 14px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="print-container">
            <h2>Scan to Provide Feedback</h2>
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
      await navigator.clipboard.writeText(feedbackLink);
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
        <Spinner animation="border" style={{ color: '#1ea8e7' }} />
      </div>
    );
  }

  return (
    <div className="container-fluid qsr-page-container">
      <div className="qsr-page-title-container text-start">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto">
            <h1 className="qsr-page-title">Feedback QR Code</h1>
            <div className="text-muted mt-1 small">Generate and share a QR code to collect customer feedback</div>
          </Col>
        </Row>
      </div>

      <Row className="justify-content-center mt-5">
        <Col lg={8} xl={7}>
          <Card className="qrfor-feedback-glass-card border-0 overflow-hidden">
            <Card.Body className="p-0">
              <div className="qrfor-feedback-qr-container-box p-4 p-md-5">
                {feedbackToken ? (
                  <>
                    <div className="text-center mb-5">
                      <h4 className="fw-bold text-dark mb-2">Customer Feedback QR</h4>
                      <p className="text-muted small">Scan the QR code to provide feedback:</p>
                    </div>

                    <div className="qrfor-feedback-qr-frame mb-4" ref={qrCodeRef}>
                      <QRCodeSVG size={220} value={feedbackLink} level="H" includeMargin={false} />
                    </div>

                    <div className="w-100 mb-5 text-center">
                      <div className="qrfor-feedback-qrfor-feedback-url-pill d-inline-block px-4 mx-auto shadow-sm">
                        <CsLineIcons icon="link" size="14" className="me-2 text-primary" />
                        {feedbackLink}
                      </div>
                    </div>

                    <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 w-100 px-md-5 mb-5">
                      <Button
                        className="qrfor-feedback-custom-btn-outline px-4 py-2 flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                        onClick={printQRCode}
                        disabled={generating}
                      >
                        <CsLineIcons icon="print" size="18" />
                        Print QR Code
                      </Button>

                      <Button
                        className="qrfor-feedback-custom-btn-outline px-4 py-2 flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                        onClick={copyToClipboard}
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
                      <p className="text-muted small mb-4">Generate a QR code that customers can scan to provide feedback about your service.</p>
                      <Button
                        className="qrfor-feedback-custom-btn-solid px-5 py-2 d-inline-flex align-items-center gap-2"
                        onClick={generateFeedbackQR}
                        disabled={generating}
                      >
                        {generating ? (
                          <>
                            <Spinner animation="border" size="sm" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <CsLineIcons icon="qr-code" size="18" />
                            Generate New QR Code
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <CsLineIcons icon="info-circle" size="48" className="text-info mb-3" />
                    <h5 className="fw-bold">No QR Code Generated</h5>
                    <p className="text-muted mb-4">You haven't generated a feedback QR code yet.</p>
                    <Button className="qrfor-feedback-custom-btn-solid px-5 py-2" onClick={generateFeedbackQR} disabled={generating}>
                      {generating ? <Spinner animation="border" size="sm" /> : 'Create Feedback QR Code'}
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

export default QRforFeedback;
