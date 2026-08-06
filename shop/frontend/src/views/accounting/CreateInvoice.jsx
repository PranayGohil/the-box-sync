import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import CreatableSelect from 'react-select/creatable';
import { createInvoice } from '../../api/accounting';
import { getCatalogData } from '../../api/orderService';

const breadcrumbs = [
  { to: '', text: 'Home' },
  { to: 'accounting', text: 'Accounting & Billing' },
  { to: 'accounting/create-invoice', text: 'GST Invoice' },
];

const invoiceStyles = `
  .inv-section-title {
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #23b3f4;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .inv-field label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 5px;
  }
  .inv-field .form-control,
  .inv-field .form-select {
    border-radius: 10px !important;
    border: 1.5px solid #e5e7eb !important;
    font-size: 0.85rem !important;
    color: #334155 !important;
    padding: 8px 12px !important;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .inv-field .form-control:focus,
  .inv-field .form-select:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 3px rgba(35,179,244,0.12) !important;
  }
  .inv-line-card {
    border: 1.5px solid #e5e7eb;
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 12px;
    background: #fafcff;
    transition: box-shadow 0.15s;
  }
  .inv-line-card:hover { box-shadow: 0 4px 16px rgba(35,179,244,0.08); }
  .inv-line-num {
    width: 26px; height: 26px;
    border-radius: 50%;
    background: #23b3f4;
    color: #fff;
    font-size: 0.72rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .inv-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.85rem;
  }
  .inv-summary-row:last-child { border-bottom: none; }
  .inv-summary-label { color: #64748b; }
  .inv-summary-val { font-weight: 700; color: #334155; }
  .inv-grand-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0 4px;
    font-size: 1rem;
    font-weight: 800;
    color: #23b3f4;
    border-top: 2px solid #23b3f4;
    margin-top: 4px;
  }
  .inv-tds-tag {
    background: rgba(239,68,68,0.08);
    border-radius: 10px;
    padding: 8px 12px;
    margin-top: 6px;
    display: flex;
    justify-content: space-between;
    font-size: 0.83rem;
    color: #ef4444;
    font-weight: 700;
  }
  .inv-check-label {
    font-size: 0.85rem !important;
    font-weight: 700 !important;
    color: #334155 !important;
  }
  .inv-section-card {
    border: none;
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    margin-bottom: 20px;
  }
  .inv-remove-btn {
    width: 30px; height: 30px;
    border-radius: 50%;
    border: 1.5px solid #ef4444;
    background: transparent;
    color: #ef4444;
    font-size: 1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s;
    line-height: 1;
  }
  .inv-remove-btn:hover { background: #ef4444; color: #fff; }
  .inv-item-total {
    background: linear-gradient(135deg, rgba(35,179,244,0.1), rgba(35,179,244,0.05));
    border-radius: 10px;
    padding: 8px 14px;
    font-size: 1rem;
    font-weight: 800;
    color: #1565c0;
    text-align: right;
  }
  @media (max-width: 575px) {
    .inv-section-card .card-body { padding: 16px !important; }
  }
`;

const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: 10,
    borderColor: '#e5e7eb',
    minHeight: 38,
    fontSize: '0.85rem',
    fontWeight: 600,
    boxShadow: 'none',
    '&:hover': { borderColor: '#23b3f4' }
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.85rem',
    fontWeight: 600,
    backgroundColor: state.isSelected ? '#23b3f4' : state.isFocused ? '#f0f9ff' : '#fff',
    color: state.isSelected ? '#fff' : '#334155',
  })
};

