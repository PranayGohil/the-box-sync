import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Form, Button, Tabs, Tab, Modal, Table } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { AuthContext } from 'contexts/AuthContext';

const LoyaltySettings = () => {
  const { activePlans } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  const [activeTab, setActiveTab] = useState('loyalty');
  
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
      feedbackRewardPoints: 20
    }
  });

  // Quests & Transactions State
  const [quests, setQuests] = useState([]);
  const [history, setHistory] = useState([]);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Quest Form State
  const [newQuest, setNewQuest] = useState({
    name: '',
    challengeType: 'DESSERT',
    targetCount: 3,
    rewardType: 'BONUS_POINTS',
    rewardValue: '100',
    durationDays: 30
  });

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/loyalty/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error("Error loading loyalty settings:", err);
    }
  };

  const fetchQuests = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/loyalty/quests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setQuests(res.data.data);
      }
    } catch (err) {
      console.error("Error loading quests:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/loyalty/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error("Error loading transactions:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSettings();
      fetchQuests();
      fetchTransactions();
    }
  }, [token]);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/loyalty/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || "Loyalty configurations saved!");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignToggle = (field) => {
    setSettings({
      ...settings,
      campaigns: {
        ...settings.campaigns,
        [field]: !settings.campaigns[field]
      }
    });
  };

  const handleCampaignValueChange = (field, val) => {
    setSettings({
      ...settings,
      campaigns: {
        ...settings.campaigns,
        [field]: parseInt(val, 10) || 0
      }
    });
  };

  const handleQuestToggle = async (id) => {
    try {
      const res = await axios.put(`${process.env.REACT_APP_API}/loyalty/quests/toggle/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchQuests();
      }
    } catch (err) {
      console.error("Error toggling quest state:", err);
      toast.error("Failed to toggle quest status");
    }
  };

  const handleQuestSubmit = async (e) => {
    e.preventDefault();
    if (!newQuest.name || !newQuest.rewardValue) {
      toast.warning("Please fill out all fields.");
      return;
    }
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/loyalty/quests`, newQuest, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success("Food Quest launched successfully!");
        setShowQuestModal(false);
        setNewQuest({
          name: '',
          challengeType: 'DESSERT',
          targetCount: 3,
          rewardType: 'BONUS_POINTS',
          rewardValue: '100',
          durationDays: 30
        });
        fetchQuests();
      }
    } catch (err) {
      console.error("Error adding quest:", err);
      toast.error(err.response?.data?.message || "Failed to launch quest");
    }
  };

  const runCampaignsManual = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/loyalty/run-campaigns`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(`Retention campaigns completed! Winbacks: ${res.data.stats.winbackTriggered}, Birthdays: ${res.data.stats.birthdayTriggered}`);
        fetchTransactions();
      }
    } catch (err) {
      console.error("Error triggering manual campaigns:", err);
      toast.error("Re-engagement campaigns failed to execute");
    }
  };

  const title = 'CRM & Loyalty Engine';
  const description = 'Manage standard loyalty rewards, automated marketing, and food quests';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'settings', text: 'Settings' },
    { to: 'settings/crm', title: 'CRM & Loyalty Engine' },
  ];

  return (
    <>
      <HtmlHead title={title} description={description} />
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
          transform: translateY(-2px);
          box-shadow: 0 12px 40px 0 rgba(30, 168, 231, 0.08) !important;
        }

        /* Scoped Section Headers */
        .crm-section-header {
          border-left: 4px solid #1ea8e7;
          padding-left: 15px;
          margin-bottom: 25px;
        }
        
        /* Custom Slate Colors to fix invisibility in light and dark modes */
        .crm-text-primary {
          color: #1ea8e7 !important;
        }
        .crm-text-heading {
          color: var(--heading, #1e293b) !important;
          font-weight: 700;
        }
        .crm-text-body {
          color: var(--body-color, #475569) !important;
        }
        .crm-text-muted {
          color: var(--alternate, #94a3b8) !important;
        }
        .crm-accent-neon {
          color: #23b3f4 !important;
          font-weight: 700;
        }

        /* Modernized Form Styling */
        .crm-form-control, .crm-form-select {
          height: 45px !important;
          border-radius: 1rem !important;
          border: 1px solid var(--border-color, #e2e8f0) !important;
          background-color: var(--background, #f8fafc) !important;
          color: var(--body-color, #1e293b) !important;
          font-size: 0.9rem !important;
          padding: 0.45rem 1rem !important;
          transition: all 0.25s ease !important;
        }
        .crm-form-control:focus, .crm-form-select:focus {
          background-color: var(--card-bg, #ffffff) !important;
          border-color: #1ea8e7 !important;
          box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.12) !important;
          outline: none !important;
        }
        .crm-form-label {
          font-weight: 700;
          color: var(--heading, #4a5568);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
          display: block;
        }

        /* Buttons Styling */
        .crm-custom-btn-outline {
          background: transparent !important;
          border: 1.5px solid #1ea8e7 !important;
          color: #1ea8e7 !important;
          border-radius: 50px !important;
          padding: 0.5rem 1.25rem !important;
          font-weight: 600 !important;
          transition: all 0.3s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03) !important;
        }
        .crm-custom-btn-outline:hover {
          background: #1ea8e7 !important;
          color: #ffffff !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(30, 168, 231, 0.2) !important;
        }
        .crm-custom-btn-outline i, .crm-custom-btn-outline svg {
          transition: stroke 0.3s ease;
        }
        .crm-custom-btn-outline:hover i, .crm-custom-btn-outline:hover svg {
          stroke: #ffffff !important;
        }
        
        .crm-custom-btn-solid {
          background: #1ea8e7 !important;
          border: 1px solid #1ea8e7 !important;
          color: #ffffff !important;
          border-radius: 50px !important;
          padding: 0.6rem 1.5rem !important;
          font-weight: 600 !important;
          transition: all 0.3s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
        }
        .crm-custom-btn-solid:hover {
          background: #0091d5 !important;
          border-color: #0091d5 !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(30, 168, 231, 0.25) !important;
        }

        /* Checkbox Switch Branding */
        .form-check-input:checked {
          background-color: #1ea8e7 !important;
          border-color: #1ea8e7 !important;
        }

        /* Premium Nav Tabs */
        .crm-nav-tabs {
          border-bottom: 2px solid var(--border-color, #edf2f7) !important;
          gap: 12px;
          margin-bottom: 2.25rem !important;
        }
        .crm-nav-tabs .nav-link {
          border: none !important;
          color: var(--alternate, #64748b) !important;
          font-weight: 600 !important;
          padding: 12px 24px !important;
          border-radius: 12px 12px 0 0 !important;
          position: relative;
          transition: all 0.3s ease !important;
          display: flex !important;
          align-items: center !important;
        }
        .crm-nav-tabs .nav-link:hover {
          color: #1ea8e7 !important;
          background: rgba(30, 168, 231, 0.06) !important;
        }
        .crm-nav-tabs .nav-link.active {
          color: #1ea8e7 !important;
          background: transparent !important;
        }
        .crm-nav-tabs .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background: #1ea8e7;
          border-radius: 3px 3px 0 0;
        }

        /* Informative Bullet List */
        .crm-info-list {
          list-style: none;
          padding-left: 0;
        }
        .crm-info-list li {
          margin-bottom: 1.25rem;
          position: relative;
          padding-left: 32px;
          line-height: 1.6;
        }
        .crm-info-list li::before {
          content: '✔';
          position: absolute;
          left: 0;
          top: 3px;
          color: #1ea8e7;
          font-weight: bold;
          font-size: 1.1rem;
        }

        /* Premium Tables */
        .crm-table {
          vertical-align: middle;
          margin-bottom: 0;
        }
        .crm-table th {
          font-weight: 700 !important;
          text-transform: uppercase;
          font-size: 0.75rem !important;
          letter-spacing: 0.05em;
          color: var(--alternate, #64748b) !important;
          border-bottom: 2px solid var(--border-color, #edf2f7) !important;
          padding: 1.1rem 1rem !important;
          background: transparent !important;
        }
        .crm-table td {
          padding: 1.25rem 1rem !important;
          border-bottom: 1px solid var(--border-color, #f1f5f9) !important;
          color: var(--body-color, #334155) !important;
          background: transparent !important;
        }

        /* Glass Modal Aesthetics */
        .crm-glass-modal .modal-content {
          background: var(--card-bg, rgba(255, 255, 255, 0.95)) !important;
          backdrop-filter: blur(15px) !important;
          border: 1px solid var(--border-color, rgba(226, 232, 240, 0.4)) !important;
          border-radius: 20px !important;
        }
        .crm-glass-modal .modal-header {
          border-bottom: 1px solid var(--border-color, #f1f5f9) !important;
          padding: 1.5rem !important;
        }
        .crm-glass-modal .modal-footer {
          border-top: 1px solid var(--border-color, #f1f5f9) !important;
          padding: 1.25rem 1.5rem !important;
        }

        /* Responsive Layouts */
        @media (max-width: 991px) {
          .crm-nav-tabs {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 6px;
          }
          .crm-nav-tabs .nav-link {
            white-space: nowrap;
            padding: 10px 18px !important;
          }
        }
        
        @media (max-width: 768px) {
          .crm-button-group-responsive {
            flex-direction: column !important;
            width: 100% !important;
            gap: 12px !important;
          }
          .crm-button-group-responsive button, .crm-button-group-responsive a {
            width: 100% !important;
            justify-content: center !important;
            padding: 0.75rem 1rem !important;
          }
          .crm-form-control, .crm-form-select {
            font-size: 16px !important;
            height: 45px !important;
          }
          .crm-page-title-container h1 {
            font-size: 1.75rem !important;
          }
        }

        @media (max-width: 576px) {
          .crm-glass-card {
            border-radius: 12px !important;
            padding: 1.25rem !important;
          }
        }
      `}</style>

      <div className="container-fluid pb-5">
        {/* Dynamic Responsive Title & Breadcrumbs */}
        <Row className="g-3 align-items-center mb-4 crm-page-title-container">
          <Col xs={12} md={7}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs={12} md={5} className="d-flex justify-content-md-end justify-content-start crm-button-group-responsive gap-2">
            <Button variant="none" className="crm-custom-btn-outline" onClick={runCampaignsManual} disabled={loading}>
              <CsLineIcons icon="refresh" size="18" className="me-2" />
              Trigger Schedulers
            </Button>
          </Col>
        </Row>

        {/* Gorgeous Tab Container */}
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="crm-nav-tabs border-bottom-0">
          
          {/* TAB 1: STANDARD LOYALTY */}
          <Tab 
            eventKey="loyalty" 
            title={
              <span>
                <CsLineIcons icon="star" className="me-2" size="16" />
                Standard Loyalty
              </span>
            }
          >
            <Row className="g-4">
              <Col lg={7}>
                <Card className="crm-glass-card p-4 p-md-5 border-0">
                  <div className="crm-section-header">
                    <h4 className="fw-bold crm-text-heading m-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="settings-1" className="crm-text-primary" size="20" />
                      Points Earn & Redeem Config
                    </h4>
                  </div>
                  
                  <Form onSubmit={handleSettingsSubmit}>
                    <Form.Group className="mb-4">
                      <Form.Check
                        type="switch"
                        id="loyalty-active-switch"
                        label={settings.isActive ? "Loyalty Engine is Active" : "Loyalty Engine is Disabled"}
                        checked={settings.isActive}
                        onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })}
                        className="fw-bold crm-text-heading mb-3"
                      />
                    </Form.Group>

                    <Row className="mb-4 g-3">
                      <h6 className="crm-text-heading fw-bold mb-1">1. Points Accumulation Rate</h6>
                      <Col sm={6}>
                        <Form.Label className="crm-form-label">Spent Threshold (₹)</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.earnRateSpent}
                          onChange={(e) => setSettings({ ...settings, earnRateSpent: parseInt(e.target.value, 10) || 1 })}
                          disabled={!settings.isActive}
                          className="crm-form-control"
                        />
                      </Col>
                      <Col sm={6}>
                        <Form.Label className="crm-form-label">Loyalty Points Credited</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.earnRatePoints}
                          onChange={(e) => setSettings({ ...settings, earnRatePoints: parseInt(e.target.value, 10) || 1 })}
                          disabled={!settings.isActive}
                          className="crm-form-control"
                        />
                      </Col>
                      <Form.Text className="crm-text-muted mt-2 ps-3">
                        Rule: Every <strong className="text-info">₹{settings.earnRateSpent}</strong> paid automatically credits <strong className="text-info">{settings.earnRatePoints}</strong> loyalty points.
                      </Form.Text>
                    </Row>

                    <Row className="mb-4 g-3">
                      <h6 className="crm-text-heading fw-bold mb-1">2. Points Cash-Redemption Rate</h6>
                      <Col sm={6}>
                        <Form.Label className="crm-form-label">Points Redeemed</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.redeemRatePoints}
                          onChange={(e) => setSettings({ ...settings, redeemRatePoints: parseInt(e.target.value, 10) || 1 })}
                          disabled={!settings.isActive}
                          className="crm-form-control"
                        />
                      </Col>
                      <Col sm={6}>
                        <Form.Label className="crm-form-label">Discount Benefit (₹)</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.redeemRateDiscount}
                          onChange={(e) => setSettings({ ...settings, redeemRateDiscount: parseInt(e.target.value, 10) || 1 })}
                          disabled={!settings.isActive}
                          className="crm-form-control"
                        />
                      </Col>
                      <Form.Text className="crm-text-muted mt-2 ps-3">
                        Rule: Cashiers can redeem <strong className="text-info">{settings.redeemRatePoints}</strong> points to apply a <strong className="text-info">₹{settings.redeemRateDiscount}</strong> immediate billing discount.
                      </Form.Text>
                    </Row>

                    <Button type="submit" variant="none" className="crm-custom-btn-solid mt-2 w-100 w-md-auto" disabled={loading || !settings.isActive}>
                      {loading ? "Saving..." : "Save Policies"}
                    </Button>
                  </Form>
                </Card>
              </Col>

              <Col lg={5}>
                <Card className="crm-glass-card p-4 p-md-5 border-0 h-100">
                  <div className="crm-section-header">
                    <h4 className="fw-bold crm-text-heading m-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="help" className="crm-text-primary" size="20" />
                      Program Mechanics
                    </h4>
                  </div>
                  
                  <ul className="crm-info-list crm-text-body">
                    <li>
                      <strong>Real-Time Billing Profile:</strong> Entering a customer phone number on the POS checkout screen pulls active spend metrics instantly.
                    </li>
                    <li>
                      <strong>Zero Manual Calculations:</strong> The server automatically translates bill subtotals into point balances.
                    </li>
                    <li>
                      <strong>Cashier Checks:</strong> Cashiers see standard point-redemption checks inside Dine In, Takeaway, and Delivery sheets.
                    </li>
                    <li>
                      <strong>Ledger Logs:</strong> Every deposit, redemption, or quest reward is recorded in the points ledger.
                    </li>
                  </ul>
                </Card>
              </Col>
            </Row>
          </Tab>

          {/* TAB 2: BEHAVIORAL CAMPAIGNS */}
          {activePlans.includes('Automated Retention Campaigns') && (
          <Tab 
            eventKey="campaigns" 
            title={
              <span>
                <CsLineIcons icon="message" className="me-2" size="16" />
                Retention Campaigns
              </span>
            }
          >
            <Form onSubmit={handleSettingsSubmit}>
              <Row className="g-4">
                
                {/* WINBACK */}
                <Col md={6}>
                  <Card className="crm-glass-card p-4 border-0">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="fw-bold crm-text-heading mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="pin" className="crm-text-primary" size="18" />
                        Win-back Campaign
                      </h5>
                      <Form.Check
                        type="switch"
                        id="campaigns-winbackActive"
                        checked={settings.campaigns.winbackActive}
                        onChange={() => handleCampaignToggle('winbackActive')}
                        className="m-0"
                      />
                    </div>
                    <p className="crm-text-muted small mb-3">Automated winback reward points for long-lost customers.</p>
                    <Form.Group className="mb-3">
                      <Form.Label className="crm-form-label">Inactivity Limit (Days)</Form.Label>
                      <Form.Control
                        type="number"
                        value={settings.campaigns.winbackDays}
                        onChange={(e) => handleCampaignValueChange('winbackDays', e.target.value)}
                        disabled={!settings.campaigns.winbackActive}
                        className="crm-form-control"
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label className="crm-form-label">Reward Points Balance</Form.Label>
                      <Form.Control
                        type="number"
                        value={settings.campaigns.winbackRewardPoints}
                        onChange={(e) => handleCampaignValueChange('winbackRewardPoints', e.target.value)}
                        disabled={!settings.campaigns.winbackActive}
                        className="crm-form-control"
                      />
                    </Form.Group>
                  </Card>
                </Col>

                {/* BIRTHDAY SPECIAL */}
                <Col md={6}>
                  <Card className="crm-glass-card p-4 border-0">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="fw-bold crm-text-heading mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="gift" className="crm-text-primary" size="18" />
                        Birthday Special
                      </h5>
                      <Form.Check
                        type="switch"
                        id="campaigns-birthdayActive"
                        checked={settings.campaigns.birthdayActive}
                        onChange={() => handleCampaignToggle('birthdayActive')}
                        className="m-0"
                      />
                    </div>
                    <p className="crm-text-muted small mb-3">Celebration bonus points during the customer's birthday month.</p>
                    <Form.Group className="mb-4">
                      <Form.Label className="crm-form-label">Birthday Reward Points</Form.Label>
                      <Form.Control
                        type="number"
                        value={settings.campaigns.birthdayRewardPoints}
                        onChange={(e) => handleCampaignValueChange('birthdayRewardPoints', e.target.value)}
                        disabled={!settings.campaigns.birthdayActive}
                        className="crm-form-control"
                      />
                    </Form.Group>
                  </Card>
                </Col>

                {/* MILESTONE */}
                <Col md={6}>
                  <Card className="crm-glass-card p-4 border-0">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="fw-bold crm-text-heading mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="badge" className="crm-text-primary" size="18" />
                        Loyalty Milestone
                      </h5>
                      <Form.Check
                        type="switch"
                        id="campaigns-milestoneActive"
                        checked={settings.campaigns.milestoneActive}
                        onChange={() => handleCampaignToggle('milestoneActive')}
                        className="m-0"
                      />
                    </div>
                    <p className="crm-text-muted small mb-3">Surprise bonus points when a points accumulation tier is reached.</p>
                    <Form.Group className="mb-3">
                      <Form.Label className="crm-form-label">Tier Threshold (Points)</Form.Label>
                      <Form.Control
                        type="number"
                        value={settings.campaigns.milestoneThresholdPoints}
                        onChange={(e) => handleCampaignValueChange('milestoneThresholdPoints', e.target.value)}
                        disabled={!settings.campaigns.milestoneActive}
                        className="crm-form-control"
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label className="crm-form-label">Milestone Reward Points</Form.Label>
                      <Form.Control
                        type="number"
                        value={settings.campaigns.milestoneRewardPoints}
                        onChange={(e) => handleCampaignValueChange('milestoneRewardPoints', e.target.value)}
                        disabled={!settings.campaigns.milestoneActive}
                        className="crm-form-control"
                      />
                    </Form.Group>
                  </Card>
                </Col>

                {/* FEEDBACK REWARD */}
                <Col md={6}>
                  <Card className="crm-glass-card p-4 border-0">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="fw-bold crm-text-heading mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="form" className="crm-text-primary" size="18" />
                        Feedback Reward
                      </h5>
                      <Form.Check
                        type="switch"
                        id="campaigns-feedbackActive"
                        checked={settings.campaigns.feedbackActive}
                        onChange={() => handleCampaignToggle('feedbackActive')}
                        className="m-0"
                      />
                    </div>
                    <p className="crm-text-muted small mb-3">Credits points when order ratings or reviews are submitted.</p>
                    <Form.Group className="mb-4">
                      <Form.Label className="crm-form-label">Review Completion Points</Form.Label>
                      <Form.Control
                        type="number"
                        value={settings.campaigns.feedbackRewardPoints}
                        onChange={(e) => handleCampaignValueChange('feedbackRewardPoints', e.target.value)}
                        disabled={!settings.campaigns.feedbackActive}
                        className="crm-form-control"
                      />
                    </Form.Group>
                  </Card>
                </Col>

                <Col md={12} className="text-center mt-3">
                  <Button type="submit" variant="none" className="crm-custom-btn-solid px-5 py-2 fw-bold" disabled={loading}>
                    {loading ? "Saving Campaign Parameters..." : "Save Campaign Parameters"}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Tab>
          )}

          {/* TAB 3: FOOD QUESTS GAMIFICATION */}
          {activePlans.includes('Gamified Loyalty — Food Quests') && (
          <Tab 
            eventKey="quests" 
            title={
              <span>
                <CsLineIcons icon="compass" className="me-2" size="16" />
                Food Quests (Gamified)
              </span>
            }
          >
            <Card className="crm-glass-card p-4 border-0">
              <div className="d-flex flex-sm-row flex-column justify-content-between align-items-sm-center align-items-start gap-3 mb-4">
                <div className="crm-section-header mb-0">
                  <h4 className="fw-bold crm-text-heading m-0 d-flex align-items-center gap-2">
                    <CsLineIcons icon="compass" className="crm-text-primary" size="20" />
                    Gamified Food Quests
                  </h4>
                </div>
                <Button variant="none" className="crm-custom-btn-outline" onClick={() => setShowQuestModal(true)}>
                  <CsLineIcons icon="plus" size="16" className="me-2" />
                  Launch New Quest
                </Button>
              </div>

              {quests.length === 0 ? (
                <div className="text-center py-5 crm-text-body fw-medium">
                  No active quests launched yet. Start gamifying by adding a Food Quest!
                </div>
              ) : (
                <Table responsive hover className="crm-table">
                  <thead>
                    <tr>
                      <th>Quest Challenge Title</th>
                      <th>Requirement Category</th>
                      <th>Target Count</th>
                      <th>Reward Type</th>
                      <th>Reward Amount</th>
                      <th>Validity</th>
                      <th>Active Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quests.map((quest) => (
                      <tr key={quest._id}>
                        <td className="fw-bold crm-text-heading">{quest.name}</td>
                        <td>
                          <span className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill">
                            {quest.challengeType}
                          </span>
                        </td>
                        <td className="crm-text-body">{quest.targetCount} orders/items</td>
                        <td>{quest.rewardType === 'BONUS_POINTS' ? 'Loyalty Points' : 'Menu Coupon'}</td>
                        <td className="crm-accent-neon">{quest.rewardValue}</td>
                        <td className="crm-text-body">{quest.durationDays} days</td>
                        <td>
                          <Form.Check
                            type="switch"
                            checked={quest.isActive}
                            onChange={() => handleQuestToggle(quest._id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </Tab>
          )}

          {/* TAB 4: POINT LOGS */}
          <Tab 
            eventKey="history" 
            title={
              <span>
                <CsLineIcons icon="list" className="me-2" size="16" />
                Ledger Logs
              </span>
            }
          >
            <Card className="crm-glass-card p-4 border-0">
              <div className="crm-section-header mb-4">
                <h4 className="fw-bold crm-text-heading m-0 d-flex align-items-center gap-2">
                  <CsLineIcons icon="list" className="crm-text-primary" size="20" />
                  Loyalty Transaction Audit Ledger
                </h4>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-5 crm-text-body fw-medium">
                  No points transaction audits recorded yet.
                </div>
              ) : (
                <Table responsive hover className="crm-table">
                  <thead>
                    <tr>
                      <th>Customer Profile</th>
                      <th>Mobile</th>
                      <th>Audit Type</th>
                      <th>Points Change</th>
                      <th>Bill Subtotal</th>
                      <th>Audit Context</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((log) => (
                      <tr key={log._id}>
                        <td className="fw-medium crm-text-heading">{log.customer_id?.name || "Walk-In Patron"}</td>
                        <td className="crm-text-body">{log.customer_id?.phone}</td>
                        <td>
                          <span className={`badge rounded-pill px-3 py-2 ${
                            log.type === "EARN" ? "bg-success text-white" : 
                            log.type === "REDEEM" ? "bg-danger text-white" : "bg-info text-white"
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className={`fw-bold ${log.type === "EARN" || log.type === "BONUS" ? "text-success" : "text-danger"}`}>
                          {log.type === "EARN" || log.type === "BONUS" ? "+" : "-"}{log.points} pts
                        </td>
                        <td className="crm-text-body">₹{log.amount}</td>
                        <td className="crm-text-body">{log.description}</td>
                        <td className="crm-text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </Tab>
        </Tabs>
      </div>

      {/* Launch Quest Form Modal */}
      <Modal show={showQuestModal} onHide={() => setShowQuestModal(false)} centered className="crm-glass-modal">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold crm-text-heading">Create Food Quest Challenge</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleQuestSubmit}>
          <Modal.Body className="py-2">
            <Form.Group className="mb-3">
              <Form.Label className="crm-form-label">Quest Challenge Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., The Dessert Connoisseur"
                value={newQuest.name}
                onChange={(e) => setNewQuest({ ...newQuest, name: e.target.value })}
                required
                className="crm-form-control"
              />
            </Form.Group>

            <Row className="mb-3 g-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="crm-form-label">Challenge Category</Form.Label>
                  <Form.Select
                    value={newQuest.challengeType}
                    onChange={(e) => setNewQuest({ ...newQuest, challengeType: e.target.value })}
                    className="crm-form-select"
                  >
                    <option value="DESSERT">Order Desserts</option>
                    <option value="MIDWEEK">Mid-Week Wednesday Visit</option>
                    <option value="BREAKFAST">Order Morning Breakfast</option>
                    <option value="ADVENTUROUS">Try 3 Different Items</option>
                    <option value="LOYAL">10 Completed Visits in Month</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="crm-form-label">Required Target Count</Form.Label>
                  <Form.Control
                    type="number"
                    value={newQuest.targetCount}
                    onChange={(e) => setNewQuest({ ...newQuest, targetCount: parseInt(e.target.value, 10) || 1 })}
                    required
                    className="crm-form-control"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3 g-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="crm-form-label">Reward Action</Form.Label>
                  <Form.Select
                    value={newQuest.rewardType}
                    onChange={(e) => setNewQuest({ ...newQuest, rewardType: e.target.value })}
                    className="crm-form-select"
                  >
                    <option value="BONUS_POINTS">Bonus Loyalty Points</option>
                    <option value="FREE_ITEM">Free Dessert/Drink Coupon</option>
                    <option value="DISCOUNT_PERCENT">Percent off Next Settle</option>
                    <option value="DISCOUNT_CASH">Direct Cash Off Next Bill</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="crm-form-label">Reward Balance/Value</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. 150 or 'Free Gelato'"
                    value={newQuest.rewardValue}
                    onChange={(e) => setNewQuest({ ...newQuest, rewardValue: e.target.value })}
                    required
                    className="crm-form-control"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="crm-form-label">Quest Challenge Validity (Days)</Form.Label>
              <Form.Control
                type="number"
                value={newQuest.durationDays}
                onChange={(e) => setNewQuest({ ...newQuest, durationDays: parseInt(e.target.value, 10) || 30 })}
                className="crm-form-control"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="link" className="text-decoration-none fw-bold text-muted me-2" onClick={() => setShowQuestModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="none" className="crm-custom-btn-solid">
              Launch Quest
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default LoyaltySettings;
