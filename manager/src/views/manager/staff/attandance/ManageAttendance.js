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

export default function ManageAttendance() {
  const title = 'Manage Attendance';
  const description = 'Manage staff attendance and track check-ins/check-outs';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'attendance', text: 'Attendance Management' },
  ];

  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionType, setActionType] = useState('');

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/staff/get-all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setStaffList(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setIsLoading(false);
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

  const handleCheckIn = async (staffId) => {
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
      fetchStaff();
    } catch (error) {
      console.error('Error during Check-In:', error);
    }
  };

  const handleCheckOut = async (staffId) => {
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
      fetchStaff();
    } catch (error) {
      console.error('Error during Check-Out:', error);
    }
  };

  const handleAbsent = async (staffId) => {
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
      fetchStaff();
    } catch (error) {
      console.error('Error marking Absent:', error);
    }
  };

  const handleAction = (staff, type) => {
    setSelectedStaff(staff);
    setActionType(type);
    setShowActionModal(true);
  };

  const confirmAction = () => {
    if (actionType === 'checkin') {
      handleCheckIn(selectedStaff._id);
    } else if (actionType === 'checkout') {
      handleCheckOut(selectedStaff._id);
    } else if (actionType === 'absent') {
      handleAbsent(selectedStaff._id);
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
                  >
                    <CsLineIcons icon="login" />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="btn-icon btn-icon-only me-1"
                    onClick={() => handleAction(row.original, 'absent')}
                    title="Mark Absent"
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
              >
                <CsLineIcons icon="eye" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
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
              <Col xs="12" md="5" className="d-flex align-items-start justify-content-end">
                <Button variant="outline-primary" as={Link} to="/staff/view">
                  <CsLineIcons icon="eye" className="me-2" />
                  View Staff
                </Button>
              </Col>
            </Row>
          </div>

          <Card className="mb-5">
            <Card.Header>
              <Card.Title className="mb-0">Today's Attendance - {formatDateDisplay(getTodayDate())}</Card.Title>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading staff data...</p>
                </div>
              ) : staffList.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <CsLineIcons icon="info" className="me-2" />
                  No staff members found. Please add staff first.
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
                    <Col xs="12">
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
              <small className="text-muted">
                <CsLineIcons icon="clock" className="me-1" />
                All times are in IST (Asia/Kolkata) timezone
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Action Confirmation Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
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
              {actionType === 'checkin' && <p className="text-muted">Check-in time: {getCurrentTime()}</p>}
              {actionType === 'checkout' && <p className="text-muted">Check-out time: {getCurrentTime()}</p>}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActionModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmAction}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
