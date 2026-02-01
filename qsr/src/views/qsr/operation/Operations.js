import React from 'react';
import { Row, Col, Nav, Dropdown } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import 'react-datepicker/dist/react-datepicker.css';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink } from 'react-router-dom';
import OrderHistory from './order/OrderHistory';
import OrderDetails from './order/OrderDetails';

import ManageMenu from './menu/ManageMenu';
import AddDishes from './menu/AddDishes';
import QRforMenu from './menu/QRforMenu';

const NavContent = () => {
  return (
    <Nav className="flex-column">
      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/order-history" className="px-0">
          <CsLineIcons icon="handbag" className="me-2 sw-3" size="17" />
          <span className="align-middle">Order</span>
        </Nav.Link>
        <div>
          <Nav.Link as={NavLink} to="/operations/order-history" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Order History</span>
          </Nav.Link>
        </div>
      </div>

      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/manage-menu" className="px-0">
          <CsLineIcons icon="list" className="me-2 sw-3" size="17" />
          <span className="align-middle">Menu</span>
        </Nav.Link>
        <div>
          <Nav.Link as={NavLink} to="/operations/manage-menu" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Menu</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/add-dish" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Add Dish</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/qr-for-menu" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">QR for Menu</span>
          </Nav.Link>
        </div>
      </div>
    </Nav>
  );
};

const mobileNavItems = [
  {
    label: 'Order',
    icon: 'handbag',
    items: [{ label: 'Order History', to: '/operations/order-history' }],
  },
  {
    label: 'Menu',
    icon: 'list',
    items: [
      { label: 'Manage Menu', to: '/operations/manage-menu' },
      { label: 'Add Dish', to: '/operations/add-dish' },
      { label: 'QR for Menu', to: '/operations/qr-for-menu' },
    ],
  },
];

const MobileNavbar = () => {
  return (
    <div className="d-flex gap-2 overflow-auto pb-2">
      {mobileNavItems.map((nav) => (
        <Dropdown key={nav.label} container="body" className="position-static">
          <Dropdown.Toggle variant="outline-primary" size="sm" className="d-flex align-items-center gap-1">
            <CsLineIcons icon={nav.icon} size="16" />
            {nav.label}
          </Dropdown.Toggle>

          <Dropdown.Menu
            style={{
              position: 'absolute',
              minWidth: '150px',
              maxHeight: '300px',
              overflowY: 'auto',
              marginTop: '5px',
            }}
          >
            {nav.items.map((item) => (
              <Dropdown.Item as={NavLink} key={item.to} to={item.to}>
                {item.label}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      ))}
    </div>
  );
};

const Operations = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();

  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10);

  return (
    <div className="position-relative">
      {/* ✅ MOBILE NAVBAR — OUTSIDE SCROLL */}
      {width && width < lgBreakpoint && (
        <div className="position-absolute top-0 start-0 end-0 d-lg-none">
          <MobileNavbar />
        </div>
      )}
      <Row>
        {(width && width >= lgBreakpoint) ? (
          <Col xs="auto" className="d-none d-lg-flex">
            <div className="nav flex-column sw-25 mt-2">
              <NavContent />
            </div>
          </Col>
        ) : (<div className="pt-7" />)}
        <Col>
          <Switch>
            <Route exact path="/operations" render={() => <Redirect to="/operations/order-history" />} />
            <Route path="/operations/order-history" component={OrderHistory} />
            <Route path="/operations/order-details/:id" component={OrderDetails} />

            <Route path="/operations/manage-menu" component={ManageMenu} />
            <Route path="/operations/add-dish" component={AddDishes} />
            <Route path="/operations/qr-for-menu" component={QRforMenu} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Operations;
