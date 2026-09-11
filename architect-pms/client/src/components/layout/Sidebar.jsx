import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import {
  LayoutDashboard,
  FolderPlus,
  Users,
  Search,
  CalendarCheck,
  Bell,
  Image,
  PieChart,
  Shield,
  FileText,
  LogOut,
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard',      path: '/dashboard',           icon: LayoutDashboard, roles: ['admin','architect','staff','site_engineer'], end: true },
      { label: 'Cases & Search', path: '/projects',            icon: Search,          roles: ['admin','architect','staff','site_engineer'], end: true },
      { label: 'Create Case',    path: '/projects/new',        icon: FolderPlus,      roles: ['admin','architect','staff'], end: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Data Entry',   path: '/data-entry',          icon: Users,         roles: ['admin','architect','staff'], end: true },
      { label: 'Site Visits',  path: '/site-visits',         icon: CalendarCheck, roles: ['admin','architect','staff','site_engineer'], end: true },
      { label: 'Reminders',    path: '/reminders',           icon: Bell,          roles: ['admin','architect','staff','site_engineer'], end: true },
      { label: 'Site Banner',  path: '/projects/banner-tool',icon: Image,         roles: ['admin','architect','staff'], end: true },
      { label: 'Reports',      path: '/reports',             icon: PieChart,      roles: ['admin','architect'], end: true },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'User Management',  path: '/settings/users',     icon: Shield,          roles: ['admin'] },
      { label: 'Audit Log',        path: '/settings/audit-log', icon: FileText,        roles: ['admin'] },
    ],
  },
];

const Sidebar = ({ collapsed, toggleSidebar, mobileOpen, closeMobileSidebar }) => {
  const { user, logout } = useAuth();
  const { showConfirm } = useModal();

  const handleLogout = async (isMobile = false) => {
    const confirmed = await showConfirm({
      title: 'Confirm Sign Out',
      message: 'Are you sure you want to log out of Architect PMS?',
      type: 'warning',
      confirmText: 'Sign Out',
      cancelText: 'Stay Logged In',
    });
    if (confirmed) {
      if (isMobile) closeMobileSidebar();
      logout();
    }
  };

  const renderNav = (isMobile = false) => (
    <>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Building2 size={22} color="#fff" />
        </div>
        {(!collapsed || isMobile) && (
          <div style={{ overflow: 'hidden' }}>
            <div className="sidebar-brand-title">ARCHITECT PMS</div>
            <div className="sidebar-brand-sub">Municipal Permissions</div>
          </div>
        )}
        {isMobile && (
          <button
            onClick={closeMobileSidebar}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter(i => !user || i.roles.includes(user.role));
          if (!visible.length) return null;
          return (
            <div key={group.label}>
              {(!collapsed || isMobile) && (
                <div className="sidebar-section-label">{group.label}</div>
              )}
              {visible.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end === true}
                    onClick={() => isMobile && closeMobileSidebar()}
                    title={collapsed && !isMobile ? item.label : ''}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'active' : ''}`
                    }
                    style={{ textDecoration: 'none' }}
                  >
                    <Icon size={18} className="nav-icon" style={{ flexShrink: 0 }} />
                    {(!collapsed || isMobile) && (
                      <span className="nav-label">{item.label}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {user && (
        <div className="sidebar-footer">
          {(!collapsed || isMobile) ? (
            <div className="user-tile">
              <div className="user-avatar">{user.name?.charAt(0) ?? 'U'}</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user.role}</div>
              </div>
              <button
                onClick={() => handleLogout(isMobile)}
                title="Sign out"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', flexShrink: 0 }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div className="user-avatar" style={{ width: 30, height: 30, fontSize: '0.78rem' }}>{user.name?.charAt(0) ?? 'U'}</div>
              <button onClick={() => handleLogout(false)} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                <LogOut size={16} />
              </button>
            </div>
          )}

          {/* Collapse toggle — desktop only */}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              style={{
                marginTop: '0.5rem',
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '5px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`sidebar-shell d-none d-md-flex flex-column ${collapsed ? 'collapsed' : ''}`}>
        {renderNav(false)}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && <div className="mobile-overlay d-md-none" onClick={closeMobileSidebar} />}

      {/* Mobile Drawer */}
      <div className={`mobile-sidebar-drawer d-md-none ${mobileOpen ? 'open' : ''}`}
        style={{ display: 'flex', flexDirection: 'column' }}>
        {renderNav(true)}
      </div>
    </>
  );
};

export default Sidebar;
