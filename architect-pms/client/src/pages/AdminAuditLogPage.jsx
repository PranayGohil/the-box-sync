import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import LoadingGlass from '../components/LoadingGlass';
import PageHeader from '../components/common/PageHeader';
import { formatDateTime } from '../utils/dateUtils';
import { FileText, Shield, Clock, LogIn, PlusCircle, RefreshCw, Info } from 'lucide-react';

const dotClass = (action = '') => {
  if (action.includes('LOGIN')) return { bg: '#eff1fe', border: '#c7d2fe', text: '#4f6ef7' };
  if (action.includes('CREATED')) return { bg: '#ecfdf5', border: '#a7f3d0', text: '#10b981' };
  if (action.includes('UPDATED') || action.includes('STATUS')) return { bg: '#f5f3ff', border: '#ddd6fe', text: '#7c3aed' };
  if (action.includes('DELETED')) return { bg: '#fef2f2', border: '#fecaca', text: '#ef4444' };
  return { bg: '#fffbeb', border: '#fde68a', text: '#f59e0b' };
};

const AdminAuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI('/admin/audit-logs?limit=100')
      .then((res) => {
        if (res.success) setLogs(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingGlass message="Loading System Audit Trail..." />;

  return (
    <div>
      <PageHeader
        title="System Audit Trail"
        subtitle="History of user actions, status updates, and system events"
        icon={FileText}
      />

      <div className="responsive-card-view">
        {/* Desktop Table View */}
        <div
          className="table-desktop"
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Timestamp', 'User / Account', 'Action Event', 'Entity Type', 'Change Details & Summary'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.85rem 1rem',
                          textAlign: 'left',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          color: '#94a3b8',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => {
                    const style = dotClass(log.action);
                    return (
                      <tr
                        key={log._id}
                        style={{
                          borderBottom: idx < logs.length - 1 ? '1px solid #f1f5f9' : 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.865rem' }}>
                          {log.userName}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              background: style.bg,
                              border: `1px solid ${style.border}`,
                              color: style.text,
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                            }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {log.entityType}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.845rem', color: 'var(--text-secondary)' }}>
                          {log.changesSummary}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="cards-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {logs.length === 0 ? (
            <div
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              No audit records found.
            </div>
          ) : (
            logs.map((log) => {
              const style = dotClass(log.action);
              return (
                <div
                  key={log._id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem',
                    boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}
                >
                  {/* Top Row: Action Badge + Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        color: style.text,
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                      }}
                    >
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>

                  {/* User Name */}
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {log.userName}
                  </div>

                  {/* Entity Type Tag & Summary */}
                  <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '0.65rem 0.75rem', fontSize: '0.82rem' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                      Entity: {log.entityType}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {log.changesSummary}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogPage;
