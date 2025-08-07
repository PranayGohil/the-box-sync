import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Button, Badge, Modal } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import ControlsSearch from './components/ControlsSearch';
import ControlsPageSize from './components/ControlsPageSize';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

import ModalEditPanel from './ModalEditPanel';
import DeletePanelModal from './DeletePanelModal';

// import RaiseInquiryModal from "./RaiseInquiryModal";
const PANEL_PLANS = ['Manager', 'QSR', 'Captain Panel'];

const Subscription = () => {
  const history = useHistory();

  const title = 'Subscription Plans';
  const description = 'Manage your subscriptions and access available add-ons.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'admin/subscriptions', text: 'Admin' },
    { to: 'admin/subscriptions', title: 'Subscriptions' },
  ];

  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
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

  const fetchData = async () => {
    try {
      const [plansRes, userRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/subscription/get-plans`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get(`${process.env.REACT_APP_API}/subscription/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      setSubscriptionPlans(plansRes.data);

      const enriched = userRes.data.map((sub) => {
        const plan = plansRes.data.find((p) => p._id === sub.plan_id); // eslint-disable-line no-underscore-dangle
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
          )
      );

      const accountStatus = Object.assign({}, ...panelResults);
      setPanelAccounts(accountStatus);

      const purchasedPlanIds = new Set(userRes.data.map((sub) => sub.plan_id));
      const available = plansRes.data.filter((plan) => !purchasedPlanIds.has(plan._id)); // eslint-disable-line no-underscore-dangle
      setAvailablePlans(available);

      const blocked = enriched.filter((s) => s.status === 'blocked');
      const queries = {};

      const results = await Promise.all(
        blocked.map((s) =>
          axios
            .get(`${process.env.REACT_APP_API}/customerquery/get-customer-query/${s.plan_name}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            })
            .then((res) => ({ plan: s.plan_name, data: res.data }))
        )
      );

      results.forEach(({ plan, data }) => {
        if (data.exists) queries[plan] = data.query;
      });

      setExistingQueries(queries);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRenew = async (subscriptionId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/subscription/renew`,
        { subscriptionId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchData();
    } catch (err) {
      console.error('Renew failed:', err);
    }
  };

  const handleRaiseInquiry = (planName) => {
    setInquirySubName(planName);
    setShowInquiryModal(true);
  };

  const handleBuyPlan = async (planId) => {
    console.log(localStorage.getItem('token'));
    try {
      await axios.post(`${process.env.REACT_APP_API}/subscription/buy/${planId}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchData();
    } catch (err) {
      console.error('Error purchasing plan:', err);
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
    }
  };

  const handleAddPanel = (planName) => {
    setCurrentPlanName(planName);
    setCurrentPanelData({ username: '', password: '' }); // empty for new
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
    }
  };

  const openDeletePanelModal = (planName) => {
    setDeletePlanName(planName);
    setShowDeletePanelModal(true);
  };

  const handleRedirect = (planName) => {
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
      alert("Invalid Plan")
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
            // Panel plans logic
            actionButtons = panelAccounts[original.plan_name] ? (
              <>
                <Button variant="outline-primary" size="sm" onClick={() => handleEditPanel(original.plan_name)} style={{ height: 'auto' }}>
                  <CsLineIcons icon="edit" />
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => openDeletePanelModal(original.plan_name)} style={{ height: 'auto' }}>
                  <CsLineIcons icon="bin" />
                </Button>
              </>
            ) : (
              <Button variant="outline-success" size="sm" onClick={() => handleAddPanel(original.plan_name)} style={{ height: 'auto' }}>
                <CsLineIcons icon="plus" />
              </Button>
            );
          } else if (isActive) {
            actionButtons = (
              <Button variant="outline-primary" size="sm" onClick={() => handleRedirect(original.plan_name)} style={{ height: 'auto' }}>
                <CsLineIcons icon="eye" />
              </Button>
            );
          } else if (isInactive) {
            actionButtons = (
              <Button variant="outline-success" size="sm" title="Renew" onClick={() => handleRenew(original._id)} style={{ height: 'auto' }}>
                <CsLineIcons icon="refresh-horizontal" />
              </Button>
            );
          } else if (isBlocked) {
            if (isBlockedWithQuery) {
              actionButtons = (
                <Button variant="outline-warning" size="sm" title="Already Inquiry Raised" style={{ height: 'auto' }}>
                  <CsLineIcons icon="hourglass" />
                </Button>
              );
            } else {
              actionButtons = (
                <Button
                  variant="outline-danger"
                  size="sm"
                  title="Raise Inquiry"
                  onClick={() => handleRaiseInquiry(original.plan_name)}
                  style={{ height: 'auto' }}
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
    [existingQueries]
  );

  const tableInstance = useTable({ columns, data: userSubscription, initialState: { pageIndex: 0 } }, useGlobalFilter, useSortBy, usePagination);

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
              <Table className="react-table rows" tableInstance={tableInstance} />
            </Col>
            <Col xs="12">
              <TablePagination tableInstance={tableInstance} />
            </Col>
          </Row>
        </Col>
      </Row>
      {availablePlans.length > 0 && (
        <Row className="mt-5">
          <h2>Available Add-on Plans</h2>
          {availablePlans.map((plan) => (
            <Col key={plan._id} sm="12" md="6" lg="4" className="mb-4">
              {' '}
              {/* eslint-disable-line no-underscore-dangle */}
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
                  <Button variant="primary" onClick={() => handleBuyPlan(plan._id)}>
                    {' '}
                    {/* eslint-disable-line no-underscore-dangle */}
                    Buy Plan
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
        <DeletePanelModal show={showDeletePanelModal} handleClose={() => setShowDeletePanelModal(false)} planName={deletePlanName} fetchData={fetchData} />
      )}

      {/* <RaiseInquiryModal
        show={showInquiryModal}
        handleClose={() => setShowInquiryModal(false)}
        subscriptionName={inquirySubName}
        fetchData={fetchData}
      /> */}
    </>
  );
};

export default Subscription;
