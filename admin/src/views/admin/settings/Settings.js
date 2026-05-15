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

const NavContent = ({ activePlans }) => {
  return (
    <>
      <style>{`
        .settings-sidebar .nav-link {
          border-radius: 50px !important;
          padding: 0.75rem 1.25rem !important;
          margin-bottom: 0.5rem !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.2s ease !important;
          border: 1px solid transparent !important;
          text-decoration: none !important;
          color: #64748b !important;
          background: transparent !important;
          font-weight: 500 !important;
        }
        .settings-sidebar .nav-link:hover,
        .settings-sidebar .nav-link.active {
          color: #23b3f4 !important;
          background-color: rgba(35, 179, 244, 0.08) !important;
          border-color: rgba(35, 179, 244, 0.2) !important;
        }
        .settings-sidebar .nav-link.active span,
        .settings-sidebar .nav-link.active svg {
          color: #23b3f4 !important;
          font-weight: 700 !important;
        }
        .settings-sidebar .nav-link svg {
          color: #94a3b8 !important;
          margin-right: 12px !important;
          transition: color 0.2s ease !important;
        }
        .settings-sidebar .nav-link.active svg {
          color: #23b3f4 !important;
        }
      `}</style>
      <Nav className="flex-column settings-sidebar mt-2">
        <Nav.Link as={NavLink} to="/settings/profile" className="px-0">
          <CsLineIcons icon="user" size="18" />
          <span className="align-middle">Profile</span>
        </Nav.Link>

        <Nav.Link as={NavLink} to="/settings/tax-charges" className="px-0">
          <CsLineIcons icon="dollar" size="18" />
          <span className="align-middle">Tax & Charges</span>
        </Nav.Link>

        <Nav.Link as={NavLink} to="/settings/subscription" className="px-0">
          <CsLineIcons icon="star" size="18" />
          <span className="align-middle">Subscription</span>
        </Nav.Link>

        {activePlans.includes('Restaurant Website') && (
          <Nav.Link as={NavLink} to="/settings/manage-website" className="px-0">
            <CsLineIcons icon="web-page" size="18" />
            <span className="align-middle">Manage Website</span>
          </Nav.Link>
        )}

        <Nav.Link as={NavLink} to="/settings/forgot-password" className="px-0">
          <CsLineIcons icon="key" size="18" />
          <span className="align-middle">Forgot Password</span>
        </Nav.Link>
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
    label: 'Manage Website',
    icon: 'web-page',
    items: [{ label: 'Manage Website', to: '/settings/manage-website' }],
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
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
