import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { useSelector } from 'react-redux';
import { AuthContext } from 'contexts/AuthContext';

const BottomNav = () => {
  const { isLogin } = useSelector((state) => state.auth);
  const { attrMobile, navClasses } = useSelector((state) => state.menu);
  const { pathname } = useLocation();
  const { activePlans, cashierType } = useContext(AuthContext);

  if (!isLogin || attrMobile) return null;

  const isSidebarOpen = navClasses && navClasses['mobile-side-in'];

  const isSettings = pathname.startsWith('/settings') || pathname.startsWith('/pages/profile/settings');
  const isOperations = pathname.startsWith('/operations');

  const dashUrl = cashierType === 'dine-in' ? '/dashboard/manager' : '/dashboard/qsr';
  const settingsItems = [
    { to: '/pages/profile/settings', icon: 'user', label: 'Account' },
    { to: '/pages/profile/standard', icon: 'settings-2', label: 'Profile' },
    { to: dashUrl, icon: 'home', label: 'Dash' },
  ];

  const operationsItems = [
    {
      to: '/operations/order-history',
      icon: 'handbag',
      label: 'Orders',
      isActive: (match, location) => {
        return location.pathname.startsWith('/operations/order-history') || location.pathname.startsWith('/operations/order-details');
      },
    },
    {
      to: '/operations/manage-reservations',
      icon: 'calendar',
      label: 'Res',
      hide: !activePlans.includes('Reservation Manager'),
      isActive: (match, location) => {
        return location.pathname.startsWith('/operations/manage-reservations') || location.pathname.startsWith('/operations/qr-for-reservation');
      },
    },
    {
      to: '/operations/manage-table',
      icon: 'square',
      label: 'Tables',
      isActive: (match, location) => {
        return location.pathname.startsWith('/operations/manage-table') || location.pathname.startsWith('/operations/add-table');
      },
    },
    {
      to: '/operations/manage-menu',
      icon: 'list',
      label: 'Menu',
      isActive: (match, location) => {
        return (
          location.pathname.startsWith('/operations/manage-menu') ||
          location.pathname.startsWith('/operations/add-dish') ||
          location.pathname.startsWith('/operations/qr-for-menu')
        );
      },
    },
    {
      to: '/operations/inventory-history',
      icon: 'boxes',
      label: 'Inventory',
      isActive: (match, location) => {
        const inventoryPaths = [
          '/operations/inventory-history',
          '/operations/requested-inventory',
          '/operations/add-inventory',
          '/operations/edit-inventory',
          '/operations/inventory-details',
          '/operations/stock-management',
          '/operations/daily-stock-logs',
          '/operations/wastage-log',
          '/operations/daily-opening-stock',
          '/operations/daily-closing-stock',
          '/operations/inventory-report',
        ];
        return inventoryPaths.some((p) => location.pathname.startsWith(p));
      },
    },
    {
      to: '/operations/feedback',
      icon: 'message',
      label: 'Feedback',
      isActive: (match, location) => {
        return location.pathname.startsWith('/operations/feedback') || location.pathname.startsWith('/operations/qr-for-feedback');
      },
    },
  ].filter((item) => !item.hide);

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
          z-index: ${isSidebarOpen ? '999' : '1050'};
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
          color: #23b3f4;
          background: rgba(35, 179, 244, 0.12);
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
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className="bottom-nav-item" activeClassName="active" isActive={item.isActive}>
            <CsLineIcons icon={item.icon} size="20" />
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
