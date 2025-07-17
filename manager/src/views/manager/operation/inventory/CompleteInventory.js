import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';

const CompleteInventory = () => {
  const title = 'Complete Inventory Request';
  const description = 'Complete inventory request with dummy data and modern theme.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/inventory', text: 'Inventory' },
    { to: 'operations/complete-inventory', title: 'Complete Inventory' },
  ];

  const [values, setValues] = useState({
    bill_date: '2025-07-06',
    bill_number: 'BILL-9876',
    vendor_name: 'Dummy Vendor',
    category: 'Electronics',
    total_amount: 1500,
    paid_amount: 500,
    unpaid_amount: 1000,
    bill_files: [],
    items: [
      { item_name: 'Mouse', item_quantity: 10, unit: 'pcs', item_price: 100, completed: false },
      { item_name: 'Keyboard', item_quantity: 5, unit: 'pcs', item_price: 200, completed: false },
    ],
  });

  const [filePreviews, setFilePreviews] = useState([]);

  useEffect(() => {
    const unpaid = values.total_amount - values.paid_amount;
    setValues((prev) => ({ ...prev, unpaid_amount: Number.isNaN(unpaid) ? 0 : unpaid }));
  }, [values.total_amount, values.paid_amount]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...values.items];
    updatedItems[index][field] = field === 'completed' ? value : value;
    setValues((prev) => ({ ...prev, items: updatedItems }));
  };

  const previewFiles = (files) => {
    const previews = Array.from(files)
      .map((file) => {
        if (file.type.startsWith('image/')) {
          return { type: 'image', src: URL.createObjectURL(file), name: file.name };
        }
        if (file.type === 'application/pdf') {
          return { type: 'pdf', src: URL.createObjectURL(file), name: file.name };
        }
        return null;
      })
      .filter(Boolean);
    setFilePreviews(previews);
  };

  const handleFileChange = (e) => {
    const { files } = e.target;
    setValues((prev) => ({ ...prev, bill_files: files }));
    previewFiles(files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted data:', values);
    alert('Completed locally (dummy). Check console!');
  };

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </div>

          <Form onSubmit={handleSubmit}>
            <Card body className="mb-4">
              <h5 className="mb-3">Purchase Details</h5>
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Bill Date</Form.Label>
                    <Form.Control type="date" name="bill_date" value={values.bill_date} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Bill Number</Form.Label>
                    <Form.Control type="text" name="bill_number" value={values.bill_number} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Vendor Name</Form.Label>
                    <Form.Control type="text" name="vendor_name" value={values.vendor_name} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Control type="text" name="category" value={values.category} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Total Amount</Form.Label>
                    <Form.Control type="number" name="total_amount" value={values.total_amount} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Paid Amount</Form.Label>
                    <Form.Control type="number" name="paid_amount" value={values.paid_amount} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Unpaid Amount</Form.Label>
                    <Form.Control type="number" value={values.unpaid_amount} readOnly />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Bill Files</Form.Label>
                    <Form.Control type="file" accept="image/*,application/pdf" multiple onChange={handleFileChange} />
                  </Form.Group>
                  <div className="d-flex flex-wrap mt-2">
                    {filePreviews.map((file, i) => (
                      <div key={i} className="me-2">
                        {file.type === 'image' ? <img src={file.src} alt={file.name} width="80" height="80" /> : <Badge bg="secondary">{file.name}</Badge>}
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            </Card>

            <Card body className="mb-4">
              <h5 className="mb-3">Item Details</h5>
              {values.items.map((item, index) => (
                <Row key={index} className="mb-3">
                  <Col md={1} className="d-flex align-items-end">
                    <Form.Check type="checkbox" label="" checked={item.completed} onChange={(e) => handleItemChange(index, 'completed', e.target.checked)} />
                  </Col>
                  <Col md={3}>
                    <Form.Label>Item Name</Form.Label>
                    <Form.Control type="text" value={item.item_name} readOnly />
                  </Col>
                  <Col md={2}>
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control type="number" value={item.item_quantity} readOnly />
                  </Col>
                  <Col md={2}>
                    <Form.Label>Unit</Form.Label>
                    <Form.Control type="text" value={item.unit} readOnly />
                  </Col>
                  <Col md={3}>
                    <Form.Label>Price</Form.Label>
                    <Form.Control type="number" value={item.item_price} onChange={(e) => handleItemChange(index, 'item_price', e.target.value)} />
                  </Col>
                </Row>
              ))}
            </Card>

            <Button variant="success" type="submit">
              Complete Request
            </Button>
          </Form>
        </Col>
      </Row>
    </>
  );
};

export default CompleteInventory;
