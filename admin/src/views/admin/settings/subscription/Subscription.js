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

import { plans, featureCategories } from '../../../../config/plansConfig';

import ModalEditPanel from './ModalEditPanel';
import DeletePanelModal from './DeletePanelModal';
import RaiseInquiryModal from './RaiseInquiryModal';


const PANEL_PLANS = ['Manager', 'QSR', 'Captain Panel', 'KOT Panel', 'Hotel Manager', 'Cashier'];

const PLAN_DISPLAY_NAMES = {
  Manager: 'Manager Panel',
  QSR: 'QSR Panel',
  'Payroll By The Box': 'TheBoxSync Payroll',
  'Scan For Menu': 'Scan & QR Order',
  Feedback: 'QR-based Feedback',
  'Reservation Manager': 'Reservation Management',
  'Token Management': 'Token Management',
  'Table Management': 'Table Management',
  'Waiter Calling System': 'Waiter Calling System',
  'Whatsapp-Invoice': 'WhatsApp Invoice',
  'KOT Panel': 'Kitchen Display System',
  'Cashier': 'Cashier',
};

const ADDON_LABEL_TO_DB = {
  'Reservation Management': 'Reservation Manager',
  'QSR Panel': 'QSR',
  'Manager Panel': 'Manager',
  'Cashier': 'Cashier',
  'Captain Panel': 'Captain Panel',
  'Kitchen Display System': 'KOT Panel',
  'Restaurant Website': 'Restaurant Website',
  'Scan & QR Order': 'Scan For Menu',
  'QR-based Feedback': 'Feedback',
  'Waiter Calling System': 'Waiter Calling System',
  'Dynamic Reports': 'Dynamic Reports',
  'WhatsApp Invoice': 'Whatsapp-Invoice',
  'Token Management': 'Token Management',
  'Table Management': 'Table Management',
  'TheBoxSync Payroll': 'Payroll By The Box',
};

