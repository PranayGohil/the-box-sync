import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import LayoutsFormRow from './components/LayoutsFormRow';

const AddTable = () => {
  const title = 'Add Table';
  const description = 'Examples and usage guidelines for form control styles and layout options.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/add-table', title: 'Add Table' },
  ];

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <section className="scroll-section" id="title">
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
          </section>

          <section className="scroll-section" id="formRow">
            <Card body className="mb-5">
              <LayoutsFormRow />
            </Card>
          </section>
        </Col>
      </Row>
    </>
  );
};

export default AddTable;
