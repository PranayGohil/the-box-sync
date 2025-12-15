import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button, Row, Col, Card, Form, Alert, Spinner } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const AddFeedback = () => {
  const { token } = useParams();

  const [feedbackData, setFeedbackData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    rating: 0,
    feedback: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isPageLoading, setIsPageLoading] = useState(false); // Optional for page load

  const handleChange = (e) => {
    setFeedbackData({ ...feedbackData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleStarClick = (rating) => {
    setFeedbackData({ ...feedbackData, rating });
  };

  const handleStarHover = (rating) => {
    setHoverRating(rating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (feedbackData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/feedback/add`,
        { ...feedbackData, feedbackToken: token },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        // Add small delay for better UX
        setTimeout(() => {
          setShowModal(true);
          setFeedbackData({
            customer_name: '',
            customer_email: '',
            customer_phone: '',
            rating: 0,
            feedback: '',
          });
        }, 300);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i += 1) {
      const isFilled = i <= (hoverRating || feedbackData.rating);

      stars.push(
        <span
          key={i}
          className="star-rating-icon"
          onClick={() => !isSubmitting && handleStarClick(i)}
          onMouseEnter={() => !isSubmitting && handleStarHover(i)}
          onMouseLeave={handleStarLeave}
          style={{
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '2.5rem',
            color: isFilled ? '#ffc107' : isSubmitting ? '#e9ecef' : '#e4e5e9',
            transition: 'color 0.2s ease',
            margin: '0 0.2rem',
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const getRatingText = () => {
    const rating = hoverRating || feedbackData.rating;
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Select your rating';
    }
  };

  // Optional: Show loading state while page initializes
  if (isPageLoading) {
    return (
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h5>Loading feedback form...</h5>
        </Col>
      </Row>
    );
  }

  return (
    <Row className="justify-content-center">
      <Col xs={12} lg={8} xl={6}>
        <div className="text-center mb-5">
          <CsLineIcons icon="message" className="text-primary" size={48} />
          <h1 className="mb-2">Submit Feedback</h1>
          <p className="text-muted">We value your opinion. Please share your experience with us.</p>
        </div>

        <Card className="mb-5">
          <Card.Header>
            <Card.Title className="mb-0">Feedback Form</Card.Title>
          </Card.Header>
          <Card.Body>
            {error && (
              <Alert variant="danger" className="mb-4">
                <div className="d-flex align-items-center">
                  <CsLineIcons icon="error" className="me-2" />
                  {error}
                </div>
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="customer_name"
                      value={feedbackData.customer_name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                      disabled={isSubmitting}
                      className={isSubmitting ? 'bg-light' : ''}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="customer_email"
                      value={feedbackData.customer_email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      disabled={isSubmitting}
                      className={isSubmitting ? 'bg-light' : ''}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  name="customer_phone"
                  value={feedbackData.customer_phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  disabled={isSubmitting}
                  className={isSubmitting ? 'bg-light' : ''}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>
                  Rating <span className="text-danger">*</span>
                </Form.Label>
                <div className="text-center mb-2">
                  <div className="star-rating-container">{renderStars()}</div>
                  <div className="rating-text mt-2">
                    <small className={`${isSubmitting ? 'text-muted' : 'text-muted'}`}>
                      {getRatingText()}
                      {feedbackData.rating > 0 && ` (${feedbackData.rating}/5)`}
                    </small>
                  </div>
                </div>
                <Form.Text className="text-muted d-block text-center">
                  Click on the stars to rate your experience
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>
                  Feedback <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  name="feedback"
                  value={feedbackData.feedback}
                  onChange={handleChange}
                  required
                  placeholder="Please share your detailed feedback here..."
                  disabled={isSubmitting}
                  className={isSubmitting ? 'bg-light' : ''}
                />
                <Form.Text className="text-muted">Your comments help us improve our services.</Form.Text>
              </Form.Group>

              <div className="d-grid">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="position-relative"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CsLineIcons icon="send" className="me-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
          <Card.Footer className="bg-transparent">
            <small className="text-muted">
              <CsLineIcons icon="shield" className="me-1" />
              Your feedback is confidential and will be used solely for improvement purposes.
            </small>
          </Card.Footer>
        </Card>

        {/* Thank You Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header>
            <Modal.Title>
              <CsLineIcons icon="check-circle" className="text-success me-2" />
              Thank You!
            </Modal.Title>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setShowModal(false)}
            />
          </Modal.Header>
          <Modal.Body className="text-center">
            <div className="mb-4">
              <CsLineIcons icon="check-circle" className="text-success" size={60} />
            </div>
            <p className="mb-0">Your feedback has been submitted successfully.</p>
            <p className="text-muted mt-2">We appreciate you taking the time to help us improve.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Optional: Full-page overlay loader */}
        {isSubmitting && (
          <div
            className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 9999,
              backdropFilter: 'blur(2px)'
            }}
          >
            <Card className="shadow-lg border-0" style={{ minWidth: '200px' }}>
              <Card.Body className="text-center p-4">
                <Spinner
                  animation="border"
                  variant="primary"
                  className="mb-3"
                  style={{ width: '3rem', height: '3rem' }}
                />
                <h5 className="mb-0">Submitting Feedback...</h5>
                <small className="text-muted">Please wait a moment</small>
              </Card.Body>
            </Card>
          </div>
        )}
      </Col>
    </Row>
  );
};

export default AddFeedback;