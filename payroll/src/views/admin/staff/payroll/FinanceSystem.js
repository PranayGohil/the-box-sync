import React from 'react';
import { Row, Col, Nav } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink, useLocation } from 'react-router-dom';

import ManageExpenses from './ManageExpenses';
import SalaryAdvances from './SalaryAdvances';
import StatutoryReports from './StatutoryReports';

const NavContent = () => {
  return (
    <Nav className="flex-column operations-operations-sidebar">
      {/* Manage Expenses - Flat Main Option */}
      <Nav.Link as={NavLink} to="/finance/expenses" className="px-3 py-2 my-1 d-flex align-items-center">
        <CsLineIcons icon="wallet" size="17" className="me-2" />
        <span className="align-middle">Manage Expenses</span>
      </Nav.Link>

      {/* Salary Advances - Flat Main Option */}
      <Nav.Link as={NavLink} to="/finance/advances" className="px-3 py-2 my-1 d-flex align-items-center">
        <CsLineIcons icon="wallet" size="17" className="me-2" />
        <span className="align-middle">Salary Advances</span>
      </Nav.Link>

      {/* Audit & Reports - Flat Main Option */}
      <Nav.Link as={NavLink} to="/finance/reports" className="px-3 py-2 my-1 d-flex align-items-center">
        <CsLineIcons icon="file-text" size="17" className="me-2" />
        <span className="align-middle">Audit & Reports</span>
      </Nav.Link>
    </Nav>
  );
};

const MobileBottomNav = () => {
  const { pathname } = useLocation();

  const navItems = [
    { label: 'Expenses', icon: 'wallet', to: '/finance/expenses' },
    { label: 'Advances', icon: 'wallet', to: '/finance/advances' },
    { label: 'Reports', icon: 'file-text', to: '/finance/reports' },
  ];

  return (
    <div 
      className="position-fixed bottom-0 start-0 end-0 d-lg-none px-4" 
      style={{ 
        zIndex: 1050, 
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
          boxShadow: '0 15px 40px rgba(0,0,0,0.12)'
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
                  transition: 'all 0.3s ease'
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

const FinanceSystem = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();

  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10) || 1200;

  return (
    <div className="position-relative pb-7 pb-lg-0">
      <style>{`
        /* Operations Sidebar Styling Synchronized with Admin Panel */
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

        /* Ensure sub-menu items are padded correctly like the active ones */
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
            <Route exact path="/finance" render={() => <Redirect to="/finance/expenses" />} />
            <Route exact path="/finance/expenses" render={() => <ManageExpenses />} />
            <Route exact path="/finance/advances" render={() => <SalaryAdvances />} />
            <Route exact path="/finance/reports" render={() => <StatutoryReports />} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default FinanceSystem;
