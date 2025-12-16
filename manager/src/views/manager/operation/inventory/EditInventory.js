import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import * as Yup from 'yup';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { useFormik } from 'formik';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

function EditInventory() {
  const { id } = useParams();
  const history = useHistory();
  const [loading, setLoading] = useState({
    initial: true,
    submitting: false
  });
  const [items, setItems] = useState([{ item_name: '', unit: '', item_quantity: '' }]);
  const [error, setError] = useState('');

  const title = 'Edit Inventory';
  const description = 'Edit inventory items.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: `operations/edit-inventory/${id}`, title: 'Edit Inventory' },
  ];

  // ✅ Formik setup with your schema
  const formik = useFormik({
    initialValues: { items, status: 'Requested' },
    validationSchema: Yup.object({
      items: Yup.array().of(
        Yup.object().shape({
          item_name: Yup.string().required('Item Name is required'),
          unit: Yup.string().required('Unit is required'),
          item_quantity: Yup.number()
            .typeError('Quantity must be a number')
            .required('Item Quantity is required')
            .positive('Quantity must be greater than 0'),
        })
      ),
      status: Yup.string().required('Status is required'),
    }),
    onSubmit: async (values) => {
      setLoading(prev => ({ ...prev, submitting: true }));
      try {
        const formData = new FormData();
        Object.entries(values).forEach(([key, val]) => {
          if (key === 'items') {
            formData.append('items', JSON.stringify(val));
          } else {
            formData.append(key, val);
          }
        });

        await axios.put(`${process.env.REACT_APP_API}/inventory/update/${id}`, values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        toast.success('Inventory updated successfully!');
        history.push('/operations/requested-inventory');
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to update inventory.');
      } finally {
        setLoading(prev => ({ ...prev, submitting: false }));
      }
    },
  });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(prev => ({ ...prev, initial: true }));
        setError('');
        const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        setItems(res.data.items);
        formik.setFieldValue('items', res.data.items);
        formik.setFieldValue('status', res.data.status);
      } catch (err) {
        console.error(err);
        setError('Failed to load inventory details. Please try again.');
        toast.error('Failed to load inventory details.');
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };
    fetchInventory();
  }, [id]);

  // ✅ Add/Remove/Change handlers
  const addItem = () => {
    const updated = [...items, { item_name: '', unit: '', item_quantity: '' }];
    setItems(updated);
    formik.setFieldValue('items', updated);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    formik.setFieldValue('items', updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
    formik.setFieldValue('items', updated);
  };

  const { handleSubmit, errors, touched } = formik;

  if (loading.initial) {
    return (
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Loading Inventory Details...</h5>
              <p className="text-muted">Please wait while we fetch inventory information</p>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  if (error) {
    return (
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
            <Alert variant="danger" className="my-4">
              <CsLineIcons icon="error" className="me-2" />
              {error}
              <div className="mt-3">
                <Button variant="outline-primary" onClick={() => history.push('/operations/requested-inventory')}>
                  <CsLineIcons icon="arrow-left" className="me-2" />
                  Back to Inventory List
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container">
            <h1 className="mb-0 pb-0 display-4">Edit Inventory</h1>
            <BreadcrumbList items={breadcrumbs} />
          </div>

          {/* ✅ Inventory Form */}
          <Form onSubmit={handleSubmit}>
            <Card body className="mb-4">
              <h5 className="mb-3">Item Details</h5>
              {items.map((item, index) => {
                const itemErrors = errors.items?.[index] || {};
                const itemTouched = touched.items?.[index] || {};

                return (
                  <Row key={index} className="mb-3">
                    {/* Item Name */}
                    <Col md={4}>
                      <Form.Group>
                        <Form.Control
                          type="text"
                          placeholder="Item Name"
                          value={item.item_name}
                          onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                          isInvalid={itemTouched.item_name && itemErrors.item_name}
                          disabled={loading.submitting}
                        />
                        <Form.Control.Feedback type="invalid">{itemErrors.item_name}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Quantity */}
                    <Col md={3}>
                      <Form.Group>
                        <Form.Control
                          type="number"
                          placeholder="Quantity"
                          value={item.item_quantity}
                          onChange={(e) => handleItemChange(index, 'item_quantity', e.target.value)}
                          isInvalid={itemTouched.item_quantity && itemErrors.item_quantity}
                          disabled={loading.submitting}
                        />
                        <Form.Control.Feedback type="invalid">{itemErrors.item_quantity}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Unit */}
                    <Col md={3}>
                      <Form.Group>
                        <Form.Select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          isInvalid={itemTouched.unit && itemErrors.unit}
                          disabled={loading.submitting}
                        >
                          <option value="">Select</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="litre">litre</option>
                          <option value="ml">ml</option>
                          <option value="piece">piece</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{itemErrors.unit}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Remove button */}
                    <Col md={2} className="d-flex align-items-center">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={loading.submitting || items.length === 1}
                      >
                        Remove
                      </Button>
                    </Col>
                  </Row>
                );
              })}

              {/* Add Item Button */}
              <Button
                variant="primary"
                onClick={addItem}
                className="me-2"
                disabled={loading.submitting}
              >
                <CsLineIcons icon="plus" className="me-1" />
                Add More Items
              </Button>
            </Card>

            {/* Submit */}
            <Button
              variant="success"
              type="submit"
              disabled={loading.submitting}
              style={{ minWidth: '150px' }}
            >
              {loading.submitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Updating...
                </>
              ) : (
                'Update Request'
              )}
            </Button>
          </Form>

          {/* Submitting overlay */}
          {loading.submitting && (
            <div
              className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 9999,
                backdropFilter: 'blur(2px)'
              }}
            >
              <Card className="shadow-lg border-0" style={{ minWidth: '200px' }}>
                <Card.Body className="text-center p-4">
                  <Spinner
                    animation="border"
                    variant="success"
                    className="mb-3"
                    style={{ width: '3rem', height: '3rem' }}
                  />
                  <h5 className="mb-0">Updating Inventory Request...</h5>
                  <small className="text-muted">Please wait a moment</small>
                </Card.Body>
              </Card>
            </div>
          )}
        </Col>
      </Row>
    </>
  );
}

export default EditInventory;