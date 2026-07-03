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

import ManageMenu from './menu/ManageMenu';
import AddDishes from './menu/AddDishes';
import QRforMenu from './menu/QRforMenu';

import FinancialReport from './FinancialReport';

const NavContent = () => {
  const { activePlans } = useContext(AuthContext);
  return (
    <>
      <style>{`
        .operations-sidebar .nav-link {
          border-radius: 50px !important;
          padding: 0.6rem 1.25rem !important;
          margin-bottom: 0.15rem !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.2s ease !important;
          border: 1px solid transparent !important;
          text-decoration: none !important;
          color: #64748b !important;
          background: transparent !important;
          font-size: 0.85rem !important;
        }
        .operations-sidebar .nav-link:hover,
        .operations-sidebar .nav-link.active {
          color: #23b3f4 !important;
          background-color: rgba(35, 179, 244, 0.08) !important;
          border-color: rgba(35, 179, 244, 0.2) !important;
        }
        .operations-sidebar .nav-link.active span,
        .operations-sidebar .nav-link.active svg {
          color: #23b3f4 !important;
          font-weight: 700 !important;
        }
        .operations-sidebar .section-header {
          display: flex !important;
          align-items: center !important;
          padding: 1.25rem 1.25rem 0.5rem 1.25rem !important;
          color: #1e293b !important;
          font-weight: 700 !important;
          font-size: 0.95rem !important;
          letter-spacing: -0.01em !important;
        }
        .operations-sidebar .section-header svg {
          color: #94a3b8 !important;
          margin-right: 12px !important;
        }
        .operations-sidebar .sub-menu-container {
          padding-left: 0.5rem !important;
        }
      `}</style>
      <Nav className="flex-column operations-sidebar">
        <div className="mb-1">
          <div className="section-header">
            <CsLineIcons icon="cart" size="17" />
            <span className="align-middle">Order</span>
          </div>
          <div className="sub-menu-container">
            <Nav.Link as={NavLink} to="/operations/order-history" className="px-0" isActive={(match, location) => {
              return location.pathname.startsWith('/operations/order-history') || location.pathname.startsWith('/operations/order-details');
            }}>
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Order History</span>
            </Nav.Link>
          </div>
        </div>

        <div className="mb-1">
          <div className="section-header">
            <CsLineIcons icon="book-open" size="17" />
            <span className="align-middle">Menu</span>
          </div>
          <div className="sub-menu-container">
            <Nav.Link as={NavLink} to="/operations/manage-menu" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Manage Menu</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/operations/add-dish" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Add Dish</span>
            </Nav.Link>
            {activePlans?.includes('Scan For Menu') && (
              <Nav.Link as={NavLink} to="/operations/qr-for-menu" className="px-0">
                <i className="me-2 sw-3 d-inline-block" />
                <span className="align-middle">QR for Menu</span>
              </Nav.Link>
            )}
          </div>
        </div>

        <div className="mb-1">
          <div className="section-header">
            <CsLineIcons icon="file-text" size="17" />
            <span className="align-middle">Report</span>
          </div>
          <div className="sub-menu-container">
            <Nav.Link as={NavLink} to="/operations/financial-report" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Expense-Income</span>
            </Nav.Link>
          </div>
        </div>
      </Nav>
    </>
  );
};

const MobileBottomNav = () => {
  const { pathname } = useLocation();

  const navItems = [
    { label: 'Order', icon: 'cart', to: '/operations/order-history' },
    { label: 'Menu', icon: 'book-open', to: '/operations/manage-menu' },
    { label: 'Report', icon: 'file-text', to: '/operations/financial-report' },
  ];

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
          const isActive = pathname.startsWith(item.to);
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
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10) || 1200;

  const { activePlans } = useContext(AuthContext);

  return (
    <div className="position-relative pb-7 pb-lg-0">
      {width && width < lgBreakpoint && <MobileBottomNav />}
      <Row>
        {(width && width >= lgBreakpoint) ? (
          <Col xs="auto" className="d-none d-lg-flex">
            <div className="nav flex-column sw-25">
              <NavContent />
            </div>
          </Col>
        ) : (<div className="pt-7" />)}
        <Col>
          <Switch>
            <Route exact path="/operations" render={() => <Redirect to="/operations/order-history" />} />
            <Route exact path="/operations/order-history" render={() => <OrderHistory />} />
            <Route exact path="/operations/order-details/:id" render={() => <OrderDetails />} />

            <Route exact path="/operations/manage-menu" render={() => <ManageMenu />} />
            <Route exact path="/operations/add-dish" render={() => <AddDishes />} />
            <Route
              exact
              path="/operations/qr-for-menu"
              render={() => (
                <>
                  {activePlans?.includes('Scan For Menu') ? (
                    <QRforMenu />
                  ) : (
                    <div className="text-center p-5">
                      <CsLineIcons icon="warning-hexagon" className="text-warning mb-3" size="50" />
                      <h4>Access Restricted</h4>
                      <p className="text-muted">You need the 'Scan For Menu' plan to access this feature.</p>
                    </div>
                  )}
                </>
              )}
            />

            <Route exact path="/operations/financial-report" render={() => <FinancialReport />} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Operations;