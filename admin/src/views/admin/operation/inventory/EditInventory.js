import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

const validationSchema = Yup.object().shape({
  bill_date: Yup.date().required('Bill date is required'),
  bill_number: Yup.string().required('Bill number is required'),
  vendor_name: Yup.string().required('Vendor name is required'),
  category: Yup.string().required('Category is required'),
  bill_files: Yup.mixed().required('Bill files are required'),
  sub_total: Yup.number().min(0),
  tax: Yup.number().min(0, 'Tax cannot be negative'),
  discount: Yup.number().min(0, 'Discount cannot be negative'),
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

const EditInventory = () => {
  const title = 'Edit Inventory';
  const description = 'Edit existing inventory item.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/edit-inventory', title: 'Edit Inventory' },
  ];
  const { id } = useParams();
  const history = useHistory();
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const formik = useFormik({
    initialValues: {
      bill_date: '',
      bill_number: '',
      vendor_name: '',
      category: '',
      sub_total: 0,
      tax: 0,
      discount: 0,
      total_amount: 0,
      paid_amount: '',
      unpaid_amount: '',
      bill_files: [],
      status: 'pending',
      items: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
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

        await axios.put(`${process.env.REACT_APP_API}/inventory/update/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        toast.success('Inventory updated successfully!');
        history.push('/operations/inventory-history');
      } catch (error) {
        console.error('Failed to update inventory:', error);
        toast.error(error.response?.data?.message || 'Update failed.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const { data } = res;
        setFieldValue('bill_date', data.bill_date?.slice(0, 10));
        setFieldValue('bill_number', data.bill_number);
        setFieldValue('vendor_name', data.vendor_name);
        setFieldValue('category', data.category);
        setFieldValue('sub_total', data.sub_total || 0);
        setFieldValue('tax', data.tax || 0);
        setFieldValue('discount', data.discount || 0);
        setFieldValue('total_amount', data.total_amount);
        setFieldValue('paid_amount', data.paid_amount);
        setFieldValue('status', data.status || 'pending');
        setFieldValue('items', data.items);
        setFieldValue('unpaid_amount', data.total_amount - data.paid_amount);

        setFilePreviews(data.bill_files.map((name) => ({ type: 'existing', name })));
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
        toast.error('Could not load inventory data');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [id]);

  // 🔥 Calculate sub_total from items
  const calculateSubTotal = (items) => {
    return items.reduce((sum, item) => {
      const qty = Number(item.item_quantity) || 0;
      const price = Number(item.item_price) || 0;
      return sum + qty * price;
    }, 0);
  };

  // 🔥 Update calculations when items, tax, or discount change
  useEffect(() => {
    const subTotal = calculateSubTotal(values.items);
    setFieldValue('sub_total', subTotal.toFixed(2));

    const tax = Number(values.tax) || 0;
    const discount = Number(values.discount) || 0;

    // total_amount = sub_total + tax - discount
    const totalAmount = subTotal + tax - discount;
    setFieldValue('total_amount', Math.max(0, totalAmount).toFixed(2));

    const unpaid = totalAmount - (Number(values.paid_amount) || 0);
    setFieldValue('unpaid_amount', unpaid >= 0 ? unpaid.toFixed(2) : '0.00');
  }, [values.items, values.tax, values.discount, values.paid_amount]);

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

    setFilePreviews([...filePreviews.filter(f => f.type === 'existing'), ...previews]);
  };

  if (loading) {
    return (
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h5>Loading...</h5>
        </Col>
      </Row>
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                    <Form.Control.Feedback type="invalid">{errors.vendor_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Control
                      type="text"
                      name="category"
                      value={values.category}
                      onChange={handleChange}
                      isInvalid={touched.category && errors.category}
                      disabled={isSubmitting}
                    />
                    <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
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
                      disabled={isSubmitting}
                    />
                    <Form.Control.Feedback type="invalid">{errors.bill_files}</Form.Control.Feedback>
                  </Form.Group>
                  <div className="d-flex flex-wrap mt-2">
                    {filePreviews.map((file, i) => {
                      const src = file.type === 'existing' ? `${process.env.REACT_APP_UPLOAD_DIR}${file.name}` : file.src;
                      const isImage = file.type === 'existing' ? file.name.match(/\.(jpeg|jpg|png|gif|webp)$/i) : file.type === 'image';

                      return (
                        <div key={i} className="me-2">
                          {isImage ? <img src={src} alt={file.name} width="80" height="80" /> : <iframe src={src} title={file.name} width="80" height="80" />}
                          <div style={{ fontSize: '10px' }}>{file.name}</div>
                        </div>
                      );
                    })}
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
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
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
                    <Col md={3}>
                      <Form.Group>
                        <Form.Control
                          type="number"
                          placeholder="Item Price"
                          value={item.item_price}
                          onChange={(e) => handleItemChange(index, 'item_price', e.target.value)}
                          isInvalid={itemTouched.item_price && itemErrors.item_price}
                          disabled={isSubmitting}
                        />
                        <Form.Control.Feedback type="invalid">{itemErrors.item_price}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={2} className="d-flex align-items-center">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={isSubmitting || values.items.length === 1}
                      >
                        Remove
                      </Button>
                    </Col>
                  </Row>
                );
              })}

              <Button variant="primary" onClick={addItem} disabled={isSubmitting}>
                + Add
              </Button>

              {/* 🔥 NEW: Financial Summary Section */}
              <Row className="mt-4">
                <Col md={12}>
                  <h5 className="mb-3">Financial Summary</h5>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Sub Total</Form.Label>
                    <Form.Control
                      type="number"
                      value={values.sub_total}
                      readOnly
                      className="bg-light"
                    />
                    <Form.Text className="text-muted">
                      Sum of all item prices
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Tax Amount (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      name="tax"
                      value={values.tax}
                      onChange={handleChange}
                      isInvalid={touched.tax && errors.tax}
                      disabled={isSubmitting}
                      min="0"
                      step="0.01"
                    />
                    <Form.Control.Feedback type="invalid">{errors.tax}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Discount (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      name="discount"
                      value={values.discount}
                      onChange={handleChange}
                      isInvalid={touched.discount && errors.discount}
                      disabled={isSubmitting}
                      min="0"
                      step="0.01"
                    />
                    <Form.Control.Feedback type="invalid">{errors.discount}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>
                      <strong>Total Amount</strong>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={values.total_amount}
                      readOnly
                      className="bg-light fw-bold"
                    />
                    <Form.Text className="text-muted">
                      Sub Total + Tax - Discount
                    </Form.Text>
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
                      disabled={isSubmitting}
                    />
                    <Form.Control.Feedback type="invalid">{errors.paid_amount}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Unpaid Amount</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="number"
                        value={values.unpaid_amount}
                        readOnly
                        className="bg-light"
                      />
                      {isCalculating && (
                        <Spinner
                          animation="border"
                          size="sm"
                          className="position-absolute"
                          style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                      )}
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            <Button
              variant="success"
              type="submit"
              disabled={isSubmitting}
              style={{ minWidth: '150px' }}
            >
              {isSubmitting ? (
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
              ) : 'Update'}
            </Button>
          </Form>

          {isSubmitting && (
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
                  <h5 className="mb-0">Updating Inventory...</h5>
                  <small className="text-muted">Please wait a moment</small>
                </Card.Body>
              </Card>
            </div>
          )}
        </Col>
      </Row>
    </>
  );
};

export default EditInventory;