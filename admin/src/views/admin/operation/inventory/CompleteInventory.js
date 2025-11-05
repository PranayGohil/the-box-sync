import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';

const defaultValues = {
  bill_date: '',
  bill_number: '',
  vendor_name: '',
  category: '',
  total_amount: '',
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
  total_amount: Yup.number().required('Total amount is required').positive('Must be positive'),
  paid_amount: Yup.number().required('Paid amount is required').positive('Must be positive'),

  // ✅ CORRECTED ITEMS SCHEMA
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
  const [initialValues, setInitialValues] = useState(null);
  const [filePreviews, setFilePreviews] = useState([]);

  // In CompleteInventory.js

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        // ✅ Map over items to ensure 'unit' has a default value
        const itemsWithDefaults = data.items.map((item) => ({
          ...item,
          unit: item.unit || '', // If item.unit is missing or null, default to ''
        }));

        setInitialValues({
          ...data,
          items: itemsWithDefaults, // Use the processed items
          bill_files: [],
          unpaid_amount: data.total_amount - data.paid_amount || 0,
        });
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };
    fetchInventory();
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

  if (!initialValues) return <div>Loading...</div>;

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
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const formData = new FormData();

                // Append each field manually
                formData.append('_id', values._id); // eslint-disable-line no-underscore-dangle
                formData.append('bill_date', values.bill_date);
                formData.append('bill_number', values.bill_number);
                formData.append('vendor_name', values.vendor_name);
                formData.append('category', values.category);
                formData.append('total_amount', values.total_amount);
                formData.append('paid_amount', values.paid_amount);
                formData.append('unpaid_amount', values.unpaid_amount);

                // Append completed and remaining items as JSON strings
                const completedItems = values.items.filter((item) => item.completed);
                const remainingItems = values.items.filter((item) => !item.completed);

                formData.append('items', JSON.stringify(completedItems));
                formData.append('remainingItems', JSON.stringify(remainingItems));

                // Append files
                Array.from(values.bill_files).forEach((file) => formData.append('bill_files', file));

                await axios.post(`${process.env.REACT_APP_API}/inventory/complete-request`, formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                  },
                });

                alert('Inventory completed successfully!');
                history.push('/operations/requested-inventory');
              } catch (error) {
                console.error('Submission failed:', error);
                alert('Failed to complete request.');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ values, errors, handleChange, setFieldValue, isSubmitting }) => (
              <Form>
                <Card body className="mb-4">
                  <h5 className="mb-3">Purchase Details</h5>
                  <Row>
                    <Col md={6}>
                      <label>Bill Date</label>
                      <Field type="date" name="bill_date" className="form-control" />
                      <ErrorMessage name="bill_date" component="div" className="text-danger" />
                    </Col>
                    <Col md={6}>
                      <label>Bill Number</label>
                      <Field type="text" name="bill_number" className="form-control" />
                      <ErrorMessage name="bill_number" component="div" className="text-danger" />
                    </Col>
                  </Row>

                  <Row className="mt-3">
                    <Col md={6}>
                      <label>Vendor Name</label>
                      <Field type="text" name="vendor_name" className="form-control" />
                      <ErrorMessage name="vendor_name" component="div" className="text-danger" />
                    </Col>
                    <Col md={6}>
                      <label>Category</label>
                      <Field type="text" name="category" className="form-control" />
                      <ErrorMessage name="category" component="div" className="text-danger" />
                    </Col>
                  </Row>
                  <Row className="mt-3">
                    <Col md={4}>
                      <label>Total Amount</label>
                      <Field
                        type="number"
                        name="total_amount"
                        className="form-control"
                        onChange={(e) => {
                          handleChange(e);
                          const updatedTotal = +e.target.value;
                          setFieldValue('unpaid_amount', updatedTotal - values.paid_amount);
                        }}
                      />
                      <ErrorMessage name="total_amount" component="div" className="text-danger" />
                    </Col>
                    <Col md={4}>
                      <label>Paid Amount</label>
                      <Field
                        type="number"
                        name="paid_amount"
                        className="form-control"
                        onChange={(e) => {
                          handleChange(e);
                          const updatedPaid = +e.target.value;
                          setFieldValue('unpaid_amount', values.total_amount - updatedPaid);
                        }}
                      />
                      <ErrorMessage name="paid_amount" component="div" className="text-danger" />
                    </Col>
                    <Col md={4}>
                      <label>Unpaid Amount</label>
                      <input className="form-control" readOnly value={values.unpaid_amount} />
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
                  {/* // In CompleteInventory.js, inside the second Card */}

                  <h5 className="mb-3">Item Details</h5>
                  {values.items.map((item, index) => (
                    <Row key={index} className="mb-3 align-items-start">
                      {/* Checkbox */}
                      <Col md={1} className="d-flex align-items-center justify-content-center pt-4">
                        <Field type="checkbox" name={`items[${index}].completed`} className="form-check-input" />
                      </Col>

                      {/* Item Name */}
                      <Col md={3}>
                        <label>Item Name</label>
                        <Field name={`items[${index}].item_name`} readOnly className="form-control" />
                      </Col>

                      {/* ✅ Quantity Input */}
                      <Col md={2}>
                        <label>Quantity</label>
                        <Field
                          type="number"
                          name={`items[${index}].item_quantity`}
                          className="form-control"
                          disabled={!item.completed} // Disable if not checked
                        />
                        <ErrorMessage name={`items[${index}].item_quantity`} component="div" className="text-danger" />
                      </Col>

                      {/* ✅ Unit Select Dropdown */}
                      <Col md={2}>
                        <label>Unit</label>
                        <Field as="select" name={`items[${index}].unit`} className="form-control" disabled={!item.completed} value={item.unit}>
                          <option value="">Select</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="litre">litre</option>
                          <option value="ml">ml</option>
                          <option value="piece">piece</option>
                        </Field>
                        <ErrorMessage name={`items[${index}].unit`} component="div" className="text-danger" />
                      </Col>

                      {/* Price Input */}
                      <Col md={3}>
                        <label>Price</label>
                        <Field
                          type="number"
                          name={`items[${index}].item_price`}
                          className="form-control"
                          disabled={!item.completed} // Disable if not checked
                        />
                        <ErrorMessage name={`items[${index}].item_price`} component="div" className="text-danger" />
                      </Col>
                    </Row>
                  ))}
                  {typeof errors.items === 'string' && <div className="text-danger">{errors.items}</div>}
                </Card>
                <Button variant="success" type="submit" disabled={isSubmitting}>
                  Complete Request
                </Button>
              </Form>
            )}
          </Formik>
        </Col>
      </Row>
    </>
  );
};

export default CompleteInventory;
