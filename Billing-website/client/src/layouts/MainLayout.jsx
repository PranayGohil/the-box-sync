import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export const MainLayout = () => {
  const { user, activeBusiness, businesses, switchBusiness, logout, hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Close mobile sidebar and dropdowns on route navigation
    setShowMobileSidebar(false);
    setShowUserMenu(false);
    setShowNotifications(false);
    setSearchResults(null);
  }, [location.pathname]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/settings/notifications');
        if (res.data.success) {
          setNotifications(res.data.data.notifications || []);
          setUnreadCount(res.data.data.unreadCount || 0);
        }
      } catch (err) {
        // ignore notification error
      }
    };
    if (activeBusiness) {
      fetchNotifications();
    }
  }, [activeBusiness]);

  const handleGlobalSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      try {
        const res = await api.get(`/settings/search?q=${encodeURIComponent(val)}`);
        if (res.data.success) {
          setSearchResults(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults(null);
    }
  };

  const navItems = [
    { title: 'Dashboard', path: '/dashboard', icon: 'bi-grid-1x2-fill' },
    { title: 'POS Fast Billing', path: '/pos', icon: 'bi-lightning-charge-fill', badge: 'Fast' },

    { section: 'Sales Suite' },
    { title: 'GST Invoices', path: '/sales/invoices', icon: 'bi-receipt', perm: ['invoices', 'view'] },
    { title: 'Quotations', path: '/sales/quotations', icon: 'bi-file-earmark-text', perm: ['quotations', 'view'] },
    { title: 'Sales Orders', path: '/sales/orders', icon: 'bi-cart-check', perm: ['sales_orders', 'view'] },
    { title: 'Delivery Challans', path: '/sales/challans', icon: 'bi-truck', perm: ['delivery_challans', 'view'] },
    { title: 'Sales Returns & CN', path: '/sales/returns', icon: 'bi-arrow-counterclockwise', perm: ['sales_returns', 'view'] },

    { section: 'Purchases' },
    { title: 'Purchase Bills', path: '/purchases/bills', icon: 'bi-receipt-cutoff', perm: ['purchase_bills', 'view'] },
    { title: 'Purchase Orders', path: '/purchases/orders', icon: 'bi-file-earmark-plus', perm: ['purchase_orders', 'view'] },
    { title: 'Goods Receipt (GRN)', path: '/purchases/grn', icon: 'bi-box-arrow-in-down', perm: ['goods_receipt', 'view'] },
    { title: 'Debit Notes & Returns', path: '/purchases/returns', icon: 'bi-journal-arrow-down', perm: ['debit_notes', 'view'] },

    { section: 'Inventory & Stock' },
    { title: 'Products Master', path: '/inventory/products', icon: 'bi-box-seam', perm: ['products', 'view'] },
    { title: 'Stock Summary', path: '/inventory/summary', icon: 'bi-boxes', perm: ['inventory', 'view'] },
    { title: 'Stock Movements', path: '/inventory/movements', icon: 'bi-arrow-left-right', perm: ['inventory', 'view'] },
    { title: 'Stock Adjustments', path: '/inventory/adjustments', icon: 'bi-sliders', perm: ['inventory', 'create'] },
    { title: 'Warehouse Transfers', path: '/inventory/transfers', icon: 'bi-arrow-left-right', perm: ['inventory', 'create'] },

    { section: 'Contacts' },
    { title: 'Customers CRM', path: '/contacts/customers', icon: 'bi-people', perm: ['customers', 'view'] },
    { title: 'Suppliers CRM', path: '/contacts/suppliers', icon: 'bi-building', perm: ['suppliers', 'view'] },

    { section: 'Accounting & Banking' },
    { title: 'Chart of Accounts', path: '/accounting/chart-of-accounts', icon: 'bi-diagram-3', perm: ['accounting', 'view'] },
    { title: 'Financial Statements', path: '/accounting/statements', icon: 'bi-journal-bookmark-fill', perm: ['accounting', 'view'] },
    { title: 'Payment Receipts & Out', path: '/payments', icon: 'bi-wallet2', perm: ['payments', 'view'] },
    { title: 'Expenses & TDS', path: '/payments/expenses', icon: 'bi-cash-stack', perm: ['expenses', 'view'] },

    { section: 'Tax & Compliance' },
    { title: 'GST Summary & GSTR-1', path: '/tax/gst', icon: 'bi-calculator', perm: ['tax_gst', 'view'] },
    { title: 'TDS Management', path: '/tax/tds', icon: 'bi-file-earmark-ruled', perm: ['tax_tds', 'view'] },

    { section: 'Analytics & Settings' },
    { title: 'Reports Hub', path: '/reports', icon: 'bi-bar-chart-line-fill', perm: ['reports', 'view'] },
    { title: 'Business Profile', path: '/settings/business', icon: 'bi-gear-fill', perm: ['settings', 'view'] },
    { title: 'Team & RBAC', path: '/settings/members', icon: 'bi-shield-lock-fill', perm: ['settings', 'view'] },
    { title: 'Audit Logs', path: '/settings/audit-logs', icon: 'bi-activity', perm: ['audit_logs', 'view'] }
  ];

  return (
    <div className="app-container">
      {/* Mobile Drawer Overlay Backdrop */}
      {showMobileSidebar && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1040, backdropFilter: 'blur(2px)' }}
          onClick={() => setShowMobileSidebar(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${showMobileSidebar ? 'd-flex' : 'd-none d-lg-flex'}`}>
        <div className="d-flex justify-content-between align-items-center sidebar-brand">
          <NavLink to="/dashboard" className="d-flex align-items-center text-decoration-none text-white">
            <i className="bi bi-boxes text-primary me-2" style={{ fontSize: '1.4rem' }}></i>
            <span className="fw-bold fs-5">Zenith<span style={{ color: 'var(--primary-subtle)' }}>ERP</span></span>
          </NavLink>
          {/* Close button for mobile drawer */}
          <button
            type="button"
            className="btn btn-sm btn-link text-white-50 d-lg-none p-0"
            onClick={() => setShowMobileSidebar(false)}
          >
            <i className="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        <ul className="sidebar-menu">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <li key={idx} className="nav-section-title">
                  {item.section}
                </li>
              );
            }

            if (item.perm && !hasPermission(item.perm[0], item.perm[1])) {
              return null;
            }

            return (
              <li key={idx}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span style={{ flex: 1 }}>{item.title}</span>
                  {item.badge && (
                    <span className="badge bg-warning text-dark font-weight-bold" style={{ fontSize: '0.65rem' }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Sidebar Footer User Info & Explicit Logout Button */}
        <div style={{ padding: '0.85rem 1rem', background: '#020617', borderTop: '1px solid #1e293b' }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  flexShrink: 0
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                  {activeBusiness?.role || 'Member'}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="btn btn-sm btn-outline-danger py-1 px-2 d-flex align-items-center gap-1"
              title="Log Out of Zenith ERP"
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-content">
        {/* Topbar */}
        <header className="app-topbar no-print">
          <div className="d-flex align-items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button
              className="btn btn-outline-zenith d-lg-none p-1 px-2"
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              title="Open Navigation Menu"
            >
              <i className="bi bi-list fs-5"></i>
            </button>

            {/* Global Search Input */}
            <div className="position-relative d-none d-md-block" style={{ width: '320px' }}>
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5 bg-light"
                placeholder="Search invoices, products, customers..."
                value={searchQuery}
                onChange={handleGlobalSearch}
                style={{ borderRadius: '20px' }}
              />

              {/* Search Results Dropdown Overlay */}
              {searchResults && (
                <div
                  className="card shadow-lg position-absolute w-100 mt-2 p-2 bg-white"
                  style={{ zIndex: 1060, maxHeight: '350px', overflowY: 'auto' }}
                >
                  {searchResults.customers?.length > 0 && (
                    <div className="mb-2">
                      <div className="small fw-bold text-muted px-2 py-1">Customers</div>
                      {searchResults.customers.map(c => (
                        <div
                          key={c._id}
                          className="px-2 py-1 small rounded cursor-pointer hover-bg"
                          onClick={() => { navigate('/contacts/customers'); setSearchResults(null); }}
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-person me-1 text-primary"></i> {c.name} ({c.phone || c.gstin || 'B2C'})
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.products?.length > 0 && (
                    <div className="mb-2">
                      <div className="small fw-bold text-muted px-2 py-1">Products</div>
                      {searchResults.products.map(p => (
                        <div
                          key={p._id}
                          className="px-2 py-1 small rounded cursor-pointer"
                          onClick={() => { navigate('/inventory/products'); setSearchResults(null); }}
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-box me-1 text-success"></i> {p.name} (₹{p.sellingPrice})
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.invoices?.length > 0 && (
                    <div>
                      <div className="small fw-bold text-muted px-2 py-1">Invoices</div>
                      {searchResults.invoices.map(i => (
                        <div
                          key={i._id}
                          className="px-2 py-1 small rounded cursor-pointer"
                          onClick={() => { navigate('/sales/invoices'); setSearchResults(null); }}
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-receipt me-1 text-indigo"></i> #{i.invoiceNo} - {i.customerNameSnapshot} (₹{i.grandTotal})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 gap-sm-3">
            {/* Quick Action: POS Button */}
            <NavLink to="/pos" className="btn btn-primary-zenith btn-sm d-none d-sm-inline-flex">
              <i className="bi bi-lightning-charge-fill"></i> POS Billing
            </NavLink>

            {/* Business Tenant Switcher Dropdown */}
            {businesses.length > 1 && (
              <div className="dropdown">
                <button
                  className="btn btn-outline-zenith btn-sm dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-building text-primary"></i>
                  <span className="fw-bold d-none d-md-inline" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeBusiness?.name || 'Select Business'}
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow">
                  <li className="dropdown-header small text-muted">Switch Organization</li>
                  {businesses.map((biz) => (
                    <li key={biz.id}>
                      <button
                        className={`dropdown-item small d-flex align-items-center justify-content-between ${biz.id === activeBusiness?.id ? 'active' : ''}`}
                        onClick={() => switchBusiness(biz.id)}
                      >
                        <span>{biz.name}</span>
                        {biz.id === activeBusiness?.id && <i className="bi bi-check2"></i>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notification Bell Dropdown */}
            <div className="position-relative">
              <button
                className="btn btn-outline-zenith btn-sm position-relative p-2"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                title="Notifications"
              >
                <i className="bi bi-bell-fill"></i>
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="card shadow-lg position-absolute end-0 mt-2 p-0 bg-white"
                  style={{ width: '320px', zIndex: 1060, borderRadius: '12px' }}
                >
                  <div className="card-header bg-light d-flex justify-content-between align-items-center py-2 px-3">
                    <span className="fw-bold small">Notifications</span>
                    <span className="badge bg-primary">{notifications.length}</span>
                  </div>
                  <div className="list-group list-group-flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="p-3 text-center text-muted small">No notifications yet</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} className="list-group-item list-group-item-action p-2">
                          <div className="fw-bold small">{n.title}</div>
                          <div className="text-muted" style={{ fontSize: '0.78rem' }}>{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Topbar User Profile Menu & Logout Trigger */}
            <div className="position-relative">
              <button
                className="btn btn-outline-zenith btn-sm d-flex align-items-center gap-2 p-1 pe-2"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                style={{ borderRadius: '20px' }}
                title="User Account & Logout"
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="small fw-bold d-none d-md-inline text-dark">
                  {user?.name || 'Account'}
                </span>
                <i className="bi bi-chevron-down small text-muted"></i>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="card shadow-lg position-absolute end-0 mt-2 p-0 bg-white"
                  style={{ width: '250px', zIndex: 1060, borderRadius: '12px', border: '1px solid #e2e8f0' }}
                >
                  <div className="p-3 bg-light border-bottom">
                    <div className="fw-bold text-dark text-truncate">{user?.name || 'User'}</div>
                    <div className="small text-muted font-mono text-truncate">{user?.email}</div>
                    <div className="mt-2">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle text-capitalize font-mono" style={{ fontSize: '0.68rem' }}>
                        {activeBusiness?.role || 'Member'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2">
                    <NavLink
                      to="/settings/business"
                      className="dropdown-item small py-2 px-3 rounded d-flex align-items-center gap-2"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="bi bi-gear text-primary"></i> Business Settings
                    </NavLink>
                    <NavLink
                      to="/settings/members"
                      className="dropdown-item small py-2 px-3 rounded d-flex align-items-center gap-2"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="bi bi-shield-lock text-primary"></i> Team & Privileges
                    </NavLink>
                  </div>

                  <div className="p-2 border-top bg-light rounded-bottom">
                    <button
                      className="btn btn-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 fw-bold"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                    >
                      <i className="bi bi-box-arrow-right"></i> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Instant Logout Button on Topbar */}
            <button
              onClick={logout}
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 p-2"
              title="Quick Log Out"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-xl-inline small fw-bold">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body Routed View */}
        <main className={`content-body ${location.pathname === '/pos' ? 'content-body-pos' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
