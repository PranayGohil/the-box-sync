import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Card, Spinner, Form, Table, Badge, Button, Modal, InputGroup } from "react-bootstrap";
import HtmlHead from "components/html-head/HtmlHead";
import BreadcrumbList from "components/breadcrumb-list/BreadcrumbList";
import CsLineIcons from "cs-line-icons/CsLineIcons";

const Inquiries = () => {
  const title = "Inquiries";
  const description = "Manage contact requests and business inquiries.";
  const breadcrumbs = [
    { to: "", text: "Home" },
    { to: "inquiries", text: "Inquiries" },
  ];

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMonth, setFilterMonth] = useState("Current Month");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/inquiry/get-all`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setInquiries(response.data || []);
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/inquiry/update-status/${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchInquiries();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedInquiry) return;
    try {
      setIsReplying(true);
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/inquiry/reply/${selectedInquiry._id}`,
        { replyText },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setShowModal(false);
      setReplyText("");
      fetchInquiries();
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setIsReplying(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filteredInquiries = inquiries.filter((inq) => {
    // Status Filter
    const matchesStatus = filterStatus === "All" ? true : inq.status === filterStatus;
    
    // Search Filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (inq.name && inq.name.toLowerCase().includes(query)) || 
      (inq.restaurant_name && inq.restaurant_name.toLowerCase().includes(query)) ||
      (inq.email && inq.email.toLowerCase().includes(query)) ||
      (inq.phone && String(inq.phone).includes(query));

    // Month Filter
    let matchesMonth = true;
    if (inq.date) {
      const inquiryDate = new Date(inq.date);
      const now = new Date();
      if (filterMonth === "Current Month") {
        matchesMonth = inquiryDate.getMonth() === now.getMonth() && inquiryDate.getFullYear() === now.getFullYear();
      } else if (filterMonth === "Last Month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        matchesMonth = inquiryDate.getMonth() === lastMonth.getMonth() && inquiryDate.getFullYear() === lastMonth.getFullYear();
      }
    }

    return matchesStatus && matchesSearch && matchesMonth;
  });

  const uniformStyle = { width: "120px", height: "36px", display: "flex", justifyContent: "center", alignItems: "center", margin: 0, borderRadius: "50rem", boxSizing: "border-box", padding: 0 };

  if (loading && inquiries.length === 0) {
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
            <Col xs={12} lg="auto" className="d-flex flex-wrap align-items-center justify-content-lg-end gap-3 mt-3 mt-lg-0">
              <style>{`
                .search-bar-inquiries {
                  width: 100%;
                }
                @media (min-width: 992px) {
                  .search-bar-inquiries {
                    width: 260px;
                  }
                }
              `}</style>
              <div className="d-flex align-items-center px-3 bg-white shadow-sm rounded-pill border search-bar-inquiries" style={{ height: "38px" }}>
                <CsLineIcons icon="search" size="15" className="me-2 text-muted" />
                <input
                  type="text"
                  placeholder="Search inquiries..."
                  className="border-0 bg-transparent flex-grow-1"
                  style={{ outline: "none", fontSize: "0.9rem", fontWeight: 500 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="d-flex align-items-center px-3 bg-white shadow-sm rounded-pill border" style={{ height: "38px" }}>
                <CsLineIcons icon="calendar" size="15" className="me-2 text-muted" />
                <Form.Select
                  size="sm"
                  className="border-0 shadow-none bg-transparent"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  style={{ width: "135px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", outline: "none" }}
                >
                  <option className="py-2" value="Current Month">Current Month</option>
                  <option className="py-2" value="Last Month">Last Month</option>
                  <option className="py-2" value="All Time">All Time</option>
                </Form.Select>
              </div>

              <div className="d-flex align-items-center px-3 bg-white shadow-sm rounded-pill border" style={{ height: "38px" }}>
                <CsLineIcons icon="filter" size="15" className="me-2 text-muted" />
                <Form.Select
                  size="sm"
                  className="border-0 shadow-none bg-transparent"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ width: "115px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", outline: "none" }}
                >
                  <option className="py-2" value="All">All Status</option>
                  <option className="py-2" value="Pending">Pending</option>
                  <option className="py-2" value="Resolved">Resolved</option>
                  <option className="py-2" value="Closed">Closed</option>
                </Form.Select>
              </div>
            </Col>
          </Row>
        </div>

        <Card className="mb-5 shadow-sm border-0">
          <Card.Body className="p-4">
            
            {/* Desktop Table View */}
            <div className="d-none d-lg-block">
              <Table responsive className="react-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sender</th>
                  <th>Restaurant / City</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.length > 0 ? (
                  filteredInquiries.map((inq) => (
                    <tr key={inq._id}>
                      <td>{new Date(inq.date).toLocaleDateString("en-IN")}</td>
                      <td>
                        <div className="fw-bold">{inq.name}</div>
                      </td>
                      <td>
                        <div className="fw-bold">{inq.restaurant_name}</div>
                        <div className="text-muted small">{inq.city}</div>
                      </td>
                      <td>
                        {inq.status === "Pending" && <span className="border border-warning text-warning rounded-pill d-flex align-items-center justify-content-center fw-bold text-uppercase" style={uniformStyle}>Pending</span>}
                        {inq.status === "Resolved" && <span className="border border-success text-success rounded-pill d-flex align-items-center justify-content-center fw-bold text-uppercase" style={uniformStyle}>Resolved</span>}
                        {inq.status === "Closed" && <span className="border border-secondary text-secondary rounded-pill d-flex align-items-center justify-content-center fw-bold text-uppercase" style={uniformStyle}>Closed</span>}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="rounded-pill fw-bold"
                            style={uniformStyle}
                            onClick={() => { setSelectedInquiry(inq); setReplyText(""); setShowModal(true); }}
                          >
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <CsLineIcons icon="inbox" size="48" className="text-muted mb-3 opacity-25" />
                      <p className="text-muted">No inquiries found for this status.</p>
                    </td>
                  </tr>
                )}
              </tbody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="d-block d-lg-none">
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map((inq) => (
                  <Card key={`mobile-${inq._id}`} className="mb-3 border shadow-sm rounded-3">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="fw-bold mb-0">{inq.name}</h6>
                          <div className="fw-bold text-dark mt-1">{inq.restaurant_name}</div>
                          <div className="text-muted small">{inq.city}</div>
                        </div>
                        <div className="text-end">
                          <Badge
                            bg={inq.status === "Pending" ? "warning" : inq.status === "Resolved" ? "success" : "secondary"}
                            className="rounded-pill mb-2 d-flex align-items-center justify-content-center fw-bold text-uppercase"
                            text={inq.status === "Pending" ? "dark" : "white"}
                            style={uniformStyle}
                          >
                            {inq.status}
                          </Badge>
                          <div className="small fw-bold text-muted mt-2">
                            {new Date(inq.date).toLocaleDateString("en-IN")}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-top d-flex justify-content-end">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="rounded-pill fw-bold w-100"
                          onClick={() => { setSelectedInquiry(inq); setReplyText(""); setShowModal(true); }}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <div className="text-center py-5">
                  <CsLineIcons icon="inbox" size="48" className="text-muted mb-3 opacity-25" />
                  <p className="text-muted">No inquiries found for this status.</p>
                </div>
              )}
            </div>

          </Card.Body>
        </Card>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold" style={{ color: "#23b3f4" }}>Inquiry Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInquiry && (
            <Row className="g-4">
              <Col md={6}>
                <div className="d-flex flex-column gap-3">
                  <div>
                    <div className="small text-muted fw-bold text-uppercase">Sender</div>
                    <div className="fw-bold text-dark">{selectedInquiry.name}</div>
                  </div>
                  <div>
                    <div className="small text-muted fw-bold text-uppercase">Email Address</div>
                    <div className="fw-bold text-primary"><a href={`mailto:${selectedInquiry.email}`} className="text-decoration-none">{selectedInquiry.email}</a></div>
                  </div>
                  <div>
                    <div className="small text-muted fw-bold text-uppercase">Phone Number</div>
                    <div className="fw-bold text-dark">{selectedInquiry.phone}</div>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="d-flex flex-column gap-3">
                  <div>
                    <div className="small text-muted fw-bold text-uppercase">Restaurant</div>
                    <div className="fw-bold text-dark">{selectedInquiry.restaurant_name}</div>
                  </div>
                  <div>
                    <div className="small text-muted fw-bold text-uppercase">Location / City</div>
                    <div className="fw-bold text-dark">{selectedInquiry.city}</div>
                  </div>
                  <div>
                    <div className="small text-muted fw-bold text-uppercase">Current Status</div>
                    <div className="mt-1 d-flex gap-2 align-items-center">
                      <Form.Select
                        size="sm"
                        style={{ borderRadius: "8px", width: "120px" }}
                        value={selectedInquiry.status}
                        onChange={(e) => {
                          updateStatus(selectedInquiry._id, e.target.value);
                          setSelectedInquiry({...selectedInquiry, status: e.target.value});
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </Form.Select>
                    </div>
                  </div>
                </div>
              </Col>
              
              <Col xs={12}>
                <hr className="opacity-25" />
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="small text-muted fw-bold text-uppercase">Message</div>
                  <Badge bg="primary" text="light" className="px-3 py-2 rounded-pill fw-bold shadow-sm" style={{ letterSpacing: "0.5px" }}>{selectedInquiry.purpose}</Badge>
                </div>
                <div className="p-4 bg-light rounded-3 border" style={{ fontSize: "1.05rem", color: "#334155", lineHeight: "1.6" }}>
                  {selectedInquiry.message}
                </div>
              </Col>

              <Col xs={12}>
                {selectedInquiry.reply ? (
                  <>
                    <div className="small text-muted fw-bold text-uppercase mb-2 text-success">Our Reply</div>
                    <div className="p-3 rounded-3 border" style={{ backgroundColor: "#ebf8ff", borderColor: "#90cdf4" }}>
                      <pre className="mb-0" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", color: "#2c5282" }}>
                        {selectedInquiry.reply}
                      </pre>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="small text-muted fw-bold text-uppercase mb-2 text-primary">Draft a Reply</div>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Type your reply here... (An email will be sent automatically)"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                  </>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" className="rounded-pill" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {selectedInquiry && !selectedInquiry.reply && (
            <Button 
              variant="primary" 
              className="rounded-pill px-4" 
              onClick={handleReply}
              disabled={isReplying || !replyText.trim()}
            >
              {isReplying ? <Spinner size="sm" animation="border" /> : "Send Reply"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Inquiries;
