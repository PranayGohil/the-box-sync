import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import * as Yup from 'yup';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import axios from 'axios';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';

const validationSchema = Yup.object({
  items: Yup.array()
    .of(
      Yup.object().shape({
        item_name: Yup.string().required('Item Name is required'),
        unit: Yup.string().required('Unit is required'),
        item_quantity: Yup.number().typeError('Quantity must be a number').required('Item Quantity is required').positive('Quantity must be greater than 0'),
      })
    )
    .min(1, 'At least one item is required'),
  status: Yup.string().required('Status is required'),
});

function EditInventory() {
  const { id } = useParams();
  const history = useHistory();
  const [itemOptions, setItemOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const title = 'Edit Inventory';
  const description = 'Edit inventory items.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: `operations/edit-inventory/${id}`, title: 'Edit Inventory' },
  ];

  const formik = useFormik({
    initialValues: {
      items: [{ item_name: '', unit: '', item_quantity: '' }],
      status: 'Requested',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setIsSubmitting(true);
      try {
        await axios.put(`${process.env.REACT_APP_API}/inventory/update/${id}`, values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        toast.success('Inventory updated successfully!');
        history.push('/operations/requested-inventory');
      } catch (err) {
        console.error('Error updating inventory:', err);
        toast.error(err.response?.data?.message || 'Failed to update inventory.');
      } finally {
        setIsSubmitting(false);
        setSubmitting(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  useEffect(() => {
    const fetchItemSuggestions = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API}/inventory/get-suggestions?types=item`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        setItemOptions((data.items || []).map((i) => ({ label: i, value: i })));
      } catch (err) {
        console.error('Failed to load item suggestions', err);
        toast.error('Failed to fetch item suggestions.');
      }
    };

    fetchItemSuggestions();
  }, []);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        setError('');
        const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        setFieldValue('items', res.data.items);
        setFieldValue('status', res.data.status);
      } catch (err) {
        console.error('Failed to load inventory:', err);
        setError('Failed to load inventory details. Please try again.');
        toast.error('Failed to load inventory details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, [id, setFieldValue]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...values.items];
    updatedItems[index][field] = value;
    setFieldValue('items', updatedItems);
  };

  const addItem = () => {
    setFieldValue('items', [...values.items, { item_name: '', unit: '', item_quantity: '' }]);
  };

  const removeItem = (index) => {
    const filtered = values.items.filter((_, i) => i !== index);
    setFieldValue('items', filtered);
  };

  if (isLoading) {
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
              <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
              <h5>Loading...</h5>
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

          <Form onSubmit={handleSubmit}>
            <Card body className="mb-4">
              <h5 className="mb-3">Item Details</h5>

              {values.items.map((item, index) => {
                const itemErrors = errors.items?.[index] || {};
                const itemTouched = touched.items?.[index] || {};

                return (
                  <Row key={index} className="mb-3">
                    {/* Item Name */}
                    <Col md={4}>
                      <Form.Group>
                        <CreatableSelect
                          isClearable
                          isDisabled={isSubmitting}
                          options={itemOptions}
                          value={item.item_name ? { label: item.item_name, value: item.item_name } : null}
                          onChange={(selected) => handleItemChange(index, 'item_name', selected ? selected.value : '')}
                          placeholder="Select or create item"
                          classNamePrefix="react-select"
                        />
                        {itemTouched.item_name && itemErrors.item_name && <div className="text-danger mt-1">{itemErrors.item_name}</div>}
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
                          disabled={isSubmitting}
                          min="1"
                          step="0.01"
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
                          disabled={isSubmitting}
                        >
                          <option value="">Unit</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="litre">litre</option>
                          <option value="ml">ml</option>
                          <option value="piece">piece</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{itemErrors.unit}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Remove Button - Matches AddInventory style */}
                    <Col md={2} className="d-flex align-items-center">
                      <Button variant="outline-danger" size="sm" onClick={() => removeItem(index)} disabled={isSubmitting || values.items.length === 1}>
                        Remove
                      </Button>
                    </Col>
                  </Row>
                );
              })}

              {/* Add Item Button - Matches AddInventory style */}
              <Button variant="primary" onClick={addItem} disabled={isSubmitting} className="me-2">
                <CsLineIcons icon="plus" className="me-1" />
                Add
              </Button>

              {/* Status Field */}
              <Form.Control type="hidden" name="status" value={values.status} onChange={handleChange} />

              {/* Submit Button - Matches AddInventory pattern with icon and spinner */}
              <Button type="submit" variant="primary" disabled={isSubmitting} style={{ minWidth: '120px' }}>
                {isSubmitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <div className="d-flex align-items-center">
                    <CsLineIcons icon="save" className="me-1" />
                    Update
                  </div>
                )}
              </Button>
            </Card>
          </Form>

          {/* Full page loader overlay - Matches AddInventory styling */}
          {isSubmitting && (
            <div
              className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 9999,
                backdropFilter: 'blur(2px)',
              }}
            >
              <Card className="shadow-lg border-0" style={{ minWidth: '200px' }}>
                <Card.Body className="text-center p-4">
                  <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
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
