import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';

const defaultValues = {
  bill_date: '',
  bill_number: '',
  vendor_name: '',
  category: '',
  sub_total: 0,
  tax: 0,
  discount: 0,
  total_amount: 0,
  paid_amount: '',
  unpaid_amount: 0,
  bill_files: [],
  items: [],
};

const completeInventory = Yup.object().shape({
  bill_date: Yup.date().required('Bill date is required'),
  bill_number: Yup.string().required('Bill number is required'),
  vendor_name: Yup.string().required('Vendor name is required'),
  category: Yup.string().required('Category is required'),
  bill_files: Yup.mixed().test('fileRequired', 'Bill files are required', (value) => {
    return value && value.length > 0;
  }),
  tax: Yup.number().min(0, 'Tax cannot be negative'),
  discount: Yup.number().min(0, 'Discount cannot be negative'),
  paid_amount: Yup.number().required('Paid amount is required').positive('Must be positive'),
  items: Yup.array()
    .of(
      Yup.object().shape({
        item_name: Yup.string().required('Item name is required'),
        item_quantity: Yup.number().when('completed', {
          is: true,
          then: (schema) => schema.required('Required').positive('Must be positive'),
          otherwise: (schema) => schema.notRequired(),
        }),
        unit: Yup.string().when('completed', {
          is: true,
          then: (schema) => schema.required('Required'),
          otherwise: (schema) => schema.notRequired(),
        }),
        completed: Yup.boolean(),
        item_price: Yup.number()
          .nullable()
          .transform((value, originalValue) => (String(originalValue).trim() === '' ? 0 : value))
          .when('completed', {
            is: true,
            then: (schema) => schema.required('Required').positive('Must be positive'),
            otherwise: (schema) => schema.notRequired(),
          }),
      })
    )
    .min(1, 'At least one item must be included')
    .test('at-least-one-completed', 'At least one item must be marked as completed', (items) => items && items.some((item) => item.completed)),
});

