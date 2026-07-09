// Admin Side Edit Inventory
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const validationSchema = Yup.object().shape({
  bill_date: Yup.date().required('Date required'),
  bill_number: Yup.string().required('Bill # required'),
  vendor_name: Yup.string().required('Vendor required'),
  category: Yup.string().required('Category required'),
  paid_amount: Yup.number().required('Paid amount required').min(0).max(Yup.ref('total_amount'), 'Paid exceeds total'),
  items: Yup.array().of(
    Yup.object().shape({
      item_name: Yup.string().required('Required'),
      item_quantity: Yup.number().required('Required').positive(),
      unit: Yup.string().required('Required'),
      item_price: Yup.number().required('Required').positive(),
    })
  ),
});

const EditInventory = () => {
  const { id } = useParams();
  const history = useHistory();
  const dateInputRef = React.useRef(null);
  const title = 'Edit Inventory';
  const brandColor = '#23b3f4';
  const [suggestions, setSuggestions] = useState({ vendors: [], categories: [], items: [] });
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Suggestions
  useEffect(() => {
    const getSuggestions = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API}/inventory/get-suggestions?types=vendor,category,item`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSuggestions(data);
      } catch (err) {
        toast.error('Failed to load suggestions');
      }
    };
    getSuggestions();
  }, []);

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
      items: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        Object.entries(values).forEach(([k, v]) => {
          if (k === 'bill_files') {
            Array.from(v).forEach((f) => formData.append('bill_files', f));
          } else if (k === 'items') {
            formData.append('items', JSON.stringify(v));
          } else {
            formData.append(k, v);
          }
        });
        await axios.put(`${process.env.REACT_APP_API}/inventory/update/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        toast.success('Inventory modified and synchronized successfully!');
        history.push('/inventory');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Update failed');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  // Load Inventory Data
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        setFieldValue('bill_date', data.bill_date?.slice(0, 10));
        setFieldValue('bill_number', data.bill_number);
        setFieldValue('vendor_name', data.vendor_name);
        setFieldValue('category', data.category);
        setFieldValue('sub_total', data.sub_total || 0);
        setFieldValue('tax', data.tax || 0);
        setFieldValue('discount', data.discount || 0);
        setFieldValue('total_amount', data.total_amount);
        setFieldValue('paid_amount', data.paid_amount);
        setFieldValue('status', data.status || 'Completed');
        setFieldValue('items', data.items);
        setFieldValue('unpaid_amount', data.total_amount - data.paid_amount);

        setFilePreviews(data.bill_files.map((name) => ({ type: 'existing', name })));
      } catch (err) {
        toast.error('Could not load inventory data');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [id, setFieldValue]);

  // Recalculations
  useEffect(() => {
    const subTotal = values.items.reduce((s, i) => s + (Number(i.item_quantity) || 0) * (Number(i.item_price) || 0), 0);
    const total = subTotal + (Number(values.tax) || 0) - (Number(values.discount) || 0);
    const unpaid = total - (Number(values.paid_amount) || 0);
    setFieldValue('sub_total', subTotal.toFixed(2));
    setFieldValue('total_amount', Math.max(0, total).toFixed(2));
    setFieldValue('unpaid_amount', unpaid >= 0 ? unpaid.toFixed(2) : '0.00');
  }, [values.items, values.tax, values.discount, values.paid_amount, setFieldValue]);

  const handleItemChange = (idx, field, val) => {
    const updated = [...values.items];
    updated[idx][field] = val;
    setFieldValue('items', updated);
  };

  const addItem = () => setFieldValue('items', [...values.items, { item_name: '', item_quantity: 1, unit: '', item_price: 0 }]);
  const removeItem = (idx) =>
    setFieldValue(
      'items',
      values.items.filter((_, i) => i !== idx)
    );

  const handleFileChange = (e) => {
    const { files } = e.currentTarget;
    setFieldValue('bill_files', files);
    const previews = Array.from(files).map((file) => ({ type: file.type.startsWith('image/') ? 'image' : 'pdf', name: file.name }));
    setFilePreviews([...filePreviews.filter(f => f.type === 'existing'), ...previews]);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const customStyles = `
    .add-inventory-inventory-container .btn {
      transition: all 0.2s ease-in-out !important;
    }
    .add-inventory-inventory-container .btn:hover {
      transform: translateY(-2px) !important;
    }
    .add-inventory-inventory-container .btn:not(.btn-sm) {
      border-radius: 50px !important;
      font-weight: 600 !important;
      padding: 6px 20px !important;
      height: 38px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      font-size: 0.88rem !important;
    }
    .add-inventory-inventory-container .btn.btn-sm {
      border-radius: 50px !important;
      font-weight: 600 !important;
      padding: 6px 16px !important;
      height: 34px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      font-size: 0.85rem !important;
    }
    .add-inventory-inventory-container .btn-primary {
      background-color: #23b3f4 !important;
      border-color: #23b3f4 !important;
      box-shadow: 0 4px 10px rgba(35, 179, 244, 0.15) !important;
    }
    .add-inventory-inventory-container .btn-primary:hover {
      background-color: #179edb !important;
      border-color: #179edb !important;
      box-shadow: 0 6px 15px rgba(35, 179, 244, 0.25) !important;
    }
    .add-inventory-inventory-container .btn-outline-primary,
    .add-inventory-inventory-container .manage-menu-custom-btn-outline {
      border: 1px solid #23b3f4 !important;
      color: #23b3f4 !important;
      background-color: #ffffff !important;
    }
    .add-inventory-inventory-container .btn-outline-primary:hover,
    .add-inventory-inventory-container .manage-menu-custom-btn-outline:hover {
      background-color: #23b3f4 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
    }
    .add-inventory-inventory-container .btn-outline-primary:hover svg,
    .add-inventory-inventory-container .manage-menu-custom-btn-outline:hover svg {
      stroke: #ffffff !important;
    }
    .add-inventory-inventory-container .btn-outline-danger {
      border: 1px solid #ef4444 !important;
      color: #ef4444 !important;
      background-color: #ffffff !important;
    }
    .add-inventory-inventory-container .btn-outline-danger:hover {
      background-color: #ef4444 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
    }
    .add-inventory-inventory-container .btn-outline-danger:hover svg {
      stroke: #ffffff !important;
    }
    .add-inventory-inventory-container .btn-outline-secondary {
      border: 1px solid #64748b !important;
      color: #64748b !important;
      background-color: #ffffff !important;
    }
    .add-inventory-inventory-container .btn-outline-secondary:hover {
      background-color: #64748b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25) !important;
    }
    .add-inventory-inventory-container .btn-outline-secondary:hover svg {
      stroke: #ffffff !important;
    }

    .modal-content {
      border-radius: 1.5rem !important;
      overflow: hidden !important;
    }
  `;

  return (
    <div className="add-inventory-inventory-container pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} />
      <div className="container-fluid px-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
              <BreadcrumbList items={[{ to: '', text: 'Home' }, { to: 'inventory', text: 'Inventory Management' }, { to: '', title: 'Edit' }]} />
            </Col>
            <Col xs="auto" className="d-none d-lg-block">
              <Button 
                onClick={() => history.push('/inventory')} 
                className="manage-menu-custom-btn-outline shadow-sm px-4 py-2 d-flex align-items-center"
                style={{ borderRadius: '50px', border: '2px solid #23b3f4', color: '#23b3f4', fontWeight: '700' }}
              >
                <CsLineIcons icon="arrow-left" size="18" className="me-2" /> Back
              </Button>
            </Col>
          </Row>
          <div className="mt-2 d-lg-none d-flex justify-content-start">
             <Button 
                onClick={() => history.push('/inventory')} 
                className="manage-menu-custom-btn-outline shadow-sm px-4 py-2 d-flex align-items-center"
                style={{ borderRadius: '50px', border: '2px solid #23b3f4', color: '#23b3f4', fontWeight: '700' }}
              >
                <CsLineIcons icon="arrow-left" size="16" className="me-2" /> <span className="small">Back</span>
              </Button>
          </div>
        </div>

        <Form onSubmit={handleSubmit}>
          <Card className="add-inventory-page-card border-0">
            <Card.Body className="p-4 p-lg-5">
              {/* Purchase Details */}
              <div className="add-inventory-section-label">
                <CsLineIcons icon="file-text" size="18" /> Purchase Information
              </div>
              <Row className="g-4 mb-5">
                <Col xs={12} md={3}>
                  <div className="add-inventory-input-group-label">Bill Date</div>
                  <div className="position-relative">
                    <Form.Control
                      ref={dateInputRef}
                      type="date"
                      className="add-inventory-modern-input"
                      name="bill_date"
                      value={values.bill_date}
                      onChange={handleChange}
                      isInvalid={touched.bill_date && errors.bill_date}
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
                  <div className="add-inventory-input-group-label">Bill Number</div>
                  <Form.Control
                    type="text"
                    className="add-inventory-modern-input"
                    name="bill_number"
                    value={values.bill_number}
                    onChange={handleChange}
                    isInvalid={touched.bill_number && errors.bill_number}
                    placeholder="Enter bill #"
                  />
                  {touched.bill_number && errors.bill_number && <div className="text-danger small mt-1">{errors.bill_number}</div>}
                </Col>
                <Col xs={12} md={3}>
                  <div className="add-inventory-input-group-label">Vendor</div>
                  <div className="add-inventory-select-modern">
                    <CreatableSelect
                      isClearable
                      menuPlacement="auto"
                      menuPortalTarget={document.body}
                      options={(suggestions.vendors || []).map((v) => ({ label: v, value: v }))}
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
                  <div className="add-inventory-input-group-label">Category</div>
                  <div className="add-inventory-select-modern">
                    <CreatableSelect
                      isClearable
                      menuPlacement="auto"
                      menuPortalTarget={document.body}
                      options={(suggestions.categories || []).map((c) => ({ label: c, value: c }))}
                      value={values.category ? { label: values.category, value: values.category } : null}
                      onChange={(s) => setFieldValue('category', s ? s.value : '')}
                      placeholder="Category..."
                      classNamePrefix="react-select"
                      styles={{ control: (base) => ({ ...base, borderColor: touched.category && errors.category ? '#dc3545' : base.borderColor }) }}
                    />
                  </div>
                  {touched.category && errors.category && <div className="text-danger small mt-1">{errors.category}</div>}
                </Col>
                <Col md={12}>
                  <div className="add-inventory-input-group-label">Bill Attachments</div>
                  <Form.Control
                    type="file"
                    multiple
                    className="d-none"
                    id="bill-upload"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="bill-upload" className="w-100 d-block p-4 text-center border-dashed rounded-4 bg-light cursor-pointer">
                    <CsLineIcons icon="upload" size="24" className="mb-2 text-primary" />
                    <div className="fw-bold text-muted small">Update Bills (Images or PDF)</div>
                  </label>
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {filePreviews.map((f, i) => (
                      <div key={i} className="add-inventory-file-pill">
                        <CsLineIcons icon={f.name.match(/\.(pdf)$/i) || f.type === 'pdf' ? 'file-text' : 'image'} size="14" /> {f.name.substring(0, 15)}...
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>

              {/* Item Details */}
              <div className="add-inventory-section-label">
                <CsLineIcons icon="shopping-basket" size="18" /> Inventory Items
              </div>
              <div className="add-inventory-item-header-row d-none d-lg-flex">
                <div style={{ flex: 2 }}>Item Description</div>
                <div style={{ flex: 0.8 }}>Qty</div>
                <div style={{ flex: 1 }}>Unit</div>
                <div style={{ flex: 1.2 }}>Price (₹)</div>
                <div style={{ width: '60px' }} />
              </div>

              {values.items.map((item, idx) => (
                <div key={idx} className="add-inventory-item-row-card">
                  <Row className="w-100 g-3 align-items-center">
                    <Col xs={12} lg={4}>
                      <div className="add-inventory-input-group-label d-lg-none">Item Description</div>
                      <div className="add-inventory-select-modern">
                        <CreatableSelect
                          isClearable
                          menuPlacement="auto"
                          menuPortalTarget={document.body}
                          options={(suggestions.items || []).map((i) => ({ label: i, value: i }))}
                          value={item.item_name ? { label: item.item_name, value: item.item_name } : null}
                          onChange={(s) => handleItemChange(idx, 'item_name', s ? s.value : '')}
                          placeholder="Select or type item..."
                          classNamePrefix="react-select"
                          styles={{ control: (base) => ({ ...base, borderColor: touched.items?.[idx]?.item_name && errors.items?.[idx]?.item_name ? '#dc3545' : base.borderColor }) }}
                        />
                      </div>
                      {touched.items?.[idx]?.item_name && errors.items?.[idx]?.item_name && <div className="text-danger small mt-1">{errors.items[idx].item_name}</div>}
                    </Col>
                    <Col xs={4} lg={1.5}>
                      <div className="add-inventory-input-group-label d-lg-none">Qty</div>
                      <Form.Control
                        type="number"
                        className="add-inventory-modern-input"
                        value={item.item_quantity}
                        onChange={(e) => handleItemChange(idx, 'item_quantity', e.target.value)}
                        isInvalid={touched.items?.[idx]?.item_quantity && errors.items?.[idx]?.item_quantity}
                      />
                      {touched.items?.[idx]?.item_quantity && errors.items?.[idx]?.item_quantity && <div className="text-danger small mt-1">{errors.items[idx].item_quantity}</div>}
                    </Col>
                    <Col xs={4} lg={2}>
                      <div className="add-inventory-input-group-label d-lg-none">Unit</div>
                      <Form.Select className="add-inventory-modern-input" value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} isInvalid={touched.items?.[idx]?.unit && errors.items?.[idx]?.unit}>
                        <option value="">Unit</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="litre">ltr</option>
                        <option value="ml">ml</option>
                        <option value="piece">pc</option>
                      </Form.Select>
                      {touched.items?.[idx]?.unit && errors.items?.[idx]?.unit && <div className="text-danger small mt-1">{errors.items[idx].unit}</div>}
                    </Col>
                    <Col xs={4} lg={3}>
                      <div className="add-inventory-input-group-label d-lg-none">Price</div>
                      <Form.Control
                        type="number"
                        className="add-inventory-modern-input"
                        value={item.item_price}
                        onChange={(e) => handleItemChange(idx, 'item_price', e.target.value)}
                        isInvalid={touched.items?.[idx]?.item_price && errors.items?.[idx]?.item_price}
                      />
                      {touched.items?.[idx]?.item_price && errors.items?.[idx]?.item_price && <div className="text-danger small mt-1">{errors.items[idx].item_price}</div>}
                    </Col>
                    <Col xs={12} lg="auto" className="text-end">
                      <button type="button" className="add-inventory-remove-btn ms-auto" onClick={() => removeItem(idx)} disabled={values.items.length === 1}>
                        <CsLineIcons icon="bin" size="16" />
                      </button>
                    </Col>
                  </Row>
                </div>
              ))}
              <div className="text-start mt-2">
                <Button 
                  variant="outline-primary" 
                  className="manage-menu-custom-btn-outline shadow-sm px-4 py-2 fw-bold d-flex align-items-center" 
                  onClick={addItem}
                  style={{ borderRadius: '50px', border: '2px solid #23b3f4', color: '#23b3f4' }}
                >
                  <CsLineIcons icon="plus" size="16" className="me-2" /> Add Item
                </Button>
              </div>

              {/* Financial Summary */}
              <div className="add-inventory-summary-hub">
                <Row className="g-4">
                  <Col md={4}>
                    <div className="add-inventory-input-group-label">Sub Total</div>
                    <div className="h4 fw-bold text-muted">₹ {values.sub_total}</div>
                  </Col>
                  <Col md={4}>
                    <div className="add-inventory-input-group-label">Tax Amount</div>
                    <Form.Control type="number" className="add-inventory-modern-input" name="tax" value={values.tax} onChange={handleChange} />
                  </Col>
                  <Col md={4}>
                    <div className="add-inventory-input-group-label">Discount</div>
                    <Form.Control type="number" className="add-inventory-modern-input" name="discount" value={values.discount} onChange={handleChange} />
                  </Col>

                  <Col xs={12} md={12}>
                    <div className="add-inventory-total-display shadow-sm flex-column flex-md-row align-items-stretch align-items-md-center gap-3">
                      <div>
                        <div className="add-inventory-input-group-label mb-1">Updated Payable</div>
                        <div className="add-inventory-total-val">₹ {values.total_amount}</div>
                      </div>
                      <div className="text-start text-md-end" style={{ minWidth: '200px' }}>
                        <div className="add-inventory-input-group-label">Revised Paid Amount</div>
                        <Form.Control
                          type="number"
                          className="add-inventory-modern-input text-md-center fw-bold text-primary"
                          style={{ fontSize: '1.25rem' }}
                          name="paid_amount"
                          value={values.paid_amount}
                          onChange={handleChange}
                          isInvalid={touched.paid_amount && errors.paid_amount}
                          placeholder="0.00"
                        />
                        {touched.paid_amount && errors.paid_amount && <div className="text-danger small mt-1">{errors.paid_amount}</div>}
                      </div>
                    </div>
                  </Col>

                  <Col xs={12} md={12} className="text-end pt-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2 w-100 justify-content-center justify-content-md-start">
                      <div className="sw-2 sh-2 rounded-circle bg-warning flex-shrink-0" />
                      <span className="fw-bold text-muted">Pending Balance: ₹ {values.unpaid_amount}</span>
                    </div>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="manage-menu-custom-btn-outline border-primary text-primary shadow-sm px-5 py-3 fw-bold d-flex align-items-center justify-content-center" 
                      style={{ borderRadius: '50px', border: '2px solid #23b3f4', color: '#23b3f4' }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Spinner animation="border" size="sm" className="me-2" /> : <CsLineIcons icon="save" className="me-2" />} Update & Finalize Changes
                    </Button>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>
        </Form>
      </div>

      {isSubmitting && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 9999, backdropFilter: 'blur(10px)' }}
        >
          <div className="text-center">
            <Spinner animation="grow" variant="primary" size="lg" className="mb-4" />
            <h4 className="fw-bold text-primary">Synchronizing Global Inventory</h4>
            <p className="text-muted">Updating stock levels and financial ledgers...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditInventory;