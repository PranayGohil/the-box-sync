import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Card, Spinner, Button, Badge, Form, InputGroup } from "react-bootstrap";
import HtmlHead from "components/html-head/HtmlHead";
import BreadcrumbList from "components/breadcrumb-list/BreadcrumbList";
import CsLineIcons from "cs-line-icons/CsLineIcons";

const ActivityTimeline = () => {
  const title = "Activity Timeline";
  const description = "Real-time audit logs of all administrative actions.";
  const breadcrumbs = [
    { to: "", text: "Home" },
    { to: "timeline", text: "Timeline" },
  ];

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/superadmin/audit-logs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setLogs(res.data.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action) => {
    switch (action) {
      case "LOGIN": return <CsLineIcons icon="login" className="text-primary" size="20" />;
      case "IMPERSONATE": return <CsLineIcons icon="user" className="text-info" size="20" />;
      case "BLOCK_SUBSCRIPTIONS": return <CsLineIcons icon="lock-off" className="text-danger" size="20" />;
      case "UNBLOCK_SUBSCRIPTION": return <CsLineIcons icon="unlock" className="text-success" size="20" />;
      case "EXPAND_SUBSCRIPTIONS": return <CsLineIcons icon="expand" className="text-warning" size="20" />;
      case "RENEW_SUBSCRIPTION": return <CsLineIcons icon="rotate-right" className="text-primary" size="20" />;
      case "CREATE_ADMIN": return <CsLineIcons icon="plus" className="text-success" size="20" />;
      case "DELETE_ADMIN": return <CsLineIcons icon="trash" className="text-danger" size="20" />;
      default: return <CsLineIcons icon="clock" className="text-secondary" size="20" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const searchMatch = !query || 
      log.adminName?.toLowerCase().includes(query) ||
      log.action?.toLowerCase().includes(query) ||
      log.targetId?.toLowerCase().includes(query);

    let dateMatch = true;
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      const logDate = new Date(log.timestamp);
      dateMatch = logDate.getDate() === filterDate.getDate() &&
                  logDate.getMonth() === filterDate.getMonth() &&
                  logDate.getFullYear() === filterDate.getFullYear();
    }

    return searchMatch && dateMatch;
  });

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid ps-lg-4 pe-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs={12} lg="auto" className="me-auto mb-3 mb-lg-0">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: "#23b3f4" }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs={12} lg="auto" className="d-flex flex-wrap align-items-center justify-content-lg-end gap-3 mt-3 mt-lg-0">
              <style>{`
                .search-bar-timeline {
                  width: 100%;
                }
                @media (min-width: 992px) {
                  .search-bar-timeline {
                    width: 260px;
                  }
                }
                input[type="date"]::-webkit-inner-spin-button,
                input[type="date"]::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                }
              `}</style>
              <div className="d-flex align-items-center px-3 bg-white shadow-sm rounded-pill border search-bar-timeline" style={{ height: "38px" }}>
                <CsLineIcons icon="search" size="15" className="me-2 text-muted" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="border-0 bg-transparent flex-grow-1"
                  style={{ outline: "none", fontSize: "0.9rem", fontWeight: 500 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="d-flex align-items-center px-3 bg-white shadow-sm rounded-pill border" style={{ height: "38px" }}>
                <input
                  type="date"
                  className="border-0 bg-transparent"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ outline: "none", fontSize: "0.9rem", fontWeight: 600, color: "#495057", width: "135px" }}
                />
              </div>

              <Button variant="outline-primary" className="btn-icon btn-icon-start rounded-pill d-none d-md-inline-flex align-items-center justify-content-center" style={{ height: "38px" }} onClick={fetchLogs}>
                <CsLineIcons icon="rotate-right" size="15" /> <span className="ms-1 fw-bold" style={{ fontSize: "0.9rem" }}>Refresh</span>
              </Button>
            </Col>
          </Row>
        </div>

        <Card className="mb-5 shadow-sm border-0">
          <Card.Body className="p-3 p-md-5">
            {loading && logs.length === 0 ? (
              <div className="text-center py-5">
                <Spinner animation="border" style={{ color: "#23b3f4" }} />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-5 text-muted fs-5">No activity recorded for this period.</div>
            ) : (
              <div className="timeline-container" style={{ position: "relative", paddingLeft: "30px", marginLeft: "10px" }}>
                <style>{`
                  @media (min-width: 768px) {
                    .timeline-container {
                      padding-left: 60px !important;
                      margin-left: 20px !important;
                    }
                    .timeline-icon-wrapper {
                      left: -60px !important;
                      width: 48px !important;
                      height: 48px !important;
                    }
                    .timeline-line {
                      left: -37px !important;
                    }
                  }
                  @media (max-width: 767px) {
                    .timeline-icon-wrapper {
                      left: -30px !important;
                      width: 40px !important;
                      height: 40px !important;
                    }
                    .timeline-line {
                      left: -11px !important;
                    }
                  }
                `}</style>
                <div className="timeline-line" style={{
                  position: "absolute",
                  top: "20px",
                  bottom: "0",
                  width: "2px",
                  background: "#e2e8f0",
                  zIndex: 1
                }} />

                {filteredLogs.map((log) => (
                  <div key={log._id} className="timeline-item mb-4 mb-md-5" style={{ position: "relative" }}>
                    <div className="timeline-icon-wrapper" style={{
                      position: "absolute",
                      top: "0",
                      background: "white",
                      border: "2px solid #e2e8f0",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                      boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
                    }}>
                      {getActionIcon(log.action)}
                    </div>

                    <div className="timeline-content ms-2 ms-md-4 pt-1">
                      <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center mb-3">
                        <div className="mb-2 mb-md-0">
                          <span className="fw-bold fs-6 fs-md-5 text-primary">{log.adminName}</span> 
                          <span className="text-muted fw-normal mx-2 fs-6">performed</span> 
                          <Badge bg="light" text="dark" className="fs-6 border shadow-sm px-3 py-2 mt-2 mt-md-0 d-inline-block">
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="text-muted fw-bold" style={{ fontSize: "0.9rem" }}>
                          <CsLineIcons icon="calendar" size="14" className="me-2 text-muted" />
                          {new Date(log.timestamp).toLocaleString('en-IN', { 
                            dateStyle: 'medium', 
                            timeStyle: 'short' 
                          })}
                        </div>
                      </div>

                      <div className="p-3 p-md-4 bg-white rounded-3 shadow-sm">
                        {log.targetId && (
                          <div className="mb-2 d-flex flex-column flex-sm-row gap-2">
                            <strong className="text-muted fs-6" style={{ minWidth: "80px" }}>Target ID:</strong> 
                            <span className="fw-bold text-dark fs-6" style={{ wordBreak: "break-all" }}>{log.targetId}</span>
                          </div>
                        )}
                        {Object.keys(log.details || {}).length > 0 && (
                          <div className="d-flex flex-column flex-sm-row gap-2">
                            <strong className="text-muted fs-6" style={{ minWidth: "80px" }}>Details:</strong>
                            <ul className="mb-0 mt-1 mt-sm-0 list-unstyled w-100">
                              {Object.entries(log.details).map(([key, val]) => (
                                <li key={key} className="mb-2 fs-6">
                                  <span className="text-muted text-capitalize me-2">{key.replace(/_/g, " ")}:</span> 
                                  <span className="fw-bold text-dark">{val}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default ActivityTimeline;
