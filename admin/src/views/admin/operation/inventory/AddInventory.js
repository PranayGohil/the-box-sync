import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  bill_date: Yup.date().required('Bill date is required'),
  bill_number: Yup.string().required('Bill number is required'),
  vendor_name: Yup.string().required('Vendor name is required'),
  category: Yup.string().required('Category is required'),
  bill_files: Yup.mixed().required('Bill files are required'),
  total_amount: Yup.number().required('Total amount is required').positive('Total amount must be positive'),
  paid_amount: Yup.number().required('Paid amount is required').positive('Paid amount must be positive'),
  items: Yup.array().of(
    Yup.object().shape({
      item_name: Yup.string().required('Item name is required'),
      item_quantity: Yup.number().required('Quantity is required').positive('Quantity must be positive'),
      unit: Yup.string().required('Unit is required'),
      item_price: Yup.number().required('Price is required').positive('Price must be positive'),
    })
  ),
});

const AddInventory = () => {
  const title = 'Add Inventory';
  const description = 'Add a new inventory item.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/add-inventory', title: 'Add Inventory' },
  ];

  const history = useHistory();
  const [filePreviews, setFilePreviews] = useState([]);

  const formik = useFormik({
    initialValues: {
      bill_date: '',
      bill_number: '',
      vendor_name: '',
      category: '',
      total_amount: '',
      paid_amount: '',
      unpaid_amount: '',
      bill_files: [],
      status: 'pending',
      items: [{ item_name: '', item_quantity: 1, unit: '', item_price: 0 }],
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const formData = new FormData();
        Object.entries(values).forEach(([key, val]) => {
          if (key === 'bill_files') {
            Array.from(val).forEach((file) => {
              formData.append('bill_files', file);
            });
          } else if (key === 'items') {
            formData.append('items', JSON.stringify(val));
          } else {
            formData.append(key, val);
          }
        });

        await axios.post(`${process.env.REACT_APP_API}/inventory/add`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        alert('Inventory added successfully!');
        history.push('/operations/inventory-history');
      } catch (error) {
        console.error('Failed to add inventory:', error);
        alert('Add inventory failed.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  useEffect(() => {
    const unpaid = values.total_amount - values.paid_amount;
    if (!Number.isNaN(unpaid)) {
      setFieldValue('unpaid_amount', unpaid);
    }
  }, [values.total_amount, values.paid_amount]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...values.items];
    updatedItems[index][field] = value;
    setFieldValue('items', updatedItems);
  };

  const addItem = () => {
    setFieldValue('items', [...values.items, { item_name: '', item_quantity: 1, unit: '', item_price: 0 }]);
  };

  const removeItem = (index) => {
    const filtered = values.items.filter((_, i) => i !== index);
    setFieldValue('items', filtered);
  };

  const handleFileChange = (e) => {
    const { files } = e.currentTarget;
    setFieldValue('bill_files', files);

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

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container">
            <h1 className="mb-0 pb-0 display-4">Add Inventory</h1>
            <BreadcrumbList items={breadcrumbs} />
          </div>

          <Form onSubmit={handleSubmit}>
            <Card body className="mb-4">
              <h5 className="mb-3">Purchase Details</h5>
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Bill Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="bill_date"
                      value={values.bill_date}
                      onChange={handleChange}
                      isInvalid={touched.bill_date && errors.bill_date}
                    />
                    <Form.Control.Feedback type="invalid">{errors.bill_date}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Bill Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="bill_number"
                      value={values.bill_number}
                      onChange={handleChange}
                      isInvalid={touched.bill_number && errors.bill_number}
                    />
                    <Form.Control.Feedback type="invalid">{errors.bill_number}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Vendor Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="vendor_name"
                      value={values.vendor_name}
                      onChange={handleChange}
                      isInvalid={touched.vendor_name && errors.vendor_name}
                    />
                    <Form.Control.Feedback type="invalid">{errors.vendor_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Control type="text" name="category" value={values.category} onChange={handleChange} isInvalid={touched.category && errors.category} />
                    <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Total Amount</Form.Label>
                    <Form.Control
                      type="number"
                      name="total_amount"
                      value={values.total_amount}
                      onChange={handleChange}
                      isInvalid={touched.total_amount && errors.total_amount}
                    />
                    <Form.Control.Feedback type="invalid">{errors.total_amount}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Paid Amount</Form.Label>
                    <Form.Control
                      type="number"
                      name="paid_amount"
                      value={values.paid_amount}
                      onChange={handleChange}
                      isInvalid={touched.paid_amount && errors.paid_amount}
                    />
                    <Form.Control.Feedback type="invalid">{errors.paid_amount}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Unpaid Amount</Form.Label>
                    <Form.Control type="number" value={values.unpaid_amount} readOnly />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Bill Files</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      onChange={handleFileChange}
                      isInvalid={touched.bill_files && errors.bill_files}
                    />
                    <Form.Control.Feedback type="invalid">{errors.bill_files}</Form.Control.Feedback>
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
              {values.items.map((item, index) => {
                const itemErrors = errors.items?.[index] || {};
                const itemTouched = touched.items?.[index] || {};
                return (
                  <Row key={index} className="mb-3">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Control
                          type="text"
                          placeholder="Item Name"
                          value={item.item_name}
                          onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                          isInvalid={itemTouched.item_name && itemErrors.item_name}
                        />
                        <Form.Control.Feedback type="invalid">{itemErrors.item_name}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Control
                          type="number"
                          placeholder="Quantity"
                          value={item.item_quantity}
                          onChange={(e) => handleItemChange(index, 'item_quantity', e.target.value)}
                          isInvalid={itemTouched.item_quantity && itemErrors.item_quantity}
                        />
                        <Form.Control.Feedback type="invalid">{itemErrors.item_quantity}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          isInvalid={itemTouched.unit && itemErrors.unit}
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
                    <Col md={3}>
                      <Form.Group>
                        <Form.Control
                          type="number"
                          placeholder="Item Price"
                          value={item.item_price}
                          onChange={(e) => handleItemChange(index, 'item_price', e.target.value)}
                          isInvalid={itemTouched.item_price && itemErrors.item_price}
                        />
                        <Form.Control.Feedback type="invalid">{itemErrors.item_price}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={2} className="d-flex align-items-center">
                      <Button variant="outline-danger" size="sm" onClick={() => removeItem(index)}>
                        Remove
                      </Button>
                    </Col>
                  </Row>
                );
              })}

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
