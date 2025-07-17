import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import BoxedVariationsStripe from './components/BoxedVariationsStripe';

const ManageTable = () => {
  const title = 'Manage Tables';
  const description = 'React Table responsive boxed variations with search.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/manage-table', title: 'Manage Tables' },
  ];

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          {/* Title Start */}
          <section className="scroll-section" id="title">
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
          </section>
          {/* Title End */}

          <Row>
            <Col md={4}>
              <section className="scroll-section" id="stripe">
                <h2 className="small-title">Stripe</h2>
                <Card body className="mb-5">
                  <BoxedVariationsStripe />
                </Card>
              </section>
            </Col>
            <Col md={4}>
              <section className="scroll-section" id="stripe">
                <h2 className="small-title">Stripe</h2>
                <Card body className="mb-5">
                  <BoxedVariationsStripe />
                </Card>
              </section>
            </Col>
            <Col md={4}>
              <section className="scroll-section" id="stripe">
                <h2 className="small-title">Stripe</h2>
                <Card body className="mb-5">
                  <BoxedVariationsStripe />
                </Card>
              </section>
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

export default ManageTable;