const CompleteInventory = () => {
  const { id } = useParams();
  const history = useHistory();
  const [suggestions, setSuggestions] = useState({
    vendors: [],
    categories: [],
  });
  const [initialValues, setInitialValues] = useState(null);
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const vendorOptions = (suggestions.vendors || []).map(v => ({
    label: v,
    value: v,
  }));

  const categoryOptions = (suggestions.categories || []).map(c => ({
    label: c,
    value: c,
  }));

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const itemsWithDefaults = data.items.map((item) => ({
          ...item,
          unit: item.unit || '',
          completed: false,
        }));

        setInitialValues({
          ...data,
          request_date: data.request_date,
          items: itemsWithDefaults,
          bill_files: [],
          sub_total: 0,
          tax: 0,
          discount: 0,
          total_amount: 0,
          unpaid_amount: data.total_amount - data.paid_amount || 0,
        });
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast.error('Failed to fetch inventory. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const getSuggestions = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API}/inventory/get-suggestions?types=vendor,category`, {
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
    fetchInventory();
    getSuggestions();
  }, [id]);

  const previewFiles = (files) => {
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

  const calculateSubTotal = (items) => {
    return items.reduce((sum, item) => {
      if (
        item.completed &&
        Number(item.item_quantity) > 0 &&
        Number(item.item_price) > 0
      ) {
        return sum + (item.item_quantity * item.item_price);
      }
      return sum;
    }, 0);
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

  if (!initialValues) {
    return (
      <Alert variant="danger" className="m-5">
        Failed to load inventory data. Please try again.
      </Alert>
    );
  }

  return (
    <>
      <HtmlHead title="Complete Inventory Request" description="Complete inventory request with real data." />
      <Row>
        <Col>
          <div className="page-title-container">
            <h1 className="mb-0 pb-0 display-4">Complete Inventory Request</h1>
            <BreadcrumbList
              items={[
                { to: '', text: 'Home' },
                { to: 'operations/inventory', text: 'Inventory' },
                { to: `operations/complete-inventory/${id}`, title: 'Complete Inventory' },
              ]}
            />
          </div>

          <Formik
            initialValues={{ ...defaultValues, ...initialValues }}
            validationSchema={completeInventory}
            enableReinitialize
            onSubmit={async (values) => {
              setSubmitting(true);
              try {
                const formData = new FormData();

                formData.append('_id', values._id);
                formData.append('request_date', values.request_date);
                formData.append('bill_date', values.bill_date);
                formData.append('bill_number', values.bill_number);
                formData.append('vendor_name', values.vendor_name);
                formData.append('category', values.category);
                formData.append('sub_total', values.sub_total);
                formData.append('tax', values.tax);
                formData.append('discount', values.discount);
                formData.append('total_amount', values.total_amount);
                formData.append('paid_amount', values.paid_amount);
                formData.append('unpaid_amount', values.unpaid_amount);

                const completedItems = values.items.filter((item) => item.completed);
                const remainingItems = values.items.filter((item) => !item.completed);

                formData.append('items', JSON.stringify(completedItems));
                formData.append('remainingItems', JSON.stringify(remainingItems));

                Array.from(values.bill_files).forEach((file) => formData.append('bill_files', file));

                await axios.post(`${process.env.REACT_APP_API}/inventory/complete-request`, formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                  },
                });

                toast.success('Inventory completed successfully!');
                history.push('/operations/requested-inventory');
              } catch (error) {
                console.error('Submission failed:', error);
                toast.error(error.response?.data?.message || 'Failed to complete request.');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ values, errors, handleChange, setFieldValue, isSubmitting }) => {
              // 🔥 Calculate sub_total, total_amount, and unpaid_amount
              useEffect(() => {
                const subTotal = calculateSubTotal(values.items);
                setFieldValue('sub_total', subTotal);

                const tax = Number(values.tax) || 0;
                const discount = Number(values.discount) || 0;

                // total_amount = sub_total + tax - discount
                const totalAmount = subTotal + tax - discount;
                setFieldValue('total_amount', Math.max(0, totalAmount));

                const unpaid = totalAmount - (Number(values.paid_amount) || 0);
                setFieldValue('unpaid_amount', unpaid >= 0 ? unpaid : 0);
              }, [values.items, values.tax, values.discount, values.paid_amount]);

              return (
                <Form>
                  <Card body className="mb-4">
                    <h5 className="mb-3">Purchase Details</h5>
                    <Row>
                      <Col md={6}>
                        <label>Bill Date</label>
                        <Field type="date" name="bill_date" className="form-control" min={new Date(initialValues.request_date).toISOString().split('T')[0]} disabled={isSubmitting} />
                        <ErrorMessage name="bill_date" component="div" className="text-danger" />
                      </Col>
                      <Col md={6}>
                        <label>Bill Number</label>
                        <Field type="text" name="bill_number" className="form-control" disabled={isSubmitting} />
                        <ErrorMessage name="bill_number" component="div" className="text-danger" />
                      </Col>
                    </Row>

                    <Row className="mt-3">
                      <Col md={6}>
                        <label>Vendor Name</label>
                        <CreatableSelect
                          isClearable
                          isDisabled={isSubmitting}
                          options={vendorOptions}
                          value={
                            values.vendor_name
                              ? { label: values.vendor_name, value: values.vendor_name }
                              : null
                          }
                          onChange={(selected) =>
                            setFieldValue('vendor_name', selected ? selected.value : '')
                          }
                          placeholder="Select or create vendor"
                          classNamePrefix="react-select"
                        />

                        <ErrorMessage name="vendor_name" component="div" className="text-danger" />
                      </Col>
                      <Col md={6}>
                        <label>Category</label>
                        <CreatableSelect
                          isClearable
                          isDisabled={isSubmitting}
                          options={categoryOptions}
                          value={
                            values.category
                              ? { label: values.category, value: values.category }
                              : null
                          }
                          onChange={(selected) =>
                            setFieldValue('category', selected ? selected.value : '')
                          }
                          placeholder="Select or create category"
                          classNamePrefix="react-select"
                        />

                        <ErrorMessage name="category" component="div" className="text-danger" />
                      </Col>
                    </Row>
                    <Row className="mt-3">
                      <Col md={6}>
                        <label>Bill Files</label>
                        <input
                          type="file"
                          className="form-control"
                          multiple
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            setFieldValue('bill_files', e.currentTarget.files);
                            previewFiles(e.currentTarget.files);
                          }}
                          disabled={isSubmitting}
                        />
                        <ErrorMessage name="bill_files" component="div" className="text-danger" />
                        <div className="d-flex flex-wrap mt-2">
                          {filePreviews.map((file, i) => (
                            <div key={i} className="me-2">
                              {file.type === 'image' ? <img src={file.src} alt={file.name} width="80" height="80" /> : <Badge bg="secondary">{file.name}</Badge>}
                            </div>
                          ))}
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  <Card body className="mb-4">
                    <h5 className="mb-3">Item Details</h5>
                    {values.items.map((item, index) => (
                      <Row key={index} className="mb-3 align-items-start">
                        <Col md={1} className="d-flex align-items-center justify-content-center pt-4">
                          <Field type="checkbox" name={`items[${index}].completed`} className="form-check-input" disabled={isSubmitting} />
                        </Col>

                        <Col md={3}>
                          <label>Item Name</label>
                          <Field name={`items[${index}].item_name`} readOnly className="form-control" />
                        </Col>

                        <Col md={2}>
                          <label>Quantity</label>
                          <Field
                            type="number"
                            name={`items[${index}].item_quantity`}
                            className="form-control"
                            disabled={!item.completed || isSubmitting}
                          />
                          <ErrorMessage name={`items[${index}].item_quantity`} component="div" className="text-danger" />
                        </Col>

                        <Col md={2}>
                          <label>Unit</label>
                          <Field as="select" name={`items[${index}].unit`} className="form-control" disabled={!item.completed || isSubmitting} value={item.unit}>
                            <option value="">Select</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="litre">litre</option>
                            <option value="ml">ml</option>
                            <option value="piece">piece</option>
                          </Field>
                          <ErrorMessage name={`items[${index}].unit`} component="div" className="text-danger" />
                        </Col>

                        <Col md={3}>
                          <label>Price</label>
                          <Field
                            type="number"
                            name={`items[${index}].item_price`}
                            className="form-control"
                            disabled={!item.completed || isSubmitting}
                          />
                          <ErrorMessage name={`items[${index}].item_price`} component="div" className="text-danger" />
                        </Col>
                      </Row>
                    ))}
                    {typeof errors.items === 'string' && <div className="text-danger">{errors.items}</div>}

                    {/* 🔥 NEW: Financial Summary Section */}
                    <Row className="mt-4">
                      <Col md={12}>
                        <h5 className="mb-3">Financial Summary</h5>
                      </Col>
                    </Row>

                    <Row className="mt-3">
                      <Col md={4}>
                        <label>Sub Total</label>
                        <input
                          type="number"
                          className="form-control bg-light"
                          value={values.sub_total}
                          readOnly
                        />
                        <small className="text-muted">Sum of all completed item prices</small>
                      </Col>
                      <Col md={4}>
                        <label>Tax Amount (₹)</label>
                        <Field
                          type="number"
                          name="tax"
                          className="form-control"
                          min="0"
                          step="0.01"
                          disabled={isSubmitting}
                        />
                        <ErrorMessage name="tax" component="div" className="text-danger" />
                      </Col>
                      <Col md={4}>
                        <label>Discount (₹)</label>
                        <Field
                          type="number"
                          name="discount"
                          className="form-control"
                          min="0"
                          step="0.01"
                          disabled={isSubmitting}
                        />
                        <ErrorMessage name="discount" component="div" className="text-danger" />
                      </Col>
                    </Row>

                    <Row className="mt-3">
                      <Col md={4}>
                        <label><strong>Total Amount</strong></label>
                        <input
                          type="number"
                          className="form-control bg-light fw-bold"
                          value={values.total_amount}
                          readOnly
                        />
                        <small className="text-muted">Sub Total + Tax - Discount</small>
                      </Col>
                      <Col md={4}>
                        <label>Paid Amount</label>
                        <Field
                          type="number"
                          name="paid_amount"
                          className="form-control"
                          disabled={isSubmitting}
                        />
                        <ErrorMessage name="paid_amount" component="div" className="text-danger" />
                      </Col>
                      <Col md={4}>
                        <label>Unpaid Amount</label>
                        <input
                          className="form-control bg-light"
                          readOnly
                          value={values.unpaid_amount}
                        />
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
                        Completing...
                      </>
                    ) : 'Complete'}
                  </Button>
                </Form>
              )
            }}
          </Formik>

          {submitting && (
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
                  <h5 className="mb-0">Completing Request...</h5>
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

export default CompleteInventory;