import React from 'react';
import { Row, Col, Nav } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink, useRouteMatch, useLocation } from 'react-router-dom';

import ViewStaff from './ViewStaff';
import AddStaff from './AddStaff';
import EditStaff from './EditStaff';
import StaffProfile from './StaffProfile';
import ManageAttendance from './attandance/ManageAttendance';
import ViewAttendance from './attandance/ViewAttendance';
import PayrollSettings from './payroll/PayrollSettings';
import EditWordTemplate from './payroll/EditWordTemplate';
import ManagePayroll from './payroll/ManagePayroll';
import GeneratePayroll from './payroll/GeneratePayroll';
import ViewStaffPayroll from './payroll/ViewStaffPayroll';
import Holidays from './payroll/Holidays';
import LeavePolicy from './payroll/LeavePolicy';
import LeaveRequests from './payroll/LeaveRequests';
import SalaryAdvances from './payroll/SalaryAdvances';

const NavContent = ({ path }) => {
  return (
    <Nav className="flex-column operations-operations-sidebar">
      {/* Staff Management */}
      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="user" size="17" />
          <span className="align-middle">Staff Management</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to={`${path}/view`} className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Staff</span>
          </Nav.Link>
        </div>
      </div>

      {/* Attendance */}
      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="check-square" size="17" />
          <span className="align-middle">Attendance</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to={`${path}/attendance`} className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Attendance</span>
          </Nav.Link>
        </div>
      </div>

      {/* Payroll */}
      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="credit-card" size="17" />
          <span className="align-middle">Payroll</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to={`${path}/payroll`} exact className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Manage Payroll</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to={`${path}/payroll/generate`} className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Generate Payroll</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to={`${path}/holidays`} className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Holidays</span>
          </Nav.Link>
        </div>
      </div>

      {/* Leave & HR */}
      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="book-open" size="17" />
          <span className="align-middle">Leave &amp; HR</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to={`${path}/leave-policy`} className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Leave Policies</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to={`${path}/leave-requests`} className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Leave Requests</span>
          </Nav.Link>
        </div>
      </div>

      {/* Settings - flat item */}
      <Nav.Link as={NavLink} to={`${path}/payroll/settings`} className="px-3 py-2 my-1 d-flex align-items-center">
        <CsLineIcons icon="gear" size="17" className="me-2" />
        <span className="align-middle">Payroll Configuration</span>
      </Nav.Link>
    </Nav>
  );
};

const MobileBottomNav = ({ path }) => {
  const { pathname } = useLocation();

  const navItems = [
    { label: 'Staff', icon: 'user', to: `${path}/view` },
    { label: 'Attendance', icon: 'check-square', to: `${path}/attendance` },
    { label: 'Payroll', icon: 'credit-card', to: `${path}/payroll` },
    { label: 'Leave', icon: 'book-open', to: `${path}/leave-requests` },
    { label: 'Settings', icon: 'gear', to: `${path}/payroll/settings` },
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

const Staff = () => {
  const { path } = useRouteMatch();
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();
  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10) || 1200;

  return (
    <div className="position-relative pb-7 pb-lg-0">
      <style>{`
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
      {width && width < lgBreakpoint && <MobileBottomNav path={path} />}

      <Row>
        {width && width >= lgBreakpoint ? (
          <Col xs="auto" className="d-flex pe-lg-3">
            <div className="nav flex-column sw-25 mt-2">
              <NavContent path={path} />
            </div>
          </Col>
        ) : (
          <div className="pt-4" />
        )}
        <Col>
          <Switch>
            {/* Core Staff Management */}
            <Route exact path={path} render={() => <Redirect to={`${path}/view`} />} />
            <Route exact path={`${path}/view`} component={ViewStaff} />
            <Route exact path={`${path}/add`} component={AddStaff} />
            <Route exact path={`${path}/edit/:id`} component={EditStaff} />
            <Route exact path={`${path}/profile/:id`} component={StaffProfile} />

            {/* Attendance */}
            <Route exact path={`${path}/attendance`} component={ManageAttendance} />
            <Route exact path={`${path}/attendance/view/:id`} component={ViewAttendance} />

            {/* Payroll */}
            <Route exact path={`${path}/payroll/settings`} component={PayrollSettings} />
            <Route exact path={`${path}/payroll/settings/word-editor`} component={EditWordTemplate} />
            <Route exact path={`${path}/payroll/generate`} component={GeneratePayroll} />
            <Route exact path={`${path}/payroll/view/:staffId`} component={ViewStaffPayroll} />
            <Route path={`${path}/payroll/:month?/:year?`} component={ManagePayroll} />

            {/* Leave & HR */}
            <Route exact path={`${path}/holidays`} component={Holidays} />
            <Route exact path={`${path}/leave-policy`} component={LeavePolicy} />
            <Route exact path={`${path}/leave-requests`} component={LeaveRequests} />
            <Route exact path={`${path}/salary-advances`} component={SalaryAdvances} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Staff;
