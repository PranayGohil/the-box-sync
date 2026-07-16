import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Row, Col, Card, Badge, Spinner, Button } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { AuthContext } from 'contexts/AuthContext';
import RaiseInquiryModal from './RaiseInquiryModal';

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
  const [existingQueries, setExistingQueries] = useState({});
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySubName, setInquirySubName] = useState(null);

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
        setAvailablePlans(plansRes.data.data.filter((p) => p.is_addon));
      }

      if (userRes.data?.data) {
        setSubscriptions(
          userRes.data.data.map((sub) => ({
            ...sub,
            formatted_start: new Date(sub.start_date).toLocaleDateString('en-IN'),
            formatted_end: new Date(sub.end_date).toLocaleDateString('en-IN'),
          }))
        );
      }

      // Check if inquiry exists for Basic CRM
      try {
        const queryRes = await axios.get(
          `${process.env.REACT_APP_API}/customerquery/get-customer-query/Basic CRM`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setExistingQueries({ 'Basic CRM': !!queryRes.data?.exists });
      } catch (queryErr) {
        console.error('Error checking query status', queryErr);
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

  const baseSub = subscriptions.find((sub) => sub.plan_name === 'Basic Plan') || subscriptions.find((sub) => !sub.is_addon) || subscriptions[0];
  const isBaseActive = baseSub ? baseSub.status === 'active' : true; // Default to active if no records yet
  const baseSubId = baseSub?._id;

  const activeCrmSub = subscriptions.find((sub) => sub.plan_name.startsWith('Basic CRM') && sub.status === 'active');
  const expiredCrmSub = subscriptions.find((sub) => sub.plan_name.startsWith('Basic CRM') && sub.status === 'inactive');

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" style={{ color: '#1ea8e7' }} />
        <h5 className="mt-3 fw-bold">Loading Subscriptions...</h5>
      </div>
    );
  }

  return (
    <div className="container-fluid qsr-page-container">
      <HtmlHead title={title} description={description} />

      <div className="qsr-page-title-container">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto">
            <h1 className="qsr-page-title">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      <Card className="profile-glass-card border-0 mb-4">
        <Card.Body className="p-4 p-md-5">
          <h4 className="fw-bold mb-4">Current Active Plans</h4>
          
          {/* Base Plan */}
          <div className="p-4 rounded-3 bg-light border mb-4">
            <Row className="align-items-center">
              <Col xs={12} md={8}>
                <h5 className="fw-bold text-primary mb-1">Basic Plan</h5>
                <p className="text-muted small mb-0">Enjoy all billing operations, Dish Management, Inventory Management & print configurations.</p>
                {baseSub && <small className="text-muted d-block mt-2">Valid till: {baseSub.formatted_end}</small>}
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

          {/* CRM Plan */}
          {activeCrmSub && (
            <div className="p-4 rounded-3 bg-light border mb-4">
              <Row className="align-items-center">
                <Col xs={12} md={8}>
                  <h5 className="fw-bold text-primary mb-1">{activeCrmSub.plan_name}</h5>
                  <p className="text-muted small mb-0">Access WhatsApp campaigns, customer order history, and CRM services.</p>
                  <small className="text-muted d-block mt-2">Valid till: {activeCrmSub.formatted_end}</small>
                </Col>
                <Col xs={12} md={4} className="text-md-end mt-3 mt-md-0">
                  <Badge bg="none" className="bg-success text-white px-3 py-2 rounded-pill">
                    Active
                  </Badge>
                </Col>
              </Row>
            </div>
          )}

          {/* Expired CRM Plan (if not active but exists) */}
          {!activeCrmSub && expiredCrmSub && (
            <div className="p-4 rounded-3 bg-light border mb-4">
              <Row className="align-items-center">
                <Col xs={12} md={8}>
                  <h5 className="fw-bold text-primary mb-1">{expiredCrmSub.plan_name}</h5>
                  <p className="text-muted small mb-0">Access WhatsApp campaigns, customer order history, and CRM services.</p>
                  <small className="text-muted d-block mt-2">Expired on: {expiredCrmSub.formatted_end}</small>
                </Col>
                <Col xs={12} md={4} className="text-md-end mt-3 mt-md-0">
                  <div className="d-flex flex-column align-items-md-end gap-2">
                    <Badge bg="none" className="bg-danger text-white px-3 py-2 rounded-pill">
                      Expired
                    </Badge>
                    <Button
                      variant="none"
                      size="sm"
                      className="profile-custom-btn-outline mt-1 px-3"
                      onClick={() => handleRenew(expiredCrmSub._id)}
                      disabled={renewing}
                    >
                      {renewing ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="refresh-horizontal" size="14" />} Renew Addon
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Available Upgrades */}
      {!activeCrmSub && (
        <Card className="profile-glass-card border-0 mb-4">
          <Card.Body className="p-4 p-md-5">
            <h4 className="fw-bold mb-4">Available Upgrades & Add-ons</h4>
            <div className="p-4 rounded-3 bg-light border mb-4">
              <Row className="align-items-center">
                <Col xs={12} md={8}>
                  <h5 className="fw-bold text-primary mb-1">Basic CRM</h5>
                  <p className="text-muted small mb-3">
                    Unlock CRM campaigns, view customer order histories, and run WhatsApp campaigns to engage with your customers.
                  </p>
                  <div className="d-flex gap-3 text-muted small">
                    <span><strong>Monthly:</strong> ₹59 / month</span>
                    <span><strong>Yearly:</strong> ₹599 / year</span>
                  </div>
                </Col>
                <Col xs={12} md={4} className="text-md-end mt-3 mt-md-0">
                  {existingQueries['Basic CRM'] ? (
                    <Button
                      variant="outline-secondary"
                      className="opacity-75 px-4 rounded-pill"
                      disabled
                    >
                      <CsLineIcons icon="hourglass" size="14" className="me-2" /> Inquiry Pending
                    </Button>
                  ) : (
                    <Button
                      variant="none"
                      className="profile-custom-btn-outline px-4 rounded-pill"
                      onClick={() => {
                        setInquirySubName('Basic CRM');
                        setShowInquiryModal(true);
                      }}
                    >
                      <CsLineIcons icon="email" size="14" className="me-2" /> Send Inquiry
                    </Button>
                  )}
                </Col>
              </Row>
            </div>
          </Card.Body>
        </Card>
      )}

      {showInquiryModal && (
        <RaiseInquiryModal
          show={showInquiryModal}
          handleClose={() => setShowInquiryModal(false)}
          subscriptionName={inquirySubName}
          fetchData={fetchSubscriptions}
        />
      )}
    </div>
  );
};

export default Subscription;
