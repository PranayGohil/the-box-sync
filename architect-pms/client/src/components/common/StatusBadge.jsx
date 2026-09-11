import React from 'react';

const StatusBadge = ({ status }) => {
  const norm = String(status || '').toLowerCase().replace(/\s+/g, '_');

  const MAP = {
    submitted:             { label: 'Submitted',        cls: 'status-submitted' },
    under_scrutiny:        { label: 'Under Scrutiny',   cls: 'status-scrutiny' },
    query_raised:          { label: 'Query Raised',     cls: 'status-query' },
    approved:              { label: 'Approved',         cls: 'status-approved' },
    completed:             { label: 'Approved',         cls: 'status-approved' },
    done:                  { label: 'Done',             cls: 'status-approved' },
    active:                { label: 'Active',           cls: 'status-approved' },
    rejected:              { label: 'Rejected',         cls: 'status-rejected' },
    missed:                { label: 'Missed',           cls: 'status-rejected' },
    inactive:              { label: 'Inactive',         cls: 'status-rejected' },
    overdue:               { label: 'Overdue',          cls: 'status-rejected' },
    rajachitthi_issued:    { label: 'Rajachitthi Issued', cls: 'status-rajachitthi' },
    scheduled:             { label: 'Scheduled',        cls: 'status-scrutiny' },
    pending:               { label: 'Pending',          cls: 'status-query' },
    snoozed:               { label: 'Snoozed',          cls: 'status-scrutiny' },
    under_review:          { label: 'Under Review',     cls: 'status-scrutiny' },
    application_submitted: { label: 'Submitted',        cls: 'status-submitted' },
  };

  const entry = MAP[norm] || { label: status || 'Unknown', cls: 'status-submitted' };

  return (
    <span className={`status-badge ${entry.cls}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
      {entry.label}
    </span>
  );
};

export default StatusBadge;
