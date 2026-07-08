import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { AuthContext } from 'contexts/AuthContext';

const Subscription = () => {
  const title = 'Subscription Plans';
  const description = 'Manage your subscriptions and access available add-ons.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'settings', text: 'Settings' },
    { to: 'settings/subscription', title: 'Subscriptions' },
  ];

  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const [plansRes, userRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/subscription/get-plans`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`${process.env.REACT_APP_API}/subscription/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (plansRes.data?.data) {
        setAvailablePlans(plansRes.data.data.filter(p => p.is_addon));
      }

      if (userRes.data?.data) {
        setSubscriptions(userRes.data.data.map(sub => ({
          ...sub,
          formatted_start: new Date(sub.start_date).toLocaleDateString('en-IN'),
          formatted_end: new Date(sub.end_date).toLocaleDateString('en-IN'),
        })));
      }
    } catch (err) {
      console.error('Failed to load subscription details', err);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleRenew = async (subscriptionId) => {
    if (!subscriptionId) return;
    setRenewing(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/subscription/renew`,
        { subscriptionId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Subscription renewed successfully!');
      fetchSubscriptions();
    } catch (err) {
      console.error('Renew failed:', err);
      toast.error(err.response?.data?.message || 'Renew failed.');
    } finally {
      setRenewing(false);
    }
  };

  const baseSub = subscriptions.find(sub => !sub.is_addon) || subscriptions[0];
  const isBaseActive = baseSub ? baseSub.status === 'active' : true; // Default to active if no records yet
  const baseSubId = baseSub?._id;

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" style={{ color: '#1ea8e7' }} />
        <h5 className="mt-3 fw-bold">Loading Subscriptions...</h5>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5 ps-lg-4">
      <HtmlHead title={title} description={description} />

      <Row className="g-3 align-items-center mb-4">
        <Col xs={12} md={7}>
          <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
          <BreadcrumbList items={breadcrumbs} />
        </Col>
      </Row>

      <Card className="profile-glass-card border-0 mb-4">
        <Card.Body className="p-4 p-md-5">
          <h4 className="fw-bold mb-4">Current Active Plan</h4>
          <div className="p-4 rounded-3 bg-light border mb-4">
            <Row className="align-items-center">
              <Col xs={12} md={8}>
                <h5 className="fw-bold text-primary mb-1">
                  Basic Plan
                </h5>
                <p className="text-muted small mb-0">
                  Enjoy all billing operations, Dish Management, Inventory Management & print configurations.
                </p>
                {baseSub && (
                  <small className="text-muted d-block mt-2">
                    Valid till: {baseSub.formatted_end}
                  </small>
                )}
              </Col>
              <Col xs={12} md={4} className="text-md-end mt-3 mt-md-0">
                {isBaseActive ? (
                  <Badge bg="none" className="bg-success text-white px-3 py-2 rounded-pill">
                    Active
                  </Badge>
                ) : (
                  <div className="d-flex flex-column align-items-md-end gap-2">
                    <Badge bg="none" className="bg-danger text-white px-3 py-2 rounded-pill">
                      Expired
                    </Badge>
                    <Button
                      variant="none"
                      size="sm"
                      className="profile-custom-btn-outline mt-1 px-3"
                      onClick={() => handleRenew(baseSubId)}
                      disabled={renewing}
                    >
                      {renewing ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="refresh-horizontal" size="14" />} Renew Plan
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </div>

        </Card.Body>
      </Card>
    </div>
  );
};

export default Subscription;
