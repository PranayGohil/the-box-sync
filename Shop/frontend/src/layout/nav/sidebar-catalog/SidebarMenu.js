import React, { useMemo } from 'react';
import { Col } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getMenuItems } from 'routing/helper';
import allRoutes from 'routes.js';
import SidebarMenuItems from './SidebarMenuItems';

const SidebarMenu = () => {
  const { isLogin, currentUser } = useSelector((state) => state.auth);
  const { useSidebar } = useSelector((state) => state.catalog);

  const catalogItemsMemo = useMemo(
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
      <ul className="sw-25 side-catalog mb-0 primary" id="menuSide">
        <SidebarMenuItems catalogItems={catalogItemsMemo} />
      </ul>
    </Col>
  );
};
export default SidebarMenu;
