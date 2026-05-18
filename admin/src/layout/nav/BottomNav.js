import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { useSelector } from 'react-redux';
import { AuthContext } from 'contexts/AuthContext';

const BottomNav = () => {
  const { isLogin } = useSelector((state) => state.auth);
  const { pathname } = useLocation();
  const { activePlans } = useContext(AuthContext);

  if (!isLogin) return null;

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
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(25px) saturate(200%);
          -webkit-backdrop-filter: blur(25px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 35px;
          padding: 0px 10px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          width: 100%;
          height: 65px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
          pointer-events: auto;
        }

        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none !important;
          color: #94a3b8;
          flex: 1;
          height: 100%;
          position: relative;
          transition: all 0.3s ease;
        }

        .bottom-nav-bubble {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: transparent;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 1;
        }

        .bottom-nav-item.active-bubble .bottom-nav-bubble {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #1ea8e7 0%, #007bff 100%);
          transform: translateY(-26px) scale(1.05);
          box-shadow: 0 10px 25px rgba(30, 168, 231, 0.4);
          border: 5px solid #ffffff;
          z-index: 5;
        }

        .bottom-nav-icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .bottom-nav-item.active-bubble .bottom-nav-icon-container {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
        }

        /* Adjust main layout for bottom nav space */
        @media (max-width: 991px) {
          body {
            padding-bottom: 95px !important;
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
              className={`bottom-nav-item ${isActive ? 'active-bubble' : ''}`}
            >
              <div className="bottom-nav-bubble">
                <div className="bottom-nav-icon-container">
                  <CsLineIcons
                    icon={item.icon}
                    size={isActive ? "26" : "24"}
                    stroke={isActive ? '#ffffff' : '#94a3b8'}
                    fill={isActive ? 'rgba(255,255,255,0.2)' : 'none'}
                  />
                </div>
              </div>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
