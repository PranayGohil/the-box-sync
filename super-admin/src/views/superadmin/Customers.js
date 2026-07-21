import React, { useEffect, useState } from "react";
import { Row, Col, Card, Spinner, Alert, Badge, Table, Form, InputGroup, Modal, Button, Pagination } from "react-bootstrap";
import { NavLink, useHistory } from "react-router-dom";
import axios from "axios";
import HtmlHead from "components/html-head/HtmlHead";
import BreadcrumbList from "components/breadcrumb-list/BreadcrumbList";
import CsLineIcons from "cs-line-icons/CsLineIcons";
import { toast } from "react-toastify";
import { DEFAULT_PATHS } from "config.js";

const Customers = () => {
  const title = "All Customers";
  const description = "View and manage all restaurant customers.";
  const breadcrumbs = [
    { to: "", text: "Home" },
    { to: "customers", text: "Customers" },
  ];

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const appRoot = DEFAULT_PATHS.APP.endsWith("/") ? DEFAULT_PATHS.APP.slice(1, DEFAULT_PATHS.APP.length) : DEFAULT_PATHS.APP;

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/subscription/get-all-subs`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUsers(response.data.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        history.push("/login");
      }
      console.error("Failed to fetch users", err);
      setError("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getUserPlan = (user) => {
    if (user.is_street_food) return "Street Food";
    if (user.is_shop) return "Shop";
    let planDisplay = user.purchasedPlan;
    const hasActive = user.subscriptions.some(sub => sub.status === "active") || user.is_street_food || user.is_shop;
    if (!planDisplay && hasActive) {
      const activeSubs = user.subscriptions.filter((sub) => sub.status === "active");
      const corePlans = ["street food", "qsr", "dine in", "cloud kitchen", "chain", "cafe"];
      const coreSub = activeSubs.find(sub => corePlans.some(cp => sub.plan_name && sub.plan_name.toLowerCase().includes(cp)));
      planDisplay = coreSub ? coreSub.plan_name : (activeSubs[0] ? activeSubs[0].plan_name : "");
    }
    return planDisplay || "No Plan";
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.restaurant_code?.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (subscriptionFilter !== "All") {
      const plan = getUserPlan(user).toLowerCase();
      if (!plan.includes(subscriptionFilter.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalActive = users.reduce((acc, user) => acc + user.subscriptions.filter((s) => s.status === "active").length, 0);
  const totalExpired = users.reduce((acc, user) => acc + user.subscriptions.filter((s) => s.status === "expired").length, 0);

  if (loading && users.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <Spinner animation="border" style={{ color: "#23b3f4" }} />
      </div>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid ps-lg-4 pe-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: "#23b3f4" }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="g-4 mb-4">
          <Col md="4" sm="6">
            <Card className="dashboard-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: "4px solid #3b82f6" }}>
              <Card.Body className="p-4 dashboard-stat-card-inner">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="dashboard-stat-label mb-2">Total Restaurants</div>
                    <div className="dashboard-stat-value">{users.length}</div>
                  </div>
                  <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}>
                    <CsLineIcons icon="user" size="24" style={{ color: "#3b82f6" }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md="4" sm="6">
            <Card className="dashboard-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: "4px solid #10b981" }}>
              <Card.Body className="p-4 dashboard-stat-card-inner">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="dashboard-stat-label mb-2">Active Subscriptions</div>
                    <div className="dashboard-stat-value" style={{ color: "#10b981" }}>{totalActive}</div>
                  </div>
                  <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                    <CsLineIcons icon="check-circle" size="24" style={{ color: "#10b981" }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md="4" sm="6">
            <Card className="dashboard-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: "4px solid #ef4444" }}>
              <Card.Body className="p-4 dashboard-stat-card-inner">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="dashboard-stat-label mb-2">Expired Plans</div>
                    <div className="dashboard-stat-value" style={{ color: "#ef4444" }}>{totalExpired}</div>
                  </div>
                  <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                    <CsLineIcons icon="error-hexagon" size="24" style={{ color: "#ef4444" }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="mb-5 shadow-sm border-0">
          <Card.Body className="p-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
              <h4 className="fw-bold mb-0">Customer Directory</h4>
              <style>{`
                .search-bar-directory {
                  width: 100%;
                }
                .filter-dropdown {
                  width: 100%;
                }
                @media (min-width: 576px) {
                  .search-bar-directory {
                    width: 300px;
                  }
                  .filter-dropdown {
                    width: 180px;
                  }
                }
              `}</style>
              <div className="d-flex flex-column flex-sm-row gap-3 align-items-sm-center">
                <Form.Select
                  className="filter-dropdown rounded-pill shadow-sm bg-white"
                  style={{ height: "38px", fontSize: "0.9rem", fontWeight: 500, border: "1px solid #dee2e6", color: "#6c757d" }}
                  value={subscriptionFilter}
                  onChange={(e) => setSubscriptionFilter(e.target.value)}
                >
                  <option value="All">All Subscriptions</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Chain">Chain</option>
                  <option value="Cloud">Cloud Kitchen</option>
                  <option value="Dine In">Dine In</option>
                  <option value="QSR">QSR</option>
                  <option value="Shop">Shop</option>
                  <option value="Street Food">Street Food</option>
                </Form.Select>
                <div className="d-flex align-items-center px-3 bg-white shadow-sm rounded-pill border search-bar-directory" style={{ height: "38px" }}>
                  <CsLineIcons icon="search" size="15" className="me-2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search by name, email or code..."
                    className="border-0 bg-transparent flex-grow-1"
                    style={{ outline: "none", fontSize: "0.9rem", fontWeight: 500 }}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="d-none d-lg-block">
              <Table responsive className="react-table">
                <thead>
                  <tr>
                    <th>Restaurant Details</th>
                    <th>Code</th>
                    <th>Contact</th>
                    <th>Subscriptions</th>
                    <th>Approval</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => {
                      const hasActive = user.subscriptions.some(sub => sub.status === "active") || user.is_street_food || user.is_shop;
                      const hasInactive = user.subscriptions.some(sub => sub.status === "expired" || sub.status === "inactive");
                      const hasBlocked = user.subscriptions.some(sub => sub.status === "blocked");

                      let expiryDate = "No Expiry";
                      if (hasActive) {
                        const activeSub = user.subscriptions.find(sub => sub.status === "active");
                        if (activeSub && activeSub.end_date) {
                          expiryDate = new Date(activeSub.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        }
                      } else if (hasInactive) {
                        const inactiveSub = user.subscriptions.find(sub => sub.status === "expired" || sub.status === "inactive");
                        if (inactiveSub && inactiveSub.end_date) {
                          expiryDate = new Date(inactiveSub.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        }
                      }

                      const uniformStyle = { width: "110px", height: "32px", display: "flex", justifyContent: "center", alignItems: "center", margin: 0, borderRadius: "50rem", boxSizing: "border-box", padding: 0 };

                      return (
                        <tr key={user._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold">{user.name}</span>
                            </div>
                            <div className="text-muted small">{user.email}</div>
                          </td>
                          <td>
                            <code className="text-primary fw-bold">{user.restaurant_code}</code>
                            <div className="text-muted small">{expiryDate}</div>
                          </td>
                          <td>{user.mobile}</td>
                          <td>
                            <span className="border text-dark rounded-pill d-flex align-items-center justify-content-center fw-bold text-uppercase" style={uniformStyle}>
                              {(() => {
                                if (user.is_street_food) return "Street Food";
                                if (user.is_shop) return "Shop";
                                let planDisplay = user.purchasedPlan;
                                if (!planDisplay && hasActive) {
                                  const activeSubs = user.subscriptions.filter((sub) => sub.status === "active");
                                  const corePlans = ["street food", "qsr", "dine in", "cloud kitchen", "chain"];
                                  const coreSub = activeSubs.find(sub => corePlans.some(cp => sub.plan_name && sub.plan_name.toLowerCase().includes(cp)));
                                  planDisplay = coreSub ? coreSub.plan_name : (activeSubs[0] ? activeSubs[0].plan_name : "");
                                }
                                return planDisplay || "No Plan";
                              })()}
                            </span>
                          </td>
                          <td>
                            {user.isApproved ? (
                              <span className="border border-success text-success rounded-pill d-flex align-items-center justify-content-center fw-bold" style={uniformStyle}><CsLineIcons icon="check" size="12" className="me-1" /> Approved</span>
                            ) : (
                              <span className="border border-warning text-warning rounded-pill d-flex align-items-center justify-content-center fw-bold" style={uniformStyle}><CsLineIcons icon="warning-hexagon" size="12" className="me-1" /> Pending</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2 flex-wrap">
                              {hasActive && <span className="border border-success text-success rounded-pill d-flex align-items-center justify-content-center fw-bold" style={uniformStyle}>Active</span>}
                              {hasBlocked && <span className="border border-warning text-warning rounded-pill d-flex align-items-center justify-content-center fw-bold" style={uniformStyle}>Blocked</span>}
                              {hasInactive && <span className="border border-danger text-danger rounded-pill d-flex align-items-center justify-content-center fw-bold" style={uniformStyle}>Expired</span>}
                              {!hasActive && !hasBlocked && !hasInactive && <span className="border text-muted rounded-pill d-flex align-items-center justify-content-center fw-bold" style={uniformStyle}>No Plan</span>}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex gap-2 align-items-center">
                              <button
                                type="button"
                                className="btn btn-outline-primary rounded-pill fw-bold"
                                style={uniformStyle}
                                onClick={() => history.push(`${appRoot}/userdetails/${user._id}`)}
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-5">
                        No restaurants matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            <div className="d-block d-lg-none mt-3">
              {paginatedUsers.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {paginatedUsers.map((user) => {
                    const hasActive = user.subscriptions.some(sub => sub.status === "active") || user.is_street_food;
                    const hasInactive = user.subscriptions.some(sub => sub.status === "inactive" || sub.status === "expired");
                    const hasBlocked = user.subscriptions.some(sub => sub.status === "blocked");

                    let expiryDate = "No Expiry";
                    if (hasActive) {
                      const activeSub = user.subscriptions.find(sub => sub.status === "active");
                      if (activeSub && activeSub.end_date) {
                        expiryDate = new Date(activeSub.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                      }
                    } else if (hasInactive) {
                      const inactiveSub = user.subscriptions.find(sub => sub.status === "expired" || sub.status === "inactive");
                      if (inactiveSub && inactiveSub.end_date) {
                        expiryDate = new Date(inactiveSub.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                      }
                    }

                    return (
                      <Card className="shadow-sm border" key={`mobile-${user._id}`}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h5 className="fw-bold mb-1">{user.name}</h5>
                              <div className="text-muted small mb-1">{user.email}</div>
                              <div className="small">
                                <code className="text-primary fw-bold">{user.restaurant_code}</code> | {user.mobile}
                              </div>
                              <div className="text-muted small mt-1">{expiryDate}</div>
                            </div>
                            <div>
                              {user.isApproved ? (
                                <span className="border border-success text-success rounded-pill px-2 py-1 small fw-bold"><CsLineIcons icon="check" size="10" className="me-1" /> Approved</span>
                              ) : (
                                <span className="border border-warning text-warning rounded-pill px-2 py-1 small fw-bold"><CsLineIcons icon="warning-hexagon" size="10" className="me-1" /> Pending</span>
                              )}
                            </div>
                          </div>

                          <div className="d-flex gap-2 flex-wrap mb-4">
                            <span className="border text-dark rounded-pill px-3 py-1 small fw-bold text-uppercase">
                              {(() => {
                                if (user.is_street_food) return "Street Food";
                                let planDisplay = user.purchasedPlan;
                                if (!planDisplay && hasActive) {
                                  const activeSubs = user.subscriptions.filter((sub) => sub.status === "active");
                                  const corePlans = ["street food", "qsr", "dine in", "cloud kitchen", "chain"];
                                  const coreSub = activeSubs.find(sub => corePlans.some(cp => sub.plan_name && sub.plan_name.toLowerCase().includes(cp)));
                                  planDisplay = coreSub ? coreSub.plan_name : activeSubs[0].plan_name;
                                }
                                return planDisplay || "No Plan";
                              })()}
                            </span>
                            {hasActive && <span className="border border-success text-success rounded-pill px-3 py-1 small fw-bold">Active</span>}
                            {hasBlocked && <span className="border border-warning text-warning rounded-pill px-3 py-1 small fw-bold">Blocked</span>}
                            {hasInactive && <span className="border border-danger text-danger rounded-pill px-3 py-1 small fw-bold">Expired</span>}
                            {!hasActive && !hasBlocked && !hasInactive && <span className="border text-muted rounded-pill px-3 py-1 small fw-bold">No Plan</span>}
                          </div>

                          <div className="d-flex w-100">
                            <button
                              type="button"
                              className="btn btn-outline-primary w-100 rounded-pill fw-bold"
                              style={{ padding: "0.5rem 0" }}
                              onClick={() => history.push(`${appRoot}/userdetails/${user._id}`)}
                            >
                              View
                            </button>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  No restaurants matching your search.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.Prev 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  />
                  {[...Array(totalPages)].map((_, i) => (
                    <Pagination.Item 
                      key={i + 1} 
                      active={i + 1 === currentPage} 
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  />
                </Pagination>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

    </>
  );
};

export default Customers;
