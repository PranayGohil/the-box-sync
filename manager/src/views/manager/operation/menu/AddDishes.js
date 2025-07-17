import React, { useState } from 'react';
import { Card, Col, Row, Button, Form, InputGroup } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';

const AddDishes = () => {
  const title = 'Add Dishes';
  const description = 'Form to add dishes using the new theme with old fields (dummy data).';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/add-dish', title: 'Add Dishes' },
  ];

  // Dummy data state
  const [mealType, setMealType] = useState('veg');
  const [dishes, setDishes] = useState([
    {
      dish_name: 'Paneer Butter Masala',
      dish_price: '250',
      dish_img: null,
      description: 'Rich and creamy cottage cheese curry',
      quantity: '500',
      unit: 'g',
      showAdvancedOptions: false,
    },
  ]);

  // Add dish
  const addDish = () => {
    setDishes([
      ...dishes,
      {
        dish_name: '',
        dish_price: '',
        dish_img: null,
        description: '',
        quantity: '',
        unit: '',
        showAdvancedOptions: false,
      },
    ]);
  };

  // Remove dish
  const removeDish = (index) => {
    const updated = [...dishes];
    updated.splice(index, 1);
    setDishes(updated);
  };

  // Toggle advanced
  const toggleAdvanced = (index) => {
    const updated = dishes.map((dish, i) => (i === index ? { ...dish, showAdvancedOptions: !dish.showAdvancedOptions } : dish));
    setDishes(updated);
  };

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
              <Form>
                {/* Category field */}
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group controlId="category">
                      <Form.Label>Dish Category</Form.Label>
                      <Form.Control type="text" placeholder="e.g., Main Course" defaultValue="Main Course" />
                    </Form.Group>
                  </Col>
                  {/* Meal Type */}
                  <Col md={8}>
                    <Form.Label className="d-block">Meal Type</Form.Label>
                    {['veg', 'egg', 'non-veg'].map((type) => (
                      <Form.Check
                        inline
                        key={type}
                        label={type}
                        name="mealType"
                        type="radio"
                        id={`meal-${type}`}
                        checked={mealType === type}
                        onChange={() => setMealType(type)}
                      />
                    ))}
                  </Col>
                </Row>

                {/* Dishes */}
                {dishes.map((dish, index) => (
                  <Card key={index} className="mb-4 p-3">
                    <Row>
                      <Col md={4}>
                        <Form.Group controlId={`dish-name-${index}`}>
                          <Form.Label>Dish Name</Form.Label>
                          <Form.Control type="text" defaultValue={dish.dish_name} placeholder="Enter dish name" />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group controlId={`dish-price-${index}`}>
                          <Form.Label>Price</Form.Label>
                          <Form.Control type="text" defaultValue={dish.dish_price} placeholder="e.g., 250" />
                        </Form.Group>
                      </Col>
                      <Col md={4} className="d-flex align-items-end">
                        <Button variant="outline-danger" onClick={() => removeDish(index)}>
                          Remove
                        </Button>
                      </Col>
                    </Row>

                    <Row className="mt-2">
                      <Col md={4}>
                        <Form.Group controlId={`dish-img-${index}`}>
                          <Form.Label>Image</Form.Label>
                          <Form.Control type="file" accept="image/*" />
                        </Form.Group>
                      </Col>
                      <Col md={8}>
                        <Form.Group controlId={`dish-desc-${index}`}>
                          <Form.Label>Description</Form.Label>
                          <Form.Control as="textarea" rows={2} defaultValue={dish.description} />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Advanced Options */}
                    <Form.Check
                      type="checkbox"
                      label="Advanced Options"
                      checked={dish.showAdvancedOptions}
                      onChange={() => toggleAdvanced(index)}
                      className="mt-2"
                    />
                    {dish.showAdvancedOptions && (
                      <Row className="mt-2">
                        <Col md={6}>
                          <Form.Group controlId={`dish-qty-${index}`}>
                            <Form.Label>Quantity</Form.Label>
                            <Form.Control type="text" defaultValue={dish.quantity} placeholder="e.g., 500" />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group controlId={`dish-unit-${index}`}>
                            <Form.Label>Unit</Form.Label>
                            <Form.Select defaultValue={dish.unit}>
                              <option value="">Select unit</option>
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="litre">litre</option>
                              <option value="ml">ml</option>
                              <option value="piece">piece</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    )}
                  </Card>
                ))}

                <div className="d-flex gap-2 mt-3">
                  <Button variant="primary" onClick={addDish}>
                    + Add More Dishes
                  </Button>
                  <Button variant="success">Save Menu</Button>
                </div>
              </Form>
            </Card>
          </section>
        </Col>
      </Row>
    </>
  );
};

export default AddDishes;
