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
import Profile from './account/Profile';
import TaxAndCharges from './tax-charges/TaxAndCharges';
import Subscription from './subscription/Subscription';
import ManageWebsite from './manage-website/ManageWebsite';
import ForgotPassword from './forgot-password/ForgotPassword';
import PrintConfig from './print-config/PrintConfig';

const NavContent = ({ activePlans }) => {
  return (
    <>
      <Nav className="flex-column operations-operations-sidebar">
        <div className="mb-1">
          <div className="operations-section-header">
            <CsLineIcons icon="user" size="17" />
            <span className="align-middle">Account</span>
          </div>
          <div className="operations-sub-menu-container">
            <Nav.Link as={NavLink} to="/settings/profile" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Profile</span>
            </Nav.Link>
          </div>
        </div>

        <div className="mb-1">
          <div className="operations-section-header">
            <CsLineIcons icon="dollar" size="17" />
            <span className="align-middle">Billing & Access</span>
          </div>
          <div className="operations-sub-menu-container">
            <Nav.Link as={NavLink} to="/settings/tax-charges" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Tax & Charges</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/settings/subscription" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Subscription</span>
            </Nav.Link>
          </div>
        </div>

        <div className="mb-1">
          <div className="operations-section-header">
            <CsLineIcons icon="web-page" size="17" />
            <span className="align-middle">Customization</span>
          </div>
          <div className="operations-sub-menu-container">
            {activePlans.includes('Restaurant Website') && (
              <Nav.Link as={NavLink} to="/settings/manage-website" className="px-0">
                <i className="me-2 sw-3 d-inline-block" />
                <span className="align-middle">Manage Website</span>
              </Nav.Link>
            )}
            <Nav.Link as={NavLink} to="/settings/print-config" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Print Settings</span>
            </Nav.Link>
          </div>
        </div>

        <div className="mb-1">
          <div className="operations-section-header">
            <CsLineIcons icon="key" size="17" />
            <span className="align-middle">Security</span>
          </div>
          <div className="operations-sub-menu-container">
            <Nav.Link as={NavLink} to="/settings/forgot-password" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Forgot Password</span>
            </Nav.Link>
          </div>
        </div>
      </Nav>
    </>
  );
};

const mobileNavItems = [
  {
    label: 'Account',
    icon: 'user',
    items: [
      { label: 'Profile', to: '/settings/profile' },
    ],
  },
  {
    label: 'Tax & Charges',
    icon: 'dollar',
    items: [
      { label: 'Tax & Charges', to: '/settings/tax-charges' },
    ],
  },
  {
    label: 'Subscription',
    icon: 'star',
    items: [{ label: 'Subscription', to: '/settings/subscription' }],
  },
  {
    label: 'Print Settings',
    icon: 'print',
    items: [{ label: 'Print Configuration', to: '/settings/print-config' }],
  },
  {
    label: 'Forgot Password',
    icon: 'key',
    items: [{ label: 'Forgot Password', to: '/settings/forgot-password' }],
  },
];

const MobileNavbar = ({ activePlans }) => {
  const filteredNavItems = mobileNavItems.filter((nav) => {
    if (nav.label === 'Manage Website' && (!activePlans || !activePlans.includes('Restaurant Website'))) {
      return false;
    }
    return true;
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

const Settings = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();

  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10) || 1200;

  const { activePlans } = useContext(AuthContext);

  return (
    <div className="position-relative">
      {/* ✅ MOBILE NAVBAR — HIDDEN AS IT IS NOW IN BOTTOM NAV */}
      {/* {width && width < lgBreakpoint && (
        <div className="position-absolute top-0 start-0 end-0 d-lg-none">
          <MobileNavbar activePlans={activePlans} />
        </div>
      )} */}
      <Row>
        {(width && width >= lgBreakpoint) ? (
          <Col xs="auto" className="d-none d-lg-flex">
            <div className="nav flex-column sw-25 mt-2">
              <NavContent activePlans={activePlans} />
            </div>
          </Col>
        ) : (<div className="pt-7" />)}
        <Col>
          <Switch>
            <Route exact path="/settings" render={() => <Redirect to="/settings/profile" />} />
            <Route exact path="/settings/profile" render={() => <Profile />} />
            <Route exact path="/settings/tax-charges" render={() => <TaxAndCharges />} />
            <Route exact path="/settings/subscription" render={() => <Subscription />} />
            <Route
              exact
              path="/settings/manage-website"
              render={() => (
                <>
                  {activePlans.includes('Restaurant Website') ? (
                    <ManageWebsite />
                  ) : (
                    <div className="text-center">You need to buy or renew to Restaurant Website plan to access this page.</div>
                  )}
                </>
              )}
            />
            <Route exact path="/settings/forgot-password" render={() => <ForgotPassword />} />
            <Route exact path="/settings/print-config" render={() => <PrintConfig />} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
