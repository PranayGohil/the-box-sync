import React from 'react';
import { Row, Col, Nav } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink, useLocation } from 'react-router-dom';

import WhatsappCampaign from './campaigns/WhatsappCampaign';
import CustomerOrderHistory from './CustomerOrderHistory';

const NavContent = () => {
  return (
    <>
      <style>{`
        .crm-sidebar .nav-link {
          border-radius: 50px !important;
          padding: 0.6rem 1.25rem !important;
          margin-bottom: 0.15rem !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.2s ease !important;
          border: 1px solid transparent !important;
          text-decoration: none !important;
          color: #64748b !important;
          background: transparent !important;
          font-size: 0.85rem !important;
        }
        .crm-sidebar .nav-link:hover,
        .crm-sidebar .nav-link.active {
          color: #23b3f4 !important;
          background-color: rgba(35, 179, 244, 0.08) !important;
          border-color: rgba(35, 179, 244, 0.2) !important;
        }
        .crm-sidebar .nav-link.active span,
        .crm-sidebar .nav-link.active svg {
          color: #23b3f4 !important;
          font-weight: 700 !important;
        }
        .crm-sidebar .section-header {
          display: flex !important;
          align-items: center !important;
          padding: 1.25rem 1.25rem 0.5rem 1.25rem !important;
          color: #1e293b !important;
          font-weight: 700 !important;
          font-size: 0.95rem !important;
          letter-spacing: -0.01em !important;
        }
        .crm-sidebar .section-header svg {
          color: #94a3b8 !important;
          margin-right: 12px !important;
        }
        .crm-sidebar .sub-menu-container {
          padding-left: 0.5rem !important;
        }
      `}</style>
      <Nav className="flex-column crm-sidebar">
        <div className="mb-1">
          <div className="section-header">
            <CsLineIcons icon="send" size="17" />
            <span className="align-middle">Campaigns</span>
          </div>
          <div className="sub-menu-container">
            <Nav.Link as={NavLink} to="/crm/whatsapp" className="px-0" isActive={(match, location) => {
              return location.pathname === '/crm/whatsapp' || location.pathname.startsWith('/crm/customers/');
            }}>
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">WhatsApp</span>
            </Nav.Link>
          </div>
        </div>
      </Nav>
    </>
  );
};

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { attrMobile, navClasses } = useSelector((state) => state.menu);
  const isMenuOpen = attrMobile || (navClasses && navClasses['mobile-side-in']);

  const navItems = [
    { label: 'Order', icon: 'cart', to: '/operations/order-history' },
    { label: 'Menu', icon: 'book-open', to: '/operations/manage-menu' },
    { label: 'Customers', icon: 'user', to: '/crm/whatsapp' },
    { label: 'Report', icon: 'file-text', to: '/operations/financial-report' },
  ];

  return (
    <div
      className="bottom-nav-wrapper d-lg-none"
      style={{
        opacity: isMenuOpen ? 0 : 1,
        pointerEvents: isMenuOpen ? 'none' : 'auto',
        visibility: isMenuOpen ? 'hidden' : 'visible',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <style>{`
        .bottom-nav-wrapper {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 990;
          width: 95%;
          max-width: 500px;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .bottom-nav-pill {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(25px) saturate(200%);
          -webkit-backdrop-filter: blur(25px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.45);
          border-radius: 40px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          pointer-events: auto;
        }

        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none !important;
          color: #64748b;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bottom-nav-item.active {
          color: #1ea8e7;
          background: rgba(30, 168, 231, 0.12);
          transform: translateY(-5px);
        }

        @media (max-width: 991px) {
          body {
            padding-bottom: 90px !important;
          }
        }
      `}</style>

      <div className="bottom-nav-pill">
        {navItems.map((item) => {
          let isActive = false;
          if (item.label === 'Order') {
            isActive = pathname.startsWith('/operations/order-history') || pathname.startsWith('/operations/order-details');
          } else if (item.label === 'Menu') {
            isActive = pathname.startsWith('/operations/manage-menu') || pathname.startsWith('/operations/add-dish') || pathname.startsWith('/operations/qr-for-menu');
          } else if (item.label === 'Customers') {
            isActive = pathname.startsWith('/crm/whatsapp') || pathname.startsWith('/crm/customers/');
          } else {
            isActive = pathname.startsWith(item.to);
          }
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <CsLineIcons icon={item.icon} size="20" />
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

const Crm = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();

  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10) || 1200;

  return (
    <div className="position-relative pb-7 pb-lg-0">
      {width && width < lgBreakpoint && <MobileBottomNav />}
      <Row>
        {(width && width >= lgBreakpoint) ? (
          <Col xs="auto" className="d-none d-lg-flex">
            <div className="nav flex-column sw-25">
              <NavContent />
            </div>
          </Col>
        ) : null}
        <Col>
          <Switch>
            <Route exact path="/crm" render={() => <Redirect to="/crm/whatsapp" />} />
            <Route exact path="/crm/whatsapp" render={() => <WhatsappCampaign />} />
            <Route exact path="/crm/customers/:phone" render={() => <CustomerOrderHistory />} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Crm;
