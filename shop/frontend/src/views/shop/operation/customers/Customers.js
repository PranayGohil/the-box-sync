import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Spinner, Badge, Form, InputGroup } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import { AuthContext } from 'contexts/AuthContext';
import { getCustomerList } from 'api/customerService';

/* ─── Inline Styles ─────────────────────────────────────────────────────────── */
const styles = `
  .customers-table-wrapper {
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 2px 16px rgba(35,179,244,0.07);
  }
  .customers-table {
    margin-bottom: 0;
    font-size: 0.875rem;
  }
  .customers-table thead tr {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  }
  .customers-table thead th {
    font-weight: 700;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #475569;
    border: none;
    padding: 0.85rem 1rem;
    white-space: nowrap;
    vertical-align: middle;
  }
  .customers-table thead th.sortable {
    cursor: pointer;
    user-select: none;
    transition: color 0.2s;
  }
  .customers-table thead th.sortable:hover {
    color: #23b3f4;
  }
  .customers-table tbody tr {
    transition: background 0.15s;
    border-bottom: 1px solid #f1f5f9;
  }
  .customers-table tbody tr:hover {
    background: #f8fcff;
  }
  .customers-table tbody td {
    padding: 0.85rem 1rem;
    vertical-align: middle;
    border: none;
    color: #334155;
  }
  .customers-table tbody tr:last-child {
    border-bottom: none;
  }
  .customer-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #23b3f4, #0ea5e9);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 700;
    font-size: 0.95rem;
    flex-shrink: 0;
  }
  .customer-name-cell {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }
  .customer-name {
    font-weight: 600;
    color: #1e293b;
    line-height: 1.2;
  }
  .customer-phone-sub {
    font-size: 0.75rem;
    color: #94a3b8;
  }
  .stat-badge-orders {
    background: rgba(35,179,244,0.12);
    color: #0284c7;
    font-weight: 700;
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 0.78rem;
    display: inline-block;
  }
  .stat-badge-amount {
    font-weight: 700;
    color: #0f766e;
    font-size: 0.9rem;
  }
  .order-type-badge {
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 0.72rem;
    font-weight: 700;
    display: inline-block;
  }
  .order-type-badge.dine-in  { background: rgba(168,85,247,0.12); color: #7c3aed; }
  .order-type-badge.takeaway { background: rgba(234,179,8,0.12);  color: #a16207; }
  .order-type-badge.delivery { background: rgba(34,197,94,0.12);  color: #15803d; }
  .btn-view-customer {
    border: 1.5px solid #23b3f4;
    color: #23b3f4;
    background: #fff;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.78rem;
    padding: 4px 14px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .btn-view-customer:hover {
    background: #23b3f4;
    color: #fff;
    box-shadow: 0 4px 12px rgba(35,179,244,0.3);
    text-decoration: none;
  }
  .page-size-select {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.82rem;
    padding: 5px 10px;
    color: #475569;
    background: #fff;
    cursor: pointer;
    outline: none;
  }
  .page-size-select:focus { border-color: #23b3f4; box-shadow: 0 0 0 2px rgba(35,179,244,0.15); }
  .search-input-cust {
    border: 1px solid #e2e8f0;
    border-radius: 10px 0 0 10px;
    font-size: 0.875rem;
    padding: 8px 14px;
    outline: none;
  }
  .search-input-cust:focus { border-color: #23b3f4; box-shadow: 0 0 0 2px rgba(35,179,244,0.12); }
  .search-btn-cust {
    border: 1px solid #e2e8f0;
    border-left: none;
    border-radius: 0 10px 10px 0;
    background: #f8fafc;
    color: #94a3b8;
    padding: 8px 14px;
    transition: all 0.2s;
  }
  .search-btn-cust:hover { background: #23b3f4; color: #fff; border-color: #23b3f4; }
  .pagination-btn {
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #475569;
    border-radius: 8px;
    padding: 5px 13px;
    font-size: 0.82rem;
    font-weight: 600;
    transition: all 0.2s;
  }
  .pagination-btn:hover:not(:disabled) { background: #23b3f4; color: #fff; border-color: #23b3f4; }
  .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .pagination-active {
    background: #23b3f4 !important;
    color: #fff !important;
    border-color: #23b3f4 !important;
  }
  .empty-state { padding: 3rem 1rem; text-align: center; color: #94a3b8; }
  .empty-state svg { margin-bottom: 0.75rem; opacity: 0.4; }
  .summary-stat-card {
    border-radius: 1rem;
    border: none;
    padding: 1.1rem 1.4rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .summary-stat-icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .summary-stat-label { font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .summary-stat-value { font-size: 1.45rem; font-weight: 800; color: #1e293b; line-height: 1.1; }
`;

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const getInitials = (name) => {
  if (!name || name === 'Walk-in') return 'W';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0][0].toUpperCase();
};

