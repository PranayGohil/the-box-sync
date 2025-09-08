import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from 'contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Card, Row, Col, Alert } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const QRforFeedback = () => {
  const [feedbackToken, setFeedbackToken] = useState('');
  const [loading, setLoading] = useState(false);
  const qrCodeRef = useRef(null);

  const { currentUser, userSubscriptions, activePlans } = useContext(AuthContext);

  useEffect(() => {
    if (currentUser.feedbackToken) {
      setFeedbackToken(currentUser.feedbackToken);
      console.log("User : ", currentUser);
      console.log("Feedback Token : ", currentUser.feedbackToken);
    } else {
      console.log("Token Not Found")
    }
  }, [currentUser]);

  const generateFeedbackQR = async () => {
    // if (!activePlans.includes('Feedback')) {
    //   alert('You need to buy or renew to Feedback plan to access this page.');
    //   return;
    // }

    setLoading(true);
    console.log('Generating feedback token...');
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/feedback/generate-token`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setFeedbackToken(response.data.feedbackToken);
      console.log('Feedback token:', response.data.feedbackToken);
    } catch (error) {
      console.error('Error generating feedback token:', error);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

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
                    <QRCodeSVG size={250} value={`${process.env.REACT_APP_URL}/feedback/${feedbackToken}`} className="border rounded" />
                  </div>
                  <div className="small text-muted mb-3">Feedback URL: {`${process.env.REACT_APP_URL}/feedback/${feedbackToken}`}</div>
                </div>

                <Button variant="outline-primary" onClick={printQRCode} className="me-2">
                  <CsLineIcons icon="print" className="me-2" />
                  Print QR Code
                </Button>

                <Button variant="outline-secondary" onClick={() => navigator.clipboard.writeText(`${process.env.REACT_APP_URL}/feedback/${feedbackToken}`)}>
                  <CsLineIcons icon="copy" className="me-2" />
                  Copy URL
                </Button>
              </>
            )}

            <p className="text-muted my-4">Generate a QR code that customers can scan to provide feedback about your service.</p>

            <Button variant="primary" onClick={generateFeedbackQR} disabled={loading} className="mb-4">
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Generating...
                </>
              ) : (
                <>
                  <CsLineIcons icon="qr-code" className="me-2" />
                  {feedbackToken ? 'Generate New QR Code' : 'Create Feedback QR Code'}
                </>
              )}
            </Button>

          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default QRforFeedback;
