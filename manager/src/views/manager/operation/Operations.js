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
// Trigger hot reload compilation bust

import ReservationForm from './reservation/ReservationForm';
import ManageReservations from './reservation/ManageReservations';
import QRforReservation from './reservation/QRforReservation';

import ManageTable from './table/ManageTable';
import AddTable from './table/AddTable';

import ManageMenu from './menu/ManageMenu';
import AddDishes from './menu/AddDishes';
import QRforMenu from './menu/QRforMenu';
import AddInventory from './inventory/AddInventory';
import EditInventory from './inventory/EditInventory';
import InventoryHistory from './inventory/InventoryHistory';
import InventoryDetails from './inventory/InventoryDetails';
import StockManagement from './inventory/StockManagement';
import DailyOpeningStock from './inventory/DailyOpeningStock';
import DailyClosingStock from './inventory/DailyClosingStock';
import DailyStockLogs from './inventory/DailyStockLogs';
import WastageLog from './inventory/WastageLog';
import InventoryReport from './inventory/InventoryReport';

import Feedback from './feedback/Feedback';
import QRforFeedback from './feedback/QRforFeedback';

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

      {/* Reservation Section - Manager Exclusive */}
      {activePlans.includes('Reservation Manager') && (
        <div className="mb-1">
          <div className="operations-section-header">
            <CsLineIcons icon="calendar" size="17" />
            <span className="align-middle">Reservation</span>
          </div>
          <div className="operations-sub-menu-container">
            <Nav.Link as={NavLink} to="/operations/manage-reservations" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Manage Reservations</span>
            </Nav.Link>

            <Nav.Link as={NavLink} to="/operations/qr-for-reservation" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">QR for Reservation</span>
            </Nav.Link>
          </div>
        </div>
      )}

      {/* Table Section */}
      {activePlans.includes('Table Management') && (
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
      )}

      {/* Menu Section */}
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

      {/* Inventory Section */}
      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="boxes" size="17" />
          <span className="align-middle">Inventory</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to="/operations/inventory-history" className="px-0" isActive={(match, location) => {
            const inventoryPaths = [
              '/operations/inventory-history',
              '/operations/requested-inventory',
              '/operations/add-inventory',
              '/operations/edit-inventory',
              '/operations/inventory-details',
              '/operations/stock-management',
              '/operations/daily-stock-logs',
              '/operations/wastage-log',
              '/operations/inventory-report'
            ];
            return inventoryPaths.some(p => location.pathname.startsWith(p));
          }}>
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Inventory</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/daily-opening-stock" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Opening Stock</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/daily-closing-stock" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Closing Stock</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/wastage-log" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Wastage Log</span>
          </Nav.Link>
        </div>
      </div>

      {/* Feedback Section */}
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
  );
};

const MobileBottomNav = () => {
  const { activePlans } = useContext(AuthContext);
  const { pathname } = useLocation();
  const { attrMobile } = useSelector((state) => state.menu);

  if (attrMobile) return null;

  const navItems = [
    { label: 'Order', icon: 'cart', to: '/operations/order-history' },
    { label: 'Reserv.', icon: 'calendar', to: '/operations/manage-reservations', hide: !activePlans.includes('Reservation Manager') },
    { label: 'Table', icon: 'layout-5', to: '/operations/manage-table', hide: !activePlans.includes('Table Management') },
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

            {activePlans.includes('Reservation Manager') && (
              <Route path="/operations/manage-reservations" component={ManageReservations} />
            )}
            {activePlans.includes('Reservation Manager') && (
              <Route path="/operations/reservation-form" render={() => <ReservationForm restaurantUserId={currentUser?._id} />} />
            )}
            {activePlans.includes('Reservation Manager') && (
              <Route path="/operations/qr-for-reservation" component={QRforReservation} />
            )}

            {activePlans.includes('Table Management') && (
              <Route path="/operations/manage-table" component={ManageTable} />
            )}
            {activePlans.includes('Table Management') && (
              <Route path="/operations/add-table" component={AddTable} />
            )}

            <Route path="/operations/manage-menu" component={ManageMenu} />
            <Route path="/operations/add-dish" component={AddDishes} />
            {activePlans.includes('Scan For Menu') && (
              <Route path="/operations/qr-for-menu" component={QRforMenu} />
            )}

            <Route path="/operations/requested-inventory" render={() => <Redirect to="/operations/inventory-history" />} />
            <Route path="/operations/inventory-history" component={InventoryHistory} />
            <Route path="/operations/add-inventory" component={AddInventory} />
            <Route path="/operations/edit-inventory/:id" component={EditInventory} />
            <Route path="/operations/inventory-details/:id" component={InventoryDetails} />
            <Route path="/operations/stock-management" component={StockManagement} />
            <Route path="/operations/daily-opening-stock" component={DailyOpeningStock} />
            <Route path="/operations/daily-closing-stock" component={DailyClosingStock} />
            <Route path="/operations/daily-stock-logs" component={DailyStockLogs} />
            <Route path="/operations/wastage-log" component={WastageLog} />
            <Route path="/operations/inventory-report" component={InventoryReport} />

            {activePlans.includes('Feedback') && (
              <Route path="/operations/feedback" component={Feedback} />
            )}
            {activePlans.includes('Feedback') && (
              <Route path="/operations/qr-for-feedback" component={QRforFeedback} />
            )}
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Operations;