const orderTypeBadge = (type) => {
  const map = {
    'Dine In': 'dine-in',
    Takeaway: 'takeaway',
    Delivery: 'delivery',
  };
  return <span className={`order-type-badge ${map[type] || 'takeaway'}`}>{type || '—'}</span>;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'dd MMM yyyy');
  } catch {
    return '—';
  }
};

/* ─── Component ─────────────────────────────────────────────────────────────── */
const Customers = () => {
  const title = 'Manage Customers';
  const description = 'View all customers, their order counts, and total spending.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/customers', text: 'Manage Customers' },
  ];

  const history = useHistory();
  const { currentUser } = useContext(AuthContext);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('total_orders');
  const [sortOrder, setSortOrder] = useState('desc');
  const [summary, setSummary] = useState({ total_customers: 0, total_orders: 0, total_revenue: 0 });

  const fetchRef = useRef(false);

  const fetchCustomers = useCallback(async () => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    setLoading(true);
    try {
      const res = await getCustomerList({
        page: pageIndex + 1,
        limit: pageSize,
        search: searchTerm,
        sortBy,
        sortOrder,
      });
      if (res.data?.success) {
        setCustomers(res.data.data || []);
        setTotalRecords(res.data.total || 0);
        setTotalPages(res.data.pages || 0);
        if (res.data.summary) setSummary(res.data.summary);
      } else {
        toast.error(res.data?.message || 'Failed to load customers');
      }
    } catch (err) {
      toast.error('Error fetching customers. Please try again.');
    } finally {
      setLoading(false);
      fetchRef.current = false;
    }
  }, [pageIndex, pageSize, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = () => {
    setPageIndex(0);
    setSearchTerm(searchInput.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') {
      setSearchInput('');
      setSearchTerm('');
      setPageIndex(0);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPageIndex(0);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <CsLineIcons icon="sort" size="12" className="ms-1 opacity-50" />;
    return sortOrder === 'asc' ? (
      <CsLineIcons icon="chevron-top" size="12" className="ms-1" style={{ color: '#23b3f4' }} />
    ) : (
      <CsLineIcons icon="chevron-bottom" size="12" className="ms-1" style={{ color: '#23b3f4' }} />
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await getCustomerList({ search: searchTerm, sortBy, sortOrder, limit: 9999, page: 1 });
      const rows = (res.data?.data || []).map((c, i) => ({
        '#': i + 1,
        Name: c.name || 'Walk-in',
        Phone: c.phone || '—',
        'Total Orders': c.total_orders || 0,
        'Total Amount (₹)': Number(c.total_amount || 0).toFixed(2),
        'Last Order': formatDate(c.last_order_date),
        'Most Used Type': c.most_used_type || '—',
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      XLSX.writeFile(wb, `customers_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Exported successfully!');
    } catch {
      toast.error('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const startRecord = totalRecords === 0 ? 0 : pageIndex * pageSize + 1;
  const endRecord = Math.min((pageIndex + 1) * pageSize, totalRecords);

  const renderPaginationButtons = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    let start = Math.max(0, pageIndex - 2);
    let end = Math.min(totalPages - 1, pageIndex + 2);
    if (end - start < 4) {
      if (start === 0) end = Math.min(4, totalPages - 1);
      else start = Math.max(0, end - 4);
    }
    for (let i = start; i <= end; i += 1) {
      pages.push(
        <button
          key={i}
          type="button"
          className={`pagination-btn ${i === pageIndex ? 'pagination-active' : ''}`}
          onClick={() => setPageIndex(i)}
          style={{ minWidth: '36px' }}
        >
          {i + 1}
        </button>
      );
    }
    return pages;
  };

  return (
    <>
      <style>{styles}</style>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-3">
        <Row className="align-items-center g-2">
          <Col xs="auto">
            <h1 className="mb-0 pb-0 display-6 fw-bold" style={{ color: '#1e293b', fontSize: '1.5rem' }}>
              {title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col className="d-flex justify-content-end gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={fetchCustomers}
              disabled={loading}
              style={{ borderRadius: '50px', fontWeight: 600, fontSize: '0.8rem' }}
            >
              <CsLineIcons icon="refresh" size="14" className="me-1" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              style={{
                borderRadius: '50px',
                fontWeight: 700,
                fontSize: '0.8rem',
                background: 'linear-gradient(135deg,#23b3f4,#0ea5e9)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(35,179,244,0.3)',
              }}
            >
              {exporting ? (
                <Spinner size="sm" animation="border" className="me-1" />
              ) : (
                <CsLineIcons icon="download" size="14" className="me-1" />
              )}
              Export Excel
            </Button>
          </Col>
        </Row>
      </div>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        {[
          {
            label: 'Total Customers',
            value: summary.total_customers?.toLocaleString() || '0',
            icon: 'user',
            color: '#23b3f4',
            bg: 'rgba(35,179,244,0.1)',
          },
          {
            label: 'Total Orders',
            value: summary.total_orders?.toLocaleString() || '0',
            icon: 'cart',
            color: '#8b5cf6',
            bg: 'rgba(139,92,246,0.1)',
          },
          {
            label: 'Total Revenue',
            value: `₹${Number(summary.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
            icon: 'wallet',
            color: '#0f766e',
            bg: 'rgba(15,118,110,0.1)',
          },
        ].map((stat) => (
          <Col xs={12} sm={4} key={stat.label}>
            <Card className="summary-stat-card shadow-sm" style={{ background: '#fff' }}>
              <div className="summary-stat-icon" style={{ background: stat.bg }}>
                <CsLineIcons icon={stat.icon} size="22" style={{ color: stat.color }} />
              </div>
              <div>
                <div className="summary-stat-label">{stat.label}</div>
                <div className="summary-stat-value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Controls */}
      <Card className="mb-3 shadow-sm" style={{ borderRadius: '1rem', border: 'none' }}>
        <Card.Body className="py-3">
          <Row className="align-items-center g-2">
            <Col xs={12} md="auto" className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Show</span>
              <select className="page-size-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}>
                {[10, 25, 50].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>entries</span>
            </Col>
            <Col xs={12} md className="d-flex justify-content-md-end">
              <InputGroup style={{ maxWidth: '340px', width: '100%' }}>
                <Form.Control
                  className="search-input-cust"
                  placeholder="Search by name or phone..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  style={{ border: '1px solid #e2e8f0' }}
                />
                <button className="search-btn-cust" type="button" onClick={handleSearch}>
                  <CsLineIcons icon="search" size="15" />
                </button>
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Table */}
      <Card className="customers-table-wrapper shadow-sm" style={{ border: 'none' }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" style={{ color: '#23b3f4', width: '2.5rem', height: '2.5rem' }} />
            <span className="ms-3 text-muted fw-semibold">Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <CsLineIcons icon="user" size="48" />
            <div className="fw-bold fs-5 mt-2">No customers found</div>
            <div className="small mt-1">{searchTerm ? 'Try a different search term.' : 'Customers will appear here once orders are placed.'}</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table customers-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th
                    className="sortable"
                    onClick={() => handleSort('total_orders')}
                  >
                    Total Orders <SortIcon field="total_orders" />
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort('total_amount')}
                  >
                    Total Amount <SortIcon field="total_amount" />
                  </th>
                  <th>Last Order</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, idx) => (
                  <tr key={customer.phone || idx}>
                    <td style={{ color: '#94a3b8', fontWeight: 600 }}>{startRecord + idx}</td>
                    <td>
                      <div className="customer-name-cell">
                        <div className="customer-avatar">{getInitials(customer.name)}</div>
                        <div>
                          <div className="customer-name">{customer.name || 'Walk-in'}</div>
                          <div className="customer-phone-sub">{customer.phone || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="stat-badge-orders">{customer.total_orders || 0} orders</span>
                    </td>
                    <td>
                      <span className="stat-badge-amount">
                        ₹{Number(customer.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{formatDate(customer.last_order_date)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-view-customer"
                        onClick={() => history.push(`/operations/customers/${encodeURIComponent(customer.phone)}`)}
                        disabled={!customer.phone}
                        title={!customer.phone ? 'Phone number required to view orders' : 'View customer orders'}
                      >
                        <CsLineIcons icon="eye" size="13" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div
            className="d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 py-2"
            style={{ borderTop: '1px solid #f1f5f9' }}
          >
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Showing <strong>{startRecord}</strong>–<strong>{endRecord}</strong> of <strong>{totalRecords}</strong> customers
            </span>
            <div className="d-flex gap-1 flex-wrap">
              <button type="button" className="pagination-btn" onClick={() => setPageIndex(0)} disabled={pageIndex === 0}>«</button>
              <button type="button" className="pagination-btn" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={pageIndex === 0}>‹</button>
              {renderPaginationButtons()}
              <button type="button" className="pagination-btn" onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))} disabled={pageIndex >= totalPages - 1}>›</button>
              <button type="button" className="pagination-btn" onClick={() => setPageIndex(totalPages - 1)} disabled={pageIndex >= totalPages - 1}>»</button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

export default Customers;
