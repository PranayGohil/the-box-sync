import React, { useContext } from 'react';
import { Row, Col, Nav, Dropdown } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import 'react-datepicker/dist/react-datepicker.css';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';

import OrderHistory from './order/OrderHistory';
import OrderDetails from './order/OrderDetails';

const NavContent = () => {
  const { activePlans } = useContext(AuthContext);
  return (
    <Nav className="flex-column operations-operations-sidebar">
      {/* Order Section */}
      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="cart" size="17" />
          <span className="align-middle">Order</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to="/operations/order-history" className="px-0" isActive={(match, location) => {
            return location.pathname.startsWith('/operations/order-history') || location.pathname.startsWith('/operations/order-details');
          }}>
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Order History</span>
          </Nav.Link>
        </div>
      </div>
    </Nav>
  );
};

const MobileBottomNav = () => {
  const { activePlans } = useContext(AuthContext);
  const { pathname } = useLocation();
  const { attrMobile } = useSelector((state) => state.menu);

  if (attrMobile) return null;

  const navItems = [
    { label: 'Order', icon: 'cart', to: '/operations/order-history' }
  ].filter(item => !item.hide);

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

        @media (max-width: 991px) {
          body {
            padding-bottom: 90px !important;
          }
        }
      `}</style>

      <div className="bottom-nav-pill">
        {navItems.map((item) => {
          const isActive = pathname.startsWith('/operations/order-history') || pathname.startsWith('/operations/order-details');
          return (
            <NavLink
              key={item.label}
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


const Operations = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();

  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10);
  const { activePlans, currentUser } = useContext(AuthContext);

  return (
    <div className="position-relative pb-7 pb-lg-0">
      {/* MODERN MOBILE BOTTOM NAV */}
      {width && width < lgBreakpoint && <MobileBottomNav />}

      <Row>
        {(width && width >= lgBreakpoint) ? (
          <Col xs="auto" className="d-none d-lg-flex">
            <div className="nav flex-column sw-25">
              <NavContent />
            </div>
          </Col>
        ) : (<div className="pt-2" />)}
        <Col className="ps-lg-2">
          <Switch>
            <Route exact path="/operations" render={() => <Redirect to="/operations/order-history" />} />
            <Route path="/operations/order-history" component={OrderHistory} />
            <Route path="/operations/order-details/:id" component={OrderDetails} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Operations;
