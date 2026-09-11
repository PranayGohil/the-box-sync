import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingGlass from '../components/LoadingGlass';
import PageHeader from '../components/common/PageHeader';
import PrismButton from '../components/common/PrismButton';
import { formatDate } from '../utils/dateUtils';
import {
  Search, Filter, Download, FolderPlus, Eye,
  RotateCcw, MapPin, UserCheck, FileText,
  ChevronLeft, ChevronRight, SlidersHorizontal,
} from 'lucide-react';

const ZONES = ['West Zone', 'East Zone', 'North Zone', 'South Zone', 'Central Zone'];
const STATUSES = [
  { value: 'submitted',         label: 'Submitted' },
  { value: 'under_scrutiny',    label: 'Under Scrutiny' },
  { value: 'query_raised',      label: 'Query Raised' },
  { value: 'approved',          label: 'Approved' },
  { value: 'rejected',          label: 'Rejected' },
  { value: 'rajachitthi_issued',label: 'Rajachitthi Issued' },
];

/* ── Inline helpers ──────────────────────────────── */
const inputStyle = {
  width: '100%', height: '38px',
  background: '#f8fafc', border: '1.5px solid #e2e8f0',
  borderRadius: '8px', padding: '0 12px',
  fontSize: '0.855rem', color: '#0f172a',
  fontFamily: 'var(--font-main)', outline: 'none',
};

const focusStyle = (e) => {
  e.target.style.borderColor = 'var(--accent-primary)';
  e.target.style.boxShadow = '0 0 0 3px rgba(79,110,247,0.12)';
  e.target.style.background = '#fff';
};
const blurStyle = (e) => {
  e.target.style.borderColor = '#e2e8f0';
  e.target.style.boxShadow = 'none';
  e.target.style.background = '#f8fafc';
};

const ProjectListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const LIMIT = 15;

  const [filters, setFilters] = useState({
    search:      searchParams.get('search') || '',
    caseNo:      '',
    zone:        '',
    status:      '',
    fromDate:    '',
    toDate:      '',
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const loadProjects = async (f = appliedFilters, pg = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: pg, limit: LIMIT });
      if (f.search)    q.append('search', f.search);
      if (f.caseNo)    q.append('caseNo', f.caseNo);
      if (f.zone)      q.append('zone', f.zone);
      if (f.status)    q.append('status', f.status);
      if (f.fromDate)  q.append('fromDate', f.fromDate);
      if (f.toDate)    q.append('toDate', f.toDate);
      const res = await fetchAPI(`/projects?${q}`);
      if (res.success) { setProjects(res.data); setTotal(res.total); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadProjects(appliedFilters, page); }, [page]);

  const handleApply = (e) => {
    e.preventDefault();
    setAppliedFilters({ ...filters });
    setPage(1);
    loadProjects(filters, 1);
  };

  const handleReset = () => {
    const blank = { search: '', caseNo: '', zone: '', status: '', fromDate: '', toDate: '' };
    setFilters(blank);
    setAppliedFilters(blank);
    setPage(1);
    loadProjects(blank, 1);
  };

  const totalPages = Math.ceil(total / LIMIT);
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="Case Registry"
        subtitle="Search and filter all municipal building permission cases"
        icon={Search}
      >
        <PrismButton
          variant="secondary"
          icon={Download}
          onClick={() => window.open('/api/projects/export', '_blank')}
        >
          Export Excel
        </PrismButton>
        <PrismButton
          variant="primary"
          icon={FolderPlus}
          onClick={() => navigate('/projects/new')}
        >
          New Case
        </PrismButton>
      </PageHeader>

      {/* ── Filter Panel ── */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px',
        padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
        boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
      }}>
        {/* Filter header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#eff1fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SlidersHorizontal size={16} color="var(--accent-primary)" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Search Filters</span>
            {activeFilterCount > 0 && (
              <span style={{
                background: 'var(--accent-primary)', color: '#fff',
                borderRadius: '99px', fontSize: '0.68rem', fontWeight: 800,
                padding: '2px 8px', lineHeight: 1.6,
              }}>
                {activeFilterCount} active
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleApply}>
          {/* Row 1 — Main filters */}
          <div className="filter-grid">

            {/* Keyword search */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Keyword Search
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Owner, project name..."
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  style={{ ...inputStyle, paddingLeft: '30px' }}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>
            </div>

            {/* Case No */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Case Number
              </label>
              <input
                type="text"
                placeholder="BP/2026/..."
                value={filters.caseNo}
                onChange={e => setFilters({ ...filters, caseNo: e.target.value })}
                style={inputStyle}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>

            {/* Zone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Municipal Zone
              </label>
              <select
                value={filters.zone}
                onChange={e => setFilters({ ...filters, zone: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={focusStyle} onBlur={blurStyle}
              >
                <option value="">All Zones</option>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Status Stage
              </label>
              <select
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={focusStyle} onBlur={blurStyle}
              >
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                style={inputStyle}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>

            {/* To Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={e => setFilters({ ...filters, toDate: e.target.value })}
                style={inputStyle}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="filter-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
            <PrismButton
              type="button"
              variant="secondary"
              icon={RotateCcw}
              onClick={handleReset}
            >
              Reset
            </PrismButton>
            <PrismButton
              type="submit"
              variant="primary"
              icon={Search}
            >
              Apply Filters
            </PrismButton>
          </div>
        </form>
      </div>

      {/* ── Results Count ── */}
      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{projects.length}</strong> of{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> cases
          </div>
          {totalPages > 1 && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </div>
          )}
        </div>
      )}

      {/* ── Results ── */}
      {loading ? (
        <LoadingGlass message="Searching case registry..." />
      ) : projects.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px',
          padding: '4rem 2rem', textAlign: 'center',
          boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
        }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Search size={28} color="#94a3b8" />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>No Cases Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Try adjusting your search filters or{' '}
            <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              reset all filters
            </button>
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="responsive-card-view">
            <div className="table-desktop" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {['Case No', 'Project Name', 'Owner', 'Rajachitthi', 'Zone / Ward', 'Architect', 'Status', ''].map((h) => (
                        <th key={h} style={{
                          padding: '0.85rem 1rem', textAlign: 'left',
                          fontSize: '0.7rem', fontWeight: 800,
                          textTransform: 'uppercase', letterSpacing: '0.07em',
                          color: '#94a3b8', whiteSpace: 'nowrap',
                          borderBottom: 'none',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p, idx) => (
                      <tr
                        key={p._id}
                        style={{
                          borderBottom: idx < projects.length - 1 ? '1px solid #f1f5f9' : 'none',
                          transition: 'background 0.15s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => navigate(`/projects/${p._id}`)}
                      >
                        <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
                            {p.caseNo}
                          </span>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', maxWidth: '200px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{p.projectName}</div>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.855rem', color: 'var(--text-secondary)' }}>{p.ownerName}</div>
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {p.rajachitthiNo || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Pending</span>}
                          </div>
                          {p.rajachitthiDate && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {formatDate(p.rajachitthiDate)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                            <MapPin size={13} color="#94a3b8" />
                            {p.zone}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>{p.ward}</div>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                            <UserCheck size={13} color="#94a3b8" />
                            {p.architectId?.name || 'Unassigned'}
                          </div>
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <StatusBadge status={p.status} />
                        </td>
                        <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <PrismButton
                            variant="secondary"
                            size="sm"
                            icon={Eye}
                            onClick={() => navigate(`/projects/${p._id}`)}
                          >
                            Open
                          </PrismButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="cards-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {projects.map((p) => (
                <div
                  key={p._id}
                  onClick={() => navigate(`/projects/${p._id}`)}
                  style={{
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '12px', padding: '1rem 1.1rem',
                    boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--accent-primary)' }}>{p.caseNo}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{p.projectName}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                    Owner: <strong>{p.ownerName}</strong>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={13} /> {p.zone} — {p.ward}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <UserCheck size={13} /> {p.architectId?.name || 'Unassigned'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <FileText size={13} /> {p.rajachitthiNo || 'RC Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.25rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '8px',
                  background: page === 1 ? '#f8fafc' : '#fff',
                  border: '1.5px solid #e2e8f0',
                  color: page === 1 ? '#cbd5e1' : 'var(--text-secondary)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === '…' ? (
                    <span key={`ellipsis-${i}`} style={{ width: 36, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      style={{
                        width: 36, height: 36, borderRadius: '8px',
                        background: page === n ? 'var(--accent-primary)' : '#fff',
                        border: `1.5px solid ${page === n ? 'var(--accent-primary)' : '#e2e8f0'}`,
                        color: page === n ? '#fff' : 'var(--text-secondary)',
                        fontWeight: page === n ? 800 : 500,
                        fontSize: '0.845rem', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {n}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '8px',
                  background: page === totalPages ? '#f8fafc' : '#fff',
                  border: '1.5px solid #e2e8f0',
                  color: page === totalPages ? '#cbd5e1' : 'var(--text-secondary)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectListPage;
