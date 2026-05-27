import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { Button, Card, Modal, Collapse } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import LayoutFull from 'layout/LayoutFull';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router-dom';

const SelectPlan = () => {
  const history = useHistory();
  const token = localStorage.getItem('token');

  const [selectedPlan, setSelectedPlan] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [openComparison, setOpenComparison] = useState(false);
  const [activePlans, setActivePlans] = useState([]);

  useEffect(() => {
    if (!token) {
      toast.warning('Please register or log in first to select a plan.');
      history.push('/register');
    } else {
      Promise.all([
        axios.get(`${process.env.REACT_APP_API}/subscription/get-plans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.REACT_APP_API}/subscription/get`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.REACT_APP_API}/user/get`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
        .then(([plansRes, subRes, userRes]) => {
          const userSubscriptions = subRes.data.data.filter((s) => s.status === 'active');
          const allPlans = plansRes.data.data;
          const { purchasedPlan } = userRes.data;

          const activeNames = userSubscriptions
            .map((sub) => {
              const plan = allPlans.find((p) => p._id === sub.plan_id);
              return plan ? plan.plan_name : null;
            })
            .filter(Boolean);

          if (purchasedPlan) {
            activeNames.push(purchasedPlan);
          }

          setActivePlans(activeNames);
        })
        .catch((err) => console.error('Error fetching user plans', err));
    }
  }, [history, token]);

  if (!token) {
    return null;
  }

  const title = 'Select Plan';
  const description = 'Choose your subscription plan';



  const allAddons = [
    { label: 'Reservation Management', value: 'Reservation Manager' },
    { label: 'QSR Billing Panel', value: 'QSR' },
    { label: 'Captain Ordering Panel', value: 'Captain Panel' },
    { label: 'Kitchen Display System', value: 'KOT Panel' },
    { label: 'Restaurant Website', value: 'Restaurant Website' },
    { label: 'Scan & QR Order', value: 'Scan For Menu' },
    { label: 'QR-based Feedback', value: 'Feedback' },
    { label: 'Waiter Calling System', value: 'Waiter Calling System' },
    { label: 'Dynamic Reports', value: 'Dynamic Reports' },
    { label: 'Whatsapp-Invoice', value: 'Whatsapp-Invoice' },
    { label: 'Token Management', value: 'Token Management' },
  ];

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setSelectedAddons([]);
    setShowModal(true);
  };

  const handleToggleAddon = (value) => {
    if (selectedPlan === 'Core') {
      if (selectedAddons.includes(value)) {
        setSelectedAddons([]);
      } else {
        setSelectedAddons([value]);
      }
      return;
    }

    if (selectedAddons.includes(value)) {
      setSelectedAddons(selectedAddons.filter((a) => a !== value));
    } else {
      if (selectedPlan === 'Growth' && selectedAddons.length >= 6) {
        toast.warning('You can only select up to 6 add-ons for the Growth plan.');
        return;
      }
      setSelectedAddons([...selectedAddons, value]);
    }
  };

  const handleConfirm = async () => {
    if (selectedPlan === 'Growth' && selectedAddons.length !== 6) {
      toast.warning('Please select exactly 6 add-ons for the Growth plan.');
      return;
    }
    if (selectedPlan === 'Core' && selectedAddons.length === 0) {
      toast.warning('Please select at least one option to proceed.');
      return;
    }

    setShowModal(false);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/subscription/buy-complete`,
        { planType: selectedPlan, chosenAddons: selectedAddons },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.success) {
        setShowSuccessModal(true);
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
      name: 'QSR Plan',
      originalPrice: '₹10,000',
      price: '₹8,000',
      period: '/ year',
      color: 'primary',
      features: {
        billing: [
          'Inventory Management',
          '80+ Reports',
          'Third-party Integrations',
          'In-built CRM',
          'Menu Management',
          'Staff Management',
          'Unlimited Users & Terminals',
          'Unlimited Cash Register',
          'Multi-terminal Billing',
        ],
        addons: [
          'QSR Panel',
          'Kitchen Display System',
          'Token Management',
          'Scan & QR Order',
          'QR-based Feedback',
          'Dynamic Reports',
          'WhatsApp Invoice',
        ],
        loyalty: [
          'Customer Profiles',
          'Points Earn/Redeem at POS',
        ],
        advanced: [],
        support: [
          '24/7 Support',
          'Free Training',
          'Free Staff Re-training',
        ],
      },
    },
    {
      name: 'Café Plan',
      originalPrice: '₹12,500',
      price: '₹10,000',
      period: '/ year',
      color: 'success',
      features: {
        billing: [
          'Inventory Management',
          '80+ Reports',
          'Third-party Integrations',
          'In-built CRM',
          'Menu Management',
          'Staff Management',
          'Unlimited Users & Terminals',
          'Unlimited Cash Register',
          'Multi-terminal Billing',
        ],
        addons: [
          'QSR Panel',
          'Kitchen Display System',
          'Token Management',
          'Scan & QR Order',
          'QR-based Feedback',
          'Dynamic Reports',
          'WhatsApp Invoice',
          'Restaurant Website',
        ],
        loyalty: [
          'Customer Profiles',
          'Points Earn/Redeem at POS',
          'Automated Retention Campaigns',
        ],
        advanced: [],
        support: [
          '24/7 Support',
          'Free Training',
          'Free Staff Re-training',
        ],
      },
    },
    {
      name: 'Fine Dine Plan',
      originalPrice: '₹20,000',
      price: '₹16,000',
      period: '/ year',
      color: 'warning',
      features: {
        billing: [
          'Inventory Management',
          '80+ Reports',
          'Third-party Integrations',
          'In-built CRM',
          'Menu Management',
          'Staff Management',
          'Unlimited Users & Terminals',
          'Unlimited Cash Register',
          'Multi-terminal Billing',
        ],
        addons: [
          'Captain Panel',
          'Kitchen Display System',
          'Reservation Management',
          'Scan & QR Order',
          'QR-based Feedback',
          'Waiter Calling System',
          'Dynamic Reports',
          'WhatsApp Invoice',
          'Restaurant Website',
        ],
        loyalty: [
          'Customer Profiles',
          'Points Earn/Redeem at POS',
          'Automated Retention Campaigns',
          'Gamified Loyalty — Food Quests',
        ],
        advanced: [],
        support: [
          '24/7 Support',
          'Free Training',
          'Free Staff Re-training',
        ],
      },
    },
    {
      name: 'Cloud Plan',
      originalPrice: '₹12,500',
      price: '₹10,000',
      period: '/ year',
      color: 'info',
      features: {
        billing: [
          'Inventory Management',
          '80+ Reports',
          'Third-party Integrations',
          'In-built CRM',
          'Menu Management',
          'Staff Management',
          'Unlimited Users & Terminals',
          'Unlimited Cash Register',
          'Multi-terminal Billing',
        ],
        addons: [
          'Kitchen Display System',
          'QR-based Feedback',
          'Dynamic Reports',
          'WhatsApp Invoice',
        ],
        loyalty: [
          'Customer Profiles',
          'Points Earn/Redeem at POS',
          'Automated Retention Campaigns',
        ],
        advanced: [],
        support: [
          '24/7 Support',
          'Free Training',
          'Free Staff Re-training',
        ],
      },
    },
    {
      name: 'Chain Plan',
      originalPrice: '₹30,000',
      price: '₹24,000',
      period: '/ year',
      color: 'danger',
      recommended: true,
      features: {
        billing: [
          'Inventory Management',
          '80+ Reports',
          'Third-party Integrations',
          'In-built CRM',
          'Menu Management',
          'Staff Management',
          'Unlimited Users & Terminals',
          'Unlimited Cash Register',
          'Multi-terminal Billing',
        ],
        addons: [
          'QSR Panel',
          'Captain Panel',
          'Kitchen Display System',
          'Reservation Management',
          'Token Management',
          'Scan & QR Order',
          'QR-based Feedback',
          'Waiter Calling System',
          'Dynamic Reports',
          'WhatsApp Invoice',
          'Restaurant Website',
        ],
        loyalty: [
          'Customer Profiles',
          'Points Earn/Redeem at POS',
          'Automated Retention Campaigns',
          'Gamified Loyalty — Food Quests',
        ],
        advanced: [
          'TheBoxSync Payroll',
        ],
        support: [
          '24/7 Support',
          'Free Training',
          'Free Staff Re-training',
          'Dedicated Account Manager',
        ],
      },
    },
  ];

  return (
    <LayoutFull>
      <HtmlHead title={title} description={description} />
      <style>{`
        /* Global Page Background & Fluid Layout Overrides to Eliminate White Side Gaps */
        html, body, #root, #root > div {
          background-color: #0a1118 !important;
          background: #0a1118 !important;
        }
        main, main .container, main .container #contentArea {
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          background: transparent !important;
          background-color: transparent !important;
        }

        .fixed-background {
          display: none !important;
        }
        .select-plan-wrapper {
          background: #0a1118;
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(29, 160, 219, 0.08), transparent 25%),
            radial-gradient(circle at 85% 30%, rgba(35, 179, 244, 0.08), transparent 25%);
          position: relative;
          overflow: hidden;
          width: 100%;
        }
        footer, footer .footer-content {
          background: #0a1118 !important;
          border-top: none !important;
        }
        footer p {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .plan-column {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          padding: 2.25rem 1.75rem;
          height: 100%;
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          position: relative;
          z-index: 1;
        }
        .plan-column:hover {
          transform: translateY(-8px);
          border-color: var(--plan-accent) !important;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.55), 0 0 30px var(--plan-accent-glow);
        }
        .plan-name {
          color: #fff; 
          font-size: 1.35rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .plan-name-recommended {
          color: #4ade80;
        }
        .plan-price-large {
          font-size: 2.5rem;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: -1px;
        }
        .plan-price-original {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.45);
          text-decoration: line-through;
          margin-left: 0.5rem;
          font-weight: 500;
        }
        .plan-subtitle {
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.85rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .plan-divider {
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          margin-bottom: 1rem;
        }
        
        /* Stretch features container to display fully (no scroll inside the card) */
        .features-scroll-container {
          max-height: none !important;
          overflow-y: visible !important;
          padding-right: 0 !important;
          margin-top: 0.5rem;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.85rem;
          font-size: 0.92rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.4;
        }
        .icon-check, .icon-cross {
          margin-right: 0.65rem;
          margin-top: 0.15rem;
          flex-shrink: 0;
        }
        .btn-glass {
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-glass:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.3);
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
        }
        .btn-glass-primary {
          background: var(--plan-accent);
          border: none;
          color: #fff;
          font-weight: 700;
          transition: all 0.3s ease;
        }
        .btn-glass-primary:hover {
          filter: brightness(1.15);
          transform: translateY(-2px);
          box-shadow: 0 5px 18px var(--plan-accent-glow);
        }
        .pulse-badge {
          animation: pulse-animation 2s infinite;
          font-weight: 600;
          letter-spacing: 1px;
          font-size: 0.8rem;
          padding: 0.4rem 1.25rem !important;
          text-transform: uppercase;
          background: #4ade80 !important;
          color: #0b151e !important;
        }
        @keyframes pulse-animation {
          0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
          100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }
        .glass-modal .modal-content {
          background: rgba(13, 27, 42, 0.9) !important;
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          color: #fff;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }
        .glass-modal .modal-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem 2rem;
        }
        .glass-modal .modal-body {
          padding: 2rem;
        }
        .glass-modal .modal-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem 2rem;
        }
        .glass-modal .btn-close {
          filter: invert(1) grayscale(100%) brightness(200%);
        }
        .addon-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          transition: all 0.2s;
        }
        .addon-card:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .addon-card.selected {
          background: rgba(35, 179, 244, 0.15) !important;
          border-color: #23b3f4 !important;
        }

        /* 1200px and up: Widescreen single row */
        @media (min-width: 1200px) {
          .col-xl-5-custom {
            flex: 0 0 20% !important;
            max-width: 20% !important;
          }
        }

        /* Laptops / Smaller Desktops (992px to 1366px) */
        @media (min-width: 992px) and (max-width: 1366px) {
          .plan-column {
            padding: 1.75rem 1.25rem !important;
            border-radius: 20px;
          }
          .plan-name {
            font-size: 1.15rem !important;
            margin-bottom: 0.5rem !important;
          }
          .plan-price-large {
            font-size: 2.1rem !important;
          }
          .plan-price-original {
            font-size: 0.95rem !important;
            margin-left: 0.25rem !important;
          }
          .plan-subtitle {
            font-size: 0.8rem !important;
            margin-top: 0.75rem !important;
            margin-bottom: 0.75rem !important;
          }
          .feature-item {
            font-size: 0.85rem !important;
            margin-bottom: 0.75rem !important;
          }
        }

        /* Tablets (768px to 991px) */
        @media (min-width: 768px) and (max-width: 991px) {
          .plan-column {
            padding: 2rem 1.5rem !important;
          }
          .plan-price-large {
            font-size: 2.3rem !important;
          }
        }

        /* Mobiles (under 768px) */
        @media (max-width: 767px) {
          .plan-column {
            padding: 1.75rem 1.25rem !important;
            border-radius: 20px;
          }
          .plan-price-large {
            font-size: 2.4rem !important;
          }
          .display-4 {
            font-size: 2.1rem !important;
          }
        }
      `}</style>

      <div className="min-h-100 py-5 select-plan-wrapper" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="container-fluid px-lg-5" style={{ position: 'relative', zIndex: 3, maxWidth: '1650px' }}>
          {/* Header */}
          <div className="text-center mb-5 pb-3">
            <h1 className="display-4 fw-bold mb-4 text-white" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>Value-packed features at Wallet-friendly cost</h1>
            <p className="rounded-pill px-4 py-2 mb-4 d-inline-block shadow-sm" style={{ fontWeight: 500, fontSize: '1.1rem', background: 'rgba(35, 179, 244, 0.12)', border: '1.5px solid rgba(35, 179, 244, 0.25)', color: '#23b3f4', backdropFilter: 'blur(10px)' }}>
              No hidden costs & no additional charges. Just transparent & affordable pricing.
            </p>
          </div>
          <div className="row g-4 justify-content-center">
            {plans.map((plan, index) => {
              const featureCategories = [
                {
                  title: 'Billing & Core',
                  features: [
                    'Inventory Management',
                    '80+ Reports',
                    'Third-party Integrations',
                    'In-built CRM',
                    'Menu Management',
                    'Staff Management',
                    'Unlimited Users & Terminals',
                    'Unlimited Cash Register',
                    'Multi-terminal Billing'
                  ]
                },
                {
                  title: 'Add-ons',
                  features: [
                    'QSR Panel',
                    'Captain Panel',
                    'Kitchen Display System',
                    'Reservation Management',
                    'Token Management',
                    'Scan & QR Order',
                    'QR-based Feedback',
                    'Waiter Calling System',
                    'Dynamic Reports',
                    'WhatsApp Invoice',
                    'Restaurant Website'
                  ]
                },
                {
                  title: 'Loyalty & CRM Engine',
                  features: [
                    'Customer Profiles',
                    'Points Earn/Redeem at POS',
                    'Automated Retention Campaigns',
                    'Gamified Loyalty — Food Quests'
                  ]
                },
                {
                  title: 'Advanced',
                  features: [
                    'TheBoxSync Payroll'
                  ]
                },
                {
                  title: 'Support',
                  features: [
                    '24/7 Support',
                    'Free Training',
                    'Free Staff Re-training',
                    'Dedicated Account Manager'
                  ]
                }
              ];

              const planColorMap = {
                'QSR Plan': { accent: '#23b3f4', glow: 'rgba(35, 179, 244, 0.35)' },
                'Café Plan': { accent: '#4ade80', glow: 'rgba(74, 222, 128, 0.35)' },
                'Fine Dine Plan': { accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)' },
                'Cloud Plan': { accent: '#06b6d4', glow: 'rgba(6, 182, 212, 0.35)' },
                'Chain Plan': { accent: '#f43f5e', glow: 'rgba(244, 63, 94, 0.35)' }
              };
              
              const colors = planColorMap[plan.name] || { accent: '#23b3f4', glow: 'rgba(35, 179, 244, 0.3)' };

              return (
                <div key={index} className="col-12 col-md-6 col-lg-4 col-xl-5-custom mb-4">
                  <div 
                    className="plan-column d-flex flex-column position-relative"
                    style={{
                      '--plan-accent': colors.accent,
                      '--plan-accent-glow': colors.glow
                    }}
                  >
                    {plan.recommended && (
                      <div className="position-absolute start-50 translate-middle-x" style={{ top: '-22px' }}>
                        <span className="badge rounded-pill pulse-badge shadow">Most Popular</span>
                      </div>
                    )}
                    <div className={`plan-name ${plan.recommended ? 'plan-name-recommended' : ''}`}>
                      {plan.name.replace(' Plan', '')}
                    </div>

                    <div className="d-flex align-items-baseline mb-2">
                      <span className="plan-price-large">{plan.price}</span>
                      <span className="plan-price-original">{plan.originalPrice}</span>
                    </div>

                    <p className="plan-subtitle">
                      Here are the key features that highlight our plans:
                    </p>

                    <div className="plan-divider" />

                    <div className="flex-grow-1 features-scroll-container">
                      {featureCategories.map((category, catIndex) => (
                        <div key={catIndex} className="mb-4">
                          <h6 className="text-white fw-bold mb-3 pb-2" style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {category.title}
                          </h6>
                          {category.features.map((feature, fIndex) => {
                            const hasFeature = plan.features.billing.includes(feature) ||
                              plan.features.addons.includes(feature) ||
                              (plan.features.loyalty && plan.features.loyalty.includes(feature)) ||
                              plan.features.advanced.includes(feature) ||
                              plan.features.support.includes(feature);
                            return (
                              <div key={fIndex} className="feature-item">
                                <span className={hasFeature ? 'icon-check' : 'icon-cross'}>
                                  {hasFeature ? (
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '20px', height: '20px', backgroundColor: 'transparent', border: '1.5px solid #4ade80' }}>
                                      <CsLineIcons icon="check" size="12" style={{ color: '#4ade80' }} />
                                    </div>
                                  ) : (
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '20px', height: '20px', backgroundColor: 'transparent', border: '1.5px solid #e53e3e' }}>
                                      <CsLineIcons icon="close" size="12" style={{ color: '#e53e3e' }} />
                                    </div>
                                  )}
                                </span>
                                <span>
                                  {feature}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 text-center">
                      {(() => {
                        const isSelected = activePlans.includes(plan.name) || activePlans.includes(plan.name.replace(' Plan', ''));
                        const hasAnyPlan = activePlans.length > 0;

                        if (isSelected) {
                          return (
                            <Button
                              className="rounded-pill w-100 btn-glass"
                              disabled
                              style={{ cursor: 'default', opacity: 0.9, backgroundColor: 'rgba(74,222,128,0.15)', borderColor: 'rgba(74,222,128,0.5)', color: '#4ade80' }}
                            >
                              <CsLineIcons icon="check" size="15" className="me-2" style={{ color: '#4ade80' }} />
                              Selected
                            </Button>
                          );
                        }

                        if (hasAnyPlan) {
                          return null;
                        }

                        return (
                          <Button
                            className={`rounded-pill w-100 ${plan.recommended ? 'btn-glass-primary' : 'btn-glass'}`}
                            onClick={() => handlePlanSelect(plan.name.split(' ')[0])}
                          >
                            Select Plan
                          </Button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered scrollable dialogClassName="glass-modal">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold" style={{ letterSpacing: '0.5px' }}>
            Confirm Plan Selection
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPlan === 'Growth' ? (
            <div>
              <div className="text-center mb-4">
                <CsLineIcons icon="grid" size="48" style={{ color: '#23b3f4' }} className="mb-3" />
                <h4 className="fw-bold text-white mb-2">Customize Your <span style={{ color: '#23b3f4' }}>Growth</span> Plan</h4>
                <p className="text-white-50 mb-0">Select up to 6 Add-ons included in your plan ({selectedAddons.length}/6 selected).</p>
              </div>
              <div className="row g-3">
                {allAddons.map((addon, index) => (
                  <div key={index} className="col-12 col-sm-6">
                    <div
                      className={`p-3 addon-card ${selectedAddons.includes(addon.value) ? 'selected' : ''}`}
                      onClick={() => handleToggleAddon(addon.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="form-check m-0 d-flex align-items-center" style={{ cursor: 'pointer' }}>
                        <input
                          className="form-check-input mt-0 me-3"
                          type="radio"
                          checked={selectedAddons.includes(addon.value)}
                          onChange={() => { }}
                          style={{
                            cursor: 'pointer',
                            flexShrink: 0,
                            ...(selectedAddons.includes(addon.value) ? { backgroundColor: '#23b3f4', borderColor: '#23b3f4' } : {})
                          }}
                        />
                        <label className="form-check-label mb-0 fw-medium text-white" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                          {addon.label}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedPlan === 'Core' ? (
            <div>
              <div className="text-center mb-4">
                <CsLineIcons icon="grid" size="48" style={{ color: '#23b3f4' }} className="mb-3" />
                <h4 className="fw-bold text-white mb-2">Customize Your <span style={{ color: '#23b3f4' }}>Core</span> Plan</h4>
                <p className="text-white-50 mb-0">Select optional panels to include in your plan.</p>
              </div>
              <div className="row g-3">
                {[
                  { label: 'Manager Panel', value: 'Manager', desc: 'Manage reservations, oversee active tables, update dining statuses, and streamline day-to-day operations.', icon: 'user' },
                  { label: 'QSR Panel', value: 'QSR', desc: 'Streamlined billing interface tailored for Quick Service Restaurants to punch orders fast.', icon: 'shop' }
                ].map((addon, index) => (
                  <div key={index} className="col-12">
                    <div
                      className={`p-3 addon-card ${selectedAddons.includes(addon.value) ? 'selected' : ''}`}
                      onClick={() => handleToggleAddon(addon.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="form-check m-0 d-flex align-items-start" style={{ cursor: 'pointer' }}>
                        <input
                          className="form-check-input mt-1 me-3"
                          type="radio"
                          name="core-addon"
                          checked={selectedAddons.includes(addon.value)}
                          onChange={() => { }}
                          style={{
                            cursor: 'pointer',
                            flexShrink: 0,
                            ...(selectedAddons.includes(addon.value) ? { backgroundColor: '#23b3f4', borderColor: '#23b3f4' } : {})
                          }}
                        />
                        <div className="d-flex flex-column text-start">
                          <label className="form-check-label mb-1 fw-bold text-white d-flex align-items-center" style={{ cursor: 'pointer', fontSize: '1.05rem' }}>
                            <CsLineIcons icon={addon.icon} size="18" className="me-2" style={{ color: selectedAddons.includes(addon.value) ? '#23b3f4' : 'rgba(255,255,255,0.7)' }} />
                            {addon.label}
                          </label>
                          <span className="text-white-50" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{addon.desc}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 mb-2">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(35, 179, 244, 0.15)' }}>
                <CsLineIcons icon="shield" size="40" style={{ color: '#23b3f4' }} />
              </div>
              <h4 className="fw-bold text-white mb-3">
                Select <span style={{ color: '#23b3f4' }}>{selectedPlan}</span> Plan?
              </h4>
              <p className="text-white-50 mb-0 px-3">Please confirm your selection to proceed with the activation process.</p>
            </div>
          )}

          {(() => {
            const activePlanObj = plans.find((p) => p.name.startsWith(selectedPlan));
            const basePrice = activePlanObj ? parseInt(activePlanObj.price.replace(/[^\d]/g, ''), 10) : 0;
            if (basePrice === 0) return null;
            const gst = Math.round(basePrice * 0.18);
            const total = basePrice + gst;
            return (
              <div className="mt-4 p-3 rounded-3 mx-auto" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '400px' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white-50">Plan Price:</span>
                  <span className="text-white fw-bold">₹{basePrice.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white-50">Taxes (18% GST):</span>
                  <span className="text-white fw-bold">₹{gst.toLocaleString()}</span>
                </div>
                <div className="my-2" style={{ borderTop: '1px dashed rgba(255,255,255,0.2)' }} />
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>Total Amount:</span>
                  <span className="fw-bold" style={{ fontSize: '1.4rem', color: '#4ade80' }}>₹{total.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}
        </Modal.Body>
        <Modal.Footer className="justify-content-center border-0 pt-0">
          <Button variant="link" className="text-white-50 text-decoration-none fw-bold me-3" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button className="btn-glass-primary rounded-pill px-4" onClick={handleConfirm}>
            <CsLineIcons icon="check" size="16" className="me-2" />
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal
        show={showSuccessModal}
        onHide={() => { window.location.href = '/dashboard'; }}
        centered
        dialogClassName="glass-modal"
      >
        <Modal.Body className="text-center py-5">
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(74, 222, 128, 0.15)' }}>
            <CsLineIcons icon="check" size="40" style={{ color: '#4ade80' }} />
          </div>
          <h4 className="fw-bold text-white mb-3 px-3" style={{ lineHeight: '1.4' }}>
            Thank you for choosing the <span style={{ color: '#4ade80' }}>{selectedPlan}</span> Plan!
          </h4>
          <p className="text-white-50 mb-0 px-4" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
            Our team will contact you shortly regarding payment. Your panel will be activated within 24 hours after successful payment confirmation.
          </p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center border-0 pt-0 pb-4">
          <Button className="btn-glass-primary rounded-pill px-5" onClick={() => { window.location.href = '/dashboard'; }}>
            Go to Dashboard
          </Button>
        </Modal.Footer>
      </Modal>
    </LayoutFull>
  );
};

export default SelectPlan;
