import React from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Col, Row, Button, Form as BForm } from 'react-bootstrap';
import { Formik, Form, FieldArray, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';

const AddDishes = () => {
  const title = 'Add Dishes';
  const description = 'Form to add dishes using Formik and Yup';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/add-dish', title: 'Add Dishes' },
  ];

  const history = useHistory();

  const initialValues = {
    category: '',
    mealType: 'veg',
    dishes: [
      {
        dish_name: '',
        dish_price: '',
        dish_img: null,
        description: '',
        quantity: '',
        unit: '',
        showAdvancedOptions: false,
      },
    ],
  };

  const validationSchema = Yup.object().shape({
    category: Yup.string().required('Category is required'),
    mealType: Yup.string().required('Meal type is required'),
    dishes: Yup.array().of(
      Yup.object().shape({
        dish_name: Yup.string().required('Dish name is required'),
        dish_price: Yup.number().typeError('Must be a number').required('Price is required'),
        description: Yup.string(),
        quantity: Yup.string(),
        unit: Yup.string(),
      })
    ),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const formData = new FormData();
      formData.append('category', values.category);
      formData.append('meal_type', values.mealType);
      const dishData = values.dishes.map((dish, i) => {
        if (dish.dish_img) {
          formData.append(`dish_img`, dish.dish_img); // same field for each
        }
        return {
          ...dish,
          dish_img: '', // placeholder to be filled on server
        };
      });
      formData.append('dishes', JSON.stringify(dishData));

      const res = await axios.post(`${process.env.REACT_APP_API}/menu/add`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      alert(res.data.message || 'Menu saved');
      resetForm();
      history.push('/operations/manage-menu');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Something went wrong!');
    } finally {
      setSubmitting(false);
    }
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
              <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
                {({ values, isSubmitting, handleChange, setFieldValue }) => (
                  <Form>
                    <Row className="mb-3">
                      <Col md={4}>
                        <BForm.Group>
                          <BForm.Label>Dish Category</BForm.Label>
                          <Field name="category" className="form-control" />
                          <ErrorMessage name="category" component="div" className="text-danger" />
                        </BForm.Group>
                      </Col>
                      <Col md={8}>
                        <BForm.Label className="d-block">Meal Type</BForm.Label>
                        {['veg', 'egg', 'non-veg'].map((type) => (
                          <BForm.Check
                            inline
                            key={type}
                            label={type}
                            name="mealType"
                            type="radio"
                            id={`meal-${type}`}
                            checked={values.mealType === type}
                            onChange={() => setFieldValue('mealType', type)}
                          />
                        ))}
                      </Col>
                    </Row>

                    <FieldArray name="dishes">
                      {({ push, remove }) => (
                        <>
                          {values.dishes.map((dish, index) => (
                            <Card key={index} className="mb-4 p-3">
                              <Row>
                                <Col md={4}>
                                  <BForm.Group>
                                    <BForm.Label>Dish Name</BForm.Label>
                                    <Field name={`dishes[${index}].dish_name`} className="form-control" />
                                    <ErrorMessage name={`dishes[${index}].dish_name`} component="div" className="text-danger" />
                                  </BForm.Group>
                                </Col>
                                <Col md={4}>
                                  <BForm.Group>
                                    <BForm.Label>Price</BForm.Label>
                                    <Field name={`dishes[${index}].dish_price`} className="form-control" />
                                    <ErrorMessage name={`dishes[${index}].dish_price`} component="div" className="text-danger" />
                                  </BForm.Group>
                                </Col>
                                <Col md={4} className="d-flex align-items-end">
                                  <Button variant="outline-danger" onClick={() => remove(index)}>
                                    Remove
                                  </Button>
                                </Col>
                              </Row>

                              <Row className="mt-2">
                                <Col md={4}>
                                  <BForm.Group>
                                    <BForm.Label>Image</BForm.Label>
                                    <input
                                      type="file"
                                      className="form-control"
                                      onChange={(e) => setFieldValue(`dishes[${index}].dish_img`, e.currentTarget.files[0])}
                                    />
                                  </BForm.Group>
                                </Col>
                                <Col md={8}>
                                  <BForm.Group>
                                    <BForm.Label>Description</BForm.Label>
                                    <Field as="textarea" rows={2} name={`dishes[${index}].description`} className="form-control" />
                                  </BForm.Group>
                                </Col>
                              </Row>

                              <BForm.Check
                                type="checkbox"
                                label="Advanced Options"
                                checked={dish.showAdvancedOptions}
                                onChange={() => setFieldValue(`dishes[${index}].showAdvancedOptions`, !dish.showAdvancedOptions)}
                                className="mt-2"
                              />

                              {dish.showAdvancedOptions && (
                                <Row className="mt-2">
                                  <Col md={6}>
                                    <BForm.Group>
                                      <BForm.Label>Quantity</BForm.Label>
                                      <Field name={`dishes[${index}].quantity`} className="form-control" />
                                    </BForm.Group>
                                  </Col>
                                  <Col md={6}>
                                    <BForm.Group>
                                      <BForm.Label>Unit</BForm.Label>
                                      <Field as="select" name={`dishes[${index}].unit`} className="form-select">
                                        <option value="">Select unit</option>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="litre">litre</option>
                                        <option value="ml">ml</option>
                                        <option value="piece">piece</option>
                                      </Field>
                                    </BForm.Group>
                                  </Col>
                                </Row>
                              )}
                            </Card>
                          ))}

                          <div className="d-flex gap-2 mt-3">
                            <Button
                              type="button"
                              variant="primary"
                              onClick={() =>
                                push({
                                  dish_name: '',
                                  dish_price: '',
                                  dish_img: null,
                                  description: '',
                                  quantity: '',
                                  unit: '',
                                  showAdvancedOptions: false,
                                })
                              }
                            >
                              + Add More Dishes
                            </Button>
                          </div>
                        </>
                      )}
                    </FieldArray>

                    <div className="mt-4">
                      <Button type="submit" variant="success" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Menu'}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card>
          </section>
        </Col>
      </Row>
    </>
  );
};

export default AddDishes;
