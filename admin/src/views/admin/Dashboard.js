import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Dropdown, Badge } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { format } from "date-fns";
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ChartHorizontal from './ChartHorizontal';

const Dashboard = () => {
  const title = 'Analytic Dashboard';
  const description = 'Analytic Dashboard';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
  ];

  const [todayOrders, setTodayOrders] = useState({});
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [topDishes, setTopDishes] = useState([]);

  const fetchDahboardData = async () => {
    const response = await axios.get(`${process.env.REACT_APP_API}/statistics/dashboard`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    console.log(response.data);
    setTodayOrders(response.data.TodayTotalOrderTypeWiseOrders);
    setTopDishes(response.data.MostSellingDishes);

    const rawRevenue = response.data.LastWeekTotalRevenue || [];

    const labels = rawRevenue.map(item => {
      // Construct a real date object
      const dateObj = new Date(item._id.year, item._id.month - 1, item._id.day);
      return format(dateObj, "EEE"); // "Mon", "Tue", ...
    });

    const values = rawRevenue.map(item => item.totalRevenue);

    setWeeklyRevenue({ labels, values });
  };

  useEffect(() => {
    fetchDahboardData();
  }, []);

  return (
    <>
      <HtmlHead title={title} description={description} />
      {/* Title and Top Buttons Start */}
      <div className="page-title-container">
        <Row>
          {/* Title Start */}
          <Col md="7">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          {/* Title End */}
        </Row>
      </div>
      {/* Title and Top Buttons End */}

      <Row>
        <Col lg="6">
          {/* Stats Start */}
          <div className="d-flex">
            <Dropdown>
              <Dropdown.Toggle className="small-title p-0 align-top h-auto me-2" variant="link">
                Today's
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item>Weekly</Dropdown.Item>
                <Dropdown.Item>Monthly</Dropdown.Item>
                <Dropdown.Item>Yearly</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <h2 className="small-title">Stats</h2>
          </div>
          <div className="mb-5">
            <Row className="g-2">
              <Col sm="6">
                <Card className="sh-11 hover-scale-up cursor-pointer">
                  <Card.Body className="h-100 py-3 align-items-center">
                    <Row className="g-0 h-100 align-items-center">
                      <Col xs="auto" className="pe-3">
                        <div className="bg-gradient-light sh-5 sw-5 rounded-xl d-flex justify-content-center align-items-center">
                          <CsLineIcons icon="navigate-diagonal" className="text-white" />
                        </div>
                      </Col>
                      <Col>
                        <Row className="gx-2 d-flex align-content-center">
                          <Col xs="12" className="col-12 d-flex">
                            <div className="d-flex align-items-center lh-1-25">Total Orders</div>
                          </Col>
                          <Col xl="auto" className="col-12">
                            <div className="cta-2 text-primary"> {Object.values(todayOrders).reduce((a, b) => a + b, 0)} </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm="6">
                <Card className="sh-11 hover-scale-up cursor-pointer">
                  <Card.Body className="h-100 py-3 align-items-center">
                    <Row className="g-0 h-100 align-items-center">
                      <Col xs="auto" className="pe-3">
                        <div className="bg-gradient-light sh-5 sw-5 rounded-xl d-flex justify-content-center align-items-center">
                          <CsLineIcons icon="check" className="text-white" />
                        </div>
                      </Col>
                      <Col>
                        <Row className="gx-2 d-flex align-content-center">
                          <Col xs="12" className="col-12 d-flex">
                            <div className="d-flex align-items-center lh-1-25">Dine-In</div>
                          </Col>
                          <Col xl="auto" className="col-12">
                            <div className="cta-2 text-primary"> {todayOrders["Dine In"] || 0} </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm="6">
                <Card className="sh-11 hover-scale-up cursor-pointer">
                  <Card.Body className="h-100 py-3 align-items-center">
                    <Row className="g-0 h-100 align-items-center">
                      <Col xs="auto" className="pe-3">
                        <div className="bg-gradient-light sh-5 sw-5 rounded-xl d-flex justify-content-center align-items-center">
                          <CsLineIcons icon="alarm" className="text-white" />
                        </div>
                      </Col>
                      <Col>
                        <Row className="gx-2 d-flex align-content-center">
                          <Col xs="12" className="col-12 d-flex">
                            <div className="d-flex align-items-center lh-1-25">Takeaway</div>
                          </Col>
                          <Col xl="auto" className="col-12">
                            <div className="cta-2 text-primary"> {todayOrders.Takeaway || 0} </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm="6">
                <Card className="sh-11 hover-scale-up cursor-pointer">
                  <Card.Body className="h-100 py-3 align-items-center">
                    <Row className="g-0 h-100 align-items-center">
                      <Col xs="auto" className="pe-3">
                        <div className="bg-gradient-light sh-5 sw-5 rounded-xl d-flex justify-content-center align-items-center">
                          <CsLineIcons icon="sync-horizontal" className="text-white" />
                        </div>
                      </Col>
                      <Col>
                        <Row className="gx-2 d-flex align-content-center">
                          <Col xs="12" className="col-12 d-flex">
                            <div className="d-flex align-items-center lh-1-25">Delivery</div>
                          </Col>
                          <Col xl="auto" className="col-12">
                            <div className="cta-2 text-primary"> {todayOrders.Delivery || 0} </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
          {/* Stats End */}

          {/* Sales Start */}
          <h2 className="small-title">Sales</h2>
          <Card className="mb-5 sh-40">
            <Card.Body>
              <ChartHorizontal weeklyRevenue={weeklyRevenue} />
            </Card.Body>
          </Card>
          {/* Sales End */}
        </Col>

        <Col lg="6" className="mb-5">
          <div className="d-flex justify-content-between">
            <h2 className="small-title">Stocks</h2>
            <Button variant="background-alternate" size="xs" className="btn-icon btn-icon-end p-0 text-small">
              <span className="align-bottom">View More</span> <CsLineIcons icon="chevron-right" className="align-middle" size="12" />
            </Button>
          </div>
          <div className="mb-n2">
            {topDishes.map((dish, idx) => (
              <Card className="mb-2 sh-10 sh-md-8" key={idx}>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="5" className="d-flex align-items-center mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail" className="body-link text-truncate">
                        {dish.dishName}
                      </NavLink>
                    </Col>
                    <Col md="2" className="d-flex align-items-center text-muted text-medium mb-1 mb-md-0">
                      <Badge bg="outline-tertiary" className="me-1">
                        {dish.category}
                      </Badge>
                    </Col>
                    <Col md="3" className="d-flex align-items-center text-medium text-danger justify-content-center">
                      <CsLineIcons icon="arrow-bottom" className="me-1" size="14" />
                      <span className="text-medium">-18.4%</span>
                    </Col>
                    <Col md="2" className="d-flex align-items-center justify-content-end text-muted text-medium">
                      <span>{dish.totalSold}</span>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </div>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;
