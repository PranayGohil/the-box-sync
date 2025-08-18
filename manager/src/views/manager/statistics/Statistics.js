import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Dropdown, Badge } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ChartDoughnut from './components/ChartDoughnut';
import ChartPie from './components/ChartPie';
import ChartBar from './components/ChartBar';

const Statistics = () => {
  const title = 'Analytic Dashboard';
  const description = 'Analytic Dashboard';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
  ];
  const [orderCategoryWise, setOrderCategoryWise] = useState([]);
  const [orderTypeWise, setOrderTypeWise] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState([]);

  const fetchDahboardData = async () => {
    const categoryResponse = await axios.get(`${process.env.REACT_APP_API}/statistics/category-wise-orders`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (categoryResponse.data) {
      setOrderCategoryWise(categoryResponse.data);
    }

    const orderTypeResponse = await axios.get(`${process.env.REACT_APP_API}/statistics/order-type-wise-orders`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    console.log('Order Type Response:', orderTypeResponse.data);
    if (orderTypeResponse.data) {
      setOrderTypeWise(orderTypeResponse.data);
    }

    const revenueResponse = await axios.get(`${process.env.REACT_APP_API}/statistics/revenue-summary?duration=week`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    console.log('Revenue Response:', revenueResponse.data);
    if (revenueResponse.data) {
      setRevenueSummary(revenueResponse.data);
    }
  };

  useEffect(() => {
    fetchDahboardData();
  }, []);

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="page-title-container">
        <Row>
          <Col md="7">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      <Row>
        <Col lg="4">
          <h2 className="small-title">Category</h2>
          <Card className="mb-5 sh-40">
            <Card.Body style={{ height: 'inherit' }}>
              <ChartDoughnut orderCategoryWise={orderCategoryWise} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg="4">
          <h2 className="small-title">Order Type</h2>
          <Card className="mb-5 sh-40">
            <Card.Body style={{ height: 'inherit' }}>
              <ChartPie orderTypeWise={orderTypeWise} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg="4">
          <h2 className="small-title">Last Week Revenue</h2>
          <Card className="mb-5 sh-40">
            <Card.Body> <ChartBar revenueSummary={revenueSummary} /> </Card.Body>
          </Card>
        </Col>

        <Col lg="6" className="mb-5">
          <div className="d-flex justify-content-between">
            <h2 className="small-title">Top Selling Dishes</h2>
            <Button variant="background-alternate" size="xs" className="btn-icon btn-icon-end p-0 text-small">
              <span className="align-bottom">View More</span> <CsLineIcons icon="chevron-right" className="align-middle" size="12" />
            </Button>
          </div>
          <div className="mb-n2">
            <Card className="mb-2 sh-10 sh-md-8">
              <Card.Body className="pt-0 pb-0 h-100">
                <Row className="g-0 h-100 align-content-center">
                  <Col md="6" className="d-flex align-items-center mb-2 mb-md-0">
                    <NavLink to="/pages/portfolio/detail" className="body-link text-truncate">
                      dish.dishName
                    </NavLink>
                  </Col>
                  <Col md="4" className="d-flex align-items-center text-muted text-medium mb-1 mb-md-0">
                    <Badge bg="outline-tertiary" className="me-1">
                      dish.category
                    </Badge>
                  </Col>
                  {/* <Col md="3" className="d-flex align-items-center text-medium text-danger justify-content-center">
                      <CsLineIcons icon="arrow-bottom" className="me-1" size="14" />
                      <span className="text-medium">-18.4%</span>
                    </Col> */}
                  <Col md="2" className="d-flex align-items-center justify-content-end text-muted text-medium">
                    <span>dish.totalSold</span>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default Statistics;
