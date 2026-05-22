import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Button, Badge, Modal, Spinner, Alert, Card } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import ControlsSearch from './components/ControlsSearch';
import ControlsPageSize from './components/ControlsPageSize';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

import ModalEditPanel from './ModalEditPanel';
import DeletePanelModal from './DeletePanelModal';
import RaiseInquiryModal from './RaiseInquiryModal';

const PANEL_PLANS = ['Manager', 'QSR', 'Captain Panel', 'Payroll By The Box', 'KOT Panel', 'Hotel Manager'];

const PLAN_DISPLAY_NAMES = {
  'Manager': 'Manager Panel',
  'QSR': 'QSR Panel',
  'Payroll By The Box': 'TheBoxSync Payroll',
  'Scan For Menu': 'Scan & QR Order',
  'Feedback': 'QR-based Feedback',
  'Reservation Manager': 'Reservation Management',
};

const getDisplayName = (name) => PLAN_DISPLAY_NAMES[name] || name;

const Subscription = () => {
  const history = useHistory();

  const title = 'Subscription Plans';
  const description = 'Manage your subscriptions and access available add-ons.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'admin/subscriptions', text: 'Admin' },
    { to: 'admin/subscriptions', title: 'Subscriptions' },
  ];

  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [existingQueries, setExistingQueries] = useState({});
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySubName, setInquirySubName] = useState(null);

  const [showPanelModal, setShowPanelModal] = useState(false);
  const [currentPanelData, setCurrentPanelData] = useState(null);
  const [currentPlanName, setCurrentPlanName] = useState('');

  const [showDeletePanelModal, setShowDeletePanelModal] = useState(false);
  const [deletePlanName, setDeletePlanName] = useState('');

  const [panelAccounts, setPanelAccounts] = useState({});
  const [inactiveAddOns, setInactiveAddOns] = useState([]);
  const [restaurantCode, setRestaurantCode] = useState('');

  const [actionLoading, setActionLoading] = useState({
    renew: false,
    buy: false,
    redirect: false,
  });

  

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, userRes, userDetailsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/subscription/get-plans`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`${process.env.REACT_APP_API}/subscription/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`${process.env.REACT_APP_API}/user/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).catch(() => null),
      ]);

      if (userDetailsRes && userDetailsRes.data) {
        setRestaurantCode(userDetailsRes.data.restaurant_code || '');
      }

      const enriched = userRes.data.data.map((sub) => {
        const plan = plansRes.data.data.find((p) => p._id === sub.plan_id);
        return {
          ...sub,
          plan_name: plan?.plan_name || 'Unknown',
          is_addon: plan?.is_addon || false,
          formatted_start: new Date(sub.start_date).toLocaleDateString('en-IN'),
          formatted_end: new Date(sub.end_date).toLocaleDateString('en-IN'),
        };
      });

      setUserSubscription(enriched);

      const panelResults = await Promise.all(
        enriched
          .filter((sub) => PANEL_PLANS.includes(sub.plan_name))
          .map((sub) =>
            axios
              .get(`${process.env.REACT_APP_API}/panel-user/${sub.plan_name}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              })
              .then((res) => ({ [sub.plan_name]: res.data.exists }))
              .catch(() => ({ [sub.plan_name]: false }))
          )
      );

      const accountStatus = Object.assign({}, ...panelResults);
      setPanelAccounts(accountStatus);

      const inactivePlans = enriched.filter((sub) => sub.status === 'inactive');

      const purchasedPlanIds = new Set(userRes.data.data.map((sub) => sub.plan_id));
      // Only show true addons as purchasable, exclude bundles (Core, Growth, Scale)
      const available = plansRes.data.data.filter((plan) => !purchasedPlanIds.has(plan._id) && plan.is_addon === true);
      setAvailablePlans(available);

      setInactiveAddOns(
        inactivePlans
          .filter((sub) => {
            const plan = plansRes.data.data.find((p) => p._id === sub.plan_id);
            // Only show true addon plans, exclude bundles (Core, Growth, Scale)
            return plan?.is_addon === true;
          })
          .map((sub) => {
            const plan = plansRes.data.data.find((p) => p._id === sub.plan_id);
            return {
              ...sub,
              plan_price: plan?.plan_price || 0,
              plan_duration: plan?.plan_duration || 0,
            };
          })
      );

      const blocked = enriched.filter((s) => s.status === 'blocked');
      const queries = {};

      const results = await Promise.all(
        blocked.map((s) =>
          axios
            .get(`${process.env.REACT_APP_API}/customerquery/get-customer-query/${s.plan_name}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            })
            .then((res) => ({ plan: s.plan_name, data: res.data }))
            .catch(() => ({ plan: s.plan_name, data: { exists: false } }))
        )
      );

      results.forEach(({ plan, data }) => {
        if (data.exists) queries[plan] = data.query;
      });

      setExistingQueries(queries);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      toast.error('Failed to fetch subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRenew = async (subscriptionId) => {
    setActionLoading((prev) => ({ ...prev, renew: true }));
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/subscription/renew`,
        { subscriptionId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Subscription renewed successfully!');
      fetchData();
    } catch (err) {
      console.error('Renew failed:', err);
      toast.error(err.response?.data?.message || 'Renew failed.');
    } finally {
      setActionLoading((prev) => ({ ...prev, renew: false }));
    }
  };

  const handleBuyPlan = async (planId) => {
    setActionLoading((prev) => ({ ...prev, buy: true }));
    try {
      await axios.post(`${process.env.REACT_APP_API}/subscription/buy/${planId}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Plan purchased successfully!');
      fetchData();
    } catch (err) {
      console.error('Error purchasing plan:', err);
      toast.error(err.response?.data?.message || 'Failed to purchase plan.');
    } finally {
      setActionLoading((prev) => ({ ...prev, buy: false }));
    }
  };

  const handleEditPanel = async (planName) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/panel-user/${planName}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setCurrentPlanName(planName);
      setCurrentPanelData(res.data.data || { username: '', password: '' });
      setShowPanelModal(true);
    } catch (err) {
      console.error('Error fetching panel user for edit:', err);
      toast.error('Failed to fetch panel user.');
    }
  };

  const handleAddPanel = (planName) => {
    setCurrentPlanName(planName);
    setCurrentPanelData({ username: '', password: '' });
    setShowPanelModal(true);
  };

  const handleSavePanel = async (formValues) => {
    try {
      await axios.post(`${process.env.REACT_APP_API}/panel-user/${currentPlanName}`, formValues, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setShowPanelModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving panel user:', err);
      toast.error('Failed to save panel user.');
    }
  };

  const handleRaiseInquiry = (planName) => {
    setInquirySubName(planName);
    setShowInquiryModal(true);
  };

  const openDeletePanelModal = (planName) => {
    setDeletePlanName(planName);
    setShowDeletePanelModal(true);
  };

  const handleRedirect = (planName) => {
    setActionLoading((prev) => ({ ...prev, redirect: true }));
    try {
      if (planName === 'Staff Management') {
        history.push('/staff');
      } else if (planName === 'Feedback') {
        history.push('/operations/feedback');
      } else if (planName === 'Scan For Menu') {
        history.push('/operations/qr-for-menu');
      } else if (planName === 'Online Order Reconciliation') {
        history.push('/online-order-reconcilation');
      } else if (planName === 'Reservation Manager') {
        window.open('https://manager.theboxsync.com/operations/manage-reservations', '_blank');
      } else if (planName === 'Dynamic Reports') {
        history.push('/statistics/overview');
      } else if (planName === 'Payroll By The Box') {
        window.open('https://payroll.theboxsync.com', '_blank');
      } else if (planName === 'Restaurant Website') {
        window.open(`https://website.theboxsync.com/${restaurantCode}`, '_blank');
      } else if (planName === 'Captain Panel') {
        window.open('https://captain.theboxsync.com', '_blank');
      } else if (planName === 'KOT Panel') {
        window.open('https://kot.theboxsync.com', '_blank');
      } else if (planName === 'Manager') {
        window.open('https://manager.theboxsync.com', '_blank');
      } else if (planName === 'QSR') {
        window.open('https://qsr.theboxsync.com', '_blank');
      } else {
        toast.error('Invalid Plan');
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, redirect: false }));
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Plan Name',
        accessor: 'plan_name',
        Cell: ({ value }) => <span className="fw-semibold">{getDisplayName(value)}</span>,
      },
      {
        Header: 'Start Date',
        accessor: 'formatted_start',
      },
      {
        Header: 'End Date',
        accessor: 'formatted_end',
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => {
          if (value === 'active') {
            return <Badge bg="none" className="subscription-bg-soft-success text-success px-3 py-2 rounded-pill">Active</Badge>;
          } else if (value === 'inactive') {
            return <Badge bg="none" className="subscription-bg-soft-warning text-warning px-3 py-2 rounded-pill">Inactive</Badge>;
          }
          return <Badge bg="none" className="subscription-bg-soft-danger text-danger px-3 py-2 rounded-pill">{value}</Badge>;
        },
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => {
          const { original } = row;
          const isBlockedWithQuery = !!existingQueries[original.plan_name];
          const isActive = original.status === 'active';
          const isInactive = original.status === 'inactive';
          const isBlocked = original.status === 'blocked';

          let actionButtons = null;

          if (isActive && PANEL_PLANS.includes(original.plan_name)) {
            actionButtons = panelAccounts[original.plan_name] ? (
              <>
                <Button
                  variant="none"
                  size="sm"
                  className="subscription-custom-btn-outline"
                  style={{ width: '30px', height: '30px', padding: 0 }}
                  onClick={() => handleEditPanel(original.plan_name)}
                  disabled={loading || actionLoading.renew}
                  title="Edit Panel Credentials"
                >
                  <CsLineIcons icon="edit" size="15" />
                </Button>
                <Button
                  variant="none"
                  size="sm"
                  className="subscription-custom-btn-danger"
                  onClick={() => openDeletePanelModal(original.plan_name)}
                  disabled={loading}
                  title="Remove Panel Credentials"
                >
                  <CsLineIcons icon="bin" size="15" />
                </Button>
                {['Payroll By The Box', 'Captain Panel', 'KOT Panel', 'Manager', 'QSR'].includes(original.plan_name) && (
                  <Button
                    variant="none"
                    size="sm"
                    className="subscription-custom-btn-outline"
                    style={{ width: '30px', height: '30px', padding: 0 }}
                    onClick={() => handleRedirect(original.plan_name)}
                    disabled={loading || actionLoading.redirect}
                    title="Go to Module"
                  >
                    <CsLineIcons icon="eye" size="15" />
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="none"
                  size="sm"
                  className="subscription-custom-btn-outline"
                  style={{ width: '30px', height: '30px', padding: 0 }}
                  onClick={() => handleAddPanel(original.plan_name)}
                  disabled={loading}
                  title="Set Panel Credentials"
                >
                  <CsLineIcons icon="plus" size="15" />
                </Button>
                {['Payroll By The Box', 'Captain Panel', 'KOT Panel', 'Manager', 'QSR'].includes(original.plan_name) && (
                  <Button
                    variant="none"
                    size="sm"
                    className="subscription-custom-btn-outline"
                    style={{ width: '30px', height: '30px', padding: 0 }}
                    onClick={() => handleRedirect(original.plan_name)}
                    disabled={loading || actionLoading.redirect}
                    title="Go to Module"
                  >
                    <CsLineIcons icon="eye" size="15" />
                  </Button>
                )}
              </>
            );
          } else if (isActive) {
            actionButtons = (
              <Button
                variant="none"
                size="sm"
                className="subscription-custom-btn-outline"
                style={{ width: '30px', height: '30px', padding: 0 }}
                onClick={() => handleRedirect(original.plan_name)}
                disabled={loading || actionLoading.redirect}
                title="Go to Module"
              >
                <CsLineIcons icon="eye" size="15" />
              </Button>
            );
          } else if (isInactive) {
            actionButtons = (
              <Button
                variant="none"
                size="sm"
                className="subscription-custom-btn-outline"
                style={{ width: '30px', height: '30px', padding: 0 }}
                onClick={() => handleRenew(original._id)}
                disabled={loading || actionLoading.renew}
                title="Renew Plan"
              >
                {actionLoading.renew ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="refresh-horizontal" size="15" />}
              </Button>
            );
          } else if (isBlocked) {
            if (isBlockedWithQuery) {
              actionButtons = (
                <Button variant="none" size="sm" className="subscription-custom-btn-outline opacity-50" style={{ width: '30px', height: '30px', padding: 0 }} title="Inquiry Pending" disabled>
                  <CsLineIcons icon="hourglass" size="15" />
                </Button>
              );
            } else {
              actionButtons = (
                <Button
                  variant="none"
                  size="sm"
                  className="subscription-custom-btn-danger"
                  onClick={() => handleRaiseInquiry(original.plan_name)}
                  disabled={loading}
                  title="Raise Inquiry"
                >
                  <CsLineIcons icon="send" size="15" />
                </Button>
              );
            }
          }

          return <div className="d-flex gap-2">{actionButtons}</div>;
        },
      },
    ],
    [existingQueries, loading, actionLoading]
  );

  const tableInstance = useTable(
    {
      columns,
      data: userSubscription,
      initialState: { pageIndex: 0 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const { page, prepareRow } = tableInstance;

  if (loading) {
    return (
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Loading...</h5>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <div className="container-fluid pb-5">
      
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4">
        <Row className="g-3 align-items-center">
          <Col md={7}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      <Card className="subscription-glass-card border-0 mb-5">
        <Card.Body className="p-4">
          <div className="d-flex flex-column flex-sm-row justify-content-sm-between align-items-start align-items-sm-center gap-3 mb-4">
            <h4 className="fw-bold mb-0 text-nowrap">Active Subscriptions</h4>
            <div className="d-flex gap-2 w-100 w-sm-auto">
              <div className="search-input-container shadow-sm w-100 w-sm-auto">
                <ControlsSearch tableInstance={tableInstance} />
              </div>
              <div className="d-none d-lg-block">
                <ControlsPageSize tableInstance={tableInstance} />
              </div>
            </div>
          </div>

          {userSubscription.length === 0 ? (
            <Alert variant="light" className="text-center py-5 border-dashed">
              <CsLineIcons icon="inbox" className="text-muted mb-2" size="48" />
              <div className="fw-bold text-muted">No subscriptions found.</div>
            </Alert>
          ) : (
            <>
              <div className="subscription-react-table-container">
                <Table className="react-table rows" tableInstance={tableInstance} />
              </div>

              {/* Mobile Card Rendering */}
              <div className="subscription-mobile-cards-container">
                {page.map((row) => {
                  prepareRow(row);
                  const { original } = row;
                  return (
                    <div key={row.id} className="subscription-mobile-subscription-card">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <span className="subscription-mobile-label">Plan Name</span>
                          <span className="subscription-mobile-value mb-0">{getDisplayName(original.plan_name)}</span>
                        </div>
                        <div>
                          {original.status === 'active' && <Badge bg="none" className="subscription-bg-soft-success text-success rounded-pill">Active</Badge>}
                          {original.status === 'inactive' && <Badge bg="none" className="subscription-bg-soft-warning text-warning rounded-pill">Inactive</Badge>}
                          {original.status === 'blocked' && <Badge bg="none" className="subscription-bg-soft-danger text-danger rounded-pill">Blocked</Badge>}
                        </div>
                      </div>
                      <Row className="g-2 mb-3">
                        <Col xs={6}>
                          <span className="subscription-mobile-label">Start Date</span>
                          <span className="subscription-mobile-value mb-0">{original.formatted_start}</span>
                        </Col>
                        <Col xs={6}>
                          <span className="subscription-mobile-label">End Date</span>
                          <span className="subscription-mobile-value mb-0">{original.formatted_end}</span>
                        </Col>
                      </Row>
                      <div className="pt-3 border-top d-flex justify-content-end align-items-center gap-2">
                        {row.cells.find(c => c.column.Header === 'Actions')?.render('Cell')}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <TablePagination tableInstance={tableInstance} />
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {inactiveAddOns.length > 0 && (
        <div className="mb-5">
          <div className="section-header mb-4" style={{ borderLeft: '4px solid #f6ad55', paddingLeft: '15px' }}>
            <h3 className="fw-bold mb-1">Inactive Add-ons</h3>
            <p className="text-muted small mb-0">Renew these plans to regain access to their features.</p>
          </div>
          <Row className="g-4">
            {inactiveAddOns.map((sub) => (
              <Col key={sub._id} sm="12" md="6" lg="4">
                <Card className="subscription-glass-card border-0 h-100 subscription-plan-card">
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="fw-bold mb-0">{getDisplayName(sub.plan_name)}</h5>
                      <Badge bg="none" className="subscription-bg-soft-warning text-warning rounded-pill">Expired</Badge>
                    </div>
                    <div className="subscription-plan-price mb-3">₹{sub.plan_price}</div>
                    <p className="text-muted small mb-4">
                      Duration: {sub.plan_duration} month(s)
                      <br />
                      Last active until: {sub.formatted_end}
                    </p>
                    <div className="mt-auto">
                      <Button 
                        variant="none" 
                        className="subscription-custom-btn-outline w-100" 
                        onClick={() => handleRenew(sub._id)} 
                        disabled={actionLoading.renew}
                      >
                        {actionLoading.renew ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Renewing...
                          </>
                        ) : (
                          <>
                            <CsLineIcons icon="refresh-horizontal" size="18" />
                            Renew Plan
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {availablePlans.length > 0 && (
        <div className="mb-5">
          <div className="section-header mb-4" style={{ borderLeft: '4px solid #1ea8e7', paddingLeft: '15px' }}>
            <h3 className="fw-bold mb-1">Available Add-ons</h3>
            <p className="text-muted small mb-0">Enhance your restaurant with powerful additional features.</p>
          </div>
          <Row className="g-4">
            {availablePlans.map((plan) => (
              <Col key={plan._id} sm="12" md="6" lg="4">
                <Card className="subscription-glass-card border-0 h-100 subscription-plan-card">
                  <Card.Body className="p-4 d-flex flex-column">
                    <h5 className="fw-bold mb-2">{getDisplayName(plan.plan_name)}</h5>
                    <div className="subscription-plan-price mb-2">₹{plan.plan_price}</div>
                    <div className="text-muted small mb-3">per {plan.plan_duration} month(s)</div>
                    
                    {plan.features?.length > 0 && (
                      <ul className="subscription-feature-list">
                        {plan.features.map((feature, i) => (
                          <li key={i}>
                            <CsLineIcons icon="check" size="14" className="text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    <div className="mt-auto">
                      <Button 
                        variant="none" 
                        className="subscription-custom-btn-solid w-100" 
                        onClick={() => handleBuyPlan(plan._id)} 
                        disabled={actionLoading.buy}
                      >
                        {actionLoading.buy ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CsLineIcons icon="cart" size="18" />
                            Buy Now
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {showPanelModal && (
        <ModalEditPanel
          show={showPanelModal}
          handleClose={() => setShowPanelModal(false)}
          data={currentPanelData}
          planName={currentPlanName}
          onSave={handleSavePanel}
        />
      )}

      {showDeletePanelModal && (
        <DeletePanelModal show={showDeletePanelModal} handleClose={() => setShowDeletePanelModal(false)} planName={deletePlanName} fetchData={fetchData} />
      )}

      {showInquiryModal && (
        <RaiseInquiryModal show={showInquiryModal} handleClose={() => setShowInquiryModal(false)} subscriptionName={inquirySubName} fetchData={fetchData} />
      )}

      {/* Global loading overlay for actions */}
      {(actionLoading.renew || actionLoading.buy || actionLoading.redirect) && (
        <div
          className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 9999,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="subscription-glass-card border-0" style={{ minWidth: '250px' }}>
            <div className="card-body text-center p-5">
              <Spinner animation="border" style={{ color: '#1ea8e7', width: '3rem', height: '3rem' }} className="mb-3" />
              <h5 className="fw-bold mb-1">
                {actionLoading.renew && 'Renewing Plan...'}
                {actionLoading.buy && 'Confirming Purchase...'}
                {actionLoading.redirect && 'Opening Module...'}
              </h5>
              <p className="text-muted small mb-0">Please wait while we sync your account</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
