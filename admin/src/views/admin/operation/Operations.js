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
    <Nav className="flex-column">
      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/order-history" className="px-0">
          <CsLineIcons icon="cart" className="me-2 sw-3" size="17" />
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
        <Nav.Link as={NavLink} to="/operations/manage-table" className="px-0">
          <CsLineIcons icon="layout-5" className="me-2 sw-3" size="17" />
          <span className="align-middle">Table</span>
        </Nav.Link>
        <div>
          <Nav.Link as={NavLink} to="/operations/manage-table" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Table</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/add-table" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Add Table</span>
          </Nav.Link>
        </div>
      </div>

      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/manage-menu" className="px-0">
          <CsLineIcons icon="book-open" className="me-2 sw-3" size="17" />
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
          {activePlans.includes('Scan For Menu') && (
          <Nav.Link as={NavLink} to="/operations/qr-for-menu" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">QR for Menu</span>
          </Nav.Link>
          )}
        </div>
      </div>

      {activePlans.includes('Hotel Manager') && (
        <div className="mb-2">
          <Nav.Link as={NavLink} to="/operations/manage-rooms" className="px-0">
            <i className="bi-door-open me-2 ms-1 sw-3" size="17" />
            <span className="align-middle">Rooms</span>
          </Nav.Link>
          <div>
            <Nav.Link as={NavLink} to="/operations/manage-rooms" className="px-0 pt-1">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Manage Rooms</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/operations/add-room" className="px-0 pt-1">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Add Room</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/operations/add-room-category" className="px-0 pt-1">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Add Room Category</span>
            </Nav.Link>
          </div>
        </div>
      )}

      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/inventory-history" className="px-0">
          <CsLineIcons icon="boxes" className="me-2 sw-3" size="17" />
          <span className="align-middle">Inventory</span>
        </Nav.Link>
        <div>
          <Nav.Link as={NavLink} to="/operations/inventory-history" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Inventory</span>
          </Nav.Link>
        </div>
      </div>

      {activePlans.includes('Feedback') && (
      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/feedback" className="px-0">
          <CsLineIcons icon="message" className="me-2 sw-3" size="17" />
          <span className="align-middle">Feedback</span>
        </Nav.Link>
        <div>
          <Nav.Link as={NavLink} to="/operations/feedback" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">View Feedbacks</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/qr-for-feedback" className="px-0 pt-1">
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

  const navItems = [
    { label: 'Order', icon: 'cart', to: '/operations/order-history' },
    { label: 'Table', icon: 'layout-5', to: '/operations/manage-table' },
    { label: 'Menu', icon: 'book-open', to: '/operations/manage-menu' },
    { label: 'Inventory', icon: 'boxes', to: '/operations/inventory-history' },
    { label: 'Feedback', icon: 'message', to: '/operations/feedback', hide: !activePlans.includes('Feedback') },
  ].filter(item => !item.hide);

  return (
    <div 
      className="position-fixed bottom-0 start-0 end-0 d-lg-none px-4" 
      style={{ 
        zIndex: 1050, 
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
      }}
    >
      <div 
        className="d-flex justify-content-around align-items-center position-relative shadow-lg"
        style={{ 
          height: '65px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(25px)',
          borderRadius: '35px',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 15px 40px rgba(0,0,0,0.12)'
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className="d-flex flex-column align-items-center text-decoration-none"
              style={{ flex: 1, height: '100%', position: 'relative', justifyContent: 'center' }}
            >
              <div 
                className="d-flex align-items-center justify-content-center transition-all"
                style={{ 
                  width: isActive ? '60px' : '38px',
                  height: isActive ? '60px' : '38px',
                  background: isActive ? 'linear-gradient(135deg, #1ea8e7 0%, #007bff 100%)' : 'transparent',
                  borderRadius: '50%',
                  transform: isActive ? 'translateY(-28px) scale(1.1)' : 'scale(1)',
                  boxShadow: isActive ? '0 10px 25px rgba(30, 168, 231, 0.4)' : 'none',
                  border: isActive ? '5px solid #fff' : 'none',
                  transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  zIndex: isActive ? 5 : 1
                }}
              >
                <div 
                  style={{ 
                    filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CsLineIcons 
                    icon={item.icon} 
                    size={isActive ? 32 : 28} 
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

const Operations = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();

  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10) || 1200;

  const { activePlans } = useContext(AuthContext);

  return (
    <div className="position-relative pb-7 pb-lg-0">
      {/* MOBILE BOTTOM NAV — REMOVED AS IT IS NOW HANDLED BY GLOBAL BOTTOMNAV */}
      {/* {width && width < lgBreakpoint && <MobileBottomNav />} */}
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
