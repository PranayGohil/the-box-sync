import React, { useState, useEffect } from "react";
import { fetchAPI } from "../services/api";
import { useModal } from "../context/ModalContext";
import CalendarView from "../components/CalendarView";
import StatusBadge from "../components/StatusBadge";
import LoadingGlass from "../components/LoadingGlass";
import PageHeader from "../components/common/PageHeader";
import PrismButton from "../components/common/PrismButton";
import { formatDate } from "../utils/dateUtils";
import {
  CalendarCheck,
  Plus,
  List,
  Calendar as CalendarIcon,
  CheckCircle2,
  X,
  Clock,
} from "lucide-react";
import { Modal } from "react-bootstrap";

/* ── Inline Helpers ───────────────────────────────── */
const inpStyle = {
  width: "100%",
  height: "38px",
  background: "#f8fafc",
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  padding: "0 12px",
  fontSize: "0.855rem",
  color: "#0f172a",
  fontFamily: "var(--font-main)",
  outline: "none",
  transition: "all 0.18s ease",
};

const onF = (e) => {
  e.target.style.borderColor = "var(--accent-primary)";
  e.target.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.12)";
  e.target.style.background = "#fff";
};

const onB = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
  e.target.style.background = "#f8fafc";
};

const SiteVisitsPage = () => {
  const { showAlert } = useModal();
  const [visits, setVisits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("calendar"); // 'calendar' or 'list'

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    projectId: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    assignedTo: "",
    purpose: "Site setback & boundary verification",
    status: "scheduled",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [visitRes, projRes, userRes] = await Promise.all([
        fetchAPI("/site-visits"),
        fetchAPI("/projects?limit=100"),
        fetchAPI("/admin/users").catch(() => ({ data: [] })),
      ]);

      if (visitRes.success) setVisits(visitRes.data);
      if (projRes.success) setProjects(projRes.data);
      if (userRes.data) setUsers(userRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVisit = async (e) => {
    e.preventDefault();
    try {
      await fetchAPI("/site-visits", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      showAlert({
        title: "Success",
        message: "Site inspection visit scheduled successfully!",
        type: "success",
      });
      loadData();
    } catch (err) {
      showAlert({
        title: "Schedule Error",
        message: err.message,
        type: "error",
      });
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await fetchAPI(`/site-visits/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      loadData();
    } catch (err) {
      showAlert({ title: "Update Error", message: err.message, type: "error" });
    }
  };

  if (loading)
    return <LoadingGlass message="Loading Site Visit Schedules..." />;

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Site Visit Schedule"
        subtitle="Track site inspections and stage validations across projects"
        icon={CalendarCheck}
      >
        <div
          style={{
            display: "flex",
            background: "#fff",
            border: "1.5px solid #e2e8f0",
            borderRadius: "9px",
            padding: "3px",
          }}
        >
          <button
            onClick={() => setViewMode("calendar")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "0.35rem 0.85rem",
              borderRadius: "7px",
              border: "none",
              background:
                viewMode === "calendar"
                  ? "var(--accent-primary)"
                  : "transparent",
              color: viewMode === "calendar" ? "#fff" : "var(--text-secondary)",
              fontSize: "0.8rem",
              fontWeight: viewMode === "calendar" ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <CalendarIcon size={14} /> Calendar
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "0.35rem 0.85rem",
              borderRadius: "7px",
              border: "none",
              background:
                viewMode === "list" ? "var(--accent-primary)" : "transparent",
              color: viewMode === "list" ? "#fff" : "var(--text-secondary)",
              fontSize: "0.8rem",
              fontWeight: viewMode === "list" ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <List size={14} /> List
          </button>
        </div>
        <PrismButton
          variant="primary"
          icon={Plus}
          onClick={() => setShowModal(true)}
        >
          Schedule Visit
        </PrismButton>
      </PageHeader>

      {viewMode === "calendar" ? (
        <CalendarView visits={visits} />
      ) : (
        <div className="responsive-card-view">
          <div
            className="table-desktop"
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "2px solid #e2e8f0",
                  }}
                >
                  {[
                    "Scheduled Date",
                    "Case & Project",
                    "Inspection Purpose",
                    "Assigned Inspector",
                    "Status",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.85rem 1rem",
                        textAlign: "left",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "3rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      No site visits scheduled.
                    </td>
                  </tr>
                ) : (
                  visits.map((v, idx) => (
                    <tr
                      key={v._id}
                      style={{
                        borderBottom:
                          idx < visits.length - 1
                            ? "1px solid #f1f5f9"
                            : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontWeight: 700,
                          color: "var(--accent-primary)",
                          fontSize: "0.855rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(v.scheduledDate)}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {v.projectId?.projectName || "N/A"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Case: {v.projectId?.caseNo}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {v.purpose}
                      </td>
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontSize: "0.845rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {v.assignedTo?.name || "Staff Engineer"}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <StatusBadge status={v.status} />
                      </td>
                      <td
                        style={{ padding: "0.85rem 1rem", textAlign: "right" }}
                      >
                        {v.status === "scheduled" && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "4px",
                            }}
                          >
                            <button
                              onClick={() =>
                                handleUpdateStatus(v._id, "completed")
                              }
                              style={{
                                background: "#dcfce7",
                                border: "1px solid #a7f3d0",
                                borderRadius: "6px",
                                padding: "4px 10px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "#16a34a",
                                cursor: "pointer",
                              }}
                            >
                              Mark Complete
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(v._id, "missed")
                              }
                              style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                borderRadius: "6px",
                                padding: "4px 10px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "#ef4444",
                                cursor: "pointer",
                              }}
                            >
                              Missed
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="cards-mobile">
            {visits.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "var(--text-muted)",
                  background: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                No site visits scheduled.
              </div>
            ) : (
              visits.map((v) => (
                <div
                  key={v._id}
                  className="app-card"
                  style={{ padding: "0.95rem 1rem" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "var(--accent-primary)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {formatDate(v.scheduledDate)}
                    </span>
                    <StatusBadge status={v.status} />
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.92rem",
                      color: "#0f172a",
                      margin: "3px 0",
                    }}
                  >
                    {v.projectId?.projectName || "N/A"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Case: {v.projectId?.caseNo || "N/A"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <strong>Purpose:</strong> {v.purpose}
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <strong>Inspector:</strong>{" "}
                    {v.assignedTo?.name || "Staff Engineer"}
                  </div>
                  {v.status === "scheduled" && (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginTop: "0.5rem",
                        paddingTop: "0.5rem",
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <button
                        onClick={() => handleUpdateStatus(v._id, "completed")}
                        style={{
                          flex: 1,
                          background: "#dcfce7",
                          border: "1px solid #a7f3d0",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#16a34a",
                          cursor: "pointer",
                        }}
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(v._id, "missed")}
                        style={{
                          flex: 1,
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                      >
                        Missed
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Schedule Site Inspection Visit
            </h3>
            <button
              onClick={() => setShowModal(false)}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreateVisit}>
            <div style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "0.35rem",
                  }}
                >
                  Select Project Case
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectId: e.target.value })
                  }
                  style={{ ...inpStyle, cursor: "pointer" }}
                  onFocus={onF}
                  onBlur={onB}
                  required
                >
                  <option value="">-- Select Project Case --</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      Case {p.caseNo} — {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row g-2" style={{ marginBottom: "1rem" }}>
                <div className="col-12 col-md-6">
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Visit Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDate: e.target.value,
                      })
                    }
                    style={inpStyle}
                    onFocus={onF}
                    onBlur={onB}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Assigned Inspector / Staff
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTo: e.target.value })
                    }
                    style={{ ...inpStyle, cursor: "pointer" }}
                    onFocus={onF}
                    onBlur={onB}
                  >
                    <option value="">-- Unassigned --</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "0.35rem",
                  }}
                >
                  Visit Purpose / Objective
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  style={inpStyle}
                  onFocus={onF}
                  onBlur={onB}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "0.35rem",
                  }}
                >
                  Notes / Instructions for Inspector
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  style={{
                    ...inpStyle,
                    height: "auto",
                    padding: "0.5rem 0.8rem",
                    resize: "vertical",
                  }}
                  onFocus={onF}
                  onBlur={onB}
                />
              </div>
            </div>

            <div className="form-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="prism-btn prism-btn-primary prism-btn-md"
              >
                Schedule Visit
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default SiteVisitsPage;
