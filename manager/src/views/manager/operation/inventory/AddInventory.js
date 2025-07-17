import React, { useState } from 'react';
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

  const [items, setItems] = useState([
    { item_name: '', unit: '', item_quantity: '' },
  ]);

  const addItemField = () => {
    setItems([...items, { item_name: '', unit: '', item_quantity: '' }]);
  };

  const removeItemField = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...items];
    updated[index][name] = value;
    setItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted dummy inventory:', items);
    alert('Inventory saved (dummy). Check console.');
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
              <h5 className="mb-3">Inventory Items</h5>
              {items.map((item, index) => (
                <Card className="mb-3" key={index}>
                  <Card.Body>
                    <Row>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Item Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="item_name"
                            value={item.item_name}
                            onChange={(e) => handleItemChange(index, e)}
                            placeholder="Enter item name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Unit</Form.Label>
                          <Form.Select
                            name="unit"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, e)}
                          >
                            <option value="">Select Unit</option>
                            <option value="Kilogram">Kilogram (kg)</option>
                            <option value="Grams">Grams (g)</option>
                            <option value="Liter">Liter (L)</option>
                            <option value="ml">Milliliter (ml)</option>
                            <option value="nos">Nos</option>
                            <option value="Pieces">Pieces</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Quantity</Form.Label>
                          <Form.Control
                            type="number"
                            name="item_quantity"
                            value={item.item_quantity}
                            onChange={(e) => handleItemChange(index, e)}
                            placeholder="Enter quantity"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={1} className="d-flex align-items-end">
                        <Button
                          variant="outline-danger"
                          onClick={() => removeItemField(index)}
                        >
                          Remove
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
              <Button variant="dark" onClick={addItemField} className="me-2">
                + Add More
              </Button>
              <Button type="submit" variant="success">
                Save Inventory
              </Button>
            </Card>
          </Form>
        </Col>
      </Row>
    </>
  );
};

export default AddInventory;