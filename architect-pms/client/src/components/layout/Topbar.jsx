import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { fetchAPI } from '../../services/api';
import { Search, Bell, Shield, LogOut, Menu, ChevronDown } from 'lucide-react';
import { Dropdown } from 'react-bootstrap';

const Topbar = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const { showConfirm } = useModal();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: 'Confirm Sign Out',
      message: 'Are you sure you want to log out of Architect PMS?',
      type: 'warning',
      confirmText: 'Sign Out',
      cancelText: 'Stay Logged In',
    });
    if (confirmed) {
      logout();
    }
  };

  useEffect(() => {
    if (user) {
      fetchAPI('/reminders?status=pending')
        .then((r) => { if (r.success) setCount(r.count); })
        .catch(() => {});
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="topbar">
      {/* Mobile Hamburger */}
      <button
        onClick={onToggleMobileSidebar}
        className="d-md-none btn-icon"
        aria-label="Menu"
        style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '9px', width: 38, height: 38 }}
      >
        <Menu size={19} color="var(--text-secondary)" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '420px', minWidth: 0 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '13px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
              zIndex: 1,
              flexShrink: 0,
            }}
          />
          <input
            type="text"
            placeholder="Search cases, owner, zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '9px',
              paddingLeft: '36px',
              paddingRight: '12px',
              fontSize: '0.855rem',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-main)',
              outline: 'none',
              transition: 'border-color 0.18s, box-shadow 0.18s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(79,110,247,0.12)';
              e.target.style.background = '#fff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
              e.target.style.background = '#f8fafc';
            }}
          />
        </div>
      </form>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginLeft: 'auto' }}>
        {/* Bell */}
        <button
          onClick={() => navigate('/reminders')}
          style={{
            position: 'relative', background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '9px', padding: '8px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            color: count > 0 ? '#f59e0b' : '#64748b', transition: 'all 0.15s',
          }}
        >
          <Bell size={18} />
          {count > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 16, height: 16, borderRadius: '50%',
              background: '#ef4444', color: '#fff',
              fontSize: '0.6rem', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
            }}>
              {count}
            </span>
          )}
        </button>

        {/* User Dropdown */}
        <Dropdown align="end">
          <Dropdown.Toggle
            as="div"
            className="no-caret"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '9px',
              padding: '5px 10px 5px 8px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--prism-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.78rem',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0) ?? 'U'}
            </div>
            <span
              className="d-none d-md-inline"
              style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
            >
              {user?.name?.split(' ').slice(0, 2).join(' ')}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          </Dropdown.Toggle>

          <Dropdown.Menu style={{
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: '14px', padding: '8px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
            minWidth: '200px', marginTop: '6px',
          }}>
            <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user?.role}</div>
            </div>
            {user?.role === 'admin' && (
              <Dropdown.Item onClick={() => navigate('/settings/users')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '9px 10px', borderRadius: 8, marginTop: 4 }}>
                <Shield size={15} color="#f59e0b" /> Admin Settings
              </Dropdown.Item>
            )}
            <Dropdown.Item onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#ef4444', padding: '9px 10px', borderRadius: 8, marginTop: 2 }}>
              <LogOut size={15} /> Sign Out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
};

export default Topbar;
