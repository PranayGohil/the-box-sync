import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';

const AddInventory = () => {
  const title = 'Add Inventory';
  const description = 'Add new inventory using modern theme with dummy data.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/add-inventory', title: 'Add Inventory' },
  ];

  const [values, setValues] = useState({
    bill_date: '',
    bill_number: '',
    vendor_name: '',
    category: '',
    total_amount: 0,
    paid_amount: 0,
    unpaid_amount: 0,
    bill_files: [],
    items: [{ item_name: 'Sample Item', item_quantity: 1, unit: 'kg', item_price: 100 }],
  });

  const [filePreviews, setFilePreviews] = useState([]);

  useEffect(() => {
    const unpaid = values.total_amount - values.paid_amount;
    setValues((prev) => ({ ...prev, unpaid_amount: Number.isNaN(unpaid) ? 0 : unpaid }));
  }, [values.total_amount, values.paid_amount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...values.items];
    updatedItems[index][field] = value;
    setValues((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setValues((prev) => ({
      ...prev,
      items: [...prev.items, { item_name: '', item_quantity: 0, unit: '', item_price: 0 }],
    }));
  };

  const removeItem = (index) => {
    setValues((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
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
    alert('Inventory saved locally (dummy). Check console!');
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
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Total Amount</Form.Label>
                    <Form.Control type="number" name="total_amount" value={values.total_amount} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Paid Amount</Form.Label>
                    <Form.Control type="number" name="paid_amount" value={values.paid_amount} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Unpaid Amount</Form.Label>
                    <Form.Control type="number" value={values.unpaid_amount} readOnly />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Bill Files</Form.Label>
                    <Form.Control type="file" accept="image/*,application/pdf" multiple onChange={handleFileChange} />
                  </Form.Group>
                  <div className="d-flex flex-wrap mt-2">
                    {filePreviews.map((file, i) => (
                      <div key={i} className="me-2">
                        {file.type === 'image' ? (
                          <img src={file.src} alt={file.name} width="80" height="80" />
                        ) : (
                          <iframe src={file.src} title={file.name} width="80" height="80" />
                        )}
                        <div style={{ fontSize: '10px' }}>{file.name}</div>
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
                  <Col md={3}>
                    <Form.Control
                      type="text"
                      placeholder="Item Name"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Control
                      type="number"
                      placeholder="Quantity"
                      value={item.item_quantity}
                      onChange={(e) => handleItemChange(index, 'item_quantity', e.target.value)}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Select value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)}>
                      <option value="">Unit</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="litre">litre</option>
                      <option value="ml">ml</option>
                      <option value="piece">piece</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Control
                      type="number"
                      placeholder="Item Price"
                      value={item.item_price}
                      onChange={(e) => handleItemChange(index, 'item_price', e.target.value)}
                    />
                  </Col>
                  <Col md={2} className="d-flex align-items-center">
                    <Button variant="outline-danger" size="sm" onClick={() => removeItem(index)}>
                      Remove
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button variant="primary" onClick={addItem}>
                + Add Item
              </Button>
            </Card>

            <Button variant="success" type="submit">
              Save Inventory
            </Button>
          </Form>
        </Col>
      </Row>
    </>
  );
};

export default AddInventory;
