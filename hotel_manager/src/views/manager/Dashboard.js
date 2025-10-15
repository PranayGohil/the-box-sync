import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Button, Badge, Pagination, Form } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const Dashboard = () => {
  const title = 'Bookings Dashboard';
  const description = 'Manage hotel room bookings';
  const history = useHistory();

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/bookings', title: 'Bookings' },
  ];

  const [stats, setStats] = useState({
    totalBookings: 0,
    bookedCount: 0,
    checkedInCount: 0,
    checkedOutCount: 0,
    cancelledCount: 0,
    todayBookings: 0,
    totalRevenue: 0,
    upcomingCheckouts: [],
  });

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/hotel-booking/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStats(res.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/hotel-booking/get-all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setBookings(res.data.data);
      setFilteredBookings(res.data.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchBookings();
  }, []);

  const handleStatusChange = (bookingId, newStatus) => {
    axios
      .put(
        `${process.env.REACT_APP_API}/hotel-booking/update-status/${bookingId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      .then(() => {
        fetchBookings();
        fetchStats();
      })
      .catch((error) => console.error('Error updating status:', error));
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    if (status) {
      setFilteredBookings(bookings.filter((b) => b.status === status));
    } else {
      setFilteredBookings(bookings);
    }
    setCurrentPage(1);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Booked':
        return 'primary';
      case 'Checked In':
        return 'info';
      case 'Checked Out':
        return 'success';
      case 'Cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container mb-4">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </div>

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="mb-3">
                <Card.Body className="text-center">
                  <div className="display-4 text-primary mb-2">{stats.totalBookings}</div>
                  <div className="text-muted">Total Bookings</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="mb-3">
                <Card.Body className="text-center">
                  <div className="display-4 text-info mb-2">{stats.checkedInCount}</div>
                  <div className="text-muted">Checked In</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="mb-3">
                <Card.Body className="text-center">
                  <div className="display-4 text-success mb-2">₹{stats.totalRevenue.toLocaleString()}</div>
                  <div className="text-muted">Total Revenue</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="mb-3">
                <Card.Body className="text-center">
                  <div className="display-4 text-warning mb-2">{stats.todayBookings}</div>
                  <div className="text-muted">Today's Bookings</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Status Summary */}
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Body>
                  <h5 className="mb-3">Booking Status Summary</h5>
                  <div className="d-flex gap-3 flex-wrap">
                    <div>
                      <Badge bg="primary">{stats.bookedCount}</Badge>
                      <span className="ms-2 text-muted">Booked</span>
                    </div>
                    <div>
                      <Badge bg="info">{stats.checkedInCount}</Badge>
                      <span className="ms-2 text-muted">Checked In</span>
                    </div>
                    <div>
                      <Badge bg="success">{stats.checkedOutCount}</Badge>
                      <span className="ms-2 text-muted">Checked Out</span>
                    </div>
                    <div>
                      <Badge bg="danger">{stats.cancelledCount}</Badge>
                      <span className="ms-2 text-muted">Cancelled</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Upcoming Checkouts */}
          {stats.upcomingCheckouts.length > 0 && (
            <Row className="mb-4">
              <Col md={12}>
                <Card>
                  <Card.Body>
                    <h5 className="mb-3">Upcoming Checkouts</h5>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Customer</th>
                            <th>Room</th>
                            <th>Checkout Date</th>
                            <th>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.upcomingCheckouts.map((checkout) => (
                            <tr key={checkout._id}>
                              <td>{checkout.customer_id?.name || 'N/A'}</td>
                              <td>{checkout.room_id?.room_no}</td>
                              <td>{formatDate(checkout.check_out)}</td>
                              <td>{checkout.customer_id?.phone || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Bookings List */}
          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col md={8}>
                  <h5 className="mb-0">Bookings</h5>
                </Col>
                <Col md={4} className="text-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => history.push('/booking/create-booking')}
                  >
                    <CsLineIcons icon="plus" /> New Booking
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <Form.Select
                  size="sm"
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="Booked">Booked</option>
                  <option value="Checked In">Checked In</option>
                  <option value="Checked Out">Checked Out</option>
                  <option value="Cancelled">Cancelled</option>
                </Form.Select>
              </div>

              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : currentBookings.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Customer</th>
                          <th>Room</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Nights</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentBookings.map((booking) => (
                          <tr key={booking._id}>
                            <td>
                              <small>{booking._id.slice(-6).toUpperCase()}</small>
                            </td>
                            <td>{booking.customer_id?.name || 'N/A'}</td>
                            <td>{booking.room_id?.room_no}</td>
                            <td>{formatDate(booking.check_in)}</td>
                            <td>{formatDate(booking.check_out)}</td>
                            <td>{calculateNights(booking.check_in, booking.check_out)}</td>
                            <td>₹{booking.total_price?.toLocaleString()}</td>
                            <td>
                              <Badge bg={getStatusBadgeVariant(booking.status)}>
                                {booking.status}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() =>
                                    history.push(
                                      `/booking/booking-details/${booking._id}`
                                    )
                                  }
                                >
                                  <CsLineIcons icon="eye" size="12" />
                                </Button>
                                {booking.status === 'Booked' && (
                                  <>
                                    <Button
                                      variant="outline-info"
                                      size="sm"
                                      onClick={() =>
                                        handleStatusChange(booking._id, 'Checked In')
                                      }
                                    >
                                      Check In
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        handleStatusChange(booking._id, 'Cancelled')
                                      }
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}
                                {booking.status === 'Checked In' && (
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() =>
                                      handleStatusChange(booking._id, 'Checked Out')
                                    }
                                  >
                                    Check Out
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        <Pagination.First
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        />
                        <Pagination.Prev
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        />
                        {Array.from({ length: totalPages }, (_, i) => (
                          <Pagination.Item
                            key={i + 1}
                            active={i + 1 === currentPage}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        />
                        <Pagination.Last
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">No bookings found</p>
                  <Button
                    variant="primary"
                    onClick={() => history.push('/booking/create-booking')}
                  >
                    Create Your First Booking
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;