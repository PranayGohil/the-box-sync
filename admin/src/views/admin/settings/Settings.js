import React from 'react';
import { Row, Col, Nav } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import 'react-datepicker/dist/react-datepicker.css';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink } from 'react-router-dom';

import Profile from './account/Profile';
import Address from './account/Address';
import Gst from './tax-charges/Gst';
import Container from './tax-charges/Container';
import Subscription from './subscription/Subscription';
import ManageWebsite from './manage-website/ManageWebsite';

const NavContent = () => {
  return (
    <Nav className="flex-column">
      <div className="mb-2">
        <Nav.Link as={NavLink} to="/settings/profile" className="px-0">
          <CsLineIcons icon="activity" className="me-2 sw-3" size="17" />
          <span className="align-middle">Account</span>
        </Nav.Link>
        <div>
          <Nav.Link as={NavLink} to="/settings/profile" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Profile</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/settings/address" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Address</span>
          </Nav.Link>
        </div>
      </div>

      <div className="mb-2">
        <Nav.Link as={NavLink} to="/settings/gst" className="px-0">
          <CsLineIcons icon="shield" className="me-2 sw-3" size="17" />
          <span className="align-middle">Tax & Charges</span>
        </Nav.Link>
        <div>
          <Nav.Link as={NavLink} to="/settings/gst" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">GST</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/settings/container-charge" className="px-0 pt-1">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Container Charges</span>
          </Nav.Link>
        </div>
      </div>

      <div className="mb-2">
        <Nav.Link as={NavLink} to="/settings/subscription" className="px-0">
          <CsLineIcons icon="notification" className="me-2 sw-3" size="17" />
          <span className="align-middle">Subscription</span>
        </Nav.Link>
        {/* <div>
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
                </div> */}
      </div>
      <div className="mb-2">
        <Nav.Link as={NavLink} to="/settings/manage-website" className="px-0">
          <CsLineIcons icon="notification" className="me-2 sw-3" size="17" />
          <span className="align-middle">Manage Website</span>
        </Nav.Link>
        {/* <div>
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
                </div> */}
      </div>
    </Nav>
  );
};

const Settings = () => {
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
            <Route exact path="/settings" render={() => <Redirect to="/settings/profile" />} />
            <Route path="/settings/profile" render={() => <Profile />} />
            <Route path="/settings/address" render={() => <Address />} />
            <Route path="/settings/gst" render={() => <Gst />} />
            <Route path="/settings/container-charge" render={() => <Container />} />
            <Route path="/settings/subscription" render={() => <Subscription />} />
            <Route path="/settings/manage-website" render={() => <ManageWebsite />} />
          </Switch>
        </Col>
      </Row>
    </>
  );
};

export default Settings;
