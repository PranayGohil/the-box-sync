import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

const CalendarView = ({ visits = [], onSelectVisit }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "1.5rem",
        boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
      }}
    >
      {/* Calendar Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CalendarIcon size={20} color="var(--accent-primary)" />
          <h2
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: "1.15rem",
              color: "var(--text-primary)",
            }}
          >
            {monthNames[month]} {year}
          </h2>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            onClick={prevMonth}
            style={{
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              padding: "5px 8px",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            style={{
              background: "#eff1fe",
              border: "1.5px solid #c7d2fe",
              borderRadius: "8px",
              padding: "5px 12px",
              fontSize: "0.8rem",
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
              padding: "5px 8px",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Responsive Calendar Container */}
      <div className="calendar-grid-container">
        <div className="calendar-grid-inner">
          {/* Weekday labels */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={{ padding: "0.5rem 0" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "6px",
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
                      borderRadius: "10px",
                      minHeight: "85px",
                      border: "1px solid transparent",
                    }}
                  />
                );
              }

              return (
                <div
                  key={idx}
                  style={{
                    minHeight: "85px",
                    padding: "0.5rem",
                    borderRadius: "10px",
                    background: isToday ? "#eff1fe" : "#ffffff",
                    border: `1.5px solid ${isToday ? "#c7d2fe" : "#e2e8f0"}`,
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: isToday ? 800 : 600,
                        color: isToday
                          ? "var(--accent-primary)"
                          : "var(--text-primary)",
                      }}
                    >
                      {day}
                    </span>
                    {dayVisits.length > 0 && (
                      <span
                        style={{
                          background: "var(--accent-primary)",
                          color: "#fff",
                          borderRadius: "99px",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          padding: "1px 5px",
                          lineHeight: 1.5,
                        }}
                      >
                        {dayVisits.length}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                      maxHeight: "55px",
                      overflowY: "auto",
                    }}
                  >
                    {dayVisits.map((v) => (
                      <div
                        key={v._id}
                        onClick={() => onSelectVisit && onSelectVisit(v)}
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
                        title={`${v.projectId?.projectName} (${v.purpose})`}
                      >
                        {v.projectId?.caseNo || v.purpose}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
