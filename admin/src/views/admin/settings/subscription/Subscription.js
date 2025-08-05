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

// import RaiseInquiryModal from "./RaiseInquiryModal";

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
  const [existingQueries, setExistingQueries] = useState({});
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySubName, setInquirySubName] = useState(null);

  const fetchData = async () => {
    try {
      const [plansRes, userRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/subscription/getsubscriptionplans`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get(`${process.env.REACT_APP_API}/subscription/getusersubscriptioninfo`, {
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
        `${process.env.REACT_APP_API}/subscription/renewsubscription`,
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

          return (
            <div className="d-flex gap-2">
              {isActive && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    switch (original.plan_name) {
                      case 'Manager':
                        history.push('/manager');
                        break;
                      case 'QSR':
                        history.push('/qsr');
                        break;
                      case 'Captain Panel':
                        history.push('/captain');
                        break;
                      case 'Payroll By The Box':
                        history.push('/payroll');
                        break;
                      case 'Scan For Menu':
                        history.push('/manage-menu');
                        break;
                      case 'Restaurant Website':
                        history.push('/manage-restaurant-website');
                        break;
                      case 'Reservation Manager':
                        history.push('/manage-reservation-manager');
                        break;
                      case 'Online Order Reconciliation':
                        history.push('/manage-online-order-reconciliation');
                        break;
                      case 'Feedback':
                        history.push('/manage-feedback');
                        break;
                      case 'Staff Management':
                        history.push('/manage-staff');
                        break;
                      case 'Dynamic Reports':
                        history.push('/dynamic-reports');
                        break;
                      default:
                        break;
                    }
                  }}
                >
                  <CsLineIcons icon="eye" />
                </Button>
              )}

              {isInactive && (
                <Button
                  variant="outline-success"
                  size="sm"
                  title="Renew"
                  onClick={() => handleRenew(original._id)} // eslint-disable-line no-underscore-dangle
                >
                  <CsLineIcons icon="reload" />
                </Button>
              )}

              {isBlocked &&
                (isBlockedWithQuery ? (
                  <Button variant="outline-warning" size="sm" title="Already Raised">
                    <CsLineIcons icon="sand-clock" />
                  </Button>
                ) : (
                  <Button variant="outline-danger" size="sm" title="Raise Inquiry" onClick={() => handleRaiseInquiry(original.plan_name)}>
                    <CsLineIcons icon="send" />
                  </Button>
                ))}
            </div>
          );
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
