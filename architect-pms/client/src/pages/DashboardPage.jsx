import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingGlass from '../components/LoadingGlass';
import PageHeader from '../components/common/PageHeader';
import PrismButton from '../components/common/PrismButton';
import { formatDateTime } from '../utils/dateUtils';
import {
  LayoutDashboard, FolderPlus, Users, Search, BarChart3, CalendarCheck,
  Bell, Image, TrendingUp, Clock, CalendarDays, AlertTriangle,
  ArrowRight, PlusCircle, CheckCircle2, LogIn, RefreshCw, Info,
} from 'lucide-react';

/* Map audit action → dot colour class */
const dotClass = (action = '') => {
  if (action.includes('LOGIN'))    return 'dot-blue';
  if (action.includes('CREATED'))  return 'dot-green';
  if (action.includes('UPDATED') || action.includes('STATUS')) return 'dot-violet';
  if (action.includes('DELETED'))  return 'dot-red';
  return 'dot-amber';
};

/* Map audit action → icon */
const DotIcon = ({ action = '' }) => {
  if (action.includes('LOGIN'))    return <LogIn size={15} />;
  if (action.includes('CREATED'))  return <PlusCircle size={15} />;
  if (action.includes('UPDATED') || action.includes('STATUS')) return <RefreshCw size={15} />;
  return <Info size={15} />;
};

const QUICK_MODULES = [
  { title: 'Create Case',    desc: 'Register new project file',   icon: FolderPlus,    color: '#4f6ef7', bg: '#eff1fe', path: '/projects/new' },
  { title: 'Case Registry',  desc: 'Multi-filter search',         icon: Search,        color: '#7c6ef7', bg: '#f3f2fe', path: '/projects' },
  { title: 'Data Entry',     desc: 'Manage 6 master types',       icon: Users,         color: '#e879a3', bg: '#fdf0f7', path: '/data-entry' },
  { title: 'Site Visits',    desc: 'Inspection schedule',         icon: CalendarCheck, color: '#f59e0b', bg: '#fffbeb', path: '/site-visits' },
  { title: 'Reminders',      desc: 'Validity alerts & deadlines', icon: Bell,          color: '#10b981', bg: '#ecfdf5', path: '/reminders' },
  { title: 'Site Banner',    desc: 'Printable site signage',      icon: Image,         color: '#06b6d4', bg: '#ecfeff', path: '/projects/banner-tool' },
  { title: 'Analytics',      desc: 'SLA & workload charts',       icon: BarChart3,     color: '#8b5cf6', bg: '#f5f3ff', path: '/reports' },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading]               = useState(true);
  const [stats, setStats]                   = useState({ activeCases: 0, pendingApprovals: 0, upcomingVisits: 0, expiringLicenses: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [auditLogs, setAuditLogs]           = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [projRes, visitsRes, remRes, auditRes] = await Promise.all([
          fetchAPI('/projects?limit=6'),
          fetchAPI('/site-visits?status=scheduled'),
          fetchAPI('/reminders?status=pending'),
          fetchAPI('/admin/audit-logs?limit=8').catch(() => ({ data: [] })),
        ]);
        if (projRes.success) {
          setRecentProjects(projRes.data);
          const pending = projRes.data.filter(p => ['submitted','under_scrutiny','query_raised'].includes(p.status)).length;
          setStats(s => ({ ...s, activeCases: projRes.total, pendingApprovals: pending }));
        }
        if (visitsRes.success) setStats(s => ({ ...s, upcomingVisits: visitsRes.count }));
        if (remRes.success) {
          const exp = remRes.data.filter(r => r.type === 'license_expiry').length;
          setStats(s => ({ ...s, expiringLicenses: exp }));
        }
        if (auditRes.data) setAuditLogs(auditRes.data);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingGlass message="Loading Dashboard..." />;

  const STAT_CARDS = [
    { label: 'Active Cases',      value: stats.activeCases,      icon: TrendingUp,    iconBg: '#eff1fe', iconFg: '#4f6ef7', accent: 'c-blue' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock,         iconBg: '#fffbeb', iconFg: '#f59e0b', accent: 'c-amber' },
    { label: 'Site Visits',       value: stats.upcomingVisits,   icon: CalendarDays,  iconBg: '#ecfeff', iconFg: '#06b6d4', accent: 'c-cyan' },
    { label: 'Expiring Licenses', value: stats.expiringLicenses, icon: AlertTriangle, iconBg: '#fef2f2', iconFg: '#ef4444', accent: 'c-red' },
  ];

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="Dashboard"
        subtitle="Real-time tracking for municipal building approvals"
        icon={LayoutDashboard}
      >
        <PrismButton variant="primary" icon={PlusCircle} onClick={() => navigate('/projects/new')}>
          New Case
        </PrismButton>
      </PageHeader>

      {/* ── Stat Metric Cards ── */}
      <div className="stat-row">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`stat-card ${s.accent}`}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '6px' }}>
                    {s.value}
                  </div>
                </div>
                <div className="stat-icon" style={{ background: s.iconBg, color: s.iconFg }}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Module Access ── */}
      <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>Quick Access</h2>
      </div>
      <div className="module-grid">
        {QUICK_MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.title} className="module-tile" onClick={() => navigate(m.path)}>
              <div className="module-icon" style={{ background: m.bg, color: m.color }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{m.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.desc}</div>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: m.color, fontWeight: 600 }}>
                Open <ArrowRight size={13} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Recent Cases + Audit Feed ── */}
      <style>{`
        .dash-bottom { display: grid; grid-template-columns: 1fr 380px; gap: 1.25rem; align-items: start; }
        @media (max-width: 1100px) { .dash-bottom { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="dash-bottom">

        {/* Recent Cases Table */}
        <div className="app-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>Recent Project Cases</h3>
            <button onClick={() => navigate('/projects')}
              style={{ background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer', padding: 0 }}>
              View All →
            </button>
          </div>

          {/* Desktop Table */}
          <div className="responsive-card-view">
            <div className="table-responsive table-desktop">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Case No</th>
                    <th>Project Name</th>
                    <th>Zone</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{p.caseNo}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{p.projectName}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.zone}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        <PrismButton variant="secondary" size="sm" onClick={() => navigate(`/projects/${p._id}`)}>
                          View
                        </PrismButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="cards-mobile">
              {recentProjects.map((p) => (
                <div key={p._id} className="app-card hoverable" style={{ padding: '0.9rem 1rem' }}
                  onClick={() => navigate(`/projects/${p._id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.82rem' }}>{p.caseNo}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', margin: '3px 0' }}>{p.projectName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.zone}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Trail Activity Feed */}
        <div className="app-card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>Audit Trail & Recent Activity</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>Live event log from all users</p>

          <div className="activity-feed">
            {auditLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No activity recorded yet.</p>
            ) : auditLogs.map((log) => (
              <div key={log._id} className="activity-item">
                {/* Coloured circle dot with icon */}
                <div className={`activity-dot ${dotClass(log.action)}`}>
                  <DotIcon action={log.action} />
                </div>
                <div className="activity-body">
                  <div className="activity-text">{log.changesSummary}</div>
                  <div className="activity-meta">
                    By {log.userName} &bull;{' '}
                    {formatDateTime(log.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive fix for the 2-col bottom section */}
      <style>{`
        @media (max-width: 991px) {
          .dash-bottom-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 767px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
