import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
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
      height: 52px !important;
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
      width: 45px;
      height: 45px;
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
    .summary-hub {
      background: #f8fafc;
      border-radius: 1.5rem;
      padding: 2.5rem;
      margin-top: 3rem;
      border: 1px solid #f1f5f9;
    }
    @media (max-width: 768px) {
      .summary-hub {
        padding: 1.5rem;
      }
    }
    .total-display {
      background: #ffffff;
      border-radius: 1.25rem;
      padding: 1.5rem;
      border: 1.5px solid #23b3f4;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .amount-paid-container {
      width: 300px;
      text-align: right;
    }
    @media (max-width: 768px) {
      .total-display {
        flex-direction: column;
        align-items: flex-start;
      }
      .amount-paid-container {
        width: 100%;
        text-align: left;
      }
    }
    .total-val {
      font-size: 1.75rem;
      font-weight: 900;
      color: #23b3f4;
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
  bill_date: Yup.date().required('Bill date is required'),
  bill_number: Yup.string().required('Bill number is required'),
  vendor_name: Yup.string().required('Vendor name is required'),
  category: Yup.string().required('Category is required'),
  bill_files: Yup.mixed().required('Bill files are required'),
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
  const { id } = useParams();
  const history = useHistory();
  const brandColor = '#23b3f4';
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          if (key === 'bill_files') Array.from(val).forEach(f => formData.append('bill_files', f));
          else if (key === 'items') formData.append('items', JSON.stringify(val));
          else formData.append(key, val);
        });

        await axios.put(`${process.env.REACT_APP_API}/inventory/update/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        toast.success('Inventory updated successfully!');
        history.push('/operations/inventory-history');
      } catch (error) {
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
        setFieldValue('status', data.status || 'pending');
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
  const removeItem = (idx) => setFieldValue('items', values.items.filter((_, i) => i !== idx));

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

  return (
    <div className="inventory-container">
      <style>{customStyles}</style>
      <HtmlHead title="Edit Inventory" />
      <div className="container px-lg-5">
        <div className="page-title-container mb-4 mt-n3">
          <Row className="g-3 align-items-center">
            <Col xs="12" md="7">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>Edit Inventory</h1>
              <BreadcrumbList items={[{ to: '', text: 'Home' }, { to: 'operations', text: 'Operations' }, { to: 'operations/edit-inventory', title: 'Edit' }]} />
            </Col>
            <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button variant="outline-secondary" onClick={() => history.goBack()} className="rounded-pill px-4 fw-bold border-2">
                <CsLineIcons icon="arrow-left" size="14" className="me-2" /> Cancel
              </Button>
            </Col>
          </Row>
        </div>

        <Form onSubmit={handleSubmit}>
          <Card className="page-card border-0">
            <Card.Body className="p-4 p-lg-5">
              <div className="section-label"><CsLineIcons icon="file-text" size="18" /> Record Modification</div>
              <Row className="g-4 mb-5">
                <Col xs={12} md={3}><div className="input-group-label">Bill Date</div><Form.Control type="date" className="modern-input" name="bill_date" value={values.bill_date} onChange={handleChange} isInvalid={touched.bill_date && errors.bill_date} /></Col>
                <Col xs={12} md={3}><div className="input-group-label">Bill Number</div><Form.Control type="text" className="modern-input" name="bill_number" value={values.bill_number} onChange={handleChange} isInvalid={touched.bill_number && errors.bill_number} /></Col>
                <Col xs={12} md={3}><div className="input-group-label">Vendor</div><Form.Control type="text" className="modern-input" name="vendor_name" value={values.vendor_name} onChange={handleChange} /></Col>
                <Col xs={12} md={3}><div className="input-group-label">Category</div><Form.Control type="text" className="modern-input" name="category" value={values.category} onChange={handleChange} /></Col>
                <Col md={12}><div className="input-group-label">Update Attachments</div><Form.Control type="file" multiple className="d-none" id="bill-update" onChange={handleFileChange} /><label htmlFor="bill-update" className="w-100 d-block p-4 text-center border-dashed rounded-4 bg-light cursor-pointer"><CsLineIcons icon="upload" size="24" className="mb-2 text-primary" /><div className="fw-bold text-muted small">Select New Files to Replace Current ones</div></label><div className="d-flex flex-wrap gap-2 mt-3">{filePreviews.map((f, i) => <div key={i} className="file-pill"><CsLineIcons icon={f.name.match(/\.(pdf)$/i) ? 'file-text' : 'image'} size="14" /> {f.name.substring(0, 15)}...</div>)}</div></Col>
              </Row>

              <div className="section-label"><CsLineIcons icon="shopping-basket" size="18" /> Adjusted Item List</div>
              <div className="item-header-row d-none d-lg-flex">
                <div style={{flex: 2}}>Item Name</div>
                <div style={{flex: 0.8}}>Qty</div>
                <div style={{flex: 1}}>Unit</div>
                <div style={{flex: 1.2}}>Price (₹)</div>
                <div style={{width: '60px'}} />
              </div>

              {values.items.map((item, idx) => (
                <div key={idx} className="item-row-card">
                  <Row className="w-100 g-3 align-items-center">
                    <Col xs={12} lg={4}>
                      <div className="input-group-label d-lg-none">Item Name</div>
                      <Form.Control type="text" className="modern-input" value={item.item_name} onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)} />
                    </Col>
                    <Col xs={4} lg={1.5}>
                      <div className="input-group-label d-lg-none">Qty</div>
                      <Form.Control type="number" className="modern-input" value={item.item_quantity} onChange={(e) => handleItemChange(idx, 'item_quantity', e.target.value)} />
                    </Col>
                    <Col xs={4} lg={2}>
                      <div className="input-group-label d-lg-none">Unit</div>
                      <Form.Select className="modern-input" value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}><option value="">Unit</option><option value="kg">kg</option><option value="g">g</option><option value="litre">ltr</option><option value="ml">ml</option><option value="piece">pc</option></Form.Select>
                    </Col>
                    <Col xs={4} lg={3}>
                      <div className="input-group-label d-lg-none">Price</div>
                      <Form.Control type="number" className="modern-input" value={item.item_price} onChange={(e) => handleItemChange(idx, 'item_price', e.target.value)} />
                    </Col>
                    <Col xs={12} lg="auto" className="text-end"><button type="button" className="remove-btn ms-auto" onClick={() => removeItem(idx)} disabled={values.items.length === 1}><CsLineIcons icon="bin" size="16" /></button></Col>
                  </Row>
                </div>
              ))}
              <div className="text-start"><Button variant="outline-primary" className="rounded-pill px-4 fw-bold border-2" onClick={addItem}><CsLineIcons icon="plus" size="16" className="me-2" /> Add Item</Button></div>

              <div className="summary-hub">
                <Row className="g-4">
                  <Col md={4}><div className="input-group-label">Sub Total</div><div className="h4 fw-bold text-muted">₹ {values.sub_total}</div></Col>
                  <Col md={4}><div className="input-group-label">Tax Amount</div><Form.Control type="number" className="modern-input" name="tax" value={values.tax} onChange={handleChange} /></Col>
                  <Col md={4}><div className="input-group-label">Discount</div><Form.Control type="number" className="modern-input" name="discount" value={values.discount} onChange={handleChange} /></Col>
                  
                  <Col md={12}>
                    <div className="total-display shadow-sm flex-column flex-md-row align-items-stretch align-items-md-center gap-3">
                      <div>
                        <div className="input-group-label mb-1">Updated Payable</div>
                        <div className="total-val">₹ {values.total_amount}</div>
                      </div>
                      <div className="text-start text-md-end" style={{ width: '300px' }}>
                        <div className="input-group-label">Revised Paid Amount</div>
                        <Form.Control type="number" className="modern-input text-md-center fw-bold text-primary" style={{ fontSize: '1.25rem' }} name="paid_amount" value={values.paid_amount} onChange={handleChange} />
                      </div>
                    </div>
                  </Col>
                  
                  <Col md={12} className="text-end pt-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2 w-100 justify-content-center justify-content-md-start">
                      <div className="sw-2 sh-2 rounded-circle bg-warning flex-shrink-0" />
                      <span className="fw-bold text-muted">Remaining Due: ₹ {values.unpaid_amount}</span>
                    </div>
                    <Button type="submit" variant="outline-primary" className="rounded-pill px-5 fw-bold border-2 w-100 w-md-auto ms-md-auto" disabled={isSubmitting}>
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
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 9999, backdropFilter: 'blur(10px)' }}>
          <div className="text-center"><Spinner animation="grow" variant="primary" size="lg" className="mb-4" /><h4 className="fw-bold text-primary">Synchronizing Global Adjustments</h4><p className="text-muted">Recalculating ledgers and stock history...</p></div>
        </div>
      )}
    </div>
  );
};

export default EditInventory;