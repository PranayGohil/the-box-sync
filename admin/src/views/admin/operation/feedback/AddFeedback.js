import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button, Row, Col, Card, Form, Alert } from 'react-bootstrap';
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

    console.log(feedbackData);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/feedback/add`,
        { ...feedbackData, feedbackToken: token },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setShowModal(true);
        setFeedbackData({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          rating: 0,
          feedback: '',
        });
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
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
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          onMouseLeave={handleStarLeave}
          style={{
            cursor: 'pointer',
            fontSize: '2.5rem',
            color: isFilled ? '#ffc107' : '#e4e5e9',
            transition: 'color 0.2s ease',
            margin: '0 0.2rem',
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
                <CsLineIcons icon="error" className="me-2" />
                {error}
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
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>
                  Rating <span className="text-danger">*</span>
                </Form.Label>
                <div className="text-center mb-2">
                  <div className="star-rating-container">{renderStars()}</div>
                  <div className="rating-text mt-2">
                    <small className="text-muted">
                      {getRatingText()}
                      {feedbackData.rating > 0 && ` (${feedbackData.rating}/5)`}
                    </small>
                  </div>
                </div>
                <Form.Text className="text-muted d-block text-center">Click on the stars to rate your experience</Form.Text>
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
                />
                <Form.Text className="text-muted">Your comments help us improve our services.</Form.Text>
              </Form.Group>

              <div className="d-grid">
                <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
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
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowModal(false)} />
          </Modal.Header>
          <Modal.Body className="text-center">
            <p className="mb-0">Your feedback has been submitted successfully.</p>
            <p className="text-muted mt-2">We appreciate you taking the time to help us improve.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Col>
    </Row>
  );
};

export default AddFeedback;
