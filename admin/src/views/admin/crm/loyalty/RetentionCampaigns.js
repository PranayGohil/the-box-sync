import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Modal, Badge } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';

const RetentionCampaigns = () => {
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  
  const initialCampaignState = {
    name: '',
    triggerType: '',
    isAutomated: true,
    conditionMatch: 'ALL',
    conditions: [{ field: 'TOTAL_SPEND', operator: 'GREATER_THAN', value: 0 }],
    rewardType: 'POINTS',
    rewardValue: ''
  };

  const [newCampaign, setNewCampaign] = useState({ ...initialCampaignState });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/loyalty/retention-campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setCampaigns(res.data.data);
      }
    } catch (err) {
      console.error('Error loading campaigns:', err);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCampaigns();
    }
  }, [token]);

  const handleAddCondition = () => {
    setNewCampaign({
      ...newCampaign,
      conditions: [...newCampaign.conditions, { field: 'TOTAL_SPEND', operator: 'GREATER_THAN', value: 0 }]
    });
  };

  const handleRemoveCondition = (index) => {
    const updatedConditions = newCampaign.conditions.filter((_, i) => i !== index);
    setNewCampaign({ ...newCampaign, conditions: updatedConditions });
  };

  const handleConditionChange = (index, key, value) => {
    const updatedConditions = [...newCampaign.conditions];
    updatedConditions[index][key] = value;
    setNewCampaign({ ...newCampaign, conditions: updatedConditions });
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/loyalty/retention-campaigns`, newCampaign, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Campaign created successfully');
        setShowModal(false);
        setNewCampaign({ ...initialCampaignState });
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    }
  };

  const toggleCampaignStatus = async (id) => {
    try {
      const res = await axios.put(`${process.env.REACT_APP_API}/loyalty/retention-campaigns/toggle/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Error toggling campaign:', err);
      toast.error('Failed to update campaign status');
    }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this campaign?")) return;
    try {
      const res = await axios.delete(`${process.env.REACT_APP_API}/loyalty/retention-campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Error deleting campaign:', err);
      toast.error('Failed to delete campaign');
    }
  };

  const runCampaignsManual = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API}/loyalty/run-campaigns`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        toast.success(`Automated rules processed! Custom Triggered: ${res.data.stats.customTriggered || 0}`);
      }
    } catch (err) {
      console.error('Error triggering automated campaigns:', err);
      toast.error('Failed to dispatch scans');
    }
  };

  const getRewardLabel = (camp) => {
    switch (camp.rewardType) {
      case 'POINTS': return `+${camp.rewardValue} pts`;
      case 'DISCOUNT_PERCENT': return `${camp.rewardValue}% Off`;
      case 'DISCOUNT_AMOUNT': return `₹${camp.rewardValue} Off`;
      case 'FREE_ITEM': return `Free ${camp.rewardValue}`;
      default: return camp.rewardValue;
    }
  };

  return (
    <>
      <HtmlHead title="Loyalty Engine" description="Advanced Custom Campaigns Engine" />
      <style>{`
        .crm-glass-card {
          background: var(--card-bg, rgba(255, 255, 255, 0.85)) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid var(--border-color, rgba(226, 232, 240, 0.4)) !important;
          border-radius: 20px !important;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05) !important;
        }
        .crm-text-heading { color: var(--heading-color, #1e293b); }
        .crm-text-body { color: var(--body-color, #475569); }
        .crm-text-muted { color: var(--muted-color, #94a3b8); }
        .crm-text-primary { color: var(--primary-color, #1ea8e7); }
        .crm-form-label {
          font-weight: 600;
          color: var(--heading-color, #334155);
          margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
        }
        .crm-form-control, .crm-form-select {
          border-radius: 12px;
          border: 1px solid var(--border-color, #cbd5e1);
          background: var(--input-bg, #f8fafc);
          height: 38px;
          padding: 0 1rem;
          transition: all 0.3s ease;
        }
        .crm-form-control:focus, .crm-form-select:focus {
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
        .crm-table {
          --bs-table-bg: transparent;
          --bs-table-striped-bg: rgba(241, 245, 249, 0.5);
          border-collapse: separate;
          border-spacing: 0 8px;
        }
        .crm-table tbody tr {
          background: var(--card-bg, #ffffff);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .crm-table tbody tr:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
        .crm-table td {
          border: none;
          padding: 1rem 1.25rem;
          vertical-align: middle;
        }
        .crm-table td:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
        .crm-table td:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
        .crm-table th {
          border: none;
          color: var(--muted-color, #64748b);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          padding: 0.75rem 1.25rem;
        }
        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: rgba(226, 232, 240, 0.6);
          color: #64748b;
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          background: #e2e8f0;
          color: #334155;
        }
        .action-btn.delete:hover {
          background: #fee2e2;
          color: #ef4444;
        }
        .action-btn.delete:hover {
          background: #fee2e2;
          color: #ef4444;
        }
        .rule-card {
          background: rgba(241, 245, 249, 0.5);
          border-radius: 12px;
          padding: 1rem;
          border: 1px dashed #cbd5e1;
        }
        .crm-switch .form-check-input {
          cursor: pointer;
          transform: scale(1.3);
          margin-top: 0.15rem;
        }
        .crm-switch .form-check-input:checked {
          background-color: #2db5e4 !important;
          border-color: #2db5e4 !important;
        }
      `}</style>

      <div className="page-title-container mb-3 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="mb-0 pb-0 display-4" id="title">Advanced Loyalty Engine</h1>
        </div>
        <div className="d-flex gap-2">
          <Button variant="none" className="crm-custom-btn-outline px-4 py-2" onClick={runCampaignsManual}>
            <CsLineIcons icon="send" size="18" className="me-2" />
            Run Scans
          </Button>
          <Button variant="none" className="crm-custom-btn-primary px-4 py-2" onClick={() => setShowModal(true)}>
            <CsLineIcons icon="plus" size="18" className="me-2" />
            Build Rule
          </Button>
        </div>
      </div>

      <Card className="crm-glass-card p-4 border-0">
        <div className="crm-section-header mb-4">
          <h4 className="fw-bold crm-text-heading m-0 d-flex align-items-center gap-2">
            <CsLineIcons icon="diagram-2" className="crm-text-primary" size="20" />
            Automated Rules & Campaigns
          </h4>
        </div>

        {loading ? (
          <div className="text-center py-5">Loading configurations...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-5 crm-text-body fw-medium">
            <CsLineIcons icon="send" size="48" className="text-muted mb-3 opacity-50" />
            <p>No active rules defined yet.</p>
            <Button variant="none" className="crm-custom-btn-outline mt-2" onClick={() => setShowModal(true)}>
              Build Your First Rule
            </Button>
          </div>
        ) : (
          <Table responsive hover className="crm-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Trigger Event</th>
                <th>Conditions</th>
                <th>Reward</th>
                <th>Automated</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => (
                <tr key={camp._id}>
                  <td className="fw-bold crm-text-heading">{camp.name}</td>
                  <td>
                    <Badge bg="info" className="text-white px-3 py-2 rounded-pill">
                      {camp.triggerType}
                    </Badge>
                  </td>
                  <td className="crm-text-body" style={{ maxWidth: '250px' }}>
                    {camp.conditions && camp.conditions.length > 0 ? (
                      <div>
                        <span className="fw-bold text-muted small me-2">{camp.conditionMatch}:</span>
                        {camp.conditions.map((c, i) => (
                          <div key={i} className="small">
                            {c.field.replace('_', ' ')} {c.operator === 'GREATER_THAN' ? '>' : c.operator === 'LESS_THAN' ? '<' : '='} {c.value}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">No conditions set</span>
                    )}
                  </td>
                  <td className="fw-bold text-success">{getRewardLabel(camp)}</td>
                  <td>
                    {camp.isAutomated ? (
                      <Badge bg="success" className="bg-opacity-10 text-success px-2 py-1">Active Scan</Badge>
                    ) : (
                      <Badge bg="secondary" className="bg-opacity-10 text-secondary px-2 py-1">Manual Run</Badge>
                    )}
                  </td>
                  <td>
                    <Form.Check
                      type="switch"
                      id={`switch-${camp._id}`}
                      checked={camp.isActive}
                      onChange={() => toggleCampaignStatus(camp._id)}
                      className="crm-switch m-0"
                    />
                  </td>
                  <td className="text-end">
                    <button type="button" className="action-btn delete" onClick={() => deleteCampaign(camp._id)}>
                      <CsLineIcons icon="bin" size="16" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Advanced Rule Builder Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold crm-text-heading">Build Loyalty Rule</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateCampaign}>
          <Modal.Body>
            <div className="mb-4">
              <h6 className="fw-bold text-primary mb-3">1. Basics</h6>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="crm-form-label">Internal Rule Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. VIP Spenders Alert"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      required
                      className="crm-form-control"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="crm-form-label">Customer-Facing Trigger Label</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Milestone Achieved!"
                      value={newCampaign.triggerType}
                      onChange={(e) => setNewCampaign({ ...newCampaign, triggerType: e.target.value })}
                      required
                      className="crm-form-control"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Check
                    type="checkbox"
                    id="isAutomated"
                    label="Run this rule automatically during background scans (Recommended)"
                    checked={newCampaign.isAutomated}
                    onChange={(e) => setNewCampaign({ ...newCampaign, isAutomated: e.target.checked })}
                    className="fw-bold text-muted mt-2"
                  />
                </Col>
              </Row>
            </div>

            <div className="mb-4">
              <h6 className="fw-bold text-primary mb-3">2. Rule Logic</h6>
              <div className="rule-card">
                <div className="d-flex align-items-center mb-3">
                  <span className="me-2 fw-bold text-muted">Match</span>
                  <Form.Select
                    size="sm"
                    className="d-inline-block w-auto shadow-sm"
                    value={newCampaign.conditionMatch}
                    onChange={(e) => setNewCampaign({ ...newCampaign, conditionMatch: e.target.value })}
                  >
                    <option value="ALL">ALL (AND)</option>
                    <option value="ANY">ANY (OR)</option>
                  </Form.Select>
                  <span className="ms-2 fw-bold text-muted">of the following rules:</span>
                </div>

                {newCampaign.conditions.map((cond, index) => (
                  <Row className="g-2 mb-2 align-items-center" key={index}>
                    <Col sm={4}>
                      <Form.Select
                        value={cond.field}
                        onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                        className="crm-form-select"
                        required
                      >
                        <option value="TOTAL_SPEND">Total Spend Amount</option>
                        <option value="VISIT_COUNT">Total Visits Count</option>
                        <option value="INACTIVITY_DAYS">Days Since Last Visit</option>
                      </Form.Select>
                    </Col>
                    <Col sm={3}>
                      <Form.Select
                        value={cond.operator}
                        onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                        className="crm-form-select"
                        required
                      >
                        <option value="GREATER_THAN">Is Greater Than</option>
                        <option value="LESS_THAN">Is Less Than</option>
                        <option value="EQUAL">Is Exactly</option>
                      </Form.Select>
                    </Col>
                    <Col sm={4}>
                      <Form.Control
                        type="number"
                        placeholder="Value"
                        value={cond.value}
                        onChange={(e) => handleConditionChange(index, 'value', parseInt(e.target.value, 10) || 0)}
                        className="crm-form-control"
                        required
                      />
                    </Col>
                    <Col sm={1} className="text-end">
                      {newCampaign.conditions.length > 1 && (
                        <button type="button" className="action-btn delete m-0" onClick={() => handleRemoveCondition(index)}>
                          <CsLineIcons icon="close" size="14" />
                        </button>
                      )}
                    </Col>
                  </Row>
                ))}
                
                <Button variant="none" className="text-primary fw-bold p-0 mt-2" onClick={handleAddCondition}>
                  + Add Another Condition
                </Button>
              </div>
            </div>

            <div>
              <h6 className="fw-bold text-primary mb-3">3. Reward & Execution</h6>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="crm-form-label">Reward Type</Form.Label>
                    <Form.Select
                      value={newCampaign.rewardType}
                      onChange={(e) => setNewCampaign({ ...newCampaign, rewardType: e.target.value })}
                      className="crm-form-select"
                      required
                    >
                      <option value="POINTS">Loyalty Points</option>
                      <option value="DISCOUNT_PERCENT">Percentage Discount (%)</option>
                      <option value="DISCOUNT_AMOUNT">Flat Discount Amount (₹)</option>
                      <option value="FREE_ITEM">Free Item</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="crm-form-label">
                      {newCampaign.rewardType === 'FREE_ITEM' ? 'Item Name' : 'Reward Value'}
                    </Form.Label>
                    <Form.Control
                      type={newCampaign.rewardType === 'FREE_ITEM' ? 'text' : 'number'}
                      placeholder={newCampaign.rewardType === 'FREE_ITEM' ? 'e.g. Free Garlic Bread' : 'e.g. 50'}
                      value={newCampaign.rewardValue}
                      onChange={(e) => setNewCampaign({ ...newCampaign, rewardValue: e.target.value })}
                      required
                      className="crm-form-control"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 mt-4">
            <Button variant="none" className="crm-custom-btn-outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="none" className="crm-custom-btn-primary">
              Activate Engine Rule
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default RetentionCampaigns;