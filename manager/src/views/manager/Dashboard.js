import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Dropdown, Badge } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { format } from "date-fns";
import Glide from 'components/carousel/Glide';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ChartHorizontal from './ChartBar';

const Dashboard = () => {
  const title = 'Dashboard';
  const description = 'Analytic Dashboard';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Dashboard' },
  ];

  const [tables, setTables] = useState([]);
  const [topDishes, setTopDishes] = useState([]);

  const fetchTables = async () => {
    const response = await axios.get(`${process.env.REACT_APP_API}/table/get-all`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    console.log(response.data);
    setTables(response.data.data);
  }
  const fetchDahboardData = async () => {
    const response = await axios.get(`${process.env.REACT_APP_API}/statistics/dashboard`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    console.log(response.data);
    setTopDishes(response.data.MostSellingDishes);
  };

  useEffect(() => {
    fetchTables();
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
          {/* {tables.map((table) => ( */}
            <Row className="gx-2">
              <h2 className="small-title">table.area</h2>
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
                  {/* {table.tables.map((item, idx) => ( */}
                    <div>
                      <Glide.Item>
                        <Card className="sh-20 hover-border-primary mb-5">
                          <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                            <div className="d-flex sh-5 sw-5 bg-gradient-light mb-3 align-items-center justify-content-center rounded-xl">
                              <CsLineIcons icon="user" className="text-white" />
                            </div>
                            <p className="mb-0 lh-1">Tables</p>
                            <p className="cta-3 mb-0 text-primary">item.table_noooooooooooooooooooooooooooooooooooo</p>
                          </Card.Body>
                        </Card>
                      </Glide.Item>
                    </div>
                  {/* ))} */}
                      <Glide.Item>
                        <Card className="sh-20 hover-border-primary mb-5">
                          <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                            <div className="d-flex sh-5 sw-5 bg-gradient-light mb-3 align-items-center justify-content-center rounded-xl">
                              <CsLineIcons icon="user" className="text-white" />
                            </div>
                            <p className="mb-0 lh-1">Tables</p>
                            <p className="cta-3 mb-0 text-primary">item.table_n</p>
                          </Card.Body>
                        </Card>
                      </Glide.Item>
                </Glide>
              </Col>
            </Row>
          // ))}
        </Col>

        <Col lg="6" className="mb-5">
          <div className="d-flex justify-content-between">
            <h2 className="small-title">Top Selling Dishes</h2>
            <Button variant="background-alternate" size="xs" className="btn-icon btn-icon-end p-0 text-small">
              <span className="align-bottom">View More</span> <CsLineIcons icon="chevron-right" className="align-middle" size="12" />
            </Button>
          </div>
          <div className="mb-n2">
            {topDishes.map((dish, idx) => (
              <Card className="mb-2 sh-10 sh-md-8" key={idx}>
                <Card.Body className="pt-0 pb-0 h-100">
                  <Row className="g-0 h-100 align-content-center">
                    <Col md="6" className="d-flex align-items-center mb-2 mb-md-0">
                      <NavLink to="/pages/portfolio/detail" className="body-link text-truncate">
                        {dish.dishName}
                      </NavLink>
                    </Col>
                    <Col md="4" className="d-flex align-items-center text-muted text-medium mb-1 mb-md-0">
                      <Badge bg="outline-tertiary" className="me-1">
                        {dish.category}
                      </Badge>
                    </Col>
                    {/* <Col md="3" className="d-flex align-items-center text-medium text-danger justify-content-center">
                      <CsLineIcons icon="arrow-bottom" className="me-1" size="14" />
                      <span className="text-medium">-18.4%</span>
                    </Col> */}
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
