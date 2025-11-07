import React, { useState, useContext } from 'react';
import { Row, Col, Nav } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import bootstrapIcons from 'bootstrap-icons/bootstrap-icons-tags';
import useCustomLayout from 'hooks/useCustomLayout';
import 'react-datepicker/dist/react-datepicker.css';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink } from 'react-router-dom';

import { AuthContext } from 'contexts/AuthContext';
import OrderHistory from './order/OrderHistory';
import OrderDetails from './order/OrderDetails';

import ManageTable from './table/ManageTable';
import AddTable from './table/AddTable';

import ManageMenu from './menu/ManageMenu';
import AddDishes from './menu/AddDishes';
import QRforMenu from './menu/QRforMenu';

import AddRoom from './room/AddRoom';
import AddRoomCategory from './room/AddRoomCategory';
import ManageRooms from './room/ManageRooms';

import RequestedInventory from './inventory/RequestedInventory';
import AddInventory from './inventory/AddInventory';
import EditInventory from './inventory/EditInventory';
import InventoryHistory from './inventory/InventoryHistory';
import CompleteInventory from './inventory/CompleteInventory';
import InventoryDetails from './inventory/InventoryDetails';

import Feedback from './feedback/Feedback';
import QRforFeedback from './feedback/QRforFeedback';
import AddFeedback from './feedback/AddFeedback';

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

const Operations = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();

  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10);

  const { activePlans } = useContext(AuthContext);

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
            <Route exact path="/operations/order-history" render={() => <OrderHistory />}
            />
            <Route exact path="/operations/order-details/:id" render={() => <OrderDetails />} />

            <Route exact path="/operations/manage-table" render={() => <ManageTable />} />
            <Route exact path="/operations/add-table" render={() => <AddTable />} />

            <Route exact path="/operations/manage-menu" render={() => <ManageMenu />} />
            <Route exact path="/operations/add-dishes" render={() => <AddDishes />} />
            <Route exact path="/operations/qr-for-menu" render={() => <>
              {
                activePlans.includes("Scan For Menu") ?
                  <QRforMenu /> :
                  <div className="text-center">You need to buy or renew to Scan For Menu plan to access this page.</div>
              }
            </>
            } />

            <Route exact path="/operations/manage-rooms"
              render={() => <>
                {
                  activePlans.includes("Hotel Manager") ?
                    <ManageRooms /> :
                    <div className="text-center">You need to buy or renew to Hotel Manager plan to access this page.</div>
                }</>}
            />
            <Route exact path="/operations/add-room"
              render={() => <>
                {
                  activePlans.includes("Hotel Manager") ?
                    <AddRoom /> :
                    <div className="text-center">You need to buy or renew to Hotel Manager plan to access this page.</div>
                }</>}
            />
            <Route exact path="/operations/add-room-category"
              render={() => <>
                {
                  activePlans.includes("Hotel Manager") ?
                    <AddRoomCategory /> :
                    <div className="text-center">You need to buy or renew to Hotel Manager plan to access this page.</div>
                }</>}
            />

            <Route exact path="/operations/requested-inventory" render={() => <RequestedInventory />} />
            <Route exact path="/operations/inventory-history" render={() => <InventoryHistory />} />
            <Route exact path="/operations/add-inventory" render={() => <AddInventory />} />
            <Route exact path="/operations/edit-inventory/:id" render={() => <EditInventory />} />
            <Route exact path="/operations/complete-inventory/:id" render={() => <CompleteInventory />} />
            <Route exact path="/operations/inventory-details/:id" render={() => <InventoryDetails />} />

            <Route exact path="/operations/feedback"
              render={() => <>
                {
                  activePlans.includes("Feedback") ?
                    <Feedback /> :
                    <div className="text-center">You need to buy or renew to Feedback plan to access this page.</div>
                }</>}
            />
            <Route exact path="/operations/qr-for-feedback"
              render={() => <>
                {
                  activePlans.includes("Feedback") ?
                    <QRforFeedback /> :
                    <div className="text-center">You need to buy or renew to Feedback plan to access this page.</div>
                }</>} />
            {/* <Route exact path="/operations/add-feedback" component={AddFeedback} /> */}

          </Switch>
        </Col>
      </Row>
    </>
  );
};

export default Operations;
