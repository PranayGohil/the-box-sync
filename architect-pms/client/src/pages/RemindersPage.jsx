import React, { useState, useEffect } from "react";
import { fetchAPI } from "../services/api";
import { useModal } from "../context/ModalContext";
import StatusBadge from "../components/StatusBadge";
import LoadingGlass from "../components/LoadingGlass";
import PageHeader from "../components/common/PageHeader";
import PrismButton from "../components/common/PrismButton";
import { formatDate } from "../utils/dateUtils";
import {
  Bell,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";

const RemindersPage = () => {
  const { showAlert } = useModal();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");

  const loadReminders = async () => {
    setLoading(true);
    try {
      let url = "/reminders";
      if (statusFilter !== "all") url += `?status=${statusFilter}`;
      const res = await fetchAPI(url);
      if (res.success) setReminders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await fetchAPI(`/reminders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      loadReminders();
    } catch (err) {
      showAlert({ title: "Error", message: err.message, type: "error" });
    }
  };

  const handleRefreshScanner = async () => {
    try {
      const res = await fetchAPI("/reminders/refresh", { method: "POST" });
      showAlert({
        title: "Scan Completed",
        message: `Automated reminder scan complete! Found ${res.newRemindersCount} new alert(s).`,
        type: "success",
      });
      loadReminders();
    } catch (err) {
      showAlert({ title: "Scan Error", message: err.message, type: "error" });
    }
  };

  if (loading) return <LoadingGlass message="Scanning Reminders Engine..." />;

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Automated Reminders"
        subtitle="Alerts for license expiries, permit deadlines, and site visits"
        icon={Bell}
        iconColor="#f59e0b"
        iconBg="#fffbeb"
      >
        <PrismButton
          variant="secondary"
          icon={RotateCcw}
          onClick={handleRefreshScanner}
        >
          Scan &amp; Refresh Engine
        </PrismButton>
      </PageHeader>

      {/* Filter Tabs */}
      <div className="reminders-filter-bar">
        {["pending", "done", "snoozed", "all"].map((st) => {
          const isActive = statusFilter === st;
          return (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.45rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: isActive ? "var(--accent-primary)" : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.84rem",
                textTransform: "capitalize",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {st}
            </button>
          );
        })}
      </div>

      {/* Reminders List */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "1.25rem",
          boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
        }}
      >
        {reminders.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              color: "var(--text-muted)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <CheckCircle2 size={28} color="#10b981" />
            </div>
            <h3
              style={{
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--text-primary)",
                margin: "0 0 0.4rem",
              }}
            >
              All Clear! No Pending Reminders
            </h3>
            <p style={{ fontSize: "0.875rem", margin: 0 }}>
              All professional licenses and scheduled site visits are currently
              up to date.
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
          >
            {reminders.map((r) => {
              const isOverdue = new Date(r.dueDate) < new Date();
              return (
                <div
                  key={r._id}
                  className={`reminder-card ${isOverdue ? "overdue" : "normal"}`}
                >
                  {/* Top Header: Icon + Title + Status Badge */}
                  <div className="reminder-card-header">
                    <div className="reminder-card-left">
                      <div
                        className="reminder-icon-box"
                        style={{
                          background:
                            r.type === "license_expiry" ? "#fef2f2" : "#fffbeb",
                          border: `1px solid ${r.type === "license_expiry" ? "#fecaca" : "#fde68a"}`,
                          color:
                            r.type === "license_expiry" ? "#ef4444" : "#f59e0b",
                        }}
                      >
                        {r.type === "license_expiry" ? (
                          <ShieldAlert size={20} />
                        ) : (
                          <Calendar size={20} />
                        )}
                      </div>
                      <div className="reminder-card-content">
                        <div className="reminder-status-mobile">
                          <StatusBadge status={r.status} />
                        </div>
                        <div className="reminder-card-title">{r.title}</div>
                      </div>
                    </div>
                    <div className="reminder-status-desktop">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>

                  {/* Body: Description */}
                  {r.description && (
                    <div className="reminder-card-body">{r.description}</div>
                  )}

                  {/* Footer Row: Due Date + Actions */}
                  <div className="reminder-card-footer">
                    <div
                      className="reminder-due-pill"
                      style={{
                        color: isOverdue ? "#ef4444" : "var(--accent-primary)",
                      }}
                    >
                      Due Date: {formatDate(r.dueDate)}{" "}
                      {isOverdue && "(OVERDUE)"}
                    </div>

                    {r.status === "pending" && (
                      <div className="reminder-actions">
                        <button
                          onClick={() => handleUpdateStatus(r._id, "done")}
                          className="btn-action-done"
                        >
                          <CheckCircle2 size={13} /> Mark Done
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(r._id, "snoozed")}
                          className="btn-action-snooze"
                        >
                          <Clock size={13} /> Snooze
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RemindersPage;
