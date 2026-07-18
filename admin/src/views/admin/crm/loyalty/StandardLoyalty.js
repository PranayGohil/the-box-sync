import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import { AuthContext } from 'contexts/AuthContext';

const StandardLoyalty = () => {
  const { activePlans } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    earnRateSpent: 10,
    earnRatePoints: 1,
    redeemRatePoints: 100,
    redeemRateDiscount: 10,
    isActive: true,
    campaigns: {
      winbackActive: false,
      winbackDays: 30,
      winbackRewardPoints: 50,
      birthdayActive: false,
      birthdayRewardPoints: 100,
      milestoneActive: false,
      milestoneThresholdPoints: 500,
      milestoneRewardPoints: 150,
      feedbackActive: false,
      feedbackRewardPoints: 20,
    },
  });

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/loyalty/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error loading loyalty settings:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSettings();
    }
  }, [token]);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/loyalty/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Loyalty configurations saved!');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HtmlHead title="Standard Loyalty" description="Standard Loyalty Configuration" />
      <style>{`
        /* Premium Adaptive Glass Cards */
        .crm-glass-card {
          background: var(--card-bg, rgba(255, 255, 255, 0.85)) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid var(--border-color, rgba(226, 232, 240, 0.4)) !important;
          border-radius: 20px !important;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05) !important;
          transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease !important;
        }
        .crm-glass-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.1) !important;
        }
        .crm-text-heading { color: var(--heading-color, #1e293b); }
        .crm-text-body { color: var(--body-color, #475569); }
        .crm-text-muted { color: var(--muted-color, #94a3b8); }
        .crm-text-primary { color: var(--primary-color, #1ea8e7); }
        .crm-accent-neon {
          color: var(--accent-color, #f43f5e);
          text-shadow: 0 0 10px rgba(244, 63, 94, 0.2);
        }
        .crm-form-label {
          font-weight: 600;
          color: var(--heading-color, #334155);
          margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
        }
        .crm-form-control {
          border-radius: 12px;
          border: 1px solid var(--border-color, #cbd5e1);
          background: var(--input-bg, #f8fafc);
          height: 38px;
          padding: 0 1rem;
          transition: all 0.3s ease;
        }
        .crm-form-control:focus {
          border-color: var(--primary-color, #1ea8e7);
          box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.1);
          background: #ffffff;
        }
        .crm-custom-btn-primary, .crm-custom-btn-outline {
          background: #ffffff !important;
          border: 1px solid #2db5e4 !important;
          border-radius: 50px !important;
          padding: 0.5rem 1.5rem !important;
          font-weight: 500 !important;
          font-size: 0.85rem !important;
          color: #2db5e4 !important;
          box-shadow: none !important;
          transition: all 0.2s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .crm-custom-btn-primary:hover, .crm-custom-btn-outline:hover {
          background: #2db5e4 !important;
          color: #ffffff !important;
        }
        .crm-switch .form-check-input {
          cursor: pointer;
          width: 3em !important;
          height: 1.5em !important;
          margin-top: 0.15rem;
        }
        .crm-switch .form-check-input:checked {
          background-color: #2db5e4 !important;
          border-color: #2db5e4 !important;
        }
      `}</style>

      <div className="page-title-container mb-3">
        <Row>
          <Col className="mb-2">
            <h1 className="mb-2 pb-0 display-4" id="title">Standard Loyalty</h1>
          </Col>
        </Row>
      </div>

      <Card className="crm-glass-card p-4 border-0 mb-4">

        <Form onSubmit={handleSettingsSubmit}>
          <div className="mb-4 p-3 rounded-3" style={{ background: 'var(--light-bg, rgba(241, 245, 249, 0.5))' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <h6 className="fw-bold crm-text-heading m-0">Global Master Switch</h6>
              <Form.Check
                type="switch"
                className="crm-switch m-0"
                id="loyalty-active"
                checked={settings.isActive}
                onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })}
              />
            </div>
            <span className="crm-text-muted small d-block">Enable or temporarily pause the entire loyalty engine</span>
          </div>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="operational-report-interactive-card border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="operational-report-card-title-container">
                    <h2 className="small-title mb-0" style={{ color: '#2db5e4', fontWeight: '800' }}>
                      Earning Dynamics
                    </h2>
                    <CsLineIcons icon="activity" size="18" style={{ color: '#2db5e4' }} />
                  </div>
                  <div className="mt-4">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-secondary mb-1" style={{ fontSize: '0.9rem' }}>Amount Spent (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        className="crm-form-control"
                        value={settings.earnRateSpent}
                        onChange={(e) => setSettings({ ...settings, earnRateSpent: Number(e.target.value) })}
                        disabled={!settings.isActive}
                      />
                      <Form.Text className="text-muted mt-1 d-block" style={{ fontSize: '0.85rem' }}>Every ₹{settings.earnRateSpent} spent yields...</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold text-secondary mb-1" style={{ fontSize: '0.9rem' }}>Points Awarded</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        className="crm-form-control"
                        value={settings.earnRatePoints}
                        onChange={(e) => setSettings({ ...settings, earnRatePoints: Number(e.target.value) })}
                        disabled={!settings.isActive}
                      />
                      <Form.Text className="text-muted mt-1 d-block" style={{ fontSize: '0.85rem' }}>...{settings.earnRatePoints} loyalty points.</Form.Text>
                    </Form.Group>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="operational-report-interactive-card border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="operational-report-card-title-container">
                    <h2 className="small-title mb-0" style={{ color: '#f87171', fontWeight: '800' }}>
                      Redemption Power
                    </h2>
                    <CsLineIcons icon="gift" size="18" style={{ color: '#f87171' }} />
                  </div>
                  <div className="mt-4">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-secondary mb-1" style={{ fontSize: '0.9rem' }}>Points to Redeem</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        className="crm-form-control"
                        value={settings.redeemRatePoints}
                        onChange={(e) => setSettings({ ...settings, redeemRatePoints: Number(e.target.value) })}
                        disabled={!settings.isActive}
                      />
                      <Form.Text className="text-muted mt-1 d-block" style={{ fontSize: '0.85rem' }}>Trading in {settings.redeemRatePoints} points grants...</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold text-secondary mb-1" style={{ fontSize: '0.9rem' }}>Discount Value (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        className="crm-form-control"
                        value={settings.redeemRateDiscount}
                        onChange={(e) => setSettings({ ...settings, redeemRateDiscount: Number(e.target.value) })}
                        disabled={!settings.isActive}
                      />
                      <Form.Text className="text-muted mt-1 d-block" style={{ fontSize: '0.85rem' }}>...a ₹{settings.redeemRateDiscount} reduction on the bill.</Form.Text>
                    </Form.Group>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="text-end mt-4">
            <Button type="submit" variant="none" className="crm-custom-btn-primary rounded-pill px-4" disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </Form>
      </Card>
    </>
  );
};

export default StandardLoyalty;