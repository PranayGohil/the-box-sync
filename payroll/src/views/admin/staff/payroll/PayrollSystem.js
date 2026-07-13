import React from 'react';
import { Row, Col, Nav } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink, useLocation } from 'react-router-dom';

import ManagePayroll from './ManagePayroll';
import GeneratePayroll from './GeneratePayroll';
import Holidays from './Holidays';
import FeedbacksAndComplaints from './FeedbacksAndComplaints';
import ViewStaffPayroll from './ViewStaffPayroll';

const NavContent = () => {
  return (
    <Nav className="flex-column operations-operations-sidebar">
      {/* Manage Payroll */}
      <Nav.Link as={NavLink} to="/staff/payroll/manage" className="px-3 py-2 my-1 d-flex align-items-center">
        <CsLineIcons icon="layout" size="17" className="me-2" />
        <span className="align-middle">Manage Payroll</span>
      </Nav.Link>

      {/* Generate Payroll */}
      <Nav.Link as={NavLink} to="/staff/payroll/generate" className="px-3 py-2 my-1 d-flex align-items-center">
        <CsLineIcons icon="plus" size="17" className="me-2" />
        <span className="align-middle">Generate Payroll</span>
      </Nav.Link>

      {/* Holidays */}
      <Nav.Link as={NavLink} to="/staff/payroll/holidays" className="px-3 py-2 my-1 d-flex align-items-center">
        <CsLineIcons icon="calendar" size="17" className="me-2" />
        <span className="align-middle">Holidays</span>
      </Nav.Link>

      {/* Feedbacks & Complaints */}
      <Nav.Link as={NavLink} to="/staff/payroll/feedbacks" className="px-3 py-2 my-1 d-flex align-items-center">
        <CsLineIcons icon="message" size="17" className="me-2" />
        <span className="align-middle">Feedback &amp; Complaints</span>
      </Nav.Link>
    </Nav>
  );
};

const MobileBottomNav = () => {
  const { pathname } = useLocation();

  const navItems = [
    { label: 'Manage', icon: 'layout', to: '/staff/payroll/manage' },
    { label: 'Generate', icon: 'plus', to: '/staff/payroll/generate' },
    { label: 'Holidays', icon: 'calendar', to: '/staff/payroll/holidays' },
    { label: 'Feedback', icon: 'message', to: '/staff/payroll/feedbacks' },
  ];

  return (
    <div
      className="position-fixed bottom-0 start-0 end-0 d-lg-none px-4"
      style={{
        zIndex: 1000,
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
          boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
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
                  width: '46px',
                  height: '46px',
                  background: isActive ? 'rgba(30, 168, 231, 0.12)' : 'transparent',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                }}
              >
                <CsLineIcons
                  icon={item.icon}
                  size="24"
                  stroke={isActive ? '#1ea8e7' : '#94a3b8'}
                  fill={isActive ? 'rgba(30, 168, 231, 0.1)' : 'none'}
                />
              </div>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

const PayrollSystem = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();

  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10) || 1200;

  return (
    <div className="position-relative pb-7 pb-lg-0">
      <style>{`
        /* Operations Sidebar Styling */
        .operations-operations-sidebar .nav-link {
          display: flex !important;
          align-items: center !important;
          transition: all 0.2s ease !important;
          border: 1px solid transparent !important;
          text-decoration: none !important;
          color: #64748b !important;
          background: transparent !important;
          font-size: 0.85rem !important;
          border-radius: 50px !important;
          padding: 0.65rem 1.25rem !important;
          margin-bottom: 0.25rem !important;
        }

        .operations-operations-sidebar .nav-link:hover,
        .operations-operations-sidebar .nav-link.active {
          color: #23b3f4 !important;
          background-color: rgba(35, 179, 244, 0.08) !important;
          border-color: rgba(35, 179, 244, 0.2) !important;
        }

        .operations-operations-sidebar .nav-link.active span,
        .operations-operations-sidebar .nav-link.active svg,
        .operations-operations-sidebar .nav-link.active i {
          color: #23b3f4 !important;
          font-weight: 700 !important;
        }

        .operations-operations-sidebar .operations-section-header {
          display: flex !important;
          align-items: center !important;
          padding: 1.25rem 1.25rem 0.5rem 1.25rem !important;
          color: #1e293b !important;
          font-weight: 700 !important;
          font-size: 0.95rem !important;
          letter-spacing: -0.01em !important;
        }

        .operations-operations-sidebar .operations-section-header svg {
          color: #94a3b8 !important;
          margin-right: 12px !important;
        }

        .operations-operations-sidebar .operations-sub-menu-container {
          padding-left: 0.5rem !important;
        }

        .operations-operations-sidebar .operations-sub-menu-container .nav-link {
          padding-left: 2rem !important;
        }
      `}</style>

      {/* MOBILE BOTTOM NAV */}
      {width && width < lgBreakpoint && <MobileBottomNav />}

      <Row>
        {width && width >= lgBreakpoint ? (
          <Col xs="auto" className="d-flex pe-lg-3">
            <div className="nav flex-column sw-25 mt-2">
              <NavContent />
            </div>
          </Col>
        ) : (
          <div className="pt-4" />
        )}
        <Col>
          <Switch>
            <Route exact path="/staff/payroll" render={() => <Redirect to="/staff/payroll/manage" />} />
            <Route path="/staff/payroll/manage/:month?/:year?" render={() => <ManagePayroll />} />
            <Route exact path="/staff/payroll/generate" render={() => <GeneratePayroll />} />
            <Route exact path="/staff/payroll/holidays" render={() => <Holidays />} />
            <Route exact path="/staff/payroll/feedbacks" render={() => <FeedbacksAndComplaints />} />
            <Route exact path="/staff/payroll/view/:id" render={() => <ViewStaffPayroll />} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default PayrollSystem;