const CreateInvoice = () => {
  const history = useHistory();
  const location = useLocation();
  const shopId = localStorage.getItem('shopId');

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    customerDetails: { name: '', gstin: '', billingAddress: '', shippingAddress: '', state: 'Gujarat', stateCode: '24', phone: '', email: '' },
    notes: '',
    termsAndConditions: 'Payment is due within 15 days.',
    reverseCharge: false,
    placeOfSupply: 'Gujarat',
    salesPerson: '',
    orderReference: '',
    paymentTerms: 'COD',
    tdsDetails: { isTDSDeducted: false, name: '', description: '', rateType: 'percentage', value: 0, amount: 0 },
    extraDetails: { isApplied: false, name: '', rateType: 'amount', value: 0, amount: 0 }
  });

  const [items, setItems] = useState([
    { catalogItemId: '', name: '', hsnCode: '', quantity: 1, unit: 'pcs', rate: 0, discount: 0, taxRate: 18, cgst: 0, sgst: 0, igst: 0, totalAmount: 0 }
  ]);

  const [catalogItems, setCatalogItems] = useState([]);
  const [sellerState, setSellerState] = useState('Gujarat');

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API || 'http://localhost:5000/api'}/user/get`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setSellerState(data.user?.state || data.state || 'Gujarat');
      } catch (err) { console.error(err); }
    };
    fetchSellerProfile();
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await getCatalogData({}, token);
        const itemsList = [];
        if (res.data?.data) {
          res.data.data.forEach(cat => {
            (cat.items || []).forEach(item => {
              if (item.has_variants && item.variants?.length > 0) {
                item.variants.forEach(v => {
                  itemsList.push({ _id: `${item._id}_${v.size_name}`, name: `${item.item_name} (${v.size_name})`, baseName: `${item.item_name} (${v.size_name})`, price: v.price || item.item_price || 0, unit: item.unit || 'pcs' });
                });
              } else {
                itemsList.push({ _id: String(item._id), name: item.item_name, baseName: item.item_name, price: item.item_price || 0, unit: item.unit || 'pcs' });
              }
            });
          });
        }
        setCatalogItems(itemsList);
      } catch (error) { console.error('Error fetching catalog data:', error); }
    };
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (location.state?.items?.length > 0) {
      const mappedItems = location.state.items.map(item => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.item_price || item.price || item.unitPrice || item.rate) || 0;
        const disc = Number(item.discount || item.discountAmount) || 0;
        const taxRate = Number(item.taxRate || item.gstPercentage) || 18;
        const baseAmount = (qty * price) - disc;
        const taxAmount = (baseAmount * taxRate) / 100;
        const nameVal = item.item_name || item.name || '';
        const match = catalogItems.find(ci => ci.name.trim().toLowerCase() === nameVal.trim().toLowerCase());
        return {
          catalogItemId: match ? match._id : 'custom', name: nameVal,
          hsnCode: item.hsn_code || item.hsnCode || '',
          quantity: qty, unit: item.unit || 'pcs', rate: price, discount: disc, taxRate,
          cgst: item.cgstAmount || item.cgst || (taxAmount / 2),
          sgst: item.sgstAmount || item.sgst || (taxAmount / 2),
          igst: item.igstAmount || item.igst || 0,
          totalAmount: item.totalAmount || (baseAmount + taxAmount)
        };
      });
      setItems(mappedItems);
    }
    if (location.state?.customer) {
      setFormData(prev => ({
        ...prev,
        customerDetails: {
          ...prev.customerDetails,
          name: location.state.customer.name || '',
          phone: location.state.customer.phone || '',
          billingAddress: location.state.customer.address || '',
          gstin: location.state.customer.gst_no || location.state.customer.gstin || ''
        }
      }));
    }
  }, [location.state, catalogItems]);

  const handleItemSelect = (index, selected) => {
    const newItems = [...items];
    const value = selected ? selected.value : '';
    newItems[index].name = value;
    if (value) {
      const match = catalogItems.find(ci => ci.name.trim().toLowerCase() === value.trim().toLowerCase());
      if (match) {
        newItems[index].catalogItemId = match._id;
        newItems[index].rate = match.price;
        newItems[index].unit = match.unit;
        const qty = Number(newItems[index].quantity) || 1;
        const price = Number(match.price) || 0;
        const disc = Number(newItems[index].discount) || 0;
        const taxRate = Number(newItems[index].taxRate) || 18;
        const baseAmount = (qty * price) - disc;
        const taxAmount = (baseAmount * taxRate) / 100;
        newItems[index].cgst = taxAmount / 2;
        newItems[index].sgst = taxAmount / 2;
        newItems[index].igst = 0;
        newItems[index].totalAmount = baseAmount + taxAmount;
      } else {
        newItems[index].catalogItemId = 'custom';
      }
    } else {
      newItems[index].catalogItemId = '';
    }
    setItems(newItems);
  };

  const handleCustomerChange = (e) => {
    setFormData({ ...formData, customerDetails: { ...formData.customerDetails, [e.target.name]: e.target.value } });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    const qty = Number(newItems[index].quantity) || 0;
    const price = Number(newItems[index].rate) || 0;
    const disc = Number(newItems[index].discount) || 0;
    const taxRate = Number(newItems[index].taxRate) || 0;
    const baseAmount = (qty * price) - disc;
    const taxAmount = (baseAmount * taxRate) / 100;
    const isInterstate = sellerState.trim().toLowerCase() !== formData.customerDetails.state.trim().toLowerCase();
    if (isInterstate) {
      newItems[index].igst = taxAmount; newItems[index].cgst = 0; newItems[index].sgst = 0;
    } else {
      newItems[index].cgst = taxAmount / 2; newItems[index].sgst = taxAmount / 2; newItems[index].igst = 0;
    }
    newItems[index].totalAmount = baseAmount + taxAmount;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { catalogItemId: '', name: '', hsnCode: '', quantity: 1, unit: 'pcs', rate: 0, discount: 0, taxRate: 18, cgst: 0, sgst: 0, igst: 0, totalAmount: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSummary = () => {
    let subTotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    items.forEach(item => {
      subTotal += ((item.quantity * item.rate) - item.discount);
      totalCGST += item.cgst; totalSGST += item.sgst; totalIGST += item.igst;
    });
    let extraAmount = 0;
    if (formData.extraDetails?.isApplied) {
      const val = Number(formData.extraDetails.value) || 0;
      extraAmount = formData.extraDetails.rateType === 'percentage' ? (subTotal * val) / 100 : val;
    }
    const grandTotal = subTotal + totalCGST + totalSGST + totalIGST + extraAmount;
    let tdsAmount = 0;
    if (formData.tdsDetails?.isTDSDeducted) {
      const val = Number(formData.tdsDetails.value) || 0;
      tdsAmount = formData.tdsDetails.rateType === 'percentage' ? (subTotal * val) / 100 : val;
    }
    return { subTotal, totalCGST, totalSGST, totalIGST, grandTotal, tdsAmount, netPayable: grandTotal - tdsAmount, extraAmount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const summary = calculateSummary();
    const payload = {
      ...formData, shopId,
      items: items.map(i => ({ ...i, gstPercentage: i.taxRate })),
      tdsDetails: { ...formData.tdsDetails, amount: summary.tdsAmount },
      extraDetails: { ...formData.extraDetails, amount: summary.extraAmount },
      summary: { taxableValue: summary.subTotal, cgstTotal: summary.totalCGST, sgstTotal: summary.totalSGST, igstTotal: summary.totalIGST, grandTotal: summary.grandTotal },
      amountDue: summary.netPayable,
      purchaseOrderId: location.state?.purchaseOrderId || null
    };
    try {
      await createInvoice(payload);
      toast.success('GST Invoice created successfully!');
      history.push('/accounting');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create GST Invoice');
    }
  };

  const summary = calculateSummary();

  return (
    <>
      <style>{invoiceStyles}</style>

      {/* Page Header */}
      <div className="qsr-page-title-container">
        <h1 className="qsr-page-title">Create GST Invoice</h1>
        <BreadcrumbList items={breadcrumbs} />
      </div>

      <Form onSubmit={handleSubmit}>

        {/* Section 1: Customer Details */}
        <Card className="inv-section-card">
          <Card.Body className="p-4">
            <div className="inv-section-title">
              <CsLineIcons icon="user" size="15" /> Customer &amp; Shipping Details
            </div>
            <Row className="g-3">
              <Col xs={12} md={6}>
                <div className="inv-field">
                  <Form.Label>Customer Name *</Form.Label>
                  <Form.Control type="text" name="name" value={formData.customerDetails.name} onChange={handleCustomerChange} required placeholder="Full name or company" />
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="inv-field">
                  <Form.Label>GSTIN</Form.Label>
                  <Form.Control type="text" name="gstin" value={formData.customerDetails.gstin} onChange={handleCustomerChange} placeholder="15-digit GST number" />
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div className="inv-field">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control type="text" name="phone" value={formData.customerDetails.phone} onChange={handleCustomerChange} placeholder="Mobile number" />
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div className="inv-field">
                  <Form.Label>State *</Form.Label>
                  <Form.Control type="text" name="state" value={formData.customerDetails.state} onChange={handleCustomerChange} required />
                </div>
              </Col>
              <Col xs={12} md={4}>
                <div className="inv-field">
                  <Form.Label>Place of Supply</Form.Label>
                  <Form.Control type="text" name="placeOfSupply" value={formData.placeOfSupply} onChange={(e) => setFormData({ ...formData, placeOfSupply: e.target.value })} />
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="inv-field">
                  <Form.Label>Billing Address</Form.Label>
                  <Form.Control type="text" name="billingAddress" value={formData.customerDetails.billingAddress} onChange={handleCustomerChange} placeholder="Street, City, PIN" />
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="inv-field">
                  <Form.Label>Shipping Address</Form.Label>
                  <Form.Control type="text" name="shippingAddress" value={formData.customerDetails.shippingAddress} onChange={handleCustomerChange} placeholder="Same as billing or different" />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Section 2: Line Items */}
        <Card className="inv-section-card">
          <Card.Body className="p-4">
            <div className="inv-section-title">
              <CsLineIcons icon="box" size="15" /> Line Items
            </div>

            {items.map((item, index) => (
              <div className="inv-line-card" key={index}>
                {/* Card Header Row */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="inv-line-num">{index + 1}</div>
                  <div className="flex-grow-1 inv-field mb-0">
                    <CreatableSelect
                      isClearable
                      options={catalogItems.map(ci => ({ value: ci.name, label: ci.name }))}
                      value={item.name ? { label: item.name, value: item.name } : null}
                      onChange={(selected) => handleItemSelect(index, selected)}
                      placeholder="Select or type item name..."
                      classNamePrefix="react-select"
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                  {items.length > 1 && (
                    <button type="button" className="inv-remove-btn" onClick={() => removeItem(index)}>×</button>
                  )}
                </div>

                <Row className="g-2">
                  <Col xs={6} sm={4} md={3}>
                    <div className="inv-field">
                      <Form.Label>HSN Code</Form.Label>
                      <Form.Control type="text" value={item.hsnCode} onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)} placeholder="HSN" />
                    </div>
                  </Col>
                  <Col xs={6} sm={4} md={2}>
                    <div className="inv-field">
                      <Form.Label>Quantity *</Form.Label>
                      <Form.Control type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required />
                    </div>
                  </Col>
                  <Col xs={6} sm={4} md={2}>
                    <div className="inv-field">
                      <Form.Label>Rate (₹) *</Form.Label>
                      <Form.Control type="number" min="0" step="any" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} required />
                    </div>
                  </Col>
                  <Col xs={6} sm={4} md={2}>
                    <div className="inv-field">
                      <Form.Label>Discount (₹)</Form.Label>
                      <Form.Control type="number" min="0" step="any" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', e.target.value)} />
                    </div>
                  </Col>
                  <Col xs={6} sm={4} md={3}>
                    <div className="inv-field">
                      <Form.Label>GST Rate</Form.Label>
                      <Form.Select value={item.taxRate} onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}>
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </Form.Select>
                    </div>
                  </Col>
                </Row>

                {/* Line Total */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="d-flex gap-2 flex-wrap">
                    {item.cgst > 0 && <Badge bg="light" text="dark" className="border" style={{ fontSize: '0.7rem' }}>CGST ₹{item.cgst.toFixed(2)}</Badge>}
                    {item.sgst > 0 && <Badge bg="light" text="dark" className="border" style={{ fontSize: '0.7rem' }}>SGST ₹{item.sgst.toFixed(2)}</Badge>}
                    {item.igst > 0 && <Badge bg="light" text="dark" className="border" style={{ fontSize: '0.7rem' }}>IGST ₹{item.igst.toFixed(2)}</Badge>}
                  </div>
                  <div className="inv-item-total">₹{item.totalAmount.toFixed(2)}</div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline-primary" onClick={addItem} className="rounded-pill px-4 mt-2" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              <CsLineIcons icon="plus" size="14" className="me-1" /> Add Line Item
            </Button>
          </Card.Body>
        </Card>

        {/* Section 3: TDS & Extra Details */}
        <Card className="inv-section-card">
          <Card.Body className="p-4">
            <div className="inv-section-title">
              <CsLineIcons icon="file-text" size="15" /> TDS &amp; Extra Adjustments
            </div>
            <Row className="g-4">
              {/* TDS */}
              <Col xs={12} md={6}>
                <Form.Check
                  type="checkbox"
                  id="isTDSDeducted"
                  label="Apply TDS Deduction"
                  checked={formData.tdsDetails.isTDSDeducted}
                  onChange={(e) => setFormData(prev => ({ ...prev, tdsDetails: { ...prev.tdsDetails, isTDSDeducted: e.target.checked } }))}
                  className="inv-check-label mb-3"
                />
                {formData.tdsDetails.isTDSDeducted && (
                  <div className="p-3 rounded-3" style={{ background: '#f8faff', border: '1.5px solid #e5e7eb' }}>
                    <Row className="g-2">
                      <Col xs={12} sm={6}>
                        <div className="inv-field">
                          <Form.Label>TDS Name / Section</Form.Label>
                          <Form.Control type="text" placeholder="e.g. TDS Sec 194C" value={formData.tdsDetails.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, tdsDetails: { ...prev.tdsDetails, name: e.target.value } }))} />
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div className="inv-field">
                          <Form.Label>Description</Form.Label>
                          <Form.Control type="text" placeholder="e.g. Contractor payment" value={formData.tdsDetails.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, tdsDetails: { ...prev.tdsDetails, description: e.target.value } }))} />
                        </div>
                      </Col>
                      <Col xs={7}>
                        <div className="inv-field">
                          <Form.Label>Value</Form.Label>
                          <Form.Control type="number" min="0" step="any" value={formData.tdsDetails.value || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, tdsDetails: { ...prev.tdsDetails, value: Number(e.target.value) || 0 } }))} />
                        </div>
                      </Col>
                      <Col xs={5}>
                        <div className="inv-field">
                          <Form.Label>Rate Type</Form.Label>
                          <Form.Select value={formData.tdsDetails.rateType}
                            onChange={(e) => setFormData(prev => ({ ...prev, tdsDetails: { ...prev.tdsDetails, rateType: e.target.value } }))}>
                            <option value="percentage">% Percent</option>
                            <option value="amount">₹ Flat</option>
                          </Form.Select>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}
              </Col>

              {/* Extra Adjustments */}
              <Col xs={12} md={6}>
                <Form.Check
                  type="checkbox"
                  id="isExtraApplied"
                  label="Apply Extra Charges / Adjustments"
                  checked={formData.extraDetails.isApplied}
                  onChange={(e) => setFormData(prev => ({ ...prev, extraDetails: { ...prev.extraDetails, isApplied: e.target.checked } }))}
                  className="inv-check-label mb-3"
                />
                {formData.extraDetails.isApplied && (
                  <div className="p-3 rounded-3" style={{ background: '#f8faff', border: '1.5px solid #e5e7eb' }}>
                    <Row className="g-2">
                      <Col xs={12}>
                        <div className="inv-field">
                          <Form.Label>Charge Name</Form.Label>
                          <Form.Control type="text" placeholder="e.g. Packing Charges" value={formData.extraDetails.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, extraDetails: { ...prev.extraDetails, name: e.target.value } }))} />
                        </div>
                      </Col>
                      <Col xs={7}>
                        <div className="inv-field">
                          <Form.Label>Value</Form.Label>
                          <Form.Control type="number" step="any" value={formData.extraDetails.value || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, extraDetails: { ...prev.extraDetails, value: Number(e.target.value) || 0 } }))} />
                        </div>
                      </Col>
                      <Col xs={5}>
                        <div className="inv-field">
                          <Form.Label>Type</Form.Label>
                          <Form.Select value={formData.extraDetails.rateType}
                            onChange={(e) => setFormData(prev => ({ ...prev, extraDetails: { ...prev.extraDetails, rateType: e.target.value } }))}>
                            <option value="amount">₹ Flat</option>
                            <option value="percentage">% Percent</option>
                          </Form.Select>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Section 4: Invoice Summary */}
        <Card className="inv-section-card">
          <Card.Body className="p-4">
            <div className="inv-section-title">
              <CsLineIcons icon="dollar" size="15" /> Invoice Summary
            </div>
            <Row className="justify-content-end">
              <Col xs={12} md={6} lg={5}>
                <div className="inv-summary-row">
                  <span className="inv-summary-label">Subtotal (Taxable)</span>
                  <span className="inv-summary-val">₹{summary.subTotal.toFixed(2)}</span>
                </div>
                {summary.totalCGST > 0 && (
                  <div className="inv-summary-row">
                    <span className="inv-summary-label">Total CGST</span>
                    <span className="inv-summary-val">₹{summary.totalCGST.toFixed(2)}</span>
                  </div>
                )}
                {summary.totalSGST > 0 && (
                  <div className="inv-summary-row">
                    <span className="inv-summary-label">Total SGST</span>
                    <span className="inv-summary-val">₹{summary.totalSGST.toFixed(2)}</span>
                  </div>
                )}
                {summary.totalIGST > 0 && (
                  <div className="inv-summary-row">
                    <span className="inv-summary-label">Total IGST</span>
                    <span className="inv-summary-val">₹{summary.totalIGST.toFixed(2)}</span>
                  </div>
                )}
                {formData.extraDetails.isApplied && (
                  <div className="inv-summary-row">
                    <span className="inv-summary-label">{formData.extraDetails.name || 'Adjustment'}</span>
                    <span className="inv-summary-val">₹{summary.extraAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="inv-summary-row" style={{ fontWeight: 700 }}>
                  <span className="inv-summary-label" style={{ color: '#334155', fontWeight: 700 }}>Grand Total</span>
                  <span className="inv-summary-val">₹{summary.grandTotal.toFixed(2)}</span>
                </div>
                {formData.tdsDetails.isTDSDeducted && (
                  <div className="inv-tds-tag">
                    <span>TDS Deduction ({formData.tdsDetails.rateType === 'percentage' ? `${formData.tdsDetails.value}%` : 'Flat'})</span>
                    <span>-₹{summary.tdsAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="inv-grand-row">
                  <span>Net Payable</span>
                  <span>₹{Math.round(summary.netPayable).toFixed(2)}</span>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Footer Buttons */}
        <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mb-5">
          <Button type="button" variant="outline-secondary" onClick={() => history.push('/accounting')} className="rounded-pill px-4" style={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="rounded-pill px-5" style={{ fontWeight: 700 }}>
            <CsLineIcons icon="save" size="14" className="me-1" /> Save Invoice
          </Button>
        </div>
      </Form>
    </>
  );
};

export default CreateInvoice;
