import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import useLayout from 'hooks/useLayout';
import Footer from 'layout/footer/Footer';
import Nav from 'layout/nav/Nav';
import SidebarMenu from 'layout/nav/sidebar-menu/SidebarMenu';

const Layout = ({ children }) => {
  useLayout();

  const { pathname } = useLocation();
  const isOrderPage = ['/order/dine-in', '/order/takeaway', '/order/delivery', '/order/qsr-pos'].some(p => pathname.includes(p));

  useEffect(() => {
    document.documentElement.click();
    window.scrollTo(0, 0);
    // eslint-disable-next-line
    }, [pathname]);
  return (
    <>
      {!isOrderPage && <Nav />}
      <main>
        <div>
          <Row className="h-100">
            <SidebarMenu />
            <Col className="h-100" id="contentArea">
              {children}
            </Col>
          </Row>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default React.memo(Layout);
