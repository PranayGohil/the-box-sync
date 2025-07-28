import React, { useState } from 'react';
import { Button, Row, Col, Card } from 'react-bootstrap';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { Link, NavLink, useHistory } from 'react-router-dom';
import { Steps } from 'intro.js-react';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Glide from 'components/carousel/Glide';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import 'intro.js/introjs.css';

const DashboardsDefault = () => {
  const history = useHistory();
  const title = 'Dashboard';
  const description = 'Default Dashboard';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
  ];

  const [tourEnabled, setTourEnabled] = useState(false);
  const tourSteps = [
    {
      element: '#introFirst',
      title: 'Fancy Charts',
      intro: 'Some charts over here!',
    },
    {
      element: '#introSecond',
      title: 'Product Card',
      intro: 'Here is a product card with buttons!',
    },
    {
      element: '#introThird',
      title: 'More Cards',
      intro: 'Category card with an icon!',
    },
  ];
  const tourOptions = {
    nextLabel: '<span>Next</span><i class="cs-chevron-right"></i>',
    prevLabel: '<i class="cs-chevron-left"></i><span>Prev</span>',
    skipLabel: '<i class="cs-close"></i>',
    doneLabel: '<i class="cs-check"></i><span>Done</span>',
    overlayOpacity: 0.5,
    exitOnOverlayClick: true,
    exitOnEsc: true,
  };

  const tables = [{
    area: 'A.C.',
    table: [{ number: '1', maxPersons: '2' }, { number: '2', maxPersons: '2' }, { number: '3', maxPersons: '4' }, { number: '4', maxPersons: '4' }, { number: '5', maxPersons: '6' }],
  },
  {
    area: 'Non A.C.',
    table: [{ number: '1', maxPersons: '2' }, { number: '2', maxPersons: '2' }, { number: '3', maxPersons: '4' }, { number: '4', maxPersons: '4' }, { number: '5', maxPersons: '6' }],
  }]
  return (
    <>
      <HtmlHead title={title} description={description} />

      {/* Tour Start */}
      <Steps
        enabled={tourEnabled}
        steps={tourSteps}
        initialStep={0}
        options={tourOptions}
        onExit={() => {
          setTourEnabled(false);
        }}
      />
      {/* Tour End */}

      {/* Title and Top Buttons Start */}
      <div className="page-title-container">
        <Row>
          {/* Title Start */}
          <Col md="7">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          {/* Title End */}

          {/* Top Buttons Start */}
          <Col md="5" className="d-flex align-items-start justify-content-end">
            <Button
              variant="outline-primary"
              className="btn-icon btn-icon-start btn-icon w-100 w-md-auto ms-1"
              onClick={() => {
                setTourEnabled(true);
              }}
            >
              <CsLineIcons icon="flag" /> <span>Delivery</span>
            </Button>
            <Button
              variant="outline-primary"
              className="btn-icon btn-icon-start btn-icon w-100 w-md-auto ms-1"
              onClick={() => {
                setTourEnabled(true);
              }}
            >
              <CsLineIcons icon="flag" /> <span>Takeaway</span>
            </Button>
          </Col>
          {/* Top Buttons End */}
        </Row>
      </div>
      {/* Title and Top Buttons End */}

      <Row>
        <Col xl="6">
          {/* Stats Start */}
          {tables.map((table, index) => (
            <>
              <h2 className="small-title">{table.area}</h2>
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
                    {table.table.map((item, i) => (
                      <Link to="/order" key={i}>
                        <Glide.Item onClick={() => (history.push('/order'))}>
                          <Card className="sh-20 hover-border-primary mb-5">
                            <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                              <div className="d-flex sh-8 sw-8 bg-gradient-light fs-3 text-white mb-3 align-items-center justify-content-center rounded-xl">
                                {item.number}
                              </div>
                              <p className="mb-0 lh-1">Maximum Person</p>
                              <p className="cta-3 mb-0 text-primary">{item.maxPersons}</p>
                            </Card.Body>
                          </Card>
                        </Glide.Item>
                      </Link>
                    ))}
                  </Glide>
                </Col>
              </Row>
            </>
          ))}
          {/* Stats End */}
        </Col>

        {/* Products Start */}
        <Col xl="6" className="mb-5">
          <h2 className="small-title">Active Deleveries and Takeaways</h2>
          <Card className="mb-2" id="introSecond">
            <Row className="g-0 sh-12">
              <Col xs="auto">
                <NavLink to="/pages/portfolio/detail">
                  <div className="d-flex justify-content-center align-items-center flex-column sh-12 sw-13 sw-lg-15">Token <div className='fs-3'>1</div></div>
                </NavLink>
              </Col>
              <Col>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="7" className="d-flex flex-column mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail">Takeaway</NavLink>
                      <div className="text-small text-muted text-truncate">Status
                      </div>
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
                  <div className="d-flex justify-content-center align-items-center flex-column sh-12 sw-13 sw-lg-15">Token <div className='fs-3'>2</div></div>
                </NavLink>
              </Col>
              <Col>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="7" className="d-flex flex-column mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail">Takeaway</NavLink>
                      <div className="text-small text-muted text-truncate">Status
                      </div>
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
                  <div className="d-flex justify-content-center align-items-center flex-column sh-12 sw-13 sw-lg-15">Customer <div className='fw-bold fs-6'>Pranay</div></div>
                </NavLink>
              </Col>
              <Col>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="7" className="d-flex flex-column mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail">Delievery</NavLink>
                      <div className="text-small text-muted text-truncate">Status
                      </div>
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
                  <div className="d-flex justify-content-center align-items-center flex-column sh-12 sw-13 sw-lg-15">Customer <div className='fw-bold fs-6'>Pranay</div></div>
                </NavLink>
              </Col>
              <Col>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="7" className="d-flex flex-column mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail">Delievery</NavLink>
                      <div className="text-small text-muted text-truncate">Status
                      </div>
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
                  <div className="d-flex justify-content-center align-items-center flex-column sh-12 sw-13 sw-lg-15">Customer <div className='fw-bold fs-6'>Pranay</div></div>
                </NavLink>
              </Col>
              <Col>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="7" className="d-flex flex-column mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail">Delievery</NavLink>
                      <div className="text-small text-muted text-truncate">Status
                      </div>
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
      </Row >

      <Row>
        {/* Logs Start */}
        <Col lg="6" className="mb-5">
          <h2 className="small-title">Logs</h2>
          <Card className="sh-40 h-lg-100-card">
            <Card.Body className="mb-n2 scroll-out h-100">
              <OverlayScrollbarsComponent options={{ scrollbars: { autoHide: 'leave' }, overflowBehavior: { x: 'hidden', y: 'scroll' } }} className="h-100">
                <Row className="g-0 mb-2">
                  <Col xs="auto">
                    <div className="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                      <div className="sh-3">
                        <CsLineIcons icon="circle" className="text-primary align-top" />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex flex-column pt-0 pb-0 ps-3 pe-4 h-100 justify-content-center">
                      <div className="d-flex flex-column">
                        <div className="text-alternate mt-n1 lh-1-25">New user registiration</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-inline-block d-flex justify-content-end align-items-center h-100">
                      <div className="text-muted ms-2 mt-n1 lh-1-25">18 Dec</div>
                    </div>
                  </Col>
                </Row>
                <Row className="g-0 mb-2">
                  <Col xs="auto">
                    <div className="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                      <div className="sh-3">
                        <CsLineIcons icon="square" className="text-secondary align-top" />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex flex-column pt-0 pb-0 ps-3 pe-4 h-100 justify-content-center">
                      <div className="d-flex flex-column">
                        <div className="text-alternate mt-n1 lh-1-25">Product out of stock: Breadstick</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-inline-block d-flex justify-content-end align-items-center h-100">
                      <div className="text-muted ms-2 mt-n1 lh-1-25">15 Dec</div>
                    </div>
                  </Col>
                </Row>
                <Row className="g-0 mb-2">
                  <Col xs="auto">
                    <div className="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                      <div className="sh-3">
                        <CsLineIcons icon="triangle" className="text-tertiary align-top" />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex flex-column pt-0 pb-0 ps-3 pe-4 h-100 justify-content-center">
                      <div className="d-flex flex-column">
                        <div className="text-alternate mt-n1 lh-1-25">Category page returned an error</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-inline-block d-flex justify-content-end align-items-center h-100">
                      <div className="text-muted ms-2 mt-n1 lh-1-25">14 Dec</div>
                    </div>
                  </Col>
                </Row>
                <Row className="g-0 mb-2">
                  <Col xs="auto">
                    <div className="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                      <div className="sh-3">
                        <CsLineIcons icon="hexagon" className="text-quaternary align-top" />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex flex-column pt-0 pb-0 ps-3 pe-4 h-100 justify-content-center">
                      <div className="d-flex flex-column">
                        <div className="text-alternate mt-n1 lh-1-25">14 products added</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-inline-block d-flex justify-content-end align-items-center h-100">
                      <div className="text-muted ms-2 mt-n1 lh-1-25">14 Dec</div>
                    </div>
                  </Col>
                </Row>
                <Row className="g-0 mb-2">
                  <Col xs="auto">
                    <div className="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                      <div className="sh-3">
                        <CsLineIcons icon="hexagon" className="text-quaternary align-top" />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex flex-column pt-0 pb-0 ps-3 pe-4 h-100 justify-content-center">
                      <div className="d-flex flex-column">
                        <div className="text-alternate mt-n1 lh-1-25">New sale: Soda Bread</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-inline-block d-flex justify-content-end align-items-center h-100">
                      <div className="text-muted ms-2 mt-n1 lh-1-25">14 Dec</div>
                    </div>
                  </Col>
                </Row>
                <Row className="g-0 mb-2">
                  <Col xs="auto">
                    <div className="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                      <div className="sh-3">
                        <CsLineIcons icon="square" className="text-secondary align-top" />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex flex-column pt-0 pb-0 ps-3 pe-4 h-100 justify-content-center">
                      <div className="d-flex flex-column">
                        <div className="text-alternate mt-n1 lh-1-25">Product out of stock: Breadstick</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-inline-block d-flex justify-content-end align-items-center h-100">
                      <div className="text-muted ms-2 mt-n1 lh-1-25">15 Dec</div>
                    </div>
                  </Col>
                </Row>
                <Row className="g-0 mb-2">
                  <Col xs="auto">
                    <div className="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                      <div className="sh-3">
                        <CsLineIcons icon="triangle" className="text-tertiary align-top" />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex flex-column pt-0 pb-0 ps-3 pe-4 h-100 justify-content-center">
                      <div className="d-flex flex-column">
                        <div className="text-alternate mt-n1 lh-1-25">Product page returned an error</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-inline-block d-flex justify-content-end align-items-center h-100">
                      <div className="text-muted ms-2 mt-n1 lh-1-25">14 Dec</div>
                    </div>
                  </Col>
                </Row>
                <Row className="g-0 mb-2">
                  <Col xs="auto">
                    <div className="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                      <div className="sh-3">
                        <CsLineIcons icon="hexagon" className="text-quaternary align-top" />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex flex-column pt-0 pb-0 ps-3 pe-4 h-100 justify-content-center">
                      <div className="d-flex flex-column">
                        <div className="text-alternate mt-n1 lh-1-25">New sale: Steirer Brot</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-inline-block d-flex justify-content-end align-items-center h-100">
                      <div className="text-muted ms-2 mt-n1 lh-1-25">13 Dec</div>
                    </div>
                  </Col>
                </Row>
                <Row className="g-0 mb-2">
                  <Col xs="auto">
                    <div className="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                      <div className="sh-3">
                        <CsLineIcons icon="hexagon" className="text-quaternary align-top" />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex flex-column pt-0 pb-0 ps-3 pe-4 h-100 justify-content-center">
                      <div className="d-flex flex-column">
                        <div className="text-alternate mt-n1 lh-1-25">Recived a support ticket</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-inline-block d-flex justify-content-end align-items-center h-100">
                      <div className="text-muted ms-2 mt-n1 lh-1-25">13 Dec</div>
                    </div>
                  </Col>
                </Row>
                <Row className="g-0 mb-2">
                  <Col xs="auto">
                    <div className="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                      <div className="sh-3">
                        <CsLineIcons icon="hexagon" className="text-quaternary align-top" />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex flex-column pt-0 pb-0 ps-3 pe-4 h-100 justify-content-center">
                      <div className="d-flex flex-column">
                        <div className="text-alternate mt-n1 lh-1-25">Recived a support ticket</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-inline-block d-flex justify-content-end align-items-center h-100">
                      <div className="text-muted ms-2 mt-n1 lh-1-25">13 Dec</div>
                    </div>
                  </Col>
                </Row>
                <Row className="g-0 mb-2">
                  <Col xs="auto">
                    <div className="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                      <div className="sh-3">
                        <CsLineIcons icon="hexagon" className="text-quaternary align-top" />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex flex-column pt-0 pb-0 ps-3 pe-4 h-100 justify-content-center">
                      <div className="d-flex flex-column">
                        <div className="text-alternate mt-n1 lh-1-25">Recived a comment</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-inline-block d-flex justify-content-end align-items-center h-100">
                      <div className="text-muted ms-2 mt-n1 lh-1-25">13 Dec</div>
                    </div>
                  </Col>
                </Row>
              </OverlayScrollbarsComponent>
            </Card.Body>
          </Card>
        </Col>
        {/* Logs End */}

        {/* Categories Start */}
        <Col lg="6" className="mb-5">
          <h2 className="small-title">Categories</h2>
          <Row className="g-2">
            <Col xs="6" xl="4" className="sh-19">
              <Card className="h-100 hover-scale-up" id="introThird">
                <Card.Body className="text-center">
                  <NavLink to="#">
                    <CsLineIcons icon="cupcake" className="text-primary" />
                    <p className="heading mt-3 text-body">Cupcakes</p>
                    <div className="text-extra-small fw-medium text-muted">14 PRODUCTS</div>
                  </NavLink>
                </Card.Body>
              </Card>
            </Col>
            <Col xs="6" xl="4" className="sh-19">
              <Card className="h-100 hover-scale-up">
                <Card.Body className="text-center">
                  <NavLink to="#">
                    <CsLineIcons icon="loaf" className="text-primary" />
                    <p className="heading mt-3 text-body">Breads</p>
                    <div className="text-extra-small fw-medium text-muted">3 PRODUCTS</div>
                  </NavLink>
                </Card.Body>
              </Card>
            </Col>
            <Col xs="6" xl="4" className="sh-19">
              <Card className="h-100 hover-scale-up">
                <Card.Body className="text-center">
                  <NavLink to="#">
                    <CsLineIcons icon="radish" className="text-primary" />
                    <p className="heading mt-3 text-body">Vegetables</p>
                    <div className="text-extra-small fw-medium text-muted">8 PRODUCTS</div>
                  </NavLink>
                </Card.Body>
              </Card>
            </Col>
            <Col xs="6" xl="4" className="sh-19">
              <Card className="h-100 hover-scale-up">
                <Card.Body className="text-center">
                  <NavLink to="#">
                    <CsLineIcons icon="pear" className="text-primary" />
                    <p className="heading mt-3 text-body">Fruits</p>
                    <div className="text-extra-small fw-medium text-muted">9 PRODUCTS</div>
                  </NavLink>
                </Card.Body>
              </Card>
            </Col>
            <Col xs="6" xl="4" className="sh-19">
              <Card className="h-100 hover-scale-up">
                <Card.Body className="text-center">
                  <NavLink to="#">
                    <CsLineIcons icon="loaf" className="text-primary" />
                    <p className="heading mt-3 text-body">Mushrooms</p>
                    <div className="text-extra-small fw-medium text-muted">3 PRODUCTS</div>
                  </NavLink>
                </Card.Body>
              </Card>
            </Col>
            <Col xs="6" xl="4" className="sh-19">
              <Card className="h-100 hover-scale-up">
                <Card.Body className="text-center">
                  <NavLink to="#">
                    <CsLineIcons icon="water" className="text-primary" />
                    <p className="heading mt-3 text-body">Drinks</p>
                    <div className="text-extra-small fw-medium text-muted">4 PRODUCTS</div>
                  </NavLink>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
        {/* Categories End */}
      </Row>

      {/* Extend Your Knowledge Start */}
      <Row>
        <h2 className="small-title">Extend Your Knowledge</h2>
        <Col md="4" className="mb-5">
          <Card className="w-100 sh-20 sh-md-22 hover-img-scale-up">
            <img src="/img/banner/cta-standard-1.webp" className="card-img h-100 scale" alt="card image" />
            <div className="card-img-overlay d-flex flex-column justify-content-between bg-transparent">
              <div className="d-flex flex-column h-100 justify-content-between align-items-start">
                <div className="cta-3 text-black">
                  Introduction
                  <br />
                  to Bread Making
                </div>
                <Button variant="primary" className="btn-icon btn-icon-start mt-3 stretched-link">
                  <CsLineIcons icon="chevron-right" /> <span>View</span>
                </Button>
              </div>
            </div>
          </Card>
        </Col>
        <Col md="4" className="mb-5">
          <Card className="w-100 sh-20 sh-md-22 hover-img-scale-up">
            <img src="/img/banner/cta-standard-2.webp" className="card-img h-100 scale" alt="card image" />
            <div className="card-img-overlay d-flex flex-column justify-content-between bg-transparent">
              <div className="d-flex flex-column h-100 justify-content-between align-items-start">
                <div className="cta-3 text-black">
                  Basic Principles
                  <br />
                  of Cooking
                </div>
                <Button variant="primary" className="btn-icon btn-icon-start mt-3 stretched-link">
                  <CsLineIcons icon="chevron-right" /> <span>View</span>
                </Button>
              </div>
            </div>
          </Card>
        </Col>
        <Col md="4" className="mb-5">
          <Card className="w-100 sh-20 sh-md-22 hover-img-scale-up">
            <img src="/img/banner/cta-standard-3.webp" className="card-img h-100 scale" alt="card image" />
            <div className="card-img-overlay d-flex flex-column justify-content-between bg-transparent">
              <div className="d-flex flex-column h-100 justify-content-between align-items-start">
                <div className="cta-3 text-black">
                  Easy & Practical
                  <br />
                  Recipes
                </div>
                <Button variant="primary" className="btn-icon btn-icon-start mt-3 stretched-link">
                  <CsLineIcons icon="chevron-right" /> <span>View</span>
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      {/* Extend Your Knowledge End */}
    </>
  );
};

export default DashboardsDefault;
