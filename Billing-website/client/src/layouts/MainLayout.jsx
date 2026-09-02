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

  const topDirectLinks = [
    { title: 'Dashboard', path: '/dashboard', icon: 'bi-grid-1x2-fill' },
    { title: 'POS Fast Billing', path: '/pos', icon: 'bi-lightning-charge-fill', badge: 'Fast' }
  ];

  const menuGroups = [
    {
      id: 'sales',
      title: 'Sales Suite',
      icon: 'bi-receipt-cutoff',
      items: [
        { title: 'GST Invoices', path: '/sales/invoices', icon: 'bi-receipt', perm: ['invoices', 'view'] },
        { title: 'Quotations', path: '/sales/quotations', icon: 'bi-file-earmark-text', perm: ['quotations', 'view'] },
        { title: 'Sales Orders', path: '/sales/orders', icon: 'bi-cart-check', perm: ['sales_orders', 'view'] },
        { title: 'Delivery Challans', path: '/sales/challans', icon: 'bi-truck', perm: ['delivery_challans', 'view'] },
        { title: 'Sales Returns & CN', path: '/sales/returns', icon: 'bi-arrow-counterclockwise', perm: ['sales_returns', 'view'] }
      ]
    },
    {
      id: 'purchases',
      title: 'Purchases',
      icon: 'bi-bag-check',
      items: [
        { title: 'Purchase Bills', path: '/purchases/bills', icon: 'bi-receipt-cutoff', perm: ['purchase_bills', 'view'] },
        { title: 'Purchase Orders', path: '/purchases/orders', icon: 'bi-file-earmark-plus', perm: ['purchase_orders', 'view'] },
        { title: 'Goods Receipt (GRN)', path: '/purchases/grn', icon: 'bi-box-arrow-in-down', perm: ['goods_receipt', 'view'] },
        { title: 'Debit Notes & Returns', path: '/purchases/returns', icon: 'bi-journal-arrow-down', perm: ['debit_notes', 'view'] }
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory & Stock',
      icon: 'bi-boxes',
      items: [
        { title: 'Products Master', path: '/inventory/products', icon: 'bi-box-seam', perm: ['products', 'view'] },
        { title: 'Stock Summary', path: '/inventory/summary', icon: 'bi-boxes', perm: ['inventory', 'view'] },
        { title: 'Stock Movements', path: '/inventory/movements', icon: 'bi-arrow-left-right', perm: ['inventory', 'view'] },
        { title: 'Stock Adjustments', path: '/inventory/adjustments', icon: 'bi-sliders', perm: ['inventory', 'create'] },
        { title: 'Warehouse Transfers', path: '/inventory/transfers', icon: 'bi-arrow-left-right', perm: ['inventory', 'create'] }
      ]
    },
    {
      id: 'contacts',
      title: 'Contacts CRM',
      icon: 'bi-people',
      items: [
        { title: 'Customers CRM', path: '/contacts/customers', icon: 'bi-person-badge', perm: ['customers', 'view'] },
        { title: 'Suppliers CRM', path: '/contacts/suppliers', icon: 'bi-building', perm: ['suppliers', 'view'] }
      ]
    },
    {
      id: 'accounting',
      title: 'Accounting & Banking',
      icon: 'bi-bank',
      items: [
        { title: 'Chart of Accounts', path: '/accounting/chart-of-accounts', icon: 'bi-diagram-3', perm: ['accounting', 'view'] },
        { title: 'Financial Statements', path: '/accounting/statements', icon: 'bi-journal-bookmark-fill', perm: ['accounting', 'view'] },
        { title: 'Payment Receipts & Out', path: '/payments', icon: 'bi-wallet2', perm: ['payments', 'view'] },
        { title: 'Expenses & TDS', path: '/payments/expenses', icon: 'bi-cash-stack', perm: ['expenses', 'view'] }
      ]
    },
    {
      id: 'tax',
      title: 'Tax & Compliance',
      icon: 'bi-calculator',
      items: [
        { title: 'GST Summary & GSTR-1', path: '/tax/gst', icon: 'bi-calculator', perm: ['tax_gst', 'view'] },
        { title: 'TDS Management', path: '/tax/tds', icon: 'bi-file-earmark-ruled', perm: ['tax_tds', 'view'] }
      ]
    },
    {
      id: 'settings',
      title: 'Analytics & Settings',
      icon: 'bi-gear',
      items: [
        { title: 'Reports Hub', path: '/reports', icon: 'bi-bar-chart-line-fill', perm: ['reports', 'view'] },
        { title: 'Business Profile', path: '/settings/business', icon: 'bi-gear-fill', perm: ['settings', 'view'] },
        { title: 'Team & RBAC', path: '/settings/members', icon: 'bi-shield-lock-fill', perm: ['settings', 'view'] },
        { title: 'Audit Logs', path: '/settings/audit-logs', icon: 'bi-activity', perm: ['audit_logs', 'view'] }
      ]
    }
  ];

  // Helper to determine active category group based on pathname
  const findActiveGroup = (pathname) => {
    for (const group of menuGroups) {
      if (group.items.some((item) => pathname.startsWith(item.path))) {
        return group.id;
      }
    }
    return null;
  };

  const [openCategory, setOpenCategory] = useState(() => findActiveGroup(location.pathname));

  useEffect(() => {
    // When route changes, auto-open active group
    const activeId = findActiveGroup(location.pathname);
    if (activeId) {
      setOpenCategory(activeId);
    }
    setShowMobileSidebar(false);
    setShowUserMenu(false);
    setShowNotifications(false);
    setSearchResults(null);
  }, [location.pathname]);

  const handleToggleCategory = (groupId) => {
    // Single-expand accordion: clicking opened category closes it, clicking another opens it & closes previous
    setOpenCategory((prev) => (prev === groupId ? null : groupId));
  };

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
        {/* Top Sidebar Header: Active Company Brand / Logo */}
        <div className="d-flex justify-content-between align-items-center sidebar-brand">
          <NavLink to="/dashboard" className="d-flex align-items-center text-decoration-none text-white gap-2 overflow-hidden flex-grow-1">
            {activeBusiness?.logoUrl ? (
              <img
                src={activeBusiness.logoUrl}
                alt={activeBusiness.name || 'Company Logo'}
                style={{ maxHeight: '38px', maxWidth: '160px', objectFit: 'contain' }}
              />
            ) : (
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                <div
                  className="d-flex align-items-center justify-content-center fw-extrabold text-white rounded shadow-sm flex-shrink-0"
                  style={{ width: '32px', height: '32px', fontSize: '0.92rem', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
                >
                  {(activeBusiness?.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.88rem', letterSpacing: '-0.01em', lineHeight: '1.2' }}>
                    {activeBusiness?.name || 'My Company'}
                  </div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>
                    {activeBusiness?.city ? `${activeBusiness.city}, ` : ''}{activeBusiness?.state || 'GST Billing'}
                  </div>
                </div>
              </div>
            )}
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

        <div className="sidebar-menu">
          {/* 1. Direct Links (Dashboard & POS) */}
          <div className="mb-2">
            {topDirectLinks.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.path}
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon}`}></i>
                <span style={{ flex: 1 }}>{item.title}</span>
                {item.badge && (
                  <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.65rem' }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="nav-section-title px-2 pb-1 pt-2">
            Workspace Modules
          </div>

          {/* 2. Collapsible Accordion Groups */}
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.perm || hasPermission(item.perm[0], item.perm[1])
            );
            if (visibleItems.length === 0) return null;

            const isOpen = openCategory === group.id;
            const isAnyChildActive = visibleItems.some((item) => location.pathname.startsWith(item.path));

            return (
              <div key={group.id} className="sidebar-accordion-group mb-1">
                <button
                  type="button"
                  className={`sidebar-category-btn ${isOpen ? 'open' : ''} ${isAnyChildActive ? 'active-category' : ''}`}
                  onClick={() => handleToggleCategory(group.id)}
                >
                  <div className="d-flex align-items-center gap-2 overflow-hidden">
                    <i className={`bi ${group.icon} ${isAnyChildActive ? 'text-primary' : 'text-muted'}`}></i>
                    <span className="text-truncate">{group.title}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <i className="bi bi-chevron-down chevron-icon"></i>
                  </div>
                </button>

                {isOpen && (
                  <ul className="sidebar-submenu">
                    {visibleItems.map((subItem, subIdx) => (
                      <li key={subIdx}>
                        <NavLink
                          to={subItem.path}
                          className={({ isActive }) => `sidebar-subnav-link ${isActive ? 'active' : ''}`}
                        >
                          <i className={`bi ${subItem.icon}`}></i>
                          <span>{subItem.title}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Fixed Pinned Sidebar Footer */}
        <div className="sidebar-footer">
          {/* User Profile & Explicit Logout Button */}
          <div className="p-2 px-3 border-bottom border-secondary border-opacity-25">
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2 overflow-hidden flex-grow-1" title={`${user?.name || 'User'} (${user?.email || ''})`}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                    {activeBusiness?.role || 'Admin'}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="btn btn-sm btn-outline-danger py-1 px-2 d-flex align-items-center gap-1 flex-shrink-0"
                title="Log Out of System"
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span className="d-none d-sm-inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Bottom Powered by TheBox */}
          <div
            style={{
              padding: '0.5rem 1rem',
              background: '#01040f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Powered by
            </span>
            <img
              src="/logo-blue.svg"
              alt="TheBox"
              style={{ height: '18px', maxWidth: '90px', objectFit: 'contain' }}
            />
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

            {/* Direct Instant Logout Button on Topbar (Desktop/Tablet) */}
            <button
              onClick={logout}
              className="btn btn-outline-danger btn-sm d-none d-sm-flex align-items-center gap-1 p-2"
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
