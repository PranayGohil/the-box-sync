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

import ManageMenu from './menu/ManageMenu';
import AddDishes from './menu/AddDishes';
import QRforMenu from './menu/QRforMenu';

import Feedback from './feedback/Feedback';

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
        <Nav.Link as={NavLink} to="/operations/feedback" className="px-0">
          <CsLineIcons icon="tablet" className="me-2 sw-3" size="17" />
          <span className="align-middle">Feedback</span>
        </Nav.Link>
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

            <Route path="/operations/manage-menu" component={ManageMenu} />
            <Route path="/operations/add-dishes" component={AddDishes} />
            <Route path="/operations/qr-for-menu" component={QRforMenu} />

            <Route path="/operations/feedback" component={Feedback} />
            
          </Switch>
        </Col>
      </Row>
    </>
  );
};

export default Operations;
