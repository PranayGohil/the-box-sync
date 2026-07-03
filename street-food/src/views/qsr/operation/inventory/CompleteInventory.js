import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Spinner, Form } from 'react-bootstrap';
import { Formik, Form as FormikForm, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';
import CsLineIcons from 'cs-line-icons/CsLineIcons';



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

const completeInventorySchema = Yup.object().shape({
  bill_date: Yup.date().required('Bill date is required'),
  bill_number: Yup.string().required('Bill number is required'),
  vendor_name: Yup.string().required('Vendor name is required'),
  category: Yup.string().required('Category is required'),
  bill_files: Yup.mixed().test('fileRequired', 'Bill files are required', (value) => value && value.length > 0),
  tax: Yup.number().min(0, 'Tax cannot be negative'),
  discount: Yup.number().min(0, 'Discount cannot be negative'),
  paid_amount: Yup.number().required('Paid amount is required').min(0, 'Paid amount cannot be negative'),
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
  const dateInputRef = React.useRef(null);
  const brandColor = '#23b3f4';
  const [suggestions, setSuggestions] = useState({ vendors: [], categories: [] });
  const [initialValues, setInitialValues] = useState(null);
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        const itemsWithDefaults = data.items.map((item) => ({
          ...item,
          unit: item.unit || '',
          completed: false,
        }));

        setInitialValues({
          ...data,
          items: itemsWithDefaults,
          bill_files: [],
          sub_total: 0,
          tax: 0,
          discount: 0,
          total_amount: 0,
          unpaid_amount: data.total_amount - data.paid_amount || 0,
        });
      } catch (error) {
        toast.error('Failed to fetch inventory.');
      } finally {
        setLoading(false);
      }
    };

    const getSuggestions = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API}/inventory/get-suggestions?types=vendor,category`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSuggestions(data);
      } catch (error) {
        toast.error('Failed to load suggestions.');
      }
    };
    fetchInventory();
    getSuggestions();
  }, [id]);

  const previewFiles = (files) => {
    const previews = Array.from(files).map((file) => {
      if (file.type.startsWith('image/')) return { type: 'image', name: file.name };
      if (file.type === 'application/pdf') return { type: 'pdf', name: file.name };
      return null;
    }).filter(Boolean);
    setFilePreviews(previews);
  };

  const calculateSubTotal = (items) => {
    return items.reduce((sum, item) => {
      if (item.completed && Number(item.item_quantity) > 0 && Number(item.item_price) > 0) {
        return sum + (item.item_quantity * item.item_price);
      }
      return sum;
    }, 0);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const customStyles = `
    .complete-inventory-inventory-container .btn {
      transition: all 0.2s ease-in-out !important;
    }
    .complete-inventory-inventory-container .btn:hover {
      transform: translateY(-2px) !important;
    }
    .complete-inventory-inventory-container .btn:not(.btn-sm) {
      border-radius: 50px !important;
      font-weight: 600 !important;
      padding: 10px 28px !important;
      height: 48px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      font-size: 0.95rem !important;
    }
    .complete-inventory-inventory-container .btn.btn-sm {
      border-radius: 50px !important;
      font-weight: 600 !important;
      padding: 6px 16px !important;
      height: 36px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      font-size: 0.85rem !important;
    }
    .complete-inventory-inventory-container .btn-primary {
      background-color: #23b3f4 !important;
      border-color: #23b3f4 !important;
      box-shadow: 0 4px 10px rgba(35, 179, 244, 0.15) !important;
    }
    .complete-inventory-inventory-container .btn-primary:hover {
      background-color: #179edb !important;
      border-color: #179edb !important;
      box-shadow: 0 6px 15px rgba(35, 179, 244, 0.25) !important;
    }
    .complete-inventory-inventory-container .btn-outline-primary {
      border: 1px solid #23b3f4 !important;
      color: #23b3f4 !important;
      background-color: #ffffff !important;
    }
    .complete-inventory-inventory-container .btn-outline-primary:hover {
      background-color: #23b3f4 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
    }
    .complete-inventory-inventory-container .btn-outline-primary:hover svg {
      stroke: #ffffff !important;
    }
    .complete-inventory-inventory-container .btn-outline-danger {
      border: 1px solid #ef4444 !important;
      color: #ef4444 !important;
      background-color: #ffffff !important;
    }
    .complete-inventory-inventory-container .btn-outline-danger:hover {
      background-color: #ef4444 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
    }
    .complete-inventory-inventory-container .btn-outline-danger:hover svg {
      stroke: #ffffff !important;
    }
    .complete-inventory-inventory-container .btn-outline-warning {
      border: 1px solid #f59e0b !important;
      color: #f59e0b !important;
      background-color: #ffffff !important;
    }
    .complete-inventory-inventory-container .btn-outline-warning:hover {
      background-color: #f59e0b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25) !important;
    }
    .complete-inventory-inventory-container .btn-outline-warning:hover svg {
      stroke: #ffffff !important;
    }
    .complete-inventory-inventory-container .btn-outline-secondary {
      border: 1px solid #64748b !important;
      color: #64748b !important;
      background-color: #ffffff !important;
    }
    .complete-inventory-inventory-container .btn-outline-secondary:hover {
      background-color: #64748b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25) !important;
    }
    .complete-inventory-inventory-container .btn-outline-secondary:hover svg {
      stroke: #ffffff !important;
    }

    .modal-content {
      border-radius: 1.5rem !important;
      overflow: hidden !important;
    }
  `;

  return (
    <div className="complete-inventory-inventory-container">
      <style>{customStyles}</style>
      <HtmlHead title="Complete Inventory" />
      <div className="container-fluid px-3 px-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-3 align-items-center">
            <Col xs={12} md={7}>
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>Complete Request</h1>
              <BreadcrumbList items={[{ to: '', text: 'Home' }, { to: 'operations/inventory', text: 'Inventory' }, { to: `operations/complete-inventory/${id}`, title: 'Complete' }]} />
            </Col>
            <Col xs={12} md={5} className="d-flex flex-wrap justify-content-start justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button variant="outline-secondary" onClick={() => history.goBack()} className="rounded-pill px-4 fw-bold border-2">
                <CsLineIcons icon="arrow-left" size="14" className="me-2" /> Cancel
              </Button>
            </Col>
          </Row>
        </div>

        <Formik
          initialValues={{ ...defaultValues, ...initialValues }}
          validationSchema={completeInventorySchema}
          enableReinitialize
          onSubmit={async (values) => {
            setSubmitting(true);
            try {
              const formData = new FormData();
              formData.append('_id', values._id);
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
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
              });

              toast.success('Inventory synchronization successful!');
              history.push('/operations/inventory-history');
            } catch (error) {
              toast.error(error.response?.data?.message || 'Completion failed.');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, handleChange, setFieldValue }) => {
            useEffect(() => {
              const subTotal = calculateSubTotal(values.items);
              const tax = Number(values.tax) || 0;
              const discount = Number(values.discount) || 0;
              const totalAmount = subTotal + tax - discount;
              const unpaid = totalAmount - (Number(values.paid_amount) || 0);

              setFieldValue('sub_total', subTotal.toFixed(2));
              setFieldValue('total_amount', Math.max(0, totalAmount).toFixed(2));
              setFieldValue('unpaid_amount', unpaid >= 0 ? unpaid.toFixed(2) : '0.00');
            }, [values.items, values.tax, values.discount, values.paid_amount, setFieldValue]);

            return (
              <FormikForm>
                <Card className="complete-inventory-page-card border-0">
                  <Card.Body className="p-4 p-lg-5">
                    <div className="complete-inventory-section-label"><CsLineIcons icon="file-text" size="18" /> Purchase Verification</div>
                    <Row className="g-4 mb-5">
                      <Col xs={12} md={3}>
                        <div className="complete-inventory-input-group-label">Bill Date</div>
                        <div className="position-relative">
                          <Field 
                            innerRef={dateInputRef}
                            type="date" 
                            name="bill_date" 
                            className={`complete-inventory-modern-input form-control ${touched.bill_date && errors.bill_date ? 'is-invalid' : ''}`} 
                          />
                          <div 
                            className="position-absolute end-0 top-50 translate-middle-y me-3" 
                            style={{ cursor: 'pointer', zIndex: 5 }}
                            onClick={() => dateInputRef.current?.showPicker()}
                          >
                            <CsLineIcons icon="calendar" size="16" className="text-muted" />
                          </div>
                        </div>
                        {touched.bill_date && errors.bill_date && <div className="text-danger small mt-1">{errors.bill_date}</div>}
                      </Col>
                      <Col xs={12} md={3}>
                        <div className="complete-inventory-input-group-label">Bill Number</div>
                        <Field type="text" name="bill_number" className={`complete-inventory-modern-input form-control ${touched.bill_number && errors.bill_number ? 'is-invalid' : ''}`} placeholder="Enter bill #" />
                        {touched.bill_number && errors.bill_number && <div className="text-danger small mt-1">{errors.bill_number}</div>}
                      </Col>
                      <Col xs={12} md={3}>
                        <div className="complete-inventory-input-group-label">Vendor</div>
                        <div className="complete-inventory-select-modern">
                          <CreatableSelect 
                            isClearable 
                            menuPlacement="auto" 
                            menuPortalTarget={document.body} 
                            options={(suggestions.vendors || []).map(v => ({ label: v, value: v }))} 
                            value={values.vendor_name ? { label: values.vendor_name, value: values.vendor_name } : null} 
                            onChange={(s) => setFieldValue('vendor_name', s ? s.value : '')} 
                            placeholder="Vendor..." 
                            classNamePrefix="react-select" 
                            styles={{ control: (base) => ({ ...base, borderColor: touched.vendor_name && errors.vendor_name ? '#dc3545' : base.borderColor }) }}
                          />
                        </div>
                        {touched.vendor_name && errors.vendor_name && <div className="text-danger small mt-1">{errors.vendor_name}</div>}
                      </Col>
                      <Col xs={12} md={3}>
                        <div className="complete-inventory-input-group-label">Category</div>
                        <div className="complete-inventory-select-modern">
                          <CreatableSelect 
                            isClearable 
                            menuPlacement="auto" 
                            menuPortalTarget={document.body} 
                            options={(suggestions.categories || []).map(c => ({ label: c, value: c }))} 
                            value={values.category ? { label: values.category, value: values.category } : null} 
                            onChange={(s) => setFieldValue('category', s ? s.value : '')} 
                            placeholder="Category..." 
                            classNamePrefix="react-select" 
                            styles={{ control: (base) => ({ ...base, borderColor: touched.category && errors.category ? '#dc3545' : base.borderColor }) }}
                          />
                        </div>
                        {touched.category && errors.category && <div className="text-danger small mt-1">{errors.category}</div>}
                      </Col>
                      <Col xs={12} md={12}>
                        <div className="complete-inventory-input-group-label">Final Bill Files</div>
                        <Form.Control type="file" multiple className="d-none" id="bill-upload" onChange={(e) => { setFieldValue('bill_files', e.currentTarget.files); previewFiles(e.currentTarget.files); }} />
                        <label htmlFor="bill-upload" className="w-100 d-block p-4 text-center border-dashed rounded-4 bg-light cursor-pointer">
                          <CsLineIcons icon="upload" size="24" className="mb-2 text-primary" />
                          <div className="fw-bold text-muted small">Upload Verified Bills</div>
                        </label>
                        <div className="d-flex flex-wrap gap-2 mt-3">
                          {filePreviews.map((f, i) => <div key={i} className="complete-inventory-file-pill"><CsLineIcons icon={f.type === 'pdf' ? 'file-text' : 'image'} size="14" /> {f.name.substring(0, 15)}...</div>)}
                        </div>
                        {touched.bill_files && errors.bill_files && <div className="text-danger small mt-1 text-center">{errors.bill_files}</div>}
                      </Col>
                    </Row>

                    <div className="complete-inventory-section-label"><CsLineIcons icon="shopping-basket" size="18" /> Verification List</div>

                    {values.items.map((item, idx) => (
                      <div key={idx} className={`complete-inventory-item-row-card ${item.completed ? 'completed' : ''}`}>
                        <Row className="w-100 g-3 align-items-center">
                          {/* Left Column: Checkbox & Item Description */}
                          <Col xs={12} lg={5} className="d-flex align-items-center">
                            <div className="d-flex align-items-center w-100">
                              <Field type="checkbox" name={`items[${idx}].completed`} className="form-check-input complete-inventory-custom-check flex-shrink-0" />
                              <div className="ms-3 flex-grow-1">
                                <div className="complete-inventory-input-group-label text-muted small text-uppercase fw-bold mb-1">Item Description</div>
                                <Field name={`items[${idx}].item_name`} readOnly className="complete-inventory-modern-input form-control border-0 bg-transparent fw-bold p-0 h-auto" />
                              </div>
                            </div>
                          </Col>

                          {/* Right Column: Input Textboxes (Qty, Unit, Price) */}
                          <Col xs={12} lg={7}>
                            <Row className="g-2 g-lg-3">
                              <Col xs={3}>
                                <div className="complete-inventory-input-group-label text-muted small text-uppercase fw-bold mb-1">Qty</div>
                                <Field 
                                  type="number" 
                                  name={`items[${idx}].item_quantity`} 
                                  className={`complete-inventory-modern-input form-control ${touched.items?.[idx]?.item_quantity && errors.items?.[idx]?.item_quantity ? 'is-invalid' : ''}`} 
                                  disabled={!item.completed} 
                                />
                                {touched.items?.[idx]?.item_quantity && errors.items?.[idx]?.item_quantity && <div className="text-danger small mt-1">{errors.items[idx].item_quantity}</div>}
                              </Col>
                              <Col xs={4}>
                                <div className="complete-inventory-input-group-label text-muted small text-uppercase fw-bold mb-1">Unit</div>
                                <Field 
                                  as="select" 
                                  name={`items[${idx}].unit`} 
                                  className={`complete-inventory-modern-input form-control ${touched.items?.[idx]?.unit && errors.items?.[idx]?.unit ? 'is-invalid' : ''}`} 
                                  disabled={!item.completed}
                                >
                                  <option value="">Unit</option>
                                  <option value="kg">kg</option>
                                  <option value="g">g</option>
                                  <option value="litre">ltr</option>
                                  <option value="ml">ml</option>
                                  <option value="piece">pc</option>
                                </Field>
                                {touched.items?.[idx]?.unit && errors.items?.[idx]?.unit && <div className="text-danger small mt-1">{errors.items[idx].unit}</div>}
                              </Col>
                              <Col xs={5}>
                                <div className="complete-inventory-input-group-label text-muted small text-uppercase fw-bold mb-1">Price (₹)</div>
                                <Field 
                                  type="number" 
                                  name={`items[${idx}].item_price`} 
                                  className={`complete-inventory-modern-input form-control ${touched.items?.[idx]?.item_price && errors.items?.[idx]?.item_price ? 'is-invalid' : ''}`} 
                                  disabled={!item.completed} 
                                />
                                {touched.items?.[idx]?.item_price && errors.items?.[idx]?.item_price && <div className="text-danger small mt-1">{errors.items[idx].item_price}</div>}
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                      </div>
                    ))}
                    {typeof errors.items === 'string' && <div className="text-danger mt-2 fw-bold small text-center">{errors.items}</div>}

                    <div className="complete-inventory-summary-hub">
                      <Row className="g-4">
                        <Col xs={12} md={4}><div className="complete-inventory-input-group-label">Sub Total</div><div className="h4 fw-bold text-muted">₹ {values.sub_total}</div></Col>
                        <Col xs={6} md={4}><div className="complete-inventory-input-group-label">Tax Amount</div><Field type="number" name="tax" className="complete-inventory-modern-input form-control" /></Col>
                        <Col xs={6} md={4}><div className="complete-inventory-input-group-label">Discount</div><Field type="number" name="discount" className="complete-inventory-modern-input form-control" /></Col>
                        
                        <Col md={12}>
                          <div className="complete-inventory-total-display shadow-sm">
                            <div>
                              <div className="complete-inventory-input-group-label mb-1">Total Payable Amount</div>
                              <div className="complete-inventory-total-val">₹ {values.total_amount}</div>
                            </div>
                            <div className="complete-inventory-amount-paid-container">
                              <div className="complete-inventory-input-group-label">Amount Paid</div>
                              <Field 
                                type="number" 
                                name="paid_amount" 
                                className={`complete-inventory-modern-input form-control text-center fw-bold text-primary ${touched.paid_amount && errors.paid_amount ? 'is-invalid' : ''}`} 
                                style={{fontSize: '1.25rem'}} 
                                placeholder="0.00" 
                              />
                              {touched.paid_amount && errors.paid_amount && <div className="text-danger small mt-1 text-center">{errors.paid_amount}</div>}
                            </div>
                          </div>
                        </Col>
                        
                        <Col md={12} className="text-end pt-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="sw-2 sh-2 rounded-circle bg-warning" />
                            <span className="fw-bold text-muted">Balance Due: ₹ {values.unpaid_amount}</span>
                          </div>
                          <Button type="submit" variant="outline-primary" className="rounded-pill px-5 fw-bold border-2 ms-md-auto w-100 w-md-auto" disabled={submitting}>
                            {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : <CsLineIcons icon="check-circle" className="me-2" />} Complete Synchronization
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </Card.Body>
                </Card>
              </FormikForm>
            );
          }}
        </Formik>
      </div>

      {submitting && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 9999, backdropFilter: 'blur(10px)' }}>
          <div className="text-center"><Spinner animation="grow" variant="primary" size="lg" className="mb-4" /><h4 className="fw-bold text-primary">Finalizing Global Synchronization</h4><p className="text-muted">Recording stock entry and financial adjustments...</p></div>
        </div>
      )}
    </div>
  );
};

export default CompleteInventory;