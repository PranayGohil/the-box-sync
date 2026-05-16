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
      </Nav>
    </>
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
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Operations;
