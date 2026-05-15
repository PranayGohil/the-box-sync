import React, { useMemo } from 'react';
import { Col } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getMenuItems } from 'routing/helper';
import allRoutes from 'routes.js';
import SidebarMenuItems from './SidebarMenuItems';

const SidebarMenu = () => {
  const { isLogin, currentUser } = useSelector((state) => state.auth);
  const { useSidebar } = useSelector((state) => state.menu);

  const menuItemsMemo = useMemo(
    () =>
      getMenuItems({
        data: allRoutes.sidebarItems,
        isLogin,
        userRole: currentUser.role,
      }),
    [isLogin, currentUser]
  );

  if (!useSidebar === true) {
    return <></>;
  }
  return (
    <Col xs="auto" className="side-menu-container">
      <style>{`
        .side-menu a {
          border-radius: 50px !important;
          padding: 0.75rem 1.25rem !important;
          margin-bottom: 0.35rem !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.2s ease !important;
          border: 1px solid transparent !important;
          text-decoration: none !important;
          color: var(--alternate) !important;
          background: transparent !important;
        }
        .side-menu a:hover,
        .side-menu a.active {
          color: var(--primary) !important;
          background-color: rgba(var(--primary-rgb), 0.08) !important;
          border-color: rgba(var(--primary-rgb), 0.2) !important;
        }
        .side-menu a.active .icon,
        .side-menu a.active .label {
          color: var(--primary) !important;
          font-weight: 700 !important;
        }
        .side-menu a[data-bs-target] {
          background: transparent !important;
          border: none !important;
          color: var(--muted) !important;
          font-weight: 800 !important;
          padding-top: 1.5rem !important;
          padding-bottom: 0.5rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          pointer-events: none !important;
        }
        .side-menu ul {
          padding-left: 0.5rem !important;
        }
      `}</style>
      <ul className="sw-25 side-menu mb-0 primary" id="menuSide">
        <SidebarMenuItems menuItems={menuItemsMemo} />
      </ul>
    </Col>
  );
};
export default SidebarMenu;
