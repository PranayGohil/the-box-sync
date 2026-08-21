import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'var(--primary-light)',
  iconColor = 'var(--primary)',
  trend,
  badge
}) => {
  return (
    <div className="stat-card">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
          <div className="stat-label text-truncate" title={title}>{title}</div>
          {badge && (
            <span className="badge bg-light text-muted border" style={{ fontSize: '0.65rem' }}>
              {badge}
            </span>
          )}
        </div>
        <div className="stat-value">{value}</div>
        {subtitle && (
          <div className="text-muted text-truncate" style={{ fontSize: '0.76rem', marginTop: '2px' }} title={subtitle}>
            {subtitle}
          </div>
        )}
        {trend && (
          <div
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              color: trend.positive ? 'var(--success)' : 'var(--danger)',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <i className={`bi ${trend.positive ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}`}></i>
            <span className="text-truncate">{trend.text}</span>
          </div>
        )}
      </div>
      <div className="stat-icon-wrapper" style={{ backgroundColor: iconBg, color: iconColor }}>
        <i className={`bi ${icon}`}></i>
      </div>
    </div>
  );
};

