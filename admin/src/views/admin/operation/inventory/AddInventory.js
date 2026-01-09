import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';

const validationSchema = Yup.object().shape({
  bill_date: Yup.date().required('Bill date is required'),
  bill_number: Yup.string().required('Bill number is required'),
  vendor_name: Yup.string().required('Vendor name is required'),
  category: Yup.string().required('Category is required'),
  bill_files: Yup.mixed().required('Bill files are required'),
  sub_total: Yup.number().min(0),
  tax: Yup.number().min(0, 'Tax cannot be negative'),
  discount: Yup.number().min(0, 'Discount cannot be negative'),
  total_amount: Yup.number().min(0),
  paid_amount: Yup.number().required('Paid amount is required').min(0).max(Yup.ref('total_amount'), 'Paid amount cannot exceed total'),
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
  const [suggestions, setSuggestions] = useState({
    vendors: [],
    categories: [],
    items: [],
  });
  const [filePreviews, setFilePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const vendorOptions = (suggestions.vendors || []).map((v) => ({
    label: v,
    value: v,
  }));

  const categoryOptions = (suggestions.categories || []).map((c) => ({
    label: c,
    value: c,
  }));

  const itemOptions = (suggestions.items || []).map((i) => ({
    label: i,
    value: i,
  }));

  useEffect(() => {
    const getSuggestions = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API}/inventory/get-suggestions?types=vendor,category,item`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        toast.error('Failed to fetch vendors. Please try again.');
      }
    };

    getSuggestions();
  }, []);

  const calculateSubTotal = (items) => {
    return items.reduce((sum, item) => {
      const qty = Number(item.item_quantity) || 0;
      const price = Number(item.item_price) || 0;
      return sum + qty * price;
    }, 0);
  };

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
      status: 'Completed',
      items: [{ item_name: '', item_quantity: 1, unit: '', item_price: 0 }],
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
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

        await axios.post(`${process.env.REACT_APP_API}/inventory/add`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        toast.success('Inventory added successfully!');
        history.push('/operations/inventory-history');
      } catch (error) {
        console.error('Failed to add inventory:', error);
        toast.error(error.response?.data?.message || 'Add inventory failed.');
      } finally {
        setIsSubmitting(false);
        setSubmitting(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  // 🔥 Calculate sub_total, total_amount, and unpaid_amount
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
                    <CreatableSelect
                      isClearable
                      isDisabled={isSubmitting}
                      options={vendorOptions}
                      value={values.vendor_name ? { label: values.vendor_name, value: values.vendor_name } : null}
                      onChange={(selected) => setFieldValue('vendor_name', selected ? selected.value : '')}
                      placeholder="Select or create vendor"
                      classNamePrefix="react-select"
                    />

                    {touched.vendor_name && errors.vendor_name && <div className="text-danger mt-1">{errors.vendor_name}</div>}

                    <Form.Control.Feedback type="invalid">{errors.vendor_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <CreatableSelect
                      isClearable
                      isDisabled={isSubmitting}
                      options={categoryOptions}
                      value={values.category ? { label: values.category, value: values.category } : null}
                      onChange={(selected) => setFieldValue('category', selected ? selected.value : '')}
                      placeholder="Select or create category"
                      classNamePrefix="react-select"
                    />

                    {touched.category && errors.category && <div className="text-danger mt-1">{errors.category}</div>}

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
                      <Button variant="outline-danger" size="sm" onClick={() => removeItem(index)} disabled={isSubmitting || values.items.length === 1}>
                        Remove
                      </Button>
                    </Col>
                  </Row>
                );
              })}

              <Button variant="secondary" onClick={addItem} disabled={isSubmitting}>
               Add
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
                    <Form.Control type="number" value={values.sub_total} readOnly className="bg-light" />
                    <Form.Text className="text-muted">Sum of all item prices</Form.Text>
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
                    <Form.Control type="number" value={values.total_amount} readOnly className="bg-light fw-bold" />
                    <Form.Text className="text-muted">Sub Total + Tax - Discount</Form.Text>
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
                      <Form.Control type="number" value={values.unpaid_amount} readOnly className="bg-light" />
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
              <Button type="submit" variant="primary" className="mt-3" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <div className="d-flex align-items-center">
                    Submit
                  </div>
                )}
              </Button>
            </Card>
          </Form>

          {/* Full page loader overlay */}
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
                  <h5 className="mb-0">Adding Inventory...</h5>
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

export default AddInventory;
