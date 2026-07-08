import React, { useContext } from 'react';
import { Row, Col, Nav, Dropdown } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink } from 'react-router-dom';

import { AuthContext } from 'contexts/AuthContext';
import Profile from './Profile';
import TaxAndCharges from './TaxAndCharges';
import Subscription from './Subscription';
import ForgotPassword from './ForgotPassword';
import PrintConfig from './PrintConfig';

const NavContent = ({ activePlans }) => {
  return (
    <>
      <Nav className="flex-column operations-operations-sidebar">
        <div className="mb-1">
          <div className="operations-section-header">
            <CsLineIcons icon="user" size="17" />
            <span className="align-middle ms-2">Account</span>
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
            <span className="align-middle ms-2">Billing & Access</span>
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
            <span className="align-middle ms-2">Customization</span>
          </div>
          <div className="operations-sub-menu-container">
            <Nav.Link as={NavLink} to="/settings/print-config" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Print Settings</span>
            </Nav.Link>
          </div>
        </div>

        <div className="mb-1">
          <div className="operations-section-header">
            <CsLineIcons icon="key" size="17" />
            <span className="align-middle ms-2">Security</span>
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

const MobileNavbar = () => {
  const items = [
    { to: '/settings/profile', icon: 'user', title: 'Profile' },
    { to: '/settings/tax-charges', icon: 'dollar', title: 'Tax & Charges' },
    { to: '/settings/subscription', icon: 'star', title: 'Subscription' },
    { to: '/settings/print-config', icon: 'print', title: 'Print Settings' },
    { to: '/settings/forgot-password', icon: 'key', title: 'Forgot Password' },
  ];

  return (
    <>
      <div 
        className="settings-mobile-bottom-nav d-flex justify-content-around align-items-center position-fixed start-50 translate-middle-x"
        style={{
          width: 'calc(100% - 40px)',
          maxWidth: '480px',
          height: '64px',
          backgroundColor: '#ffffff',
          borderRadius: '35px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          bottom: '20px',
          zIndex: 1040,
          padding: '0 15px',
        }}
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="d-flex flex-column align-items-center justify-content-center text-decoration-none"
            activeClassName="active"
            style={{
              color: '#8f9bb3',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              transition: 'all 0.25s ease-in-out',
            }}
          >
            <div className="icon-container d-flex align-items-center justify-content-center w-100 h-100 rounded-circle">
              <CsLineIcons icon={item.icon} size="20" />
            </div>
          </NavLink>
        ))}
      </div>
      
      {/* Dynamic custom CSS to style the active nav link */}
      <style>{`
        .settings-mobile-bottom-nav a.active {
          background-color: #e6f6fd !important;
          color: #1ea8e7 !important;
        }
        .settings-mobile-bottom-nav a.active svg {
          stroke: #1ea8e7 !important;
          fill: rgba(30, 168, 231, 0.2) !important;
        }
        @media (max-width: 1200px) {
          .settings-content-col {
            padding-bottom: 100px !important;
          }
        }
      `}</style>
    </>
  );
};

const Settings = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();

  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10) || 1200;

  const { activePlans } = useContext(AuthContext);

  return (
    <div className="position-relative container-fluid">
      <Row>
        {width && width >= lgBreakpoint ? (
          <Col xs="auto" className="d-none d-lg-flex">
            <div className="nav flex-column sw-25 mt-2">
              <NavContent activePlans={activePlans} />
            </div>
          </Col>
        ) : (
          <Col xs={12} className="d-lg-none">
            <MobileNavbar />
          </Col>
        )}
        <Col className="settings-content-col">
          <Switch>
            <Route exact path="/settings" render={() => <Redirect to="/settings/profile" />} />
            <Route exact path="/settings/profile" render={() => <Profile />} />
            <Route exact path="/settings/tax-charges" render={() => <TaxAndCharges />} />
            <Route exact path="/settings/subscription" render={() => <Subscription />} />
            <Route exact path="/settings/forgot-password" render={() => <ForgotPassword />} />
            <Route exact path="/settings/print-config" render={() => <PrintConfig />} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
