import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import useLayout from 'hooks/useLayout';
import Footer from 'layout/footer/Footer';
import Nav from 'layout/nav/Nav';
import RightButtons from 'layout/right-buttons/RightButtons';
import SidebarMenu from 'layout/nav/sidebar-menu/SidebarMenu';

const LayoutFull = ({ children }) => {
  useLayout();

  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.click();
    window.scrollTo(0, 0);
    // eslint-disable-next-line
  }, [pathname]);
  return (
    <>
      <div className="fixed-background" />
      <main className="container-fluid p-0 h-100 position-relative">
        <Container>
          <Row className="h-100">
            <Col className="h-100" id="contentArea">
              {children}
            </Col>
          </Row>
        </Container>
      </main>
      <Footer />
      <RightButtons />
    </>
  );
};

export default React.memo(LayoutFull);
