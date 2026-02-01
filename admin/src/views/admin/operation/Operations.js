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

import ManageWaiters from './waiter/ManageWaiters';

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

      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/manage-waiters" className="px-0">
          <CsLineIcons icon="main-course" className="me-2 sw-3" size="17" />
          <span className="align-middle">Waiter</span>
        </Nav.Link>
        <div>
          <Nav.Link as={NavLink} to="/operations/manage-waiters" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Waiters</span>
          </Nav.Link>
        </div>
      </div>

      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/manage-table" className="px-0">
          <CsLineIcons icon="square" className="me-2 sw-3" size="17" />
          {/* <i className="bi-calendar me-2 ms-1 sw-3" size="17" /> */}
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
          <Nav.Link as={NavLink} to="/operations/qr-for-menu" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">QR for Menu</span>
          </Nav.Link>
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
        </div>
      </div>

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
    label: 'Waiter',
    icon: 'main-course',
    items: [{ label: 'Manage Waiters', to: '/operations/manage-waiters' }],
  },
  {
    label: 'Table',
    icon: 'square',
    items: [
      { label: 'Manage Table', to: '/operations/manage-table' },
      { label: 'Add Table', to: '/operations/add-table' },
    ],
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
  {
    label: 'Inventory',
    icon: 'boxes',
    items: [
      { label: 'Requested Inventory', to: '/operations/requested-inventory' },
      { label: 'Inventory History', to: '/operations/inventory-history' },
      { label: 'Add Inventory', to: '/operations/add-inventory' },
    ],
  },
  {
    label: 'Feedback',
    icon: 'chat-text',
    items: [
      { label: 'View Feedbacks', to: '/operations/feedback' },
      { label: 'Feedback QR', to: '/operations/qr-for-feedback' },
    ],
  },
];

const MobileNavbar = () => {
  return (
    <div className="d-flex gap-2 overflow-auto pb-2">
      {mobileNavItems.map((nav) => (
        <Dropdown key={nav.label} container="body" className='position-static'>
          <Dropdown.Toggle variant="outline-primary" size="sm" className="d-flex align-items-center gap-1">
            <CsLineIcons icon={nav.icon} size="16" />
            {nav.label}
          </Dropdown.Toggle>

          <Dropdown.Menu style={{
            position: 'absolute',
            minWidth: '150px',
            maxHeight: '300px',
            overflowY: 'auto',
            marginTop: '5px',
          }}>
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
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10) || 1200;

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
            <Route exact path="/operations/order-history" render={() => <OrderHistory />} />
            <Route exact path="/operations/order-details/:id" render={() => <OrderDetails />} />

            <Route exact path="/operations/manage-waiters" render={() => <ManageWaiters />} />

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

            <Route exact path="/operations/requested-inventory" render={() => <RequestedInventory />} />
            <Route exact path="/operations/inventory-history" render={() => <InventoryHistory />} />
            <Route exact path="/operations/add-inventory" render={() => <AddInventory />} />
            <Route exact path="/operations/edit-inventory/:id" render={() => <EditInventory />} />
            <Route exact path="/operations/complete-inventory/:id" render={() => <CompleteInventory />} />
            <Route exact path="/operations/inventory-details/:id" render={() => <InventoryDetails />} />

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
