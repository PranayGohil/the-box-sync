import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Building2,
  Clock,
  User,
  CheckCircle2,
} from "lucide-react";
import { Modal } from "react-bootstrap";
import StatusBadge from "./StatusBadge";

const CalendarView = ({ visits = [], onSelectVisit }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayInfo, setSelectedDayInfo] = useState(null); // { day, visits }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const daysArray = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const getVisitsForDay = (day) => {
    if (!day) return [];
    return visits.filter((v) => {
      const vDate = new Date(v.scheduledDate);
      return (
        vDate.getDate() === day &&
        vDate.getMonth() === month &&
        vDate.getFullYear() === year
      );
    });
  };

  const handleDayClick = (day, dayVisits) => {
    if (!day) return;
    if (dayVisits && dayVisits.length > 0) {
      setSelectedDayInfo({ day, visits: dayVisits });
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "clamp(0.85rem, 3vw, 1.5rem)",
        boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
      }}
    >
      {/* Calendar Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CalendarIcon size={18} color="var(--accent-primary)" />
          <h2
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: "clamp(0.98rem, 3.5vw, 1.15rem)",
              color: "var(--text-primary)",
            }}
          >
            {monthNames[month]} {year}
          </h2>
        </div>
        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
          <button
            onClick={prevMonth}
            style={{
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              padding: "4px 8px",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            style={{
              background: "#eff1fe",
              border: "1.5px solid #c7d2fe",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--accent-primary)",
              cursor: "pointer",
            }}
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            style={{
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              padding: "4px 8px",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Responsive Calendar Container (Zero Horizontal Scroll on Mobile) */}
      <div className="calendar-grid-container">
        <div className="calendar-grid-inner">
          {/* Weekday labels */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              fontSize: "clamp(0.65rem, 2.5vw, 0.72rem)",
              fontWeight: 800,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              marginBottom: "0.4rem",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={{ padding: "0.3rem 0" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "clamp(2px, 1vw, 6px)",
            }}
          >
            {daysArray.map((day, idx) => {
              const dayVisits = getVisitsForDay(day);
              const isToday =
                day &&
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              if (!day) {
                return (
                  <div
                    key={idx}
                    style={{
                      background: "#f8fafc",
                      borderRadius: "8px",
                      minHeight: "clamp(48px, 10vw, 85px)",
                      border: "1px solid transparent",
                    }}
                  />
                );
              }

              const hasVisits = dayVisits.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day, dayVisits)}
                  style={{
                    minHeight: "clamp(48px, 10vw, 85px)",
                    padding: "clamp(3px, 1vw, 6px)",
                    borderRadius: "9px",
                    background: isToday
                      ? "#eff1fe"
                      : hasVisits
                      ? "#faf5ff"
                      : "#ffffff",
                    border: `1.5px solid ${
                      isToday
                        ? "#c7d2fe"
                        : hasVisits
                        ? "#e9d5ff"
                        : "#e2e8f0"
                    }`,
                    transition: "all 0.15s",
                    cursor: hasVisits ? "pointer" : "default",
                    position: "relative",
                  }}
                >
                  {/* Top Header: Day Number + Count Badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "clamp(0.72rem, 2.5vw, 0.8rem)",
                        fontWeight: isToday ? 800 : 600,
                        color: isToday
                          ? "var(--accent-primary)"
                          : "var(--text-primary)",
                      }}
                    >
                      {day}
                    </span>

                    {/* Count Badge (Always visible on mobile & desktop) */}
                    {hasVisits && (
                      <span
                        style={{
                          background: "var(--accent-primary)",
                          color: "#fff",
                          borderRadius: "50%",
                          width: "18px",
                          height: "18px",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 2px 6px rgba(79,110,247,0.3)",
                        }}
                        title={`${dayVisits.length} site visit(s)`}
                      >
                        {dayVisits.length}
                      </span>
                    )}
                  </div>

                  {/* Desktop Case Number Pills (Hidden on Mobile < 576px via d-none d-sm-block) */}
                  {hasVisits && (
                    <div
                      className="d-none d-sm-flex"
                      style={{
                        flexDirection: "column",
                        gap: "3px",
                        maxHeight: "55px",
                        overflowY: "auto",
                        marginTop: "2px",
                      }}
                    >
                      {dayVisits.map((v) => (
                        <div
                          key={v._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectVisit) onSelectVisit(v);
                          }}
                          style={{
                            padding: "2px 5px",
                            borderRadius: "5px",
                            background: "#f1f5f9",
                            fontSize: "0.67rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            cursor: "pointer",
                            border: "1px solid #e2e8f0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={`Case ${v.projectId?.caseNo || ''} — ${v.projectId?.projectName || ''}`}
                        >
                          {v.projectId?.caseNo || v.purpose}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Day Visit Detail Modal */}
      <Modal
        show={Boolean(selectedDayInfo)}
        onHide={() => setSelectedDayInfo(null)}
        centered
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CalendarIcon size={18} color="var(--accent-primary)" />
              <h3
                style={{
                  fontWeight: 800,
                  fontSize: "1rem",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Visits on {monthNames[month]} {selectedDayInfo?.day}, {year}
              </h3>
            </div>
            <button
              onClick={() => setSelectedDayInfo(null)}
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

          <div style={{ padding: "1rem 1.25rem", maxHeight: "65vh", overflowY: "auto" }}>
            {selectedDayInfo?.visits.map((v) => (
              <div
                key={v._id}
                onClick={() => {
                  setSelectedDayInfo(null);
                  if (onSelectVisit) onSelectVisit(v);
                }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "0.85rem 1rem",
                  marginBottom: "0.75rem",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.4rem",
                  }}
                >
                  <span
                    style={{
                      background: "#eff1fe",
                      border: "1px solid #c7d2fe",
                      color: "var(--accent-primary)",
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "2px 7px",
                    }}
                  >
                    CASE #{v.projectId?.caseNo || "N/A"}
                  </span>
                  <StatusBadge status={v.status} />
                </div>

                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    color: "var(--text-primary)",
                    marginBottom: "0.35rem",
                  }}
                >
                  {v.projectId?.projectName || "Building Project"}
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    marginBottom: "0.3rem",
                  }}
                >
                  <strong>Purpose:</strong> {v.purpose}
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <strong>Inspector:</strong> {v.assignedTo?.name || "Staff Engineer"}
                </div>
              </div>

            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CalendarView;
