import React, { useContext } from 'react';
import { Row, Col, Nav, Dropdown } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import 'react-datepicker/dist/react-datepicker.css';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';
import OrderHistory from './order/OrderHistory';
import OrderDetails from './order/OrderDetails';

import ReservationForm from './reservation/ReservationForm';
import ManageReservations from './reservation/ManageReservations';
import QRforReservation from './reservation/QRforReservation';

import ManageTable from './table/ManageTable';
import AddTable from './table/AddTable';

import ManageMenu from './menu/ManageMenu';
import AddDishes from './menu/AddDishes';
import QRforMenu from './menu/QRforMenu';

import RequestedInventory from './inventory/RequestedInventory';
import AddInventory from './inventory/AddInventory';
import EditInventory from './inventory/EditInventory';
import InventoryHistory from './inventory/InventoryHistory';
import InventoryDetails from './inventory/InventoryDetails';
import StockManagement from './inventory/StockManagement';
import DailyOpeningStock from './inventory/DailyOpeningStock';
import DailyClosingStock from './inventory/DailyClosingStock';
import WastageLog from './inventory/WastageLog';
import InventoryReport from './inventory/InventoryReport';

import Feedback from './feedback/Feedback';
import QRforFeedback from './feedback/QRforFeedback';

const NavContent = () => {
  const { activePlans } = useContext(AuthContext);
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

      {activePlans.includes('Reservation Manager') && (
      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/manage-reservations" className="px-0">
          <CsLineIcons icon="calendar" className="me-2 sw-3" size="17" />
          <span className="align-middle">Reservation</span>
        </Nav.Link>
        <div>
          <Nav.Link as={NavLink} to="/operations/manage-reservations" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Reservations</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/reservation-form" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Reservation Form</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/qr-for-reservation" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">QR for Reservation</span>
          </Nav.Link>
        </div>
      </div>
      )}

      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/manage-table" className="px-0">
          <CsLineIcons icon="square" className="me-2 sw-3" size="17" />
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
          {activePlans.includes('Scan For Menu') && (
          <Nav.Link as={NavLink} to="/operations/qr-for-menu" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">QR for Menu</span>
          </Nav.Link>
          )}
        </div>
      </div>

      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/requested-inventory" className="px-0">
          <CsLineIcons icon="boxes" className="me-2 sw-3" size="17" />
          <span className="align-middle">Inventory</span>
        </Nav.Link>
        <div>
          <Nav.Link as={NavLink} to="/operations/requested-inventory" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Requested Inventory</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/inventory-history" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Inventory History</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/add-inventory" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Add Inventory</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/stock-management" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Stock Management</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/daily-opening-stock" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Opening Stock</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/daily-closing-stock" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Closing Stock</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/wastage-log" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Wastage Log</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/inventory-report" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Inventory Report</span>
          </Nav.Link>
        </div>
      </div>

      {activePlans.includes('Feedback') && (
      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/feedback" className="px-0">
          <i className="bi-chat-text me-2 ms-1 sw-3" size="17" />
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

const mobileNavItems = [
  {
    label: 'Order',
    icon: 'handbag',
    items: [{ to: '/operations/order-history', label: 'Order History' }],
  },
  {
    label: 'Reservation',
    icon: 'calendar',
    items: [
      { to: '/operations/manage-reservations', label: 'Manage Reservations' },
      { to: '/operations/reservation-form', label: 'Reservation Form' },
      { to: '/operations/qr-for-reservation', label: 'QR for Reservation' }
    ],
  },
  {
    label: 'Table',
    icon: 'square',
    items: [
      { to: '/operations/manage-table', label: 'Manage Table' },
      { to: '/operations/add-table', label: 'Add Table' },
    ],
  },
  {
    label: 'Menu',
    icon: 'list',
    items: [
      { to: '/operations/manage-menu', label: 'Manage Menu' },
      { to: '/operations/add-dish', label: 'Add Dish' },
      { to: '/operations/qr-for-menu', label: 'QR for Menu' },
    ],
  },
  {
    label: 'Inventory',
    icon: 'boxes',
    items: [
      { to: '/operations/requested-inventory', label: 'Requested Inventory' },
      { to: '/operations/inventory-history', label: 'Inventory History' },
      { to: '/operations/add-inventory', label: 'Add Inventory' },
      { to: '/operations/stock-management', label: 'Stock Management' },
      { to: '/operations/daily-opening-stock', label: '🌅 Opening Stock' },
      { to: '/operations/daily-closing-stock', label: '🌙 Closing Stock' },
      { to: '/operations/wastage-log', label: '🗑 Wastage Log' },
      { to: '/operations/inventory-report', label: '📊 Inventory Report' },
    ],
  },
  {
    label: 'Feedback',
    icon: 'chat-text',
    items: [
      { to: '/operations/feedback', label: 'View Feedbacks' },
      { to: '/operations/qr-for-feedback', label: 'Feedback QR' },
    ],
  },
];

const MobileNavbar = () => {
  const { activePlans } = useContext(AuthContext);

  const filteredNavItems = mobileNavItems.filter(nav => {
    if (nav.label === 'Reservation' && !activePlans.includes('Reservation Manager')) return false;
    if (nav.label === 'Feedback' && !activePlans.includes('Feedback')) return false;
    return true;
  }).map(nav => {
    if (nav.label === 'Menu') {
      return {
        ...nav,
        items: nav.items.filter(item => {
          if (item.label === 'QR for Menu' && !activePlans.includes('Scan For Menu')) return false;
          return true;
        })
      };
    }
    return nav;
  });

  return (
    <div className="d-flex gap-2 overflow-auto pb-2">
      {filteredNavItems.map((nav) => (
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
  const { activePlans } = useContext(AuthContext);

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

            <Route path="/operations/manage-reservations" render={() => (
              <>
                {activePlans.includes('Reservation Manager') ? (
                  <ManageReservations />
                ) : (
                  <div className="text-center">You need to buy or renew to Reservation Manager plan to access this page.</div>
                )}
              </>
            )} />
            <Route path="/operations/reservation-form" render={() => (
              <>
                {activePlans.includes('Reservation Manager') ? (
                  <ReservationForm />
                ) : (
                  <div className="text-center">You need to buy or renew to Reservation Manager plan to access this page.</div>
                )}
              </>
            )} />
            <Route path="/operations/qr-for-reservation" render={() => (
              <>
                {activePlans.includes('Reservation Manager') ? (
                  <QRforReservation />
                ) : (
                  <div className="text-center">You need to buy or renew to Reservation Manager plan to access this page.</div>
                )}
              </>
            )} />

            <Route path="/operations/manage-table" component={ManageTable} />
            <Route path="/operations/add-table" component={AddTable} />

            <Route path="/operations/manage-menu" component={ManageMenu} />
            <Route path="/operations/add-dish" component={AddDishes} />
            <Route path="/operations/qr-for-menu" render={() => (
              <>
                {activePlans.includes('Scan For Menu') ? (
                  <QRforMenu />
                ) : (
                  <div className="text-center">You need to buy or renew to Scan For Menu plan to access this page.</div>
                )}
              </>
            )} />

            <Route path="/operations/requested-inventory" component={RequestedInventory} />
            <Route path="/operations/inventory-history" component={InventoryHistory} />
            <Route path="/operations/add-inventory" component={AddInventory} />
            <Route path="/operations/edit-inventory/:id" component={EditInventory} />
            <Route path="/operations/inventory-details/:id" component={InventoryDetails} />
            <Route path="/operations/stock-management" component={StockManagement} />
            <Route path="/operations/daily-opening-stock" component={DailyOpeningStock} />
            <Route path="/operations/daily-closing-stock" component={DailyClosingStock} />
            <Route path="/operations/wastage-log" component={WastageLog} />
            <Route path="/operations/inventory-report" component={InventoryReport} />

            <Route path="/operations/feedback" render={() => (
              <>
                {activePlans.includes('Feedback') ? (
                  <Feedback />
                ) : (
                  <div className="text-center">You need to buy or renew to Feedback plan to access this page.</div>
                )}
              </>
            )} />
            <Route path="/operations/qr-for-feedback" render={() => (
              <>
                {activePlans.includes('Feedback') ? (
                  <QRforFeedback />
                ) : (
                  <div className="text-center">You need to buy or renew to Feedback plan to access this page.</div>
                )}
              </>
            )} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Operations;
