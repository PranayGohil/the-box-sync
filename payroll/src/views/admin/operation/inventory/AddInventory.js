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

const customStyles = `
    .inventory-container {
      background: #f9f9fb;
      min-height: 100vh;
      padding-bottom: 5rem;
    }
    .page-card {
      background: #ffffff !important;
      border-radius: 2rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02) !important;
      overflow: hidden;
    }
    .section-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .modern-input {
      border-radius: 12px !important;
      padding: 0.8rem 1.25rem !important;
      border: 1.5px solid #f1f5f9 !important;
      font-weight: 600 !important;
      color: #334155 !important;
      transition: all 0.3s ease !important;
      background: #fcfdfe !important;
    }
    .modern-input:focus {
      border-color: #23b3f4 !important;
      box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
      background: #ffffff !important;
    }
    .input-group-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.5rem;
      padding-left: 0.25rem;
    }
    .item-header-row {
      display: flex;
      padding: 0 1.5rem;
      margin-bottom: 1rem;
      color: #94a3b8;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .item-row-card {
      background: #ffffff !important;
      border-radius: 1.25rem !important;
      border: 1px solid #f1f5f9 !important;
      padding: 1.25rem 1.5rem !important;
      margin-bottom: 1rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02) !important;
      display: flex;
      align-items: center;
      transition: all 0.25s ease;
    }
    .item-row-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.05) !important;
      border-color: rgba(35, 179, 244, 0.2) !important;
    }
    .remove-btn {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff1f2;
      color: #f43f5e;
      border: 1px solid #ffe4e6;
      transition: all 0.2s ease;
    }
    .remove-btn:hover {
      background: #f43f5e;
      color: #ffffff;
      border-color: #f43f5e;
    }
    .add-btn-premium {
      background: rgba(35, 179, 244, 0.05) !important;
      color: #23b3f4 !important;
      border: 1.5px dashed #23b3f4 !important;
      border-radius: 15px !important;
      padding: 1rem !important;
      font-weight: 800 !important;
      width: 100%;
      margin-top: 1rem;
      transition: all 0.3s ease;
    }
    .add-btn-premium:hover {
      background: #23b3f4 !important;
      color: #ffffff !important;
      border-style: solid !important;
    }
    .summary-hub {
      background: #f8fafc;
      border-radius: 1.5rem;
      padding: 2.5rem;
      margin-top: 3rem;
      border: 1px solid #f1f5f9;
    }
    .total-display {
      background: #ffffff;
      border-radius: 1.25rem;
      padding: 1.5rem;
      border: 1.5px solid #23b3f4;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-val {
      font-size: 1.75rem;
      font-weight: 900;
      color: #23b3f4;
    }
    .save-btn-premium {
      background: #23b3f4 !important;
      border: none !important;
      border-radius: 50px !important;
      padding: 1rem 3rem !important;
      font-weight: 800 !important;
      color: #ffffff !important;
      box-shadow: 0 10px 20px rgba(35, 179, 244, 0.2) !important;
      transition: all 0.3s ease !important;
    }
    .save-btn-premium:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 30px rgba(35, 179, 244, 0.3) !important;
    }
    .select-modern .react-select__control {
      border-radius: 12px !important;
      border: 1.5px solid #f1f5f9 !important;
      min-height: 52px !important;
      background: #fcfdfe !important;
      font-weight: 600 !important;
    }
    .select-modern .react-select__control--is-focused {
      border-color: #23b3f4 !important;
      box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
      background: #ffffff !important;
    }
    .file-pill {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 50px;
      padding: 0.5rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 0.75rem;
      color: #64748b;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
`;

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
    <div className="inventory-container">
      <style>{customStyles}</style>
      <HtmlHead title={title} />
      <div className="container px-lg-5">
        <div className="mb-5 pt-4 d-flex justify-content-between align-items-center">
          <div>
            <h1 className="display-4 fw-bold mb-1" style={{ color: brandColor }}>
              {title}
            </h1>
            <BreadcrumbList
              items={[
                { to: '', text: 'Home' },
                { to: 'operations', text: 'Operations' },
                { to: 'operations/add-inventory', title: 'Add' },
              ]}
            />
          </div>
          <Button variant="outline-secondary" onClick={() => history.goBack()} className="rounded-pill px-4 fw-bold border-2">
            <CsLineIcons icon="arrow-left" size="14" className="me-2" /> Cancel
          </Button>
        </div>

        <Form onSubmit={handleSubmit}>
          <Card className="page-card border-0">
            <Card.Body className="p-4 p-lg-5">
              {/* Purchase Details */}
              <div className="section-label">
                <CsLineIcons icon="file-text" size="18" /> Purchase Information
              </div>
              <Row className="g-4 mb-5">
                <Col md={3}>
                  <div className="input-group-label">Bill Date</div>
                  <Form.Control
                    type="date"
                    className="modern-input"
                    name="bill_date"
                    value={values.bill_date}
                    onChange={handleChange}
                    isInvalid={touched.bill_date && errors.bill_date}
                  />
                </Col>
                <Col md={3}>
                  <div className="input-group-label">Bill Number</div>
                  <Form.Control
                    type="text"
                    className="modern-input"
                    name="bill_number"
                    value={values.bill_number}
                    onChange={handleChange}
                    isInvalid={touched.bill_number && errors.bill_number}
                    placeholder="Enter bill #"
                  />
                </Col>
                <Col md={3}>
                  <div className="input-group-label">Vendor</div>
                  <div className="select-modern">
                    <CreatableSelect
                      isClearable
                      options={(suggestions.vendors || []).map((v) => ({ label: v, value: v }))}
                      value={values.vendor_name ? { label: values.vendor_name, value: values.vendor_name } : null}
                      onChange={(s) => setFieldValue('vendor_name', s ? s.value : '')}
                      placeholder="Vendor..."
                      classNamePrefix="react-select"
                    />
                  </div>
                </Col>
                <Col md={3}>
                  <div className="input-group-label">Category</div>
                  <div className="select-modern">
                    <CreatableSelect
                      isClearable
                      options={(suggestions.categories || []).map((c) => ({ label: c, value: c }))}
                      value={values.category ? { label: values.category, value: values.category } : null}
                      onChange={(s) => setFieldValue('category', s ? s.value : '')}
                      placeholder="Category..."
                      classNamePrefix="react-select"
                    />
                  </div>
                </Col>
                <Col md={12}>
                  <div className="input-group-label">Bill Attachments</div>
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
                      <div key={i} className="file-pill">
                        <CsLineIcons icon={f.type.includes('pdf') ? 'file-text' : 'image'} size="14" /> {f.name.substring(0, 15)}...
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>

              {/* Item Details */}
              <div className="section-label">
                <CsLineIcons icon="shopping-basket" size="18" /> Inventory Items
              </div>
              <div className="item-header-row d-none d-lg-flex">
                <div style={{ flex: 2 }}>Item Description</div>
                <div style={{ flex: 0.8 }}>Qty</div>
                <div style={{ flex: 1 }}>Unit</div>
                <div style={{ flex: 1.2 }}>Price (₹)</div>
                <div style={{ width: '60px' }} />
              </div>

              {values.items.map((item, idx) => (
                <div key={idx} className="item-row-card">
                  <Row className="w-100 g-3 align-items-center">
                    <Col lg={4.5} style={{ flex: 2 }}>
                      <div className="select-modern">
                        <CreatableSelect
                          isClearable
                          options={(suggestions.items || []).map((i) => ({ label: i, value: i }))}
                          value={item.item_name ? { label: item.item_name, value: item.item_name } : null}
                          onChange={(s) => handleItemChange(idx, 'item_name', s ? s.value : '')}
                          placeholder="Select item..."
                          classNamePrefix="react-select"
                        />
                      </div>
                    </Col>
                    <Col lg={1.5} style={{ flex: 0.8 }}>
                      <Form.Control
                        type="number"
                        className="modern-input"
                        value={item.item_quantity}
                        onChange={(e) => handleItemChange(idx, 'item_quantity', e.target.value)}
                      />
                    </Col>
                    <Col lg={2} style={{ flex: 1 }}>
                      <Form.Select className="modern-input" value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}>
                        <option value="">Unit</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="litre">ltr</option>
                        <option value="ml">ml</option>
                        <option value="piece">pc</option>
                      </Form.Select>
                    </Col>
                    <Col lg={3} style={{ flex: 1.2 }}>
                      <Form.Control
                        type="number"
                        className="modern-input"
                        value={item.item_price}
                        onChange={(e) => handleItemChange(idx, 'item_price', e.target.value)}
                      />
                    </Col>
                    <Col xs="auto" style={{ width: '60px' }} className="text-end">
                      <button type="button" className="remove-btn" onClick={() => removeItem(idx)} disabled={values.items.length === 1}>
                        <CsLineIcons icon="bin" size="16" />
                      </button>
                    </Col>
                  </Row>
                </div>
              ))}
              <div className="text-start">
                <Button variant="outline-primary" className="rounded-pill px-4 fw-bold border-2" onClick={addItem}>
                  <CsLineIcons icon="plus" size="16" className="me-2" /> Add Another Item to List
                </Button>
              </div>

              {/* Financial Summary */}
              <div className="summary-hub">
                <Row className="g-4">
                  <Col md={4}>
                    <div className="input-group-label">Sub Total</div>
                    <div className="h4 fw-bold text-muted">₹ {values.sub_total}</div>
                  </Col>
                  <Col md={4}>
                    <div className="input-group-label">Tax Amount</div>
                    <Form.Control type="number" className="modern-input" name="tax" value={values.tax} onChange={handleChange} />
                  </Col>
                  <Col md={4}>
                    <div className="input-group-label">Discount</div>
                    <Form.Control type="number" className="modern-input" name="discount" value={values.discount} onChange={handleChange} />
                  </Col>

                  <Col md={12}>
                    <div className="total-display shadow-sm">
                      <div>
                        <div className="input-group-label mb-1">Final Amount Payable</div>
                        <div className="total-val">₹ {values.total_amount}</div>
                      </div>
                      <div className="text-end" style={{ width: '300px' }}>
                        <div className="input-group-label">Paid Amount</div>
                        <Form.Control
                          type="number"
                          className="modern-input text-center fw-bold text-primary"
                          style={{ fontSize: '1.25rem' }}
                          name="paid_amount"
                          value={values.paid_amount}
                          onChange={handleChange}
                          isInvalid={touched.paid_amount && errors.paid_amount}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </Col>

                  <Col md={12} className="text-end pt-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <div className="sw-2 sh-2 rounded-circle bg-warning" />
                      <span className="fw-bold text-muted">Pending Balance: ₹ {values.unpaid_amount}</span>
                    </div>
                    <Button type="submit" variant="outline-primary" className="rounded-pill px-4 fw-bold border-2 ms-auto" disabled={isSubmitting}>
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
