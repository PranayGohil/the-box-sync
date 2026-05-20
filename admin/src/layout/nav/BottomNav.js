import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { useSelector } from 'react-redux';
import { AuthContext } from 'contexts/AuthContext';

const BottomNav = () => {
  const { isLogin } = useSelector((state) => state.auth);
  const { attrMobile } = useSelector((state) => state.menu);
  const { pathname } = useLocation();
  const { activePlans } = useContext(AuthContext);

  if (!isLogin || attrMobile) return null;

  const isSettings = pathname.startsWith('/settings');
  const isOperations = pathname.startsWith('/operations');

  const settingsItems = [
    { to: '/settings/profile', icon: 'user', label: 'Account' },
    { to: '/settings/tax-charges', icon: 'dollar', label: 'Taxes' },
    { to: '/settings/subscription', icon: 'star', label: 'Sub' },
    { to: '/settings/manage-website', icon: 'web-page', label: 'Web' },
    { to: '/settings/forgot-password', icon: 'key', label: 'Pass' },
  ];

  const operationsItems = [
    { to: '/operations/order-history', icon: 'cart', label: 'Orders' },
    { to: '/operations/manage-table', icon: 'layout-5', label: 'Tables' },
    { to: '/operations/manage-menu', icon: 'book-open', label: 'Menu' },
    { to: '/operations/inventory-history', icon: 'boxes', label: 'Inventory' },
    { to: '/operations/feedback', icon: 'message', label: 'Feedback', hide: !activePlans.includes('Feedback') },
  ].filter(item => !item.hide);

  const defaultItems = [
    { to: '/dashboard', icon: 'grid-2', label: 'Dash' },
    { to: '/operations', icon: 'list', label: 'Ops' },
    { to: '/staff', icon: 'user', label: 'Staff' },
    { to: '/statistics', icon: 'chart-4', label: 'Stats' },
    { to: '/settings', icon: 'gear', label: 'Settings' },
  ];

  let navItems = [];
  if (isOperations) {
    navItems = operationsItems;
  } else if (isSettings) {
    navItems = settingsItems;
  } else {
    return null;
  }

  return (
    <div className="bottom-nav-wrapper d-lg-none">
      <style>{`
        .bottom-nav-wrapper {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1050;
          width: 95%;
          max-width: 500px;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .bottom-nav-pill {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(25px) saturate(200%);
          -webkit-backdrop-filter: blur(25px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.45);
          border-radius: 40px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          pointer-events: auto;
        }

        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none !important;
          color: #64748b;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bottom-nav-item.active {
          color: #1ea8e7;
          background: rgba(30, 168, 231, 0.12);
          transform: translateY(-5px);
        }

        /* Adjust main layout for bottom nav space */
        @media (max-width: 991px) {
          body {
            padding-bottom: 90px !important;
          }
        }
      `}</style>

      <div className="bottom-nav-pill">
        {navItems.map((item) => {
          const checkIsActive = () => {
            if (item.to === '/operations/order-history') {
              return pathname.startsWith('/operations/order-history') || pathname.startsWith('/operations/order-details');
            }
            if (item.to === '/operations/manage-table') {
              return pathname.startsWith('/operations/manage-table') || pathname.startsWith('/operations/add-table');
            }
            if (item.to === '/operations/manage-menu') {
              return pathname.startsWith('/operations/manage-menu') || pathname.startsWith('/operations/add-dish') || pathname.startsWith('/operations/qr-for-menu');
            }
            if (item.to === '/operations/inventory-history') {
              const inventoryPaths = ['/operations/inventory', '/operations/add-inventory', '/operations/edit-inventory', '/operations/complete-inventory', '/operations/stock-management', '/operations/daily-stock-logs', '/operations/wastage-log', '/operations/requested-inventory'];
              return inventoryPaths.some(p => pathname.startsWith(p));
            }
            if (item.to === '/operations/feedback') {
              return pathname.startsWith('/operations/feedback') || pathname.startsWith('/operations/qr-for-feedback');
            }
            return pathname.startsWith(item.to);
          };

          const isActive = checkIsActive();

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <CsLineIcons icon={item.icon} size="20" />
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
