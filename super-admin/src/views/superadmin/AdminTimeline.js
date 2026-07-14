import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useHistory } from "react-router-dom";
import { Row, Col, Card, Spinner, Button } from "react-bootstrap";
import HtmlHead from "components/html-head/HtmlHead";
import BreadcrumbList from "components/breadcrumb-list/BreadcrumbList";
import CsLineIcons from "cs-line-icons/CsLineIcons";

const AdminTimeline = () => {
  const { id } = useParams();
  const history = useHistory();
  const title = "Admin Activity";
  const [adminName, setAdminName] = useState("");
  const description = `Detailed audit logs for ${adminName || "this admin"}`;
  
  const breadcrumbs = [
    { to: "", text: "Home" },
    { to: "admins", text: "Admin Management" },
    { to: `admins/${id}/timeline`, text: "Admin Activity" },
  ];

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/superadmin/audit-logs?adminId=${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setLogs(res.data.data);
      if (res.data.data.length > 0) {
        setAdminName(res.data.data[0].adminName);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [id]);

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

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid ps-lg-4 pe-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <Button variant="link" className="text-muted p-0 text-decoration-none mb-2 d-flex align-items-center gap-2" onClick={() => history.goBack()}>
                <CsLineIcons icon="arrow-left" size="14" /> Back to Admins
              </Button>
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: "#23b3f4" }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
              <p className="text-muted mt-2">{description}</p>
            </Col>
            <Col xs="auto">
              <Button variant="outline-primary" className="btn-icon btn-icon-start rounded-pill" onClick={fetchLogs}>
                <CsLineIcons icon="rotate-right" /> <span>Refresh</span>
              </Button>
            </Col>
          </Row>
        </div>

        <Card className="mb-5 shadow-sm border-0">
          <Card.Body className="p-4">
            {loading && logs.length === 0 ? (
              <div className="text-center py-5">
                <Spinner animation="border" style={{ color: "#23b3f4" }} />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-5 text-muted">No activity recorded for this admin yet.</div>
            ) : (
              <div className="timeline-container" style={{ position: "relative", paddingLeft: "40px" }}>
                <div style={{
                  position: "absolute",
                  left: "19px",
                  top: "0",
                  bottom: "0",
                  width: "2px",
                  background: "var(--border)",
                  zIndex: 1
                }} />

                {logs.map((log) => (
                  <div key={log._id} className="timeline-item mb-5" style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      left: "-40px",
                      top: "0",
                      width: "40px",
                      height: "40px",
                      background: "white",
                      border: "2px solid var(--border)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}>
                      {getActionIcon(log.action)}
                    </div>

                    <div className="timeline-content ms-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0 text-capitalize">
                          {log.action.replace(/_/g, " ")}
                        </h6>
                        <small className="text-muted fw-bold">
                          {new Date(log.timestamp).toLocaleString('en-IN', { 
                            dateStyle: 'medium', 
                            timeStyle: 'short' 
                          })}
                        </small>
                      </div>

                      <div className="p-3 bg-light rounded-3 small" style={{ border: "1px solid var(--border)" }}>
                        {log.targetId && (
                          <div className="mb-1">
                            <strong className="text-muted">Target ID:</strong> <code>{log.targetId}</code>
                          </div>
                        )}
                        {Object.keys(log.details || {}).length > 0 && (
                          <div>
                            <strong className="text-muted">Details:</strong>
                            <ul className="mb-0 mt-1 list-unstyled ms-2">
                              {Object.entries(log.details).map(([key, val]) => (
                                <li key={key} className="text-capitalize mb-1">
                                  <span className="opacity-75">{key.replace(/_/g, " ")}:</span> <span className="fw-bold">{val}</span>
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

export default AdminTimeline;
