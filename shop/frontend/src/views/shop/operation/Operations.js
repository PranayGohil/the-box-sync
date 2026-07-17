import React, { useContext } from 'react';
import { Row, Col, Nav, Dropdown } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { LAYOUT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import 'react-datepicker/dist/react-datepicker.css';
import { useWindowSize } from 'hooks/useWindowSize';
import { Switch, Route, Redirect, NavLink, useLocation } from 'react-router-dom';

import { AuthContext } from 'contexts/AuthContext';
import OrderHistory from './order/OrderHistory';
import OrderDetails from './order/OrderDetails';

import ManageCatalog from './catalog/ManageCatalog';
import AddItems from './catalog/AddItems';
import QRforCatalog from './catalog/QRforCatalog';

import FinancialReport from './FinancialReport';

import Customers from './customers/Customers';
import CustomerOrderHistory from './customers/CustomerOrderHistory';
import CampaignManager from './campaigns/CampaignManager';

const NavContent = () => {
  const { activePlans } = useContext(AuthContext);
  return (
    <>
      <style>{`
        .operations-sidebar .nav-link {
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
        .operations-sidebar .nav-link:hover,
        .operations-sidebar .nav-link.active {
          color: #23b3f4 !important;
          background-color: rgba(35, 179, 244, 0.08) !important;
          border-color: rgba(35, 179, 244, 0.2) !important;
        }
        .operations-sidebar .nav-link.active span,
        .operations-sidebar .nav-link.active svg {
          color: #23b3f4 !important;
          font-weight: 700 !important;
        }
        .operations-sidebar .section-header {
          display: flex !important;
          align-items: center !important;
          padding: 1.25rem 1.25rem 0.5rem 1.25rem !important;
          color: #1e293b !important;
          font-weight: 700 !important;
          font-size: 0.95rem !important;
          letter-spacing: -0.01em !important;
        }
        .operations-sidebar .section-header svg {
          color: #94a3b8 !important;
          margin-right: 12px !important;
        }
        .operations-sidebar .sub-catalog-container {
          padding-left: 0.5rem !important;
        }
      `}</style>
      <Nav className="flex-column operations-sidebar">
        <div className="mb-1">
          <div className="section-header">
            <CsLineIcons icon="cart" size="17" />
            <span className="align-middle">Sales</span>
          </div>
          <div className="sub-catalog-container">
            <Nav.Link as={NavLink} to="/operations/sales-history" className="px-0" isActive={(match, location) => {
              return location.pathname.startsWith('/operations/sales-history') || location.pathname.startsWith('/operations/sales-details');
            }}>
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Sales History</span>
            </Nav.Link>
          </div>
        </div>

        <div className="mb-1">
          <div className="section-header">
            <CsLineIcons icon="book-open" size="17" />
            <span className="align-middle">Catalog</span>
          </div>
          <div className="sub-catalog-container">
            <Nav.Link as={NavLink} to="/operations/manage-items" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Manage Items</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/operations/add-item" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Add Item</span>
            </Nav.Link>
          </div>
        </div>



        <div className="mb-1">
          <div className="section-header">
            <CsLineIcons icon="user" size="17" />
            <span className="align-middle">Customers</span>
          </div>
          <div className="sub-catalog-container">
            <Nav.Link as={NavLink} to="/operations/customers" className="px-0" isActive={(match, location) => {
              return location.pathname === '/operations/customers';
            }}>
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Manage Customers</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/operations/campaigns" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Campaigns</span>
            </Nav.Link>
          </div>
        </div>

        <div className="mb-1">
          <div className="section-header">
            <CsLineIcons icon="file-text" size="17" />
            <span className="align-middle">Report</span>
          </div>
          <div className="sub-catalog-container">
            <Nav.Link as={NavLink} to="/operations/financial-report" className="px-0">
              <i className="me-2 sw-3 d-inline-block" />
              <span className="align-middle">Expense-Income</span>
            </Nav.Link>
          </div>
        </div>
      </Nav>
    </>
  );
};

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { attrMobile, navClasses } = useSelector((state) => state.catalog);
  const isMenuOpen = attrMobile || (navClasses && navClasses['mobile-side-in']);

  const navItems = [
    { label: 'Sales', icon: 'cart', to: '/operations/sales-history' },
    { label: 'Catalog', icon: 'book-open', to: '/operations/manage-items' },
    { label: 'Customers', icon: 'user', to: '/operations/customers' },
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
          if (item.label === 'Sales') {
            isActive = pathname.startsWith('/operations/sales-history') || pathname.startsWith('/operations/sales-details');
          } else if (item.label === 'Catalog') {
            isActive = pathname.startsWith('/operations/manage-items') || pathname.startsWith('/operations/add-item');
          } else if (item.label === 'Customers') {
            isActive = pathname.startsWith('/operations/customers') || pathname.startsWith('/operations/campaigns');
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

const Operations = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });
  const { width } = useWindowSize();

  const { themeValues } = useSelector((state) => state.settings);
  const lgBreakpoint = parseInt(themeValues.lg.replace('px', ''), 10) || 1200;

  const { activePlans } = useContext(AuthContext);

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
            <Route exact path="/operations" render={() => <Redirect to="/operations/sales-history" />} />
            <Route exact path="/operations/sales-history" render={() => <OrderHistory />} />
            <Route exact path="/operations/sales-details/:id" render={() => <OrderDetails />} />

            <Route exact path="/operations/manage-items" render={() => <ManageCatalog />} />
            <Route exact path="/operations/add-item" render={() => <AddItems />} />

            <Route exact path="/operations/customers" render={() => <Customers />} />
            <Route exact path="/operations/customers/:phone" render={() => <CustomerOrderHistory />} />
            <Route exact path="/operations/campaigns" render={() => <CampaignManager />} />

            <Route exact path="/operations/financial-report" render={() => <FinancialReport />} />
          </Switch>
        </Col>
      </Row>
    </div>
  );
};

export default Operations;