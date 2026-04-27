import React, { useState } from 'react';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { Button, Card, Modal } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import LayoutFull from 'layout/LayoutFull';
import { toast } from 'react-toastify';

const SelectPlan = () => {
  const title = 'Select Plan';
  const description = 'Choose your subscription plan';

  const [selectedPlan, setSelectedPlan] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const allAddons = [
    { label: 'Reservation Management', value: 'Reservation Manager' },
    { label: 'QSR Billing App', value: 'QSR' },
    { label: 'Captain Ordering App', value: 'Captain Panel' },
    { label: 'Kitchen Display System', value: 'KOT Panel' },
    { label: 'Restaurant Website', value: 'Restaurant Website' },
    { label: 'Scan & QR Order', value: 'Scan For Menu' },
    { label: 'QR-based Feedback', value: 'Feedback' },
    { label: 'Waiter Calling System', value: 'Waiter Calling System' },
    { label: 'Dynamic Reports', value: 'Dynamic Reports' },
    { label: 'E-Invoice', value: 'E-Invoice' },
  ];

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setSelectedAddons([]);
    setShowModal(true);
  };

  const handleToggleAddon = (value) => {
    if (selectedAddons.includes(value)) {
      setSelectedAddons(selectedAddons.filter((a) => a !== value));
    } else {
      if (selectedAddons.length < 6) {
        setSelectedAddons([...selectedAddons, value]);
      } else {
        toast.warning('You can only select up to 6 add-ons for the Growth plan.');
      }
    }
  };

  const handleConfirm = async () => {
    setShowModal(false);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/subscription/buy-complete`,
        { planType: selectedPlan, chosenAddons: selectedAddons },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.success) {
        window.location.href = `/dashboard`;
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error purchasing plan:', error);
      toast.error('An error occurred while processing your request.');
    }
  };

  const plans = [
    {
      name: 'Core Plan',
      price: '₹10,000',
      period: '/ year',
      color: 'primary',
      features: {
        basic: [
          'Menu management',
          'Multi-terminal billing',
          'Inventory module',
          'Third-party integrations',
          'In-built CRM',
          'Central kitchen module',
          'Unlimited cash register',
          'Unlimited-user rights',
          'Reports',
          '24x7 Support',
          'Free Training',
        ],
        addons: [],
        advanced: [],
      },
    },
    {
      name: 'Growth Plan',
      price: '₹15,000',
      period: '/ year',
      color: 'success',
      recommended: true,
      features: {
        basic: [
          'Menu management',
          'Multi-terminal billing',
          'Inventory module',
          'Third-party integrations',
          'In-built CRM',
          'Central kitchen module',
          'Unlimited cash register',
          'Unlimited-user rights',
          'Reports',
          '24x7 Support',
          'Free Training',
        ],
        addons: [
          'Reservation Management',
          'QSR Billing App',
          'Captain Ordering App',
          'Kitchen Display System',
          'Restaurant Website',
          'Scan & QR Order',
          'QR-based Feedback',
          'Waiter Calling System',
          'Dynamic Reports',
          'E-Invoice',
        ],
        advanced: [],
      },
    },
    {
      name: 'Scale Plan',
      price: '₹20,000',
      period: '/ year',
      color: 'warning',
      features: {
        basic: [
          'Menu management',
          'Multi-terminal billing',
          'Inventory module',
          'Third-party integrations',
          'In-built CRM',
          'Central kitchen module',
          'Unlimited cash register',
          'Unlimited-user rights',
          'Reports',
          '24x7 Support',
          'Free Training',
        ],
        addons: [
          'Reservation Management',
          'QSR Billing App',
          'Captain Ordering App',
          'Kitchen Display System',
          'Restaurant Website',
          'Scan & QR Order',
          'QR-based Feedback',
          'Waiter Calling System',
          'Dynamic Reports',
          'E-Invoice',
        ],
        advanced: ['Payroll By TheBox', 'Dynamic reports'],
      },
    },
  ];

  return (
    <LayoutFull>
      <HtmlHead title={title} description={description} />

      <div className="min-h-100 d-flex align-items-center justify-content-center py-5">
        <div className="container">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-white fs-2 lh-1 mb-3">Value-packed features at Wallet-friendly cost</h1>
            <p className="text-white bg-primary rounded-3 px-3 py-2 mb-4">No hidden costs & no additional charges. Just transparent & affordable pricing.</p>
          </div>

          {/* Pricing Cards */}
          <div className="row g-4 justify-content-center">
            {plans.map((plan, index) => (
              <div key={index} className="col-xl-4 col-lg-6">
                <Card className={`h-100 border-${plan.color} shadow-hover`}>
                  {plan.recommended && (
                    <div className="position-absolute start-50 translate-middle mt-n3" style={{ top: '15px' }}>
                      <span className="badge bg-success rounded-pill px-3 py-2">Most Popular</span>
                    </div>
                  )}

                  <Card.Body className="d-flex flex-column">
                    {/* Plan Header */}
                    <div className="text-center mb-4">
                      <h3 className={`text-${plan.color} mb-1`}>{plan.name}</h3>
                      <div className="d-flex justify-content-center align-baseline mb-3">
                        <span className="display-4 fw-bold">{plan.price}</span>
                        <span className="text-muted ms-1">{plan.period}</span>
                      </div>
                      <Button variant={plan.color} size="lg" className="mb-4" onClick={() => handlePlanSelect(plan.name.split(' ')[0])}>
                        Select Plan
                      </Button>
                    </div>

                    {/* Features */}
                    <div className="flex-grow-1">
                      {/* Basic Features */}
                      <h6 className="text-muted text-uppercase mb-3">Basic Features</h6>
                      <ul className="list-unstyled mb-4">
                        {plan.features.basic.map((feature, i) => (
                          <li key={`basic-${i}`} className="mb-2">
                            <CsLineIcons icon="check" className="text-success me-2" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Addons */}
                      {plan.features.addons.length > 0 && (
                        <>
                          <h6 className="text-muted text-uppercase mb-3 mt-4">Add-ons</h6>
                          <ul className="list-unstyled mb-4">
                            {plan.features.addons.map((feature, i) => (
                              <li key={`addon-${i}`} className="mb-2">
                                <CsLineIcons icon="check" className="text-success me-2" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {/* Advanced Features */}
                      {plan.features.advanced.length > 0 && (
                        <>
                          <h6 className="text-muted text-uppercase mb-3 mt-4">Advanced Features</h6>
                          <ul className="list-unstyled mb-4">
                            {plan.features.advanced.map((feature, i) => (
                              <li key={`advanced-${i}`} className="mb-2">
                                <CsLineIcons icon="check" className="text-success me-2" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>

          {/* Feature Comparison Table (Collapsible) */}
          <div className="mt-5">
            <div className="collapse" id="featureComparison">
              <Card className="shadow">
                <Card.Body>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '30%' }}>Feature</th>
                          {plans.map((plan, index) => (
                            <th key={index} className="text-center">
                              {plan.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Basic Features */}
                        <tr className="table-secondary">
                          <td colSpan="4" className="fw-bold">
                            Basic Features
                          </td>
                        </tr>
                        {[
                          'Menu management',
                          'Multi-terminal billing',
                          'Inventory module',
                          'Third-party integrations',
                          'In-built CRM',
                          'Central kitchen module',
                          'Unlimited cash register',
                          'Unlimited-user rights',
                          'Reports',
                          '24x7 Support',
                          'Free Training',
                        ].map((feature, index) => (
                          <tr key={`basic-${index}`}>
                            <td>{feature}</td>
                            {plans.map((plan, planIndex) => (
                              <td key={planIndex} className="text-center">
                                <CsLineIcons icon="check" className="text-success" size="15" />
                              </td>
                            ))}
                          </tr>
                        ))}

                        {/* Addons */}
                        <tr className="table-secondary">
                          <td colSpan="4" className="fw-bold">
                            Add-ons
                          </td>
                        </tr>
                        {[
                          'Reservation Management',
                          'QSR Billing App',
                          'Captain Ordering App',
                          'Kitchen Display System',
                          'Restaurant Website',
                          'Scan & QR Order',
                          'QR-based Feedback',
                          'Waiter Calling System',
                          'Dynamic Reports',
                          'E-Invoice',
                        ].map((feature, index) => (
                          <tr key={`addon-${index}`}>
                            <td>{feature}</td>
                            {plans.map((plan, planIndex) => (
                              <td key={planIndex} className="text-center">
                                {plan.features.addons.includes(feature) ? (
                                  <CsLineIcons icon="check" className="text-success" size="15" />
                                ) : (
                                  <CsLineIcons icon="close" className="text-danger" size="15" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}

                        {/* Advanced Features */}
                        <tr className="table-secondary">
                          <td colSpan="4" className="fw-bold">
                            Advanced Features
                          </td>
                        </tr>
                        {['Payroll By TheBox', 'Dynamic reports'].map((feature, index) => (
                          <tr key={`advanced-${index}`}>
                            <td>{feature}</td>
                            {plans.map((plan, planIndex) => (
                              <td key={planIndex} className="text-center">
                                {plan.features.advanced.includes(feature) ? (
                                  <CsLineIcons icon="check" className="text-success" size="15" />
                                ) : (
                                  <CsLineIcons icon="close" className="text-danger" size="15" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Confirm Plan Selection
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPlan === 'Growth' ? (
            <div>
              <div className="text-center mb-4">
                <CsLineIcons icon="grid" size="48" className="text-success mb-3" />
                <h5>Customize Your <strong>Growth</strong> Plan</h5>
                <p className="text-muted mb-0">Select up to 6 Add-ons included in your plan ({selectedAddons.length}/6 selected).</p>
              </div>
              <div className="row g-2">
                {allAddons.map((addon, index) => (
                  <div key={index} className="col-md-6">
                    <div 
                      className={`border rounded p-2 ${selectedAddons.includes(addon.value) ? 'border-success bg-success-subtle' : ''}`}
                      onClick={() => handleToggleAddon(addon.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="form-check m-0 d-flex align-items-center" style={{ cursor: 'pointer' }}>
                        <input 
                          className="form-check-input mt-0 me-2" 
                          type="checkbox" 
                          checked={selectedAddons.includes(addon.value)}
                          onChange={() => {}} 
                        />
                        <label className="form-check-label mb-0" style={{ cursor: 'pointer', fontSize: '13px' }}>
                          {addon.label}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center mb-4">
              <CsLineIcons icon="shield" size="48" className={`text-${selectedPlan === 'Scale' ? 'warning' : 'primary'} mb-3`} />
              <h5>
                Are you sure you want to select the <strong>{selectedPlan}</strong> Plan?
              </h5>
              <p className="text-muted mb-0">You will be redirected to the checkout page to complete your purchase.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            <CsLineIcons icon="check" className="me-2" />
            Confirm & Proceed to Checkout
          </Button>
        </Modal.Footer>
      </Modal>
    </LayoutFull>
  );
};

export default SelectPlan;
