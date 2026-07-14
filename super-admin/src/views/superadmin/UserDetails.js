import React, { useEffect, useState, forwardRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";
import { Row, Col, Card, Spinner, Button, Badge, Table, Modal, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import HtmlHead from "components/html-head/HtmlHead";
import BreadcrumbList from "components/breadcrumb-list/BreadcrumbList";
import CsLineIcons from "cs-line-icons/CsLineIcons";
import { toast } from "react-toastify";

const UserDetails = () => {
  const { id } = useParams();
  const history = useHistory();
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [queries, setQueries] = useState([]);

  // Modals state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedSub4unblock, setselectedSub4unblock] = useState(null);
  const [selectedSubName4unblock, setselectedSubName4unblock] = useState(null);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [showExpandModal, setShowExpandModal] = useState(false);
  const [newEndDate, setNewEndDate] = useState(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveForm, setApproveForm] = useState({
    price: "",
    discount: "",
    paymentMode: "",
    paymentDetails: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeForm, setSubscribeForm] = useState({
    planId: "",
    planName: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    price: "",
    discount: "",
    paymentMode: "",
    paymentDetails: ""
  });



  const title = user ? `${user.name} Profile` : "Restaurant Profile";
  const description = "View and manage restaurant details, subscriptions, and support queries.";
  const breadcrumbs = [
    { to: "", text: "Home" },
    { to: "dashboard", text: "Dashboard" },
    { to: `userdetails/${id}`, text: "Restaurant Profile" },
  ];

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/subscription/get/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setUser(response.data.user);
      setSubscriptions(response.data.subscriptions);

      const plansRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/subscription/get-plans`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setAllPlans(plansRes.data.data || []);

      const queriesRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/customerquery/query-user-id/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setQueries(queriesRes.data || []);
    } catch (error) {
      if (error.response?.status === 401) history.push("/login");
      console.error("Failed to fetch user details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const handleToggleApproval = async (isApproving) => {
    try {
      setIsSubmitting(true);
      let payload = { isApproved: isApproving };
      
      if (isApproving) {
        payload = { ...payload, ...approveForm };
      } else {
        payload.revokeReason = revokeReason;
      }
      
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/superadmin/toggle-approval/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success(`Restaurant ${isApproving ? "approved" : "revoked"} successfully`);
      
      if (isApproving) {
        setShowApproveModal(false);
        setApproveForm({ price: "", discount: "", paymentMode: "", paymentDetails: "" });
      } else {
        setShowRevokeModal(false);
        setRevokeReason("");
      }
      
      fetchUserData();
    } catch (err) {
      console.error("Failed to toggle approval", err);
      toast.error(err.response?.data?.message || "Failed to update approval status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSubscribe = (sub) => {
    setSubscribeForm({
      planId: sub._id,
      planName: sub.plan_name,
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      price: sub.plan_price || "",
      discount: "",
      paymentMode: "",
      paymentDetails: ""
    });
    setShowSubscribeModal(true);
  };

  const handleSubscribeSubmit = async () => {
    try {
      setIsSubmitting(true);
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/subscription/manual-subscribe`,
        {
          userId: id,
          ...subscribeForm
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success(`Successfully subscribed to ${subscribeForm.planName}`);
      setShowSubscribeModal(false);
      fetchUserData();
    } catch (err) {
      console.error("Failed to subscribe", err);
      toast.error(err.response?.data?.message || "Failed to create subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectSub = (subId) => {
    setSelectedSubs((prev) =>
      prev.includes(subId) ? prev.filter((sId) => sId !== subId) : [...prev, subId]
    );
  };

  const confirmBlockPlans = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/subscription/block`,
        { subscriptionIds: selectedSubs },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setShowBlockModal(false);
      setSelectedSubs([]);
      fetchUserData();
      toast.success("Plans blocked successfully");
    } catch (error) {
      toast.error("Failed to block plans");
    }
  };

  const confirmUnblockPlans = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/subscription/unblock`,
        { subscriptionId: selectedSub4unblock },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setShowUnblockModal(false);
      setselectedSub4unblock(null);
      fetchUserData();
      toast.success("Plan unblocked successfully");
    } catch (error) {
      toast.error("Failed to unblock plan");
    }
  };

  const confirmExpandPlans = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/subscription/expand`,
        {
          subscriptionIds: selectedSubs,
          newEndDate: newEndDate?.toISOString().split("T")[0],
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setShowExpandModal(false);
      setSelectedSubs([]);
      setNewEndDate(null);
      fetchUserData();
      toast.success("Plans extended successfully");
    } catch (error) {
      toast.error("Failed to extend plans");
    }
  };

  const handleImpersonate = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/superadmin/impersonate/${id}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.data.token) {
        const managerUrl = `${process.env.REACT_APP_URL}/login?impersonate_token=${response.data.token}`;
        window.open(managerUrl, "_blank");
      }
    } catch (error) {
      toast.error("Failed to impersonate user.");
    }
  };

  const handleCompleteQuery = async (queryId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/customerquery/complete-query`,
        { queryId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      fetchUserData();
      toast.success("Query marked as resolved");
    } catch (err) {
      toast.error("Failed to mark as completed.");
    }
  };

  const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <div className="input-group" onClick={onClick} ref={ref} style={{ cursor: "pointer" }}>
      <input type="text" className="form-control" value={value} readOnly placeholder="Select a date" style={{ cursor: "pointer" }} />
      <span className="input-group-text"><CsLineIcons icon="calendar" /></span>
    </div>
  ));

  const CORE_PLAN_NAMES = ["street food", "qsr", "dine in", "cloud kitchen", "chain"];
  const corePlans = subscriptions.filter(sub => sub.plan_name && CORE_PLAN_NAMES.some(cp => sub.plan_name.toLowerCase().includes(cp)));
  
  const activeCorePlan = corePlans.find(sub => sub.status === "active") || corePlans[0];
  const fullActiveCorePlan = activeCorePlan ? allPlans.find(p => p.plan_name === activeCorePlan.plan_name) : null;
  const activeCorePlanId = fullActiveCorePlan ? fullActiveCorePlan._id : null;

  const subscribedAddOns = subscriptions.filter(sub => sub.plan_name && !CORE_PLAN_NAMES.some(cp => sub.plan_name.toLowerCase().includes(cp)));
  const availableAddOns = allPlans.filter(plan => 
    plan.is_addon &&
    !CORE_PLAN_NAMES.some(cp => plan.plan_name.toLowerCase().includes(cp)) && 
    (plan.compatible_with === activeCorePlanId || !plan.compatible_with) &&
    !subscribedAddOns.some(sub => sub.plan_name === plan.plan_name)
  );

  const addOns = [
    ...subscribedAddOns.map(sub => ({ ...sub, displayPrice: "Included" })),
    ...availableAddOns.map(plan => ({
      _id: plan._id,
      plan_name: plan.plan_name,
      plan_price: plan.plan_price,
      end_date: null,
      status: "not subscribed",
      is_unsubscribed: true
    }))
  ];
  

  const uniformStyle = { width: "110px", height: "32px", display: "flex", justifyContent: "center", alignItems: "center", margin: 0, borderRadius: "50rem", boxSizing: "border-box", padding: 0, fontSize: "0.85rem" };

  const renderSubscriptionRow = (sub) => (
    <tr key={sub._id}>
      <td style={{ width: "40px" }}>
        <Form.Check type="checkbox" disabled={sub.is_unsubscribed} checked={selectedSubs.includes(sub._id)} onChange={() => toggleSelectSub(sub._id)} />
      </td>
      <td className="fw-bold">{sub.plan_name}</td>
      <td className={sub.displayPrice === "Included" ? "text-success fw-bold text-uppercase" : ""} style={sub.displayPrice === "Included" ? { letterSpacing: "1px", fontSize: "0.85rem" } : {}}>{sub.displayPrice || `₹${sub.plan_price}`}</td>
      <td>{sub.end_date ? new Date(sub.end_date).toLocaleDateString("en-IN") : "-"}</td>
      <td>
        <div className="d-flex align-items-center gap-2">
          {sub.status === "active" && <span className="border border-success text-success rounded-pill fw-bold text-uppercase" style={uniformStyle}>Active</span>}
          {sub.status === "blocked" && <span className="border border-danger text-danger rounded-pill fw-bold text-uppercase" style={uniformStyle}>Blocked</span>}
          {sub.status === "not subscribed" && (
            <button 
              type="button" 
              className="btn btn-outline-primary rounded-pill fw-bold text-uppercase" 
              style={{ ...uniformStyle, padding: 0 }}
              onClick={() => handleOpenSubscribe(sub)}
            >
              Subscribe
            </button>
          )}
          {sub.status !== "active" && sub.status !== "blocked" && sub.status !== "not subscribed" && <span className="border border-warning text-warning rounded-pill fw-bold text-uppercase" style={uniformStyle}>{sub.status}</span>}
          
          {sub.status === "blocked" && (
            <button type="button" className="btn btn-outline-primary rounded-pill fw-bold" style={{ width: "32px", height: "32px", display: "flex", justifyContent: "center", alignItems: "center", padding: 0 }} onClick={() => { setselectedSub4unblock(sub._id); setselectedSubName4unblock(sub.plan_name); setShowUnblockModal(true); }}>
              <CsLineIcons icon="unlock" size="14" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  const renderMobileSubscriptionCard = (sub) => (
    <Card key={`mobile-${sub._id}`} className="mb-3 border shadow-sm">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex gap-2">
            <Form.Check type="checkbox" disabled={sub.is_unsubscribed} checked={selectedSubs.includes(sub._id)} onChange={() => toggleSelectSub(sub._id)} />
            <div>
              <h6 className="fw-bold mb-0">{sub.plan_name}</h6>
              <div className="small text-muted mt-1">{sub.end_date ? `Valid till ${new Date(sub.end_date).toLocaleDateString("en-IN")}` : "-"}</div>
            </div>
          </div>
          <div className={sub.displayPrice === "Included" ? "text-success fw-bold text-uppercase" : "fw-bold"} style={sub.displayPrice === "Included" ? { letterSpacing: "1px", fontSize: "0.85rem" } : {}}>
            {sub.displayPrice || `₹${sub.plan_price}`}
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
          <div>
            {sub.status === "active" && <span className="border border-success text-success rounded-pill fw-bold text-uppercase" style={{...uniformStyle, width: "90px", height: "26px", fontSize: "0.75rem"}}>Active</span>}
            {sub.status === "blocked" && <span className="border border-danger text-danger rounded-pill fw-bold text-uppercase" style={{...uniformStyle, width: "90px", height: "26px", fontSize: "0.75rem"}}>Blocked</span>}
            {sub.status === "not subscribed" && (
              <button 
                type="button" 
                className="btn btn-outline-primary rounded-pill fw-bold text-uppercase" 
                style={{ ...uniformStyle, width: "90px", height: "26px", fontSize: "0.75rem", padding: 0 }}
                onClick={() => handleOpenSubscribe(sub)}
              >
                Subscribe
              </button>
            )}
            {sub.status !== "active" && sub.status !== "blocked" && sub.status !== "not subscribed" && <span className="border border-warning text-warning rounded-pill fw-bold text-uppercase" style={{...uniformStyle, width: "90px", height: "26px", fontSize: "0.75rem"}}>{sub.status}</span>}
          </div>
          {sub.status === "blocked" && (
            <button type="button" className="btn btn-outline-primary rounded-pill fw-bold" style={{ width: "26px", height: "26px", display: "flex", justifyContent: "center", alignItems: "center", padding: 0 }} onClick={() => { setselectedSub4unblock(sub._id); setselectedSubName4unblock(sub.plan_name); setShowUnblockModal(true); }}>
              <CsLineIcons icon="unlock" size="12" />
            </button>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  if (loading && !user) {
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
              <Button variant="link" className="text-muted p-0 text-decoration-none mb-2 d-flex align-items-center gap-2" onClick={() => history.goBack()}>
                <CsLineIcons icon="arrow-left" size="14" /> Back to Directory
              </Button>
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: "#23b3f4" }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            {user && (
              <Col xs="auto" className="d-flex gap-2 align-items-center">
                {user.isApproved ? (
                  <Button variant="outline-danger" className="rounded-pill fw-bold shadow-sm" onClick={() => setShowRevokeModal(true)}>
                    <CsLineIcons icon="close" size="14" className="me-2" /> Revoke Account
                  </Button>
                ) : (
                  <Button variant="success" className="rounded-pill fw-bold shadow-sm" onClick={() => setShowApproveModal(true)}>
                    <CsLineIcons icon="check" size="14" className="me-2" /> Approve Account
                  </Button>
                )}
              </Col>
            )}
          </Row>
        </div>

        <Row className="g-4 mb-5">
          {/* User Info Card */}
          <Col lg="4">
            <Card className="h-100 shadow border-0" style={{ borderRadius: "12px", borderTop: "4px solid #3b82f6" }}>
              <Card.Body className="p-4 p-xl-5">
                <div className="text-center mb-4">
                  {user?.logo ? (
                    <img 
                      src={user.logo.startsWith("http") ? user.logo : `${process.env.REACT_APP_API_URL}${user.logo}`} 
                      alt={user.name} 
                      className="rounded-circle mx-auto mb-3 shadow-sm bg-white p-1" 
                      style={{ width: "90px", height: "90px", objectFit: "contain" }} 
                    />
                  ) : (
                    <div className="rounded-circle text-white d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm" style={{ width: "90px", height: "90px", fontSize: "36px", fontWeight: 700, background: "linear-gradient(135deg, #3b82f6 0%, #7444FD 100%)" }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <h4 className="fw-bold mb-1" style={{ color: "#1e293b" }}>{user?.name}</h4>
                  <div className="d-inline-flex align-items-center bg-light border px-3 py-1 mt-2 rounded-pill fw-bold text-muted shadow-sm" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
                    <CsLineIcons icon="shield" size="14" className="me-2 text-primary" /> CODE: {user?.restaurant_code}
                  </div>
                </div>
                <hr className="opacity-10 my-4" />
                <div className="d-flex flex-column gap-4 mt-2">
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", backgroundColor: "rgba(59, 130, 246, 0.1)" }}><CsLineIcons icon="email" size="18" /></div>
                    <div>
                      <div className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: "0.5px", fontSize: "0.7rem" }}>Email Address</div>
                      <div className="fw-bold" style={{ color: "#475569" }}>{user?.email}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", backgroundColor: "rgba(16, 185, 129, 0.1)" }}><CsLineIcons icon="phone" size="18" /></div>
                    <div>
                      <div className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: "0.5px", fontSize: "0.7rem" }}>Mobile Number</div>
                      <div className="fw-bold" style={{ color: "#475569" }}>{user?.mobile}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", backgroundColor: "rgba(245, 158, 11, 0.1)" }}><CsLineIcons icon="pin" size="18" /></div>
                    <div>
                      <div className="small text-muted mb-1 text-uppercase fw-bold" style={{ letterSpacing: "1px" }}>Location</div>
                      <div className="fw-bold" style={{ color: "#475569" }}>{[user?.address, user?.city, user?.state].filter(Boolean).join(", ") || "N/A"}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", backgroundColor: "rgba(6, 182, 212, 0.1)" }}><CsLineIcons icon="calendar" size="18" /></div>
                    <div>
                      <div className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: "0.5px", fontSize: "0.7rem" }}>Registered Since</div>
                      <div className="fw-bold" style={{ color: "#475569" }}>{user?.createdAt && new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric", day: "numeric" })}</div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Subscriptions Card */}
          <Col lg="8">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3 gap-md-0">
                  <h5 className="fw-bold mb-0">Active Subscriptions</h5>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-warning rounded-pill fw-bold" style={{ height: "32px", display: "flex", alignItems: "center", fontSize: "0.85rem" }} disabled={!selectedSubs.length} onClick={() => setShowBlockModal(true)}>
                      <CsLineIcons icon="lock-off" size="14" className="me-1" /> Block Selected
                    </button>
                    <button type="button" className="btn btn-outline-info rounded-pill fw-bold" style={{ height: "32px", display: "flex", alignItems: "center", fontSize: "0.85rem" }} disabled={!selectedSubs.length} onClick={() => setShowExpandModal(true)}>
                      <CsLineIcons icon="expand" size="14" className="me-1" /> Extend
                    </button>
                  </div>
                </div>

                {/* Main Core Plan Highlight */}
                {activeCorePlan ? (
                  <div className="d-flex justify-content-between align-items-center rounded p-3 mb-4" style={{ backgroundColor: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                        <CsLineIcons icon="crown" size="20" />
                      </div>
                      <div>
                        <div className="small text-primary fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>Current Core Plan</div>
                        <h5 className="fw-bold mb-0 text-primary">{activeCorePlan.plan_name}</h5>
                      </div>
                    </div>
                    <span className={`border rounded-pill fw-bold text-uppercase ${activeCorePlan.status === "active" ? "border-success text-success" : "border-danger text-danger"}`} style={uniformStyle}>
                      {activeCorePlan.status}
                    </span>
                  </div>
                ) : user?.is_street_food ? (
                  <div className="d-flex justify-content-between align-items-center rounded p-3 mb-4" style={{ backgroundColor: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                        <CsLineIcons icon="crown" size="20" />
                      </div>
                      <div>
                        <div className="small text-primary fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>Current Core Plan</div>
                        <h5 className="fw-bold mb-0 text-primary">Street Food</h5>
                      </div>
                    </div>
                    <span className="border border-success text-success rounded-pill fw-bold text-uppercase" style={uniformStyle}>
                      ACTIVE
                    </span>
                  </div>
                ) : null}

                <div className="d-none d-lg-block">
                  {addOns.length > 0 && (
                    <h6 className="text-muted fw-bold mb-3 text-uppercase" style={{ letterSpacing: "1px", fontSize: "0.8rem" }}>Add-on Features</h6>
                  )}
                  <Table responsive className="react-table align-middle">
                    <thead>
                      <tr>
                        <th style={{ width: "40px" }}>
                          <Form.Check type="checkbox" onChange={(e) => setSelectedSubs(e.target.checked ? subscriptions.map((s) => s._id) : [])} checked={selectedSubs.length === subscriptions.length && subscriptions.length > 0} />
                        </th>
                        <th>Plan Name</th>
                        <th>Price</th>
                        <th>Valid Until</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>

                      
                      {/* ADD ONS SECTION */}
                      {addOns.map(renderSubscriptionRow)}

                      {subscriptions.length === 0 && (
                        <tr><td colSpan="5" className="text-center text-muted py-4">No subscriptions found</td></tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                
                <div className="d-block d-lg-none">


                  {addOns.length > 0 && <h6 className="text-muted fw-bold mt-4 mb-3 text-uppercase" style={{ letterSpacing: "1px", fontSize: "0.8rem" }}>Add-on Features</h6>}
                  {addOns.map(renderMobileSubscriptionCard)}

                  {subscriptions.length === 0 && (
                    <div className="text-center text-muted py-4 border rounded bg-light">No subscriptions found</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Customer Queries Card */}
          <Col lg="12">
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4">Support Inquiries</h5>
                {queries.length === 0 ? (
                  <div className="text-center py-4 text-muted">No support queries found for this user.</div>
                ) : (
                  <Table responsive className="react-table">
                    <thead>
                      <tr>
                        <th>Inquiry Message</th>
                        <th>Category</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queries.map((q) => (
                        <tr key={q._id}>
                          <td style={{ maxWidth: "400px" }}>{q.message}</td>
                          <td><Badge bg="light" text="dark" className="border">{q.purpose}</Badge></td>
                          <td className="small text-muted">{new Date(q.created_at).toLocaleString()}</td>
                          <td>
                            {q.completed_at ? (
                              <Badge bg="success" className="rounded-pill px-3 py-2 bg-opacity-25 text-success"><CsLineIcons icon="check-circle" size="12" className="me-1" /> Resolved</Badge>
                            ) : (
                              <Badge bg="warning" text="dark" className="rounded-pill px-3 py-2 bg-opacity-25 text-warning"><CsLineIcons icon="clock" size="12" className="me-1" /> Pending</Badge>
                            )}
                          </td>
                          <td>
                            {!q.completed_at && (
                              <Button variant="outline-success" size="sm" className="rounded-pill fw-bold" onClick={() => handleCompleteQuery(q._id)}>
                                Mark Resolved
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modals */}
        <Modal show={showBlockModal} onHide={() => setShowBlockModal(false)} centered>
          <Modal.Header closeButton><Modal.Title className="fw-bold">Block Subscriptions</Modal.Title></Modal.Header>
          <Modal.Body>Are you sure you want to block <strong>{selectedSubs.length}</strong> plan(s)? This will instantly restrict access for the restaurant.</Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowBlockModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmBlockPlans}>Block Now</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showUnblockModal} onHide={() => setShowUnblockModal(false)} centered>
          <Modal.Header closeButton><Modal.Title className="fw-bold">Restore Access</Modal.Title></Modal.Header>
          <Modal.Body>Confirm unblocking <strong>{selectedSubName4unblock}</strong>? Access will be restored immediately.</Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowUnblockModal(false)}>Cancel</Button>
            <Button variant="success" onClick={confirmUnblockPlans}>Confirm Unblock</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showExpandModal} onHide={() => setShowExpandModal(false)} centered>
          <Modal.Header closeButton><Modal.Title className="fw-bold">Extend Plans</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small text-muted">Select New Expiry Date</Form.Label>
              <DatePicker selected={newEndDate} onChange={(date) => setNewEndDate(date)} minDate={new Date()} dateFormat="yyyy-MM-dd" customInput={<CustomDateInput />} />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-center">
              <Button variant="outline-secondary" size="sm" className="rounded-pill" onClick={() => setNewEndDate(new Date(Date.now() + 86400000))}>+1 Day</Button>
              <Button variant="outline-secondary" size="sm" className="rounded-pill" onClick={() => setNewEndDate(new Date(Date.now() + 7 * 86400000))}>+1 Week</Button>
              <Button variant="outline-secondary" size="sm" className="rounded-pill" onClick={() => { let d = new Date(); d.setMonth(d.getMonth() + 1); setNewEndDate(d); }}>+1 Month</Button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowExpandModal(false)}>Cancel</Button>
            <Button variant="info" className="text-white" onClick={confirmExpandPlans} disabled={!newEndDate}>Apply Extension</Button>
          </Modal.Footer>
        </Modal>
      </div>
      {/* Approve / Offline Payment Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered size="md">
        <Modal.Header closeButton className="border-bottom pb-3">
          <Modal.Title className="fw-bold">Approve Restaurant</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4 pb-2">
          <div className="mb-4">
            <h6 className="fw-bold mb-1">Offline Payment Details</h6>
            <div className="text-muted small">Record payment details to activate this account.</div>
          </div>
          
          <Row className="g-3">
            <Col xs={6}>
              <Form.Group>
                <Form.Label className="fw-bold small">Amount Paid (₹)</Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="e.g. 5000" 
                  value={approveForm.price} 
                  onChange={(e) => setApproveForm({...approveForm, price: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group>
                <Form.Label className="fw-bold small">Discount Given (₹)</Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="e.g. 500" 
                  value={approveForm.discount} 
                  onChange={(e) => setApproveForm({...approveForm, discount: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-bold small">Payment Mode</Form.Label>
                <Form.Select 
                  value={approveForm.paymentMode} 
                  onChange={(e) => setApproveForm({...approveForm, paymentMode: e.target.value})}
                >
                  <option value="">Select Payment Mode</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-bold small">Payment Details / Reference</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  placeholder="Enter transaction ID, notes, or reference number" 
                  value={approveForm.paymentDetails} 
                  onChange={(e) => setApproveForm({...approveForm, paymentDetails: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-3">
          <Button variant="outline-secondary" className="rounded-pill fw-bold" onClick={() => setShowApproveModal(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            className="rounded-pill fw-bold px-4" 
            onClick={() => handleToggleApproval(true)}
            disabled={!approveForm.price || !approveForm.paymentMode || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Approving...
              </>
            ) : "Confirm Approval"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Revoke Modal */}
      <Modal show={showRevokeModal} onHide={() => setShowRevokeModal(false)} centered size="md">
        <Modal.Header closeButton className="border-bottom pb-3">
          <Modal.Title className="fw-bold text-danger">Revoke Account</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4 pb-2">
          <div className="mb-4">
            <h6 className="fw-bold mb-1">Reason for Revocation</h6>
            <div className="text-muted small">Please provide a reason. This will be sent to the restaurant via email.</div>
          </div>
          
          <Form.Group>
            <Form.Control 
              as="textarea" 
              rows={3} 
              placeholder="e.g., Payment failed, violation of terms, etc." 
              value={revokeReason} 
              onChange={(e) => setRevokeReason(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-3">
          <Button variant="outline-secondary" className="rounded-pill fw-bold" onClick={() => setShowRevokeModal(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            className="rounded-pill fw-bold px-4" 
            onClick={() => handleToggleApproval(false)}
            disabled={!revokeReason.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Revoking...
              </>
            ) : "Confirm Revocation"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Subscribe Modal */}
      <Modal show={showSubscribeModal} onHide={() => setShowSubscribeModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-bottom pb-3">
          <Modal.Title className="fw-bold text-primary">Subscribe to {subscribeForm.planName}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4 pb-2">
          <Row className="g-4 mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small">Active On Date *</Form.Label>
                <Form.Control 
                  type="date"
                  value={subscribeForm.startDate} 
                  onChange={(e) => setSubscribeForm({...subscribeForm, startDate: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small">Expire Date *</Form.Label>
                <Form.Control 
                  type="date"
                  value={subscribeForm.endDate} 
                  onChange={(e) => setSubscribeForm({...subscribeForm, endDate: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small">Price (₹) *</Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="0" 
                  value={subscribeForm.price} 
                  onChange={(e) => setSubscribeForm({...subscribeForm, price: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small">Discount / Offer Details</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g., 20% off, Free for 3 months" 
                  value={subscribeForm.discount} 
                  onChange={(e) => setSubscribeForm({...subscribeForm, discount: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-4 mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-bold small">Payment Mode *</Form.Label>
                <Form.Select 
                  value={subscribeForm.paymentMode} 
                  onChange={(e) => setSubscribeForm({...subscribeForm, paymentMode: e.target.value})}
                >
                  <option value="">Select Payment Mode</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-bold small">Payment Details / Reference</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  placeholder="Enter transaction ID, notes, or reference number" 
                  value={subscribeForm.paymentDetails} 
                  onChange={(e) => setSubscribeForm({...subscribeForm, paymentDetails: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-3">
          <Button variant="outline-secondary" className="rounded-pill fw-bold" onClick={() => setShowSubscribeModal(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            className="rounded-pill fw-bold px-4" 
            onClick={handleSubscribeSubmit}
            disabled={!subscribeForm.price || !subscribeForm.paymentMode || !subscribeForm.startDate || !subscribeForm.endDate || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Subscribing...
              </>
            ) : "Confirm Subscription"}
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  );
};

export default UserDetails;
