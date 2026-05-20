// Admin Side Inventory
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Badge } from 'react-bootstrap';
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
  bill_files: Yup.mixed().required('At least one file required'),
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

const AddInventory = () => {
  const history = useHistory();
  const title = 'Add Inventory';
  const brandColor = '#23b3f4';
  const [suggestions, setSuggestions] = useState({ vendors: [], categories: [], items: [] });
  const [filePreviews, setFilePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      items: [{ item_name: '', item_quantity: 1, unit: '', item_price: 0 }],
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        Object.entries(values).forEach(([k, v]) => {
          if (k === 'bill_files') Array.from(v).forEach((f) => formData.append('bill_files', f));
          else if (k === 'items') formData.append('items', JSON.stringify(v));
          else formData.append(k, v);
        });
        await axios.post(`${process.env.REACT_APP_API}/inventory/add`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        toast.success('Inventory synchronized successfully!');
        history.push('/operations/inventory-history');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Operation failed');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

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

  return (
    <div className="add-inventory-inventory-container pb-5">
      
      <HtmlHead title={title} />
      <div className="container-fluid px-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
              <BreadcrumbList items={[{ to: '', text: 'Home' }, { to: 'operations', text: 'Operations' }, { to: 'operations/add-inventory', title: 'Add' }]} />
            </Col>
            <Col xs="auto" className="d-none d-lg-block">
              <Button 
                onClick={() => history.goBack()} 
                className="manage-menu-custom-btn-outline shadow-sm px-4 py-2 d-flex align-items-center"
                style={{ borderRadius: '50px', border: '2px solid #23b3f4', color: '#23b3f4', fontWeight: '700' }}
              >
                <CsLineIcons icon="arrow-left" size="18" className="me-2" /> Back
              </Button>
            </Col>
          </Row>
          
          <div className="mt-2 d-lg-none d-flex justify-content-start">
             <Button 
                onClick={() => history.goBack()} 
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
                      type="date"
                      className="add-inventory-modern-input"
                      name="bill_date"
                      value={values.bill_date}
                      onChange={handleChange}
                      isInvalid={touched.bill_date && errors.bill_date}
                    />
                    <div className="position-absolute end-0 top-50 translate-middle-y me-3" style={{ pointerEvents: 'none', zIndex: 5 }}>
                      <CsLineIcons icon="calendar" size="16" className="text-muted" />
                    </div>
                  </div>
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
                    />
                  </div>
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
                    />
                  </div>
                </Col>
                <Col md={12}>
                  <div className="add-inventory-input-group-label">Bill Attachments</div>
                  <Form.Control
                    type="file"
                    multiple
                    className="d-none"
                    id="bill-upload"
                    onChange={(e) => {
                      setFieldValue('bill_files', e.currentTarget.files);
                      const p = Array.from(e.currentTarget.files).map((f) => ({ name: f.name, type: f.type }));
                      setFilePreviews(p);
                    }}
                  />
                  <label htmlFor="bill-upload" className="w-100 d-block p-4 text-center border-dashed rounded-4 bg-light cursor-pointer">
                    <CsLineIcons icon="upload" size="24" className="mb-2 text-primary" />
                    <div className="fw-bold text-muted small">Upload Bills (Images or PDF)</div>
                  </label>
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {filePreviews.map((f, i) => (
                      <div key={i} className="add-inventory-file-pill">
                        <CsLineIcons icon={f.type.includes('pdf') ? 'file-text' : 'image'} size="14" /> {f.name.substring(0, 15)}...
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
                  <Row className="g-2 align-items-center">
                    <Col xs={12} lg={4}>
                      <div className="add-inventory-input-group-label">Item Description</div>
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
                        />
                      </div>
                    </Col>
                    <Col xs={4} lg={2}>
                      <div className="add-inventory-input-group-label d-lg-none">Qty</div>
                      <Form.Control
                        type="number"
                        className="add-inventory-modern-input"
                        value={item.item_quantity}
                        onChange={(e) => handleItemChange(idx, 'item_quantity', e.target.value)}
                      />
                    </Col>
                    <Col xs={4} lg={2}>
                      <div className="add-inventory-input-group-label d-lg-none">Unit</div>
                      <Form.Select className="add-inventory-modern-input" value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}>
                        <option value="">Unit</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="litre">ltr</option>
                        <option value="ml">ml</option>
                        <option value="piece">pc</option>
                      </Form.Select>
                    </Col>
                    <Col xs={4} lg={2}>
                      <div className="add-inventory-input-group-label d-lg-none">Price (₹)</div>
                      <Form.Control
                        type="number"
                        className="add-inventory-modern-input"
                        value={item.item_price}
                        onChange={(e) => handleItemChange(idx, 'item_price', e.target.value)}
                      />
                    </Col>
                    <Col xs="auto" lg="auto" className="d-flex justify-content-end align-items-center">
                      <button type="button" className="add-inventory-remove-btn" onClick={() => removeItem(idx)} disabled={values.items.length === 1}>
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
                    <div className="add-inventory-total-display shadow-sm">
                      <Row className="g-3 align-items-center w-100">
                        <Col xs={12} md={6}>
                          <div className="add-inventory-input-group-label mb-1">Final Amount Payable</div>
                          <div className="add-inventory-total-val">₹ {values.total_amount}</div>
                        </Col>
                        <Col xs={12} md={6}>
                          <div className="add-inventory-input-group-label">Paid Amount</div>
                          <Form.Control
                            type="number"
                            className="add-inventory-modern-input fw-bold text-primary"
                            style={{ fontSize: '1.1rem' }}
                            name="paid_amount"
                            value={values.paid_amount}
                            onChange={handleChange}
                            isInvalid={touched.paid_amount && errors.paid_amount}
                            placeholder="0.00"
                          />
                        </Col>
                      </Row>
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
                      {isSubmitting ? <Spinner animation="border" size="sm" className="me-2" /> : <CsLineIcons icon="save" className="me-2" />} Complete & Sync Inventory
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

export default AddInventory;
