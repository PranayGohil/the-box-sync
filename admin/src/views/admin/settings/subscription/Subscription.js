import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Button, Badge, Modal, Spinner, Alert } from 'react-bootstrap';
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

  const [actionLoading, setActionLoading] = useState({
    renew: false,
    buy: false,
    redirect: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, userRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/subscription/get-plans`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${process.env.REACT_APP_API}/subscription/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

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
      const available = plansRes.data.data.filter((plan) => !purchasedPlanIds.has(plan._id));
      setAvailablePlans(available);

      setInactiveAddOns(
        inactivePlans
          .filter((sub) => {
            const plan = plansRes.data.data.find((p) => p._id === sub.plan_id);
            return plan?.is_addon;
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
    setActionLoading(prev => ({ ...prev, renew: true }));
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
      setActionLoading(prev => ({ ...prev, renew: false }));
    }
  };

  const handleBuyPlan = async (planId) => {
    setActionLoading(prev => ({ ...prev, buy: true }));
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
      setActionLoading(prev => ({ ...prev, buy: false }));
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
    setActionLoading(prev => ({ ...prev, redirect: true }));
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
        history.push('/reservation-management');
      } else if (planName === 'Dynamic Reports') {
        history.push('/dynamic-report');
      } else if (planName === 'Payroll By The Box') {
        history.push('/staff');
      } else if (planName === 'Restaurant Website') {
        history.push('/settings/manage-website');
      } else {
        toast.error('Invalid Plan');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, redirect: false }));
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Plan Name',
        accessor: 'plan_name',
        Cell: ({ value }) => <span className="fw-semibold">{value}</span>,
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
          let color = 'danger';
          if (value === 'active') {
            color = 'success';
          } else if (value === 'inactive') {
            color = 'warning';
          }
          return <Badge bg={`outline-${color}`}>{value}</Badge>;
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
                  variant="outline-primary"
                  size="sm"
                  className="btn-icon btn-icon-only"
                  onClick={() => handleEditPanel(original.plan_name)}
                  disabled={loading || actionLoading.renew}
                >
                  <CsLineIcons icon="edit" />
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="btn-icon btn-icon-only"
                  onClick={() => openDeletePanelModal(original.plan_name)}
                  disabled={loading}
                >
                  <CsLineIcons icon="bin" />
                </Button>
                {original.plan_name === 'Payroll By The Box' && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="btn-icon btn-icon-only"
                    onClick={() => handleRedirect(original.plan_name)}
                    disabled={loading || actionLoading.redirect}
                  >
                    <CsLineIcons icon="eye" />
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline-success"
                  size="sm"
                  className="btn-icon btn-icon-only"
                  onClick={() => handleAddPanel(original.plan_name)}
                  disabled={loading}
                >
                  <CsLineIcons icon="plus" />
                </Button>
                {original.plan_name === 'Payroll By The Box' && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="btn-icon btn-icon-only"
                    onClick={() => handleRedirect(original.plan_name)}
                    disabled={loading || actionLoading.redirect}
                  >
                    <CsLineIcons icon="eye" />
                  </Button>
                )}
              </>
            );
          } else if (isActive) {
            actionButtons = (
              <Button
                variant="outline-primary"
                size="sm"
                className="btn-icon btn-icon-only"
                onClick={() => handleRedirect(original.plan_name)}
                disabled={loading || actionLoading.redirect}
              >
                <CsLineIcons icon="eye" />
              </Button>
            );
          } else if (isInactive) {
            actionButtons = (
              <Button
                variant="outline-success"
                size="sm"
                title="Renew"
                className="btn-icon btn-icon-only"
                onClick={() => handleRenew(original._id)}
                disabled={loading || actionLoading.renew}
              >
                {actionLoading.renew ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <CsLineIcons icon="refresh-horizontal" />
                )}
              </Button>
            );
          } else if (isBlocked) {
            if (isBlockedWithQuery) {
              actionButtons = (
                <Button
                  variant="outline-warning"
                  size="sm"
                  className="btn-icon btn-icon-only"
                  title="Already Inquiry Raised"
                  disabled
                >
                  <CsLineIcons icon="hourglass" />
                </Button>
              );
            } else {
              actionButtons = (
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="btn-icon btn-icon-only"
                  title="Raise Inquiry"
                  onClick={() => handleRaiseInquiry(original.plan_name)}
                  disabled={loading}
                >
                  <CsLineIcons icon="send" />
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

  const tableInstance = useTable({
    columns,
    data: userSubscription,
    initialState: { pageIndex: 0 }
  }, useGlobalFilter, useSortBy, usePagination);

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
              <h5>Loading Subscription Plans...</h5>
              <p className="text-muted">Please wait while we fetch your subscription information</p>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />

      <Row>
        <Col>
          <div className="page-title-container">
            <Row>
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
            </Row>
          </div>

          <Row className="mb-3">
            <Col sm="12" md="5" lg="3" xxl="2">
              <div className="search-input-container w-100 shadow bg-foreground">
                <ControlsSearch tableInstance={tableInstance} />
              </div>
            </Col>
            <Col sm="12" md="7" lg="9" xxl="10" className="text-end">
              <div className="d-inline-block">
                <ControlsPageSize tableInstance={tableInstance} />
              </div>
            </Col>
          </Row>

          <Row>
            <Col xs="12">
              {userSubscription.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <CsLineIcons icon="inbox" className="me-2" />
                  No subscriptions found.
                </Alert>
              ) : (
                <>
                  <Table className="react-table rows" tableInstance={tableInstance} />
                  <TablePagination tableInstance={tableInstance} />
                </>
              )}
            </Col>
          </Row>
        </Col>
      </Row>

      {inactiveAddOns.length > 0 && (
        <Row className="mt-5">
          <h2>Inactive Add-on Plans</h2>
          {inactiveAddOns.map((sub) => (
            <Col key={sub._id} sm="12" md="6" lg="4" className="mb-4">
              <div className="card shadow">
                <div className="card-body">
                  <h5 className="card-title">{sub.plan_name}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">Previously Active</h6>
                  <p className="card-text">
                    Duration: {sub.plan_duration} month(s)
                    <br />
                    Price: ₹{sub.plan_price}
                    <br />
                    Expired on: {sub.formatted_end}
                  </p>

                  <Button
                    variant="success"
                    onClick={() => handleRenew(sub._id)}
                    disabled={actionLoading.renew}
                    style={{ minWidth: '100px' }}
                  >
                    {actionLoading.renew ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Renewing...
                      </>
                    ) : 'Renew Plan'}
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {availablePlans.length > 0 && (
        <Row className="mt-5">
          <h2>Available Add-on Plans</h2>
          {availablePlans.map((plan) => (
            <Col key={plan._id} sm="12" md="6" lg="4" className="mb-4">
              <div className="card shadow">
                <div className="card-body">
                  <h5 className="card-title">{plan.plan_name}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">₹{plan.plan_price}</h6>
                  <p className="card-text">
                    Duration: {plan.plan_duration} month(s)
                    <br />
                    {plan.features?.length > 0 && (
                      <>
                        <strong>Features:</strong>
                        <ul>
                          {plan.features.map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => handleBuyPlan(plan._id)}
                    disabled={actionLoading.buy}
                    style={{ minWidth: '100px' }}
                  >
                    {actionLoading.buy ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Buying...
                      </>
                    ) : 'Buy Plan'}
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
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
        <DeletePanelModal
          show={showDeletePanelModal}
          handleClose={() => setShowDeletePanelModal(false)}
          planName={deletePlanName}
          fetchData={fetchData}
        />
      )}

      {showInquiryModal && (
        <RaiseInquiryModal
          show={showInquiryModal}
          handleClose={() => setShowInquiryModal(false)}
          subscriptionName={inquirySubName}
          fetchData={fetchData}
        />
      )}

      {/* Global loading overlay for actions */}
      {(actionLoading.renew || actionLoading.buy || actionLoading.redirect) && (
        <div
          className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 9999,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div className="card shadow-lg border-0" style={{ minWidth: '200px' }}>
            <div className="card-body text-center p-4">
              <Spinner
                animation="border"
                variant="primary"
                className="mb-3"
                style={{ width: '3rem', height: '3rem' }}
              />
              <h5 className="mb-0">
                {actionLoading.renew && 'Renewing Subscription...'}
                {actionLoading.buy && 'Processing Purchase...'}
                {actionLoading.redirect && 'Redirecting...'}
              </h5>
              <small className="text-muted">Please wait a moment</small>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Subscription;