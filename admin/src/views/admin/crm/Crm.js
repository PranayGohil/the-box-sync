import React, { useContext } from 'react';
import { Row, Col, Nav } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';

import WhatsappCampaign from './campaign/WhatsappCampaign';
import EmailCampaign from './campaign/EmailCampaign';
import StandardLoyalty from './loyalty/StandardLoyalty';
import RetentionCampaigns from './loyalty/RetentionCampaigns';
import PromoCodes from './loyalty/PromoCodes';
import LedgerLogs from './ledger/LedgerLogs';

const NavContent = () => {
  return (
    <Nav className="flex-column operations-operations-sidebar">
      {/* Campaign */}
      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="speaker" size="17" />
          <span className="align-middle">Campaign</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to="/crm/campaign/whatsapp" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Whatsapp</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/crm/campaign/email" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Email</span>
          </Nav.Link>
        </div>
      </div>

      {/* Loyalty Engine */}
      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="star" size="17" />
          <span className="align-middle">Loyalty Engine</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to="/crm/loyalty/standard" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Standard Loyalty</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/crm/loyalty/retention" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Retention Loyalty</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/crm/loyalty/promocodes" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Promo Code</span>
          </Nav.Link>
        </div>
      </div>

      {/* Ledger Logs */}
      <div className="mb-1">
        <div className="operations-section-header">
          <CsLineIcons icon="list" size="17" />
          <span className="align-middle">Ledger Logs</span>
        </div>
        <div className="operations-sub-menu-container">
          <Nav.Link as={NavLink} to="/crm/ledger-logs" className="px-0">
            <i className="me-2 sw-3 d-inline-block" />
            <span className="align-middle">Ledger Logs</span>
          </Nav.Link>
        </div>
      </div>
    </Nav>
  );
};

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const navItems = [
    { label: 'WhatsApp', icon: 'message', to: '/crm/campaign/whatsapp' },
    { label: 'Email', icon: 'email', to: '/crm/campaign/email' },
    { label: 'Standard', icon: 'star', to: '/crm/loyalty/standard' },
    { label: 'Retention', icon: 'heart', to: '/crm/loyalty/retention' },
    { label: 'Promo Codes', icon: 'tag', to: '/crm/loyalty/promocodes' },
    { label: 'Ledger Logs', icon: 'list', to: '/crm/ledger-logs' },
  ];

  return (
    <div className="bottom-nav-wrapper d-lg-none">
      <style>{`
        .bottom-nav-wrapper {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1050;
          width: 95%;
          max-width: 500px;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }
        .bottom-nav-pill {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(25px) saturate(200%);
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
          const isActive = pathname.startsWith(item.to);
          return (
            <NavLink key={item.label} to={item.to} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
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
        {width && width >= lgBreakpoint ? (
          <Col xs="auto" className="d-none d-lg-flex">
            <div className="nav flex-column sw-25">
              <NavContent />
            </div>
          </Col>
        ) : (
          <div className="pt-2" />
        )}
        <Col>
          <Switch>
            <Route exact path="/crm" render={() => <Redirect to="/crm/loyalty/standard" />} />
            <Route exact path="/crm/campaign/whatsapp" render={() => <WhatsappCampaign />} />
            <Route exact path="/crm/campaign/email" render={() => <EmailCampaign />} />
            <Route exact path="/crm/loyalty/standard" render={() => <StandardLoyalty />} />
            <Route exact path="/crm/loyalty/retention" render={() => <RetentionCampaigns />} />
            <Route exact path="/crm/loyalty/promocodes" render={() => <PromoCodes />} />
            <Route exact path="/crm/ledger-logs" render={() => <LedgerLogs />} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};
export default Crm;