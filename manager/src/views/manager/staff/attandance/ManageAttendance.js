import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Card, Button, Badge, Alert, Modal, Form, Spinner } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ControlsPageSize from 'components/table/ControlsPageSize';
import ControlsSearch from 'components/table/ControlsSearch';
import Table from 'components/table/Table';
import TablePagination from 'components/table/TablePagination';
import { toast } from 'react-toastify';

export default function ManageAttendance() {
  const title = 'Manage Attendance';
  const description = 'Manage staff attendance and track check-ins/check-outs';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'attendance', text: 'Attendance Management' },
  ];

  const history = useHistory();
  const [loading, setLoading] = useState({
    initial: true,
    actions: {
      checkin: false,
      checkout: false,
      absent: false
    }
  });
  const [staffList, setStaffList] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionType, setActionType] = useState('');
  const [error, setError] = useState('');

  const fetchStaff = async () => {
    try {
      setLoading(prev => ({ ...prev, initial: true }));
      setError('');
      const response = await axios.get(`${process.env.REACT_APP_API}/staff/get-all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setStaffList(response.data.data);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff attendance data. Please try again.');
      toast.error('Failed to fetch staff data.');
    } finally {
      setLoading(prev => ({ ...prev, initial: false }));
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const getTodayDate = () => {
    const today = new Date();
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const [day, month, year] = today.toLocaleDateString('en-IN', options).split('/');
    return `${year}-${month}-${day}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCheckIn = async (staffId, staffName) => {
    setLoading(prev => ({ ...prev, actions: { ...prev.actions, checkin: true } }));
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/staff/check-in`,
        {
          staff_id: staffId,
          date: getTodayDate(),
          in_time: getCurrentTime(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      toast.success(`${staffName} checked in successfully!`);
      fetchStaff();
    } catch (err) {
      console.error('Error during Check-In:', err);
      toast.error(err.response?.data?.message || 'Failed to check in.');
    } finally {
      setLoading(prev => ({ ...prev, actions: { ...prev.actions, checkin: false } }));
    }
  };

  const handleCheckOut = async (staffId, staffName) => {
    setLoading(prev => ({ ...prev, actions: { ...prev.actions, checkout: true } }));
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/staff/check-out`,
        {
          staff_id: staffId,
          date: getTodayDate(),
          out_time: getCurrentTime(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      toast.success(`${staffName} checked out successfully!`);
      fetchStaff();
    } catch (err) {
      console.error('Error during Check-Out:', err);
      toast.error(err.response?.data?.message || 'Failed to check out.');
    } finally {
      setLoading(prev => ({ ...prev, actions: { ...prev.actions, checkout: false } }));
    }
  };

  const handleAbsent = async (staffId, staffName) => {
    setLoading(prev => ({ ...prev, actions: { ...prev.actions, absent: true } }));
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/staff/mark-absent`,
        {
          staff_id: staffId,
          date: getTodayDate(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      toast.success(`${staffName} marked as absent!`);
      fetchStaff();
    } catch (err) {
      console.error('Error marking Absent:', err);
      toast.error(err.response?.data?.message || 'Failed to mark as absent.');
    } finally {
      setLoading(prev => ({ ...prev, actions: { ...prev.actions, absent: false } }));
    }
  };

  const handleAction = (staff, type) => {
    setSelectedStaff(staff);
    setActionType(type);
    setShowActionModal(true);
  };

  const confirmAction = () => {
    if (!selectedStaff) return;

    if (actionType === 'checkin') {
      handleCheckIn(selectedStaff._id, `${selectedStaff.f_name} ${selectedStaff.l_name}`);
    } else if (actionType === 'checkout') {
      handleCheckOut(selectedStaff._id, `${selectedStaff.f_name} ${selectedStaff.l_name}`);
    } else if (actionType === 'absent') {
      handleAbsent(selectedStaff._id, `${selectedStaff.f_name} ${selectedStaff.l_name}`);
    }
    setShowActionModal(false);
  };

  const formatDateDisplay = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Staff ID',
        accessor: 'staff_id',
        headerClassName: 'text-muted text-small text-uppercase w-10',
      },
      {
        Header: 'Name',
        accessor: (row) => `${row.f_name} ${row.l_name}`,
        headerClassName: 'text-muted text-small text-uppercase w-20',
      },
      {
        Header: 'Position',
        accessor: 'position',
        headerClassName: 'text-muted text-small text-uppercase w-15',
      },
      {
        Header: 'Status',
        id: 'status',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        Cell: ({ row }) => {
          const today = getTodayDate();
          const todayAttendance = row.original.attandance?.find((a) => a.date === today);

          let status = 'Pending';
          let statusVariant = 'warning';
          let statusIcon = 'clock';

          if (todayAttendance) {
            if (todayAttendance.in_time && !todayAttendance.out_time) {
              status = 'Checked In';
              statusVariant = 'success';
              statusIcon = 'log-in';
            } else if (todayAttendance.out_time) {
              status = 'Completed';
              statusVariant = 'primary';
              statusIcon = 'check';
            } else if (todayAttendance.status === 'absent') {
              status = 'Absent';
              statusVariant = 'danger';
              statusIcon = 'user-block';
            }
          }

          return (
            <Badge bg={statusVariant} className="d-inline-flex align-items-center">
              <CsLineIcons icon={statusIcon} className="me-1" size={12} />
              {status}
            </Badge>
          );
        },
      },
      {
        Header: 'Check-In Time',
        id: 'in_time',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        Cell: ({ row }) => {
          const today = getTodayDate();
          const todayAttendance = row.original.attandance?.find((a) => a.date === today);
          return todayAttendance?.in_time || '-';
        },
      },
      {
        Header: 'Check-Out Time',
        id: 'out_time',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        Cell: ({ row }) => {
          const today = getTodayDate();
          const todayAttendance = row.original.attandance?.find((a) => a.date === today);
          return todayAttendance?.out_time || '-';
        },
      },
      {
        Header: 'Actions',
        id: 'actions',
        headerClassName: 'text-muted text-small text-uppercase w-10 text-center',
        Cell: ({ row }) => {
          const today = getTodayDate();
          const todayAttendance = row.original.attandance?.find((a) => a.date === today);

          return (
            <div className="d-flex justify-content-center">
              {!todayAttendance ? (
                <>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="btn-icon btn-icon-only me-1"
                    onClick={() => handleAction(row.original, 'checkin')}
                    title="Check-In"
                    disabled={loading.actions.checkin || loading.actions.checkout || loading.actions.absent}
                  >
                    <CsLineIcons icon="login" />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="btn-icon btn-icon-only me-1"
                    onClick={() => handleAction(row.original, 'absent')}
                    title="Mark Absent"
                    disabled={loading.actions.checkin || loading.actions.checkout || loading.actions.absent}
                  >
                    <i className="bi-person-x-fill" />
                  </Button>
                </>
              ) : todayAttendance.in_time && !todayAttendance.out_time ? (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="btn-icon btn-icon-only me-1"
                  onClick={() => handleAction(row.original, 'checkout')}
                  title="Check-Out"
                  disabled={loading.actions.checkin || loading.actions.checkout || loading.actions.absent}
                >
                  <CsLineIcons icon="logout" />
                </Button>
              ) : (
                <Badge bg="secondary" className="mx-2 d-flex align-items-center">
                  <CsLineIcons icon="check" />
                </Badge>
              )}
              <Button
                variant="outline-dark"
                size="sm"
                className="btn-icon btn-icon-only"
                onClick={() => history.push(`/staff/attendance/view/${row.original._id}`)}
                title="View Attendance History"
                disabled={loading.initial}
              >
                <CsLineIcons icon="eye" />
              </Button>
            </div>
          );
        },
      },
    ],
    [loading]
  );

  const tableInstance = useTable(
    {
      columns,
      data: staffList,
      initialState: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
  );

  const handleRefresh = () => {
    fetchStaff();
  };

  if (loading.initial) {
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
              <h5>Loading Attendance Data...</h5>
              <p className="text-muted">Please wait while we fetch staff attendance information</p>
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
            <Row className="align-items-center">
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="5" className="d-flex align-items-start justify-content-end">
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    onClick={handleRefresh}
                    disabled={loading.initial || loading.actions.checkin || loading.actions.checkout || loading.actions.absent}
                  >
                    <CsLineIcons icon="refresh" className="me-2" />
                    Refresh
                  </Button>
                  <Button variant="outline-primary" as={Link} to="/staff/view">
                    <CsLineIcons icon="eye" className="me-2" />
                    View Staff
                  </Button>
                </div>
              </Col>
            </Row>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              <CsLineIcons icon="error" className="me-2" />
              {error}
              <Button
                variant="outline-danger"
                size="sm"
                className="ms-3"
                onClick={fetchStaff}
                disabled={loading.initial}
              >
                Retry
              </Button>
            </Alert>
          )}

          <Card className="mb-5">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <Card.Title className="mb-0">
                  <CsLineIcons icon="calendar" className="me-2" />
                  Today's Attendance - {formatDateDisplay(getTodayDate())}
                </Card.Title>
                <small className="text-muted">
                  All times are in IST (Asia/Kolkata) timezone
                </small>
              </div>
              <Badge bg="light" text="dark" className="p-2">
                <CsLineIcons icon="users" className="me-1" />
                {staffList.length} staff member{staffList.length !== 1 ? 's' : ''}
              </Badge>
            </Card.Header>
            <Card.Body>
              {staffList.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <div className="py-4">
                    <CsLineIcons icon="inbox" size="48" className="text-muted mb-3" />
                    <h5>No Staff Members Found</h5>
                    <p className="text-muted mb-4">Please add staff members to manage attendance</p>
                    <Button variant="primary" as={Link} to="/staff/add">
                      <CsLineIcons icon="plus" className="me-2" />
                      Add Staff
                    </Button>
                  </div>
                </Alert>
              ) : (
                <div className="mt-3">
                  <Row className="mb-3">
                    <Col sm="12" md="5" lg="3" xxl="2">
                      <div className="d-inline-block float-md-start me-1 mb-1 mb-md-0 search-input-container w-100 shadow bg-foreground">
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
                    <Col xs="12" style={{ overflow: 'auto' }}>
                      <Table className="react-table rows" tableInstance={tableInstance} />
                    </Col>
                    <Col xs="12">
                      <TablePagination tableInstance={tableInstance} />
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-transparent">
              <div className="d-flex flex-wrap gap-3">
                <div className="d-flex align-items-center">
                  <Badge bg="warning" className="me-2 px-2 py-1">
                    <CsLineIcons icon="clock" size="12" />
                  </Badge>
                  <small>Pending</small>
                </div>
                <div className="d-flex align-items-center">
                  <Badge bg="success" className="me-2 px-2 py-1">
                    <CsLineIcons icon="log-in" size="12" />
                  </Badge>
                  <small>Checked In</small>
                </div>
                <div className="d-flex align-items-center">
                  <Badge bg="primary" className="me-2 px-2 py-1">
                    <CsLineIcons icon="check" size="12" />
                  </Badge>
                  <small>Completed</small>
                </div>
                <div className="d-flex align-items-center">
                  <Badge bg="danger" className="me-2 px-2 py-1">
                    <i className="bi-person-x-fill" width="12" height="12" />
                  </Badge>
                  <small>Absent</small>
                </div>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Action Confirmation Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <CsLineIcons
              icon={
                actionType === 'checkin' ? 'login' :
                  actionType === 'checkout' ? 'logout' :
                    'user-block'
              }
              className="me-2"
            />
            {actionType === 'checkin' && 'Confirm Check-In'}
            {actionType === 'checkout' && 'Confirm Check-Out'}
            {actionType === 'absent' && 'Confirm Absent'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStaff && (
            <div>
              <p>
                Are you sure you want to {actionType === 'checkin' ? 'check-in' : actionType === 'checkout' ? 'check-out' : 'mark as absent'}
                <strong>
                  {' '}
                  {selectedStaff.f_name} {selectedStaff.l_name}
                </strong>
                ?
              </p>
              {actionType === 'checkin' && (
                <p className="text-muted">
                  <CsLineIcons icon="clock" className="me-1" />
                  Check-in time: {getCurrentTime()}
                </p>
              )}
              {actionType === 'checkout' && (
                <p className="text-muted">
                  <CsLineIcons icon="clock" className="me-1" />
                  Check-out time: {getCurrentTime()}
                </p>
              )}
              {actionType === 'absent' && (
                <Alert variant="warning" className="mt-3">
                  <CsLineIcons icon="alert" className="me-2" />
                  This will mark the staff as absent for today.
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActionModal(false)} disabled={loading.actions.checkin || loading.actions.checkout || loading.actions.absent}>
            Cancel
          </Button>
          <Button
            variant={
              actionType === 'checkin' ? 'primary' :
                actionType === 'checkout' ? 'secondary' :
                  'danger'
            }
            onClick={confirmAction}
            disabled={loading.actions.checkin || loading.actions.checkout || loading.actions.absent}
            style={{ minWidth: '100px' }}
          >
            {loading.actions.checkin || loading.actions.checkout || loading.actions.absent ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Action processing overlay */}
      {(loading.actions.checkin || loading.actions.checkout || loading.actions.absent) && (
        <div
          className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 9999,
            backdropFilter: 'blur(2px)'
          }}
        >
          <Card className="shadow-lg border-0" style={{ minWidth: '200px' }}>
            <Card.Body className="text-center p-4">
              <Spinner
                animation="border"
                variant="primary"
                className="mb-3"
                style={{ width: '3rem', height: '3rem' }}
              />
              <h5 className="mb-0">
                {loading.actions.checkin && 'Checking In...'}
                {loading.actions.checkout && 'Checking Out...'}
                {loading.actions.absent && 'Marking Absent...'}
              </h5>
              <small className="text-muted">Please wait a moment</small>
            </Card.Body>
          </Card>
        </div>
      )}
    </>
  );
}