const ALLOWED_PLANS_BY_TIER = {
  QSR: ['Staff Management', 'QSR', 'KOT Panel', 'Token Management', 'Scan For Menu', 'Feedback', 'Dynamic Reports', 'Whatsapp-Invoice'],
  Café: ['Staff Management', 'QSR', 'KOT Panel', 'Token Management', 'Scan For Menu', 'Feedback', 'Dynamic Reports', 'Whatsapp-Invoice', 'Restaurant Website'],
  'Fine Dine': [
    'Manager',
    'Staff Management',
    'Captain Panel',
    'KOT Panel',
    'Reservation Manager',
    'Table Management',
    'Scan For Menu',
    'Feedback',
    'Waiter Calling System',
    'Dynamic Reports',
    'Whatsapp-Invoice',
    'Restaurant Website',
    'Cashier',
  ],
  Cloud: ['Staff Management', 'QSR', 'KOT Panel', 'Feedback', 'Dynamic Reports', 'Whatsapp-Invoice', 'Restaurant Website'],
  Chain: [
    'Manager',
    'Staff Management',
    'QSR',
    'Captain Panel',
    'KOT Panel',
    'Reservation Manager',
    'Table Management',
    'Token Management',
    'Scan For Menu',
    'Feedback',
    'Waiter Calling System',
    'Dynamic Reports',
    'Whatsapp-Invoice',
    'Restaurant Website',
    'Payroll By The Box',
    'Cashier',
  ],
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
  const [userDetails, setUserDetails] = useState(null);

  const [actionLoading, setActionLoading] = useState({
    renew: false,
    buy: false,
    redirect: false,
  });

  const [activePlanFeatures, setActivePlanFeatures] = useState([]);
  const [missingFeatures, setMissingFeatures] = useState([]);

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
        axios
          .get(`${process.env.REACT_APP_API}/user/get`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          })
          .catch(() => null),
      ]);

      if (userDetailsRes && userDetailsRes.data) {
        setRestaurantCode(userDetailsRes.data.restaurant_code || '');
        setUserDetails(userDetailsRes.data);
      }

      const userTier = userDetailsRes?.data?.purchasedPlan || 'QSR';
      const allowedPlans = ALLOWED_PLANS_BY_TIER[userTier] || [];

      const activePlanObj = plans.find((p) => p.name === `${userTier} Plan` || p.name === userTier) || plans[0];
      const checkFeats = new Set([
        ...activePlanObj.features.billing,
        ...activePlanObj.features.addons,
        ...(activePlanObj.features.loyalty || []),
        ...activePlanObj.features.advanced,
        ...activePlanObj.features.support,
      ]);

      const allFeats = new Set();
      featureCategories.forEach((cat) => cat.features.forEach((f) => allFeats.add(f)));

      setActivePlanFeatures(Array.from(checkFeats));
      const crosses = [];
      allFeats.forEach((f) => {
        if (!checkFeats.has(f)) crosses.push(f);
      });
      setMissingFeatures(crosses);

      const basePlanSub = userRes.data.data.find(sub => {
        const p = plansRes.data.data.find(pl => pl._id === sub.plan_id);
        return p && !p.is_addon;
      });
      const impliedStart = basePlanSub ? new Date(basePlanSub.start_date).toLocaleDateString('en-IN') : 'Included in Plan';
      const impliedEnd = basePlanSub ? new Date(basePlanSub.end_date).toLocaleDateString('en-IN') : 'Included in Plan';

      let enriched = userRes.data.data
        .map((sub) => {
          const plan = plansRes.data.data.find((p) => p._id === sub.plan_id);
          return {
            ...sub,
            plan_name: plan?.plan_name || 'Unknown',
            is_addon: plan?.is_addon || false,
            formatted_start: new Date(sub.start_date).toLocaleDateString('en-IN'),
            formatted_end: new Date(sub.end_date).toLocaleDateString('en-IN'),
          };
        })
        .filter((sub) => allowedPlans.includes(sub.plan_name));

      const checkFeatsArray = Array.from(checkFeats);
      const impliedSubs = checkFeatsArray
        .filter((feat) => PANEL_PLANS.includes(feat))
        .map((feat) => {
          const existing = enriched.find((sub) => sub.plan_name === feat);
          if (existing) return null;

          return {
            _id: `implied_${feat}`,
            plan_name: feat,
            is_addon: true,
            status: 'active',
            plan_id: `implied_id_${feat}`,
            formatted_start: impliedStart,
            formatted_end: impliedEnd,
          };
        })
        .filter(Boolean);

      enriched = [...enriched, ...impliedSubs];

      const panelResults = await Promise.all(
        enriched
          .filter((sub) => PANEL_PLANS.includes(sub.plan_name))
          .map((sub) =>
            axios
              .get(`${process.env.REACT_APP_API}/panel-user/${sub.plan_name}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              })
              .then((res) => ({ name: sub.plan_name, exists: res.data.exists, data: res.data.data }))
              .catch(() => ({ name: sub.plan_name, exists: false, data: null }))
          )
      );

      const accountStatus = {};
      const accountData = {};
      panelResults.forEach((res) => {
        accountStatus[res.name] = res.exists;
        accountData[res.name] = res.data;
      });
      setPanelAccounts(accountStatus);

      const finalEnriched = [];
      for (const sub of enriched) {
        if (sub.plan_name === 'Cashier') {
          const cashiers = accountData.Cashier;
          if (Array.isArray(cashiers) && cashiers.length > 0) {
            cashiers.forEach((cashier, index) => {
              finalEnriched.push({
                ...sub,
                _id: `cashier_inst_${cashier._id}`,
                plan_name: 'Cashier Instance',
                display_name: `Cashier ${index + 1}`,
                accountId: cashier._id,
                accountData: cashier,
              });
            });
          }
          finalEnriched.push(sub);
        } else {
          finalEnriched.push(sub);
        }
      }

      setUserSubscription(finalEnriched);

      const inactivePlans = enriched.filter((sub) => sub.status === 'inactive');

      const purchasedPlanIds = new Set(userRes.data.data.map((sub) => sub.plan_id));
      // Only show true addons as purchasable, exclude bundles and disallowed plans
      const available = plansRes.data.data.filter((plan) => !purchasedPlanIds.has(plan._id) && plan.is_addon === true && allowedPlans.includes(plan.plan_name));
      setAvailablePlans(available);

      setInactiveAddOns(
        inactivePlans
          .filter((sub) => {
            const plan = plansRes.data.data.find((p) => p._id === sub.plan_id);
            // Only show true addon plans, exclude bundles and disallowed plans
            return plan?.is_addon === true && allowedPlans.includes(sub.plan_name);
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

  const handleSendFeatureInquiry = async (featureName) => {
    try {
      setActionLoading((prev) => ({ ...prev, [featureName]: true }));
      const payload = {
        name: userDetails?.name || 'Admin',
        email: userDetails?.email || 'Unknown',
        phone: userDetails?.mobile || 'Unknown',
        city: userDetails?.city || '',
        restaurant_name: userDetails?.restaurant_name || userDetails?.name || 'Unknown',
        purpose: `Excluded Addon: ${featureName}`,
        message: `I am interested in the "${featureName}" add-on. Please contact me with pricing and details.`,
      };

      await axios.post(`${process.env.REACT_APP_API}/inquiry/create`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success(`Inquiry sent for ${featureName}. Our team will contact you soon for Upgrades & Add-ons and pricing.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to inquiry: Please try again later.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [featureName]: false }));
    }
  };

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

  const handleEditPanel = async (planName, accountData = null) => {
    try {
      if (planName === 'Cashier' && accountData) {
        setCurrentPlanName('Cashier');
        setCurrentPanelData(accountData);
        setShowPanelModal(true);
        return;
      }
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

  const handleSavePanel = () => {
    setShowPanelModal(false);
    fetchData();
  };

  const handleRaiseInquiry = (planName) => {
    setInquirySubName(planName);
    setShowInquiryModal(true);
  };

  const openDeletePanelModal = (planName, accountId = null) => {
    setDeletePlanName(planName);
    setCurrentPanelData((prev) => ({ ...prev, accountId }));
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
      } else if (planName === 'KOT Panel' || planName === 'Kitchen Display System') {
        window.open('https://kot.theboxsync.com', '_blank');
      } else if (planName === 'Manager' || planName === 'QSR') {
        window.open('https://manager.theboxsync.com', '_blank');
      } else if (planName === 'Cashier') {
        window.open('https://cashier.theboxsync.com', '_blank');
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
        Cell: ({ row, value }) => <span className="fw-semibold">{row.original.display_name || getDisplayName(value)}</span>,
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
            return (
              <Badge bg="none" className="subscription-bg-soft-success text-success px-3 py-2 rounded-pill">
                Active
              </Badge>
            );
          } else if (value === 'inactive') {
            return (
              <Badge bg="none" className="subscription-bg-soft-warning text-warning px-3 py-2 rounded-pill">
                Inactive
              </Badge>
            );
          }
          return (
            <Badge bg="none" className="subscription-bg-soft-danger text-danger px-3 py-2 rounded-pill">
              {value}
            </Badge>
          );
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

          if (isActive && (PANEL_PLANS.includes(original.plan_name) || original.plan_name === 'Cashier Instance')) {
            // Special handling for Cashier: always show Manage Cashiers button
            if (original.plan_name === 'Cashier') {
              actionButtons = (
                <Button
                  variant="none"
                  size="sm"
                  className="subscription-custom-btn-outline"
                  style={{ width: '30px', height: '30px', padding: 0 }}
                  onClick={() => handleAddPanel('Cashier')}
                  disabled={loading}
                  title="Create New Cashier"
                >
                  <CsLineIcons icon="plus" size="15" />
                </Button>
              );
            } else if (original.plan_name === 'Cashier Instance') {
              actionButtons = (
                <>
                  <Button
                    variant="none"
                    size="sm"
                    className="subscription-custom-btn-outline"
                    style={{ width: '30px', height: '30px', padding: 0 }}
                    onClick={() => handleEditPanel('Cashier', original.accountData)}
                    disabled={loading || actionLoading.renew}
                    title="Edit Cashier"
                  >
                    <CsLineIcons icon="edit" size="15" />
                  </Button>
                  <Button
                    variant="none"
                    size="sm"
                    className="subscription-custom-btn-danger"
                    onClick={() => openDeletePanelModal('Cashier', original.accountId)}
                    disabled={loading}
                    title="Remove Cashier"
                  >
                    <CsLineIcons icon="bin" size="15" />
                  </Button>
                  <Button
                    variant="none"
                    size="sm"
                    className="subscription-custom-btn-outline"
                    style={{ width: '30px', height: '30px', padding: 0 }}
                    onClick={() => handleRedirect('Cashier')}
                    disabled={loading || actionLoading.redirect}
                    title="Go to Module"
                  >
                    <CsLineIcons icon="eye" size="15" />
                  </Button>
                </>
              );
            } else {
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
            }
          } else if (
            isActive &&
            ['Staff Management', 'Feedback', 'Scan For Menu', 'Reservation Manager', 'Dynamic Reports', 'Restaurant Website'].includes(original.plan_name)
          ) {
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
                <Button
                  variant="none"
                  size="sm"
                  className="subscription-custom-btn-outline opacity-50"
                  style={{ width: '30px', height: '30px', padding: 0 }}
                  title="Inquiry Pending"
                  disabled
                >
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
      initialState: { pageIndex: 0, pageSize: 20 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const { page, prepareRow } = tableInstance;

  if (loading) {
    return (
      <div className="container-fluid qsr-page-container">
        <HtmlHead title={title} description={description} />
        <div className="qsr-page-title-container">
          <Row>
            <Col>
              <h1 className="qsr-page-title">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h5>Loading...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid qsr-page-container">
      <HtmlHead title={title} description={description} />

      <div className="qsr-page-title-container">
        <Row className="g-3 align-items-center">
          <Col md={7}>
            <h1 className="qsr-page-title">{title}</h1>
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
                          <span className="subscription-mobile-value mb-0">{original.display_name || getDisplayName(original.plan_name)}</span>
                        </div>
                        <div>
                          {original.status === 'active' && (
                            <Badge bg="none" className="subscription-bg-soft-success text-success rounded-pill">
                              Active
                            </Badge>
                          )}
                          {original.status === 'inactive' && (
                            <Badge bg="none" className="subscription-bg-soft-warning text-warning rounded-pill">
                              Inactive
                            </Badge>
                          )}
                          {original.status === 'blocked' && (
                            <Badge bg="none" className="subscription-bg-soft-danger text-danger rounded-pill">
                              Blocked
                            </Badge>
                          )}
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
                        {row.cells.find((c) => c.column.Header === 'Actions')?.render('Cell')}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <TablePagination tableInstance={tableInstance} />
              </div>

              {activePlanFeatures.length > 0 && (
                <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="section-header mb-4" style={{ borderLeft: '4px solid #4ade80', paddingLeft: '15px' }}>
                    <h5 className="fw-bold mb-1">Your Included Features</h5>
                    <p className="text-muted small mb-0">These are all the features active in your current base plan.</p>
                  </div>
                  <Row className="g-3 mb-2">
                    {activePlanFeatures.map((feat, i) => (
                      <Col key={i} xs={12} sm={6} md={4} lg={3}>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                            style={{ width: '20px', height: '20px', backgroundColor: 'transparent', border: '1.5px solid #4ade80' }}
                          >
                            <CsLineIcons icon="check" size="12" style={{ color: '#4ade80' }} />
                          </div>
                          <span className="fw-medium text-muted" style={{ fontSize: '0.9rem' }}>
                            {feat}
                          </span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
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
                      <Badge bg="none" className="subscription-bg-soft-warning text-warning rounded-pill">
                        Expired
                      </Badge>
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

      {missingFeatures.length > 0 && (
        <div className="mb-5">
          <div className="section-header mb-4" style={{ borderLeft: '4px solid #e53e3e', paddingLeft: '15px' }}>
            <h3 className="fw-bold mb-1">Available Upgrades & Add-ons</h3>
            <p className="text-muted small mb-0">Unlock more features to enhance your restaurant operations.</p>
          </div>
          <Row className="g-4">
            {missingFeatures.map((feature, i) => {
              const dbName = ADDON_LABEL_TO_DB[feature];
              const availablePlan = dbName ? availablePlans.find((p) => p.plan_name === dbName) : null;

              return (
                <Col key={i} sm="12" md="6" lg="4">
                  <Card className="subscription-glass-card border-0 h-100 subscription-plan-card">
                    <Card.Body className="p-4 d-flex flex-column">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                          style={{ width: '24px', height: '24px', backgroundColor: 'transparent', border: '1.5px solid #e53e3e' }}
                        >
                          <CsLineIcons icon="close" size="14" style={{ color: '#e53e3e' }} />
                        </div>
                        <h6 className="fw-bold mb-0" style={{ fontSize: '1.1rem' }}>
                          {feature}
                        </h6>
                      </div>

                      {availablePlan ? (
                        <>
                          <div className="subscription-plan-price mb-2" style={{ color: '#1ea8e7' }}>
                            ₹{availablePlan.plan_price}
                          </div>
                          <div className="text-muted small mb-4">per {availablePlan.plan_duration} month(s)</div>
                          <div className="mt-auto">
                            <Button
                              variant="none"
                              className="subscription-custom-btn-solid w-100"
                              onClick={() => handleBuyPlan(availablePlan._id)}
                              disabled={actionLoading.buy}
                            >
                              {actionLoading.buy ? (
                                <>
                                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CsLineIcons icon="cart" size="18" className="me-2" />
                                  Buy Add-on
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-muted small mb-4">Included in higher tier plans. Contact support to upgrade your base plan.</div>
                          <div className="mt-auto pt-3" style={{ borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                            <Button
                              variant="outline-primary"
                              className="w-100"
                              onClick={() => handleSendFeatureInquiry(feature)}
                              disabled={actionLoading[feature]}
                            >
                              {actionLoading[feature] ? (
                                <>
                                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <CsLineIcons icon="email" size="18" className="me-2" />
                                  Send Inquiry
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
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
        <DeletePanelModal show={showDeletePanelModal} handleClose={() => setShowDeletePanelModal(false)} planName={deletePlanName} accountId={currentPanelData?.accountId} fetchData={fetchData} />
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
