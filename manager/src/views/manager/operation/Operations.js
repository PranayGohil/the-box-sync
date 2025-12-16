import React from 'react';
import { Row, Col, Nav } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import 'react-datepicker/dist/react-datepicker.css';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink } from 'react-router-dom';
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
import InventoryDetails from './inventory/InventoryDetails';

import Feedback from './feedback/Feedback';
import QRforFeedback from './feedback/QRforFeedback';

const NavContent = () => {
  return (
    <Nav className="flex-column">
      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/order-history" className="px-0">
          <CsLineIcons icon="activity" className="me-2 sw-3" size="17" />
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
          <CsLineIcons icon="credit-card" className="me-2 sw-3" size="17" />
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
          <CsLineIcons icon="shield" className="me-2 sw-3" size="17" />
          <span className="align-middle">Menu</span>
        </Nav.Link>
        <div>
          <Nav.Link as={NavLink} to="/operations/manage-menu" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Menu</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/add-dishes" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Add Dishes</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/operations/qr-for-menu" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">QR for Menu</span>
          </Nav.Link>
        </div>
      </div>

      <div className="mb-2">
        <Nav.Link as={NavLink} to="/operations/requested-inventory" className="px-0">
          <CsLineIcons icon="notification" className="me-2 sw-3" size="17" />
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
          <CsLineIcons icon="tablet" className="me-2 sw-3" size="17" />
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
          <Nav.Link as={NavLink} to="/operations/add-feedback" className="px-0 pt-1"> 
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Add Feedback</span>
          </Nav.Link>
        </div>
      </div>
    </Nav>
  );
};

const Operations = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();

  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10);

  return (
    <>
      <Row>
        {width && width >= lgBreakpoint && (
          <Col xs="auto" className="d-none d-lg-flex">
            <div className="nav flex-column sw-25 mt-n2">
              <NavContent />
            </div>
          </Col>
        )}
        <Col>
          <Switch>
            <Route exact path="/operations" render={() => <Redirect to="/operations/order-history" />} />
            <Route path="/operations/order-history" component={OrderHistory} />
            <Route path="/operations/order-details/:id" component={OrderDetails} />

            <Route path="/operations/manage-table" component={ManageTable} />
            <Route path="/operations/add-table" component={AddTable} />

            <Route path="/operations/manage-menu" component={ManageMenu} />
            <Route path="/operations/add-dishes" component={AddDishes} />
            <Route path="/operations/qr-for-menu" component={QRforMenu} />

            <Route path="/operations/requested-inventory" component={RequestedInventory} />
            <Route path="/operations/inventory-history" component={InventoryHistory} />
            <Route path="/operations/add-inventory" component={AddInventory} />
            <Route path="/operations/edit-inventory/:id" component={EditInventory} />
            <Route path="/operations/inventory-details/:id" component={InventoryDetails} />

            <Route path="/operations/feedback" component={Feedback} />
            <Route path="/operations/qr-for-feedback" component={QRforFeedback} /> 
            
          </Switch>
        </Col>
      </Row>
    </>
  );
};

export default Operations;
