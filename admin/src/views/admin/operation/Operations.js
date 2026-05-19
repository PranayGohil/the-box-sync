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

import ManageTable from './table/ManageTable';
import AddTable from './table/AddTable';

import ManageMenu from './menu/ManageMenu';
import AddDishes from './menu/AddDishes';
import QRforMenu from './menu/QRforMenu';

import RequestedInventory from './inventory/RequestedInventory';
import AddInventory from './inventory/AddInventory';
import EditInventory from './inventory/EditInventory';
import InventoryHistory from './inventory/InventoryHistory';
import CompleteInventory from './inventory/CompleteInventory';
import InventoryDetails from './inventory/InventoryDetails';
import StockManagement from './inventory/StockManagement';
import AdminDailyStockLogs from './inventory/AdminDailyStockLogs';
import AdminWastageLog from './inventory/AdminWastageLog';

import Feedback from './feedback/Feedback';
import QRforFeedback from './feedback/QRforFeedback';

const NavContent = () => {
  const { activePlans } = useContext(AuthContext);
  return (
    <>
      
      <Nav className="flex-column operations-operations-sidebar">
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

      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="layout-5" size="17" />
          <span className="align-middle">Table</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to="/operations/manage-table" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Table</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/add-table" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Add Table</span>
          </Nav.Link>
        </div>
      </div>

      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="book-open" size="17" />
          <span className="align-middle">Menu</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to="/operations/manage-menu" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Menu</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/add-dish" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Add Dish</span>
          </Nav.Link>
          {activePlans.includes('Scan For Menu') && (
          <Nav.Link as={NavLink} to="/operations/qr-for-menu" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">QR for Menu</span>
          </Nav.Link>
          )}
        </div>
      </div>

      {activePlans.includes('Hotel Manager') && (
        <div className="mb-1">
          <div className="operations-section-header">
            <i className="bi-door-open me-2 sw-3" style={{ fontSize: '17px' }} />
            <span className="align-middle">Rooms</span>
          </div>
          <div className="operations-sub-menu-container">
            <Nav.Link as={NavLink} to="/operations/manage-rooms" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Manage Rooms</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/operations/add-room" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Add Room</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/operations/add-room-category" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Add Room Category</span>
            </Nav.Link>
          </div>
        </div>
      )}

      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="boxes" size="17" />
          <span className="align-middle">Inventory</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to="/operations/inventory-history" className="px-0" isActive={(match, location) => {
            const inventoryPaths = ['/operations/inventory', '/operations/add-inventory', '/operations/edit-inventory', '/operations/complete-inventory', '/operations/stock-management', '/operations/daily-stock-logs', '/operations/wastage-log', '/operations/requested-inventory'];
            return inventoryPaths.some(p => location.pathname.startsWith(p));
          }}>
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Inventory</span>
          </Nav.Link>
        </div>
      </div>

      {activePlans.includes('Feedback') && (
      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="message" size="17" />
          <span className="align-middle">Feedback</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to="/operations/feedback" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">View Feedbacks</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/qr-for-feedback" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Feedback QR</span>
          </Nav.Link>
        </div>
      </div>
      )}
    </Nav>
    </>
  );
};

const MobileBottomNav = () => {
  const { activePlans } = useContext(AuthContext);
  const { pathname } = useLocation();

  const navItems = [
    { label: 'Order', icon: 'cart', to: '/operations/order-history' },
    { label: 'Table', icon: 'layout-5', to: '/operations/manage-table' },
    { label: 'Menu', icon: 'book-open', to: '/operations/manage-menu' },
    { label: 'Inventory', icon: 'boxes', to: '/operations/inventory-history' },
    { label: 'Feedback', icon: 'message', to: '/operations/feedback', hide: !activePlans.includes('Feedback') },
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
        ) : (<div className="pt-2" />)}
        <Col>
          <Switch>
            <Route exact path="/operations" render={() => <Redirect to="/operations/order-history" />} />
            <Route exact path="/operations/order-history" render={() => <OrderHistory />} />
            <Route exact path="/operations/order-details/:id" render={() => <OrderDetails />} />

            <Route exact path="/operations/manage-table" render={() => <ManageTable />} />
            <Route exact path="/operations/add-table" render={() => <AddTable />} />

            <Route exact path="/operations/manage-menu" render={() => <ManageMenu />} />
            <Route exact path="/operations/add-dish" render={() => <AddDishes />} />
            <Route
              exact
              path="/operations/qr-for-menu"
              render={() => (
                <>
                  {activePlans.includes('Scan For Menu') ? (
                    <QRforMenu />
                  ) : (
                    <div className="text-center">You need to buy or renew to Scan For Menu plan to access this page.</div>
                  )}
                </>
              )}
            />

            <Route exact path="/operations/requested-inventory" render={() => <Redirect to="/operations/inventory-history" />} />
            <Route exact path="/operations/inventory-history" render={() => <InventoryHistory />} />
            <Route exact path="/operations/add-inventory" render={() => <AddInventory />} />
            <Route exact path="/operations/edit-inventory/:id" render={() => <EditInventory />} />
            <Route exact path="/operations/complete-inventory/:id" render={() => <CompleteInventory />} />
            <Route exact path="/operations/inventory-details/:id" render={() => <InventoryDetails />} />
            <Route exact path="/operations/stock-management" render={() => <StockManagement />} />
            <Route exact path="/operations/daily-stock-logs" render={() => <AdminDailyStockLogs />} />
            <Route exact path="/operations/wastage-log" render={() => <AdminWastageLog />} />
            <Route exact path="/operations/inventory-report" render={() => <Redirect to="/statistics/inventory" />} />

            <Route
              exact
              path="/operations/feedback"
              render={() => (
                <>
                  {activePlans.includes('Feedback') ? (
                    <Feedback />
                  ) : (
                    <div className="text-center">You need to buy or renew to Feedback plan to access this page.</div>
                  )}
                </>
              )}
            />
            <Route
              exact
              path="/operations/qr-for-feedback"
              render={() => (
                <>
                  {activePlans.includes('Feedback') ? (
                    <QRforFeedback />
                  ) : (
                    <div className="text-center">You need to buy or renew to Feedback plan to access this page.</div>
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
