import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import LoadingGlass from '../components/LoadingGlass';
import PageHeader from '../components/common/PageHeader';
import { PieChart as PieIcon, BarChart3, TrendingUp, Users, Clock, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState([]);
  const [zoneData, setZoneData] = useState([]);
  const [turnaroundData, setTurnaroundData] = useState({ averageTurnaroundDays: 14, metricsByStage: [] });
  const [workloadData, setWorkloadData] = useState([]);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const [statusRes, zoneRes, turnRes, workRes] = await Promise.all([
          fetchAPI('/reports/status-summary'),
          fetchAPI('/reports/zone-summary'),
          fetchAPI('/reports/turnaround-time'),
          fetchAPI('/reports/workload'),
        ]);

        if (statusRes.success) setStatusData(statusRes.data);
        if (zoneRes.success) setZoneData(zoneRes.data);
        if (turnRes.success) setTurnaroundData(turnRes);
        if (workRes.success) setWorkloadData(workRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  if (loading) return <LoadingGlass message="Processing Analytics & Generating Charts..." />;

  const COLORS = ['#4f6ef7', '#7c6ef7', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Performance metrics, zone distribution, and team workloads"
        icon={PieIcon}
      />

      {/* Row 1: Charts */}
      <div className="reports-chart-grid">
        {/* Chart 1: Projects by Status */}
        <div className="reports-card">
          <h2
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              margin: '0 0 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PieIcon size={16} color="var(--accent-primary)" /> Case Status Breakdown
          </h2>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderColor: '#e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    color: '#0f172a',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Projects by Municipal Zone */}
        <div className="reports-card">
          <h2
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              margin: '0 0 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <BarChart3 size={16} color="#f59e0b" /> Projects by Municipal Zone
          </h2>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneData}>
                <XAxis dataKey="zone" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderColor: '#e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    color: '#0f172a',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="count" fill="#4f6ef7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Turnaround Time & Workload */}
      <div className="reports-grid-row2">
        {/* Turnaround Time Analysis */}
        <div className="reports-card">
          <h2
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              margin: '0 0 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={16} color="var(--accent-primary)" /> Approval Turnaround Metrics
          </h2>
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.1rem',
              marginBottom: '1.1rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Average Approval Turnaround
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-primary)', margin: '4px 0 2px' }}>
              {turnaroundData.averageTurnaroundDays} Days
            </div>
            <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <CheckCircle2 size={13} /> Compliant with municipal SLA (&lt; 21 days)
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {turnaroundData.metricsByStage?.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  fontSize: '0.83rem',
                  flexWrap: 'wrap',
                  gap: '6px',
                  minWidth: 0,
                }}
              >
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500, flex: 1, minWidth: '140px', wordBreak: 'break-word' }}>
                  {m.stage}
                </span>
                <span style={{ fontWeight: 800, color: '#f59e0b', whiteSpace: 'nowrap' }}>
                  {m.avgDays} Days
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Workload Table */}
        <div className="reports-card">
          <h2
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              margin: '0 0 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Users size={16} color="#7c6ef7" /> Professional Workload Distribution
          </h2>
          <div className="responsive-card-view">
            {/* Desktop Table View */}
            <div className="table-desktop" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Professional Name', 'Role Category', 'Active Assigned Cases'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.75rem 1rem',
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
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workloadData.map((w, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: idx < workloadData.length - 1 ? '1px solid #f1f5f9' : 'none',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {w.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            background: '#eff1fe',
                            border: '1px solid #c7d2fe',
                            color: 'var(--accent-primary)',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                          }}
                        >
                          {w.type}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#16a34a',
                            borderRadius: '99px',
                            padding: '3px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                          }}
                        >
                          {w.activeProjects} Active Cases
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="cards-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {workloadData.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {w.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span
                      style={{
                        background: '#eff1fe',
                        border: '1px solid #c7d2fe',
                        color: 'var(--accent-primary)',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                      }}
                    >
                      {w.type}
                    </span>
                    <span
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#16a34a',
                        borderRadius: '99px',
                        padding: '3px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {w.activeProjects} Active Cases
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
