import React, { useState } from 'react';
import { Button, Row, Col, Card } from 'react-bootstrap';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { NavLink } from 'react-router-dom';
import { Steps } from 'intro.js-react';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Glide from 'components/carousel/Glide';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import 'intro.js/introjs.css';

const Staff = () => {
  const staff = [
    {
      name: 'Pranay',
      profile: '/img/product/small/product-1.webp',
    },
    {
      name: 'Mayur',
      profile: '/img/product/small/product-2.webp',
    },
    {
      name: 'Rushi',
      profile: '/img/product/small/product-3.webp',
    },
    {
      name: 'Vishal',
      profile: '/img/product/small/product-4.webp',
    },
  ];
  return (
    <>
      <Row>
        <Col xl="6">
          {/* Stats Start */}
          <>
            
            <Row className="gx-2">
              <Col className="p-0">
                <Glide
                  options={{
                    gap: 0,
                    rewind: false,
                    bound: true,
                    perView: 6,
                    breakpoints: {
                      400: { perView: 1 },
                      600: { perView: 2 },
                      1400: { perView: 3 },
                      1600: { perView: 4 },
                      1900: { perView: 5 },
                      3840: { perView: 6 },
                    },
                  }}
                >
                  {staff.map((s, i) => (
                    <Glide.Item key={i}>
                      <Card className="sh-20 hover-border-primary mb-5">
                        <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                          <div className="d-flex sh-8 sw-8 bg-gradient-light text-white mb-3 align-items-center justify-content-center rounded-xl overflow-hidden">
                            <img src={s.profile} alt="..." className='object-fit-cover w-100 h-100' />
                          </div>
                          <p className="mb-0 lh-1">{s.name}</p>
                          {/* <p className="cta-3 mb-0 text-primary">{item.maxPersons}</p> */}
                        </Card.Body>
                      </Card>
                    </Glide.Item>
                  ))}
                </Glide>
              </Col>
            </Row>
          </>
          {/* Stats End */}
        </Col>

        {/* Products Start */}
        <Col xl="6" className="mb-5">
          <h2 className="small-title">Active Deleveries and Takeaways</h2>
          <Card className="mb-2" id="introSecond">
            <Row className="g-0 sh-12">
              <Col xs="auto">
                <NavLink to="/pages/portfolio/detail">
                  <div className="d-flex justify-content-center align-items-center flex-column sh-12 sw-13 sw-lg-15">
                    Token <div className="fs-3">1</div>
                  </div>
                </NavLink>
              </Col>
              <Col>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="7" className="d-flex flex-column mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail">Takeaway</NavLink>
                      <div className="text-small text-muted text-truncate">Status</div>
                    </Col>
                    <Col md="5" className="d-flex align-items-center justify-content-md-end">
                      <Button variant="outline-primary" size="sm" className="btn-icon btn-icon-start ms-1">
                        <CsLineIcons icon="eye" width="15" height="15" className="me-xxl-2" />
                        <span className="d-none d-xxl-inline-block">View Details</span>
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Col>
            </Row>
          </Card>
          <Card className="mb-2" id="introSecond">
            <Row className="g-0 sh-12">
              <Col xs="auto">
                <NavLink to="/pages/portfolio/detail">
                  <div className="d-flex justify-content-center align-items-center flex-column sh-12 sw-13 sw-lg-15">
                    Token <div className="fs-3">2</div>
                  </div>
                </NavLink>
              </Col>
              <Col>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="7" className="d-flex flex-column mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail">Takeaway</NavLink>
                      <div className="text-small text-muted text-truncate">Status</div>
                    </Col>
                    <Col md="5" className="d-flex align-items-center justify-content-md-end">
                      <Button variant="outline-primary" size="sm" className="btn-icon btn-icon-start ms-1">
                        <CsLineIcons icon="eye" width="15" height="15" className="me-xxl-2" />
                        <span className="d-none d-xxl-inline-block">View Details</span>
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Col>
            </Row>
          </Card>
          <Card className="mb-2" id="introSecond">
            <Row className="g-0 sh-12">
              <Col xs="auto">
                <NavLink to="/pages/portfolio/detail">
                  <div className="d-flex justify-content-center align-items-center flex-column sh-12 sw-13 sw-lg-15">
                    Customer <div className="fw-bold fs-6">Pranay</div>
                  </div>
                </NavLink>
              </Col>
              <Col>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="7" className="d-flex flex-column mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail">Delievery</NavLink>
                      <div className="text-small text-muted text-truncate">Status</div>
                    </Col>
                    <Col md="5" className="d-flex align-items-center justify-content-md-end">
                      <Button variant="outline-primary" size="sm" className="btn-icon btn-icon-start ms-1">
                        <CsLineIcons icon="eye" width="15" height="15" className="me-xxl-2" />
                        <span className="d-none d-xxl-inline-block">View Details</span>
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Col>
            </Row>
          </Card>
          <Card className="mb-2" id="introSecond">
            <Row className="g-0 sh-12">
              <Col xs="auto">
                <NavLink to="/pages/portfolio/detail">
                  <div className="d-flex justify-content-center align-items-center flex-column sh-12 sw-13 sw-lg-15">
                    Customer <div className="fw-bold fs-6">Pranay</div>
                  </div>
                </NavLink>
              </Col>
              <Col>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="7" className="d-flex flex-column mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail">Delievery</NavLink>
                      <div className="text-small text-muted text-truncate">Status</div>
                    </Col>
                    <Col md="5" className="d-flex align-items-center justify-content-md-end">
                      <Button variant="outline-primary" size="sm" className="btn-icon btn-icon-start ms-1">
                        <CsLineIcons icon="eye" width="15" height="15" className="me-xxl-2" />
                        <span className="d-none d-xxl-inline-block">View Details</span>
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Col>
            </Row>
          </Card>
          <Card className="mb-2" id="introSecond">
            <Row className="g-0 sh-12">
              <Col xs="auto">
                <NavLink to="/pages/portfolio/detail">
                  <div className="d-flex justify-content-center align-items-center flex-column sh-12 sw-13 sw-lg-15">
                    Customer <div className="fw-bold fs-6">Pranay</div>
                  </div>
                </NavLink>
              </Col>
              <Col>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="7" className="d-flex flex-column mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail">Delievery</NavLink>
                      <div className="text-small text-muted text-truncate">Status</div>
                    </Col>
                    <Col md="5" className="d-flex align-items-center justify-content-md-end">
                      <Button variant="outline-primary" size="sm" className="btn-icon btn-icon-start ms-1">
                        <CsLineIcons icon="eye" width="15" height="15" className="me-xxl-2" />
                        <span className="d-none d-xxl-inline-block">View Details</span>
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Col>
            </Row>
          </Card>
        </Col>
        {/* Products End */}
      </Row>
    </>
  );
};

export default Staff;
