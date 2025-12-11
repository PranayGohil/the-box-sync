import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';

const validationSchema = Yup.object().shape({
  restaurant_name: Yup.string().required('Restaurant name is required'),
  restaurant_address: Yup.string().required('Restaurant address is required'),
  contact_email: Yup.string().email('Invalid email').required('Email is required'),
  contact_phone: Yup.string().required('Phone is required'),
  open_days: Yup.string().required('Open days are required'),
  open_time_from: Yup.string().required('Opening time is required'),
  open_time_to: Yup.string().required('Closing time is required'),
});

const ManageWebsite = () => {
  const title = 'Manage Website';
  const description = 'Update restaurant details and featured menu items.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'admin', text: 'Admin' },
    { to: 'admin/manage-website', title: 'Manage Website' },
  ];

  const [allDishes, setAllDishes] = useState([]);

  const formik = useFormik({
    initialValues: {
      restaurant_name: '',
      restaurant_address: '',
      contact_email: '',
      contact_phone: '',
      open_days: 'Monday-Saturday',
      open_time_from: '11:00',
      open_time_to: '23:00',
      featured_dish_ids: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const payload = { ...values, featured_dish_ids: JSON.stringify(values.featured_dish_ids) };
        await axios.post(`${process.env.REACT_APP_API}/website/settings`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        toast.success('Website settings updated successfully.');
      } catch (err) {
        console.error('Failed to update:', err);
        toast.error('Update failed.');
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/website/settings`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        console.log(res.data);
        if (res.data) {
          Object.keys(res.data).forEach((key) => {
            if (key in values) {
              setFieldValue(key, res.data[key]);
            }
          });
        }
      } catch (err) {
        console.log(err);
        toast.error('Failed to fetch settings.');
      }
    };

    const fetchDishes = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/website/dishes`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setAllDishes(res.data);
      } catch (err) {
        console.log(err);
        toast.error('Failed to fetch dishes.');
      }
    };

    fetchSettings();
    fetchDishes();
  }, []);

  const handleDishSelect = (id) => {
    const ids = values.featured_dish_ids.includes(id) ? values.featured_dish_ids.filter((d) => d !== id) : [...values.featured_dish_ids, id];
    setFieldValue('featured_dish_ids', ids);
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
            {/* Website Details */}
            <Card body className="mb-4">
              <h5 className="mb-3">Website Details</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Restaurant Name</Form.Label>
                    <Form.Control
                      name="restaurant_name"
                      value={values.restaurant_name}
                      onChange={handleChange}
                      isInvalid={touched.restaurant_name && errors.restaurant_name}
                    />
                    <Form.Control.Feedback type="invalid">{errors.restaurant_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Restaurant Address</Form.Label>
                    <Form.Control
                      name="restaurant_address"
                      value={values.restaurant_address}
                      onChange={handleChange}
                      isInvalid={touched.restaurant_address && errors.restaurant_address}
                    />
                    <Form.Control.Feedback type="invalid">{errors.restaurant_address}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Open Days</Form.Label>
                    <Form.Control name="open_days" value={values.open_days} onChange={handleChange} isInvalid={touched.open_days && errors.open_days} />
                    <Form.Control.Feedback type="invalid">{errors.open_days}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Opening Time</Form.Label>
                    <Form.Control
                      type="time"
                      name="open_time_from"
                      value={values.open_time_from}
                      onChange={handleChange}
                      isInvalid={touched.open_time_from && errors.open_time_from}
                    />
                    <Form.Control.Feedback type="invalid">{errors.open_time_from}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Closing Time</Form.Label>
                    <Form.Control
                      type="time"
                      name="open_time_to"
                      value={values.open_time_to}
                      onChange={handleChange}
                      isInvalid={touched.open_time_to && errors.open_time_to}
                    />
                    <Form.Control.Feedback type="invalid">{errors.open_time_to}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="contact_email"
                      value={values.contact_email}
                      onChange={handleChange}
                      isInvalid={touched.contact_email && errors.contact_email}
                    />
                    <Form.Control.Feedback type="invalid">{errors.contact_email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      name="contact_phone"
                      value={values.contact_phone}
                      onChange={handleChange}
                      isInvalid={touched.contact_phone && errors.contact_phone}
                    />
                    <Form.Control.Feedback type="invalid">{errors.contact_phone}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            {/* Featured Menu Items */}
            <Card body className="mb-4">
              <h5 className="mb-3">Featured Menu Items</h5>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }} className="border rounded p-3">
                {allDishes.map((menu) => (
                  <div key={menu.category} className="mb-3">
                    <strong>
                      {menu.category} ({menu.meal_type})
                    </strong>
                    <div className="ms-3 mt-2">
                      {menu.dishes.map((dish) => (
                        <Form.Check
                          key={dish._id}
                          type="checkbox"
                          label={dish.dish_name}
                          checked={values.featured_dish_ids.includes(dish._id)}
                          onChange={() => handleDishSelect(dish._id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Button variant="success" type="submit">
              Update Settings
            </Button>
          </Form>
        </Col>
      </Row>
    </>
  );
};

export default ManageWebsite;
