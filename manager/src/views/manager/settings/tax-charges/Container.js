import React, { useEffect, useState } from 'react';
import { Button, Form, Card, Col, Row, Alert } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';

const Container = () => {
  const title = 'Edit Container Charges';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'settings', text: 'Settings' },
    { to: 'settings/container-charges', title: 'Container Charges' },
  ];

  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const validationSchema = Yup.object().shape({
    containers: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('Name is required'),
        sizeValue: Yup.number().required('Size is required').min(0, 'Must be positive'),
        sizeUnit: Yup.string().required('Unit is required'),
        price: Yup.number().required('Price is required').min(0, 'Price must be non-negative'),
      })
    ),
  });

  const formik = useFormik({
    initialValues: {
      containers: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const res = await axios.put(
          `${process.env.REACT_APP_API}/charge/update-container-charge`,
          {
            containerCharges: values.containers.map((c) => ({
              ...c,
              size: `${c.sizeValue} ${c.sizeUnit}`,
            })),
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        if (res.data.success) {
          setSuccessMessage('Container charges updated successfully.');
          setServerError('');
          setIsEditing(false);
        } else {
          setServerError('Update failed.');
        }
      } catch (err) {
        console.error(err);
        setServerError('Server error occurred.');
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/charge/get-container-charges`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.data.success && res.data.user.containerCharges) {
          const parsedContainers = res.data.user.containerCharges.map((c) => {
            const [value, unit] = c.size.split(' ');
            return {
              ...c,
              sizeValue: value || '',
              sizeUnit: unit || '',
            };
          });
          formik.setFieldValue('containers', parsedContainers);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    fetchData();
  }, []);

  const addContainer = () => {
    formik.setFieldValue('containers', [...formik.values.containers, { name: '', sizeValue: '', sizeUnit: '', price: 0 }]);
  };

  const removeContainer = (index) => {
    const updated = [...formik.values.containers];
    updated.splice(index, 1);
    formik.setFieldValue('containers', updated);
  };

  return (
    <>
      <HtmlHead title={title} />
      <Row>
        <Col>
          <section className="scroll-section" id="title">
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
          </section>

          <section className="scroll-section" id="form">
            <Card body>
              <Form onSubmit={formik.handleSubmit}>
                {formik.values.containers.map((container, index) => (
                  <Row className="mb-3" key={index}>
                    <Col md={3}>
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        name={`containers.${index}.name`}
                        value={container.name}
                        onChange={formik.handleChange}
                        isInvalid={!!formik.errors.containers?.[index]?.name}
                        disabled={!isEditing}
                        readOnly={!isEditing}
                      />
                      <Form.Control.Feedback type="invalid">{formik.errors.containers?.[index]?.name}</Form.Control.Feedback>
                    </Col>
                    <Col md={3}>
                      <Form.Label>Size</Form.Label>
                      <Row>
                        <Col xs={6}>
                          <Form.Control
                            type="number"
                            name={`containers.${index}.sizeValue`}
                            value={container.sizeValue}
                            onChange={formik.handleChange}
                            isInvalid={!!formik.errors.containers?.[index]?.sizeValue}
                            disabled={!isEditing}
                            placeholder="Quantity"
                          />
                          <Form.Control.Feedback type="invalid">{formik.errors.containers?.[index]?.sizeValue}</Form.Control.Feedback>
                        </Col>
                        <Col xs={6}>
                          <Form.Select
                            name={`containers.${index}.sizeUnit`}
                            value={container.sizeUnit}
                            onChange={formik.handleChange}
                            isInvalid={!!formik.errors.containers?.[index]?.sizeUnit}
                            disabled={!isEditing}
                          >
                            <option value="">Select Unit</option>
                            <option value="ml">ml</option>
                            <option value="l">l</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="pieces">pieces</option>
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">{formik.errors.containers?.[index]?.sizeUnit}</Form.Control.Feedback>
                        </Col>
                      </Row>
                    </Col>
                    <Col md={3}>
                      <Form.Label>Price</Form.Label>
                      <Form.Control
                        type="number"
                        name={`containers.${index}.price`}
                        value={container.price}
                        onChange={formik.handleChange}
                        isInvalid={!!formik.errors.containers?.[index]?.price}
                        disabled={!isEditing}
                      />
                      <Form.Control.Feedback type="invalid">{formik.errors.containers?.[index]?.price}</Form.Control.Feedback>
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      {isEditing && (
                        <Button variant="outline-danger" onClick={() => removeContainer(index)}>
                          Delete
                        </Button>
                      )}
                    </Col>
                  </Row>
                ))}

                {isEditing ? (
                  <>
                    <Button variant="secondary" onClick={addContainer} className="me-2">
                      Add Container
                    </Button>
                    <Button type="submit" variant="primary">
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" onClick={() => setIsEditing(true)}>
                    Edit Charges
                  </Button>
                )}

                {serverError && (
                  <Alert variant="danger" className="mt-3">
                    {serverError}
                  </Alert>
                )}
                {successMessage && (
                  <Alert variant="success" className="mt-3">
                    {successMessage}
                  </Alert>
                )}
              </Form>
            </Card>
          </section>
        </Col>
      </Row>
    </>
  );
};

export default Container;
