import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import CreatableSelect from 'react-select/creatable';
import { createPurchaseOrder } from '../../api/accounting';
import { getCatalogData } from '../../api/orderService';

const breadcrumbs = [
  { to: '', text: 'Home' },
  { to: 'accounting', text: 'Accounting & Billing' },
  { to: 'accounting/create-purchase-order', text: 'Purchase Order' },
];

const styles = `
  .po-section-title {
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
  .po-field label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 5px;
  }
  .po-field .form-control,
  .po-field .form-select {
    border-radius: 10px !important;
    border: 1.5px solid #e5e7eb !important;
    font-size: 0.85rem !important;
    color: #334155 !important;
    padding: 8px 12px !important;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .po-field .form-control:focus,
  .po-field .form-select:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 3px rgba(35,179,244,0.12) !important;
  }
  .po-line-card {
    border: 1.5px solid #e5e7eb;
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 12px;
    background: #fafcff;
    transition: box-shadow 0.15s;
  }
  .po-line-card:hover { box-shadow: 0 4px 16px rgba(35,179,244,0.08); }
  .po-line-num {
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
  .po-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.85rem;
  }
  .po-summary-row:last-child { border-bottom: none; }
  .po-summary-label { color: #64748b; }
  .po-summary-val { font-weight: 700; color: #334155; }
  .po-grand-row {
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
  .po-section-card {
    border: none;
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    margin-bottom: 20px;
  }
  .po-remove-btn {
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
  .po-remove-btn:hover { background: #ef4444; color: #fff; }
  .po-item-total {
    background: linear-gradient(135deg, rgba(35,179,244,0.1), rgba(35,179,244,0.05));
    border-radius: 10px;
    padding: 8px 14px;
    font-size: 1rem;
    font-weight: 800;
    color: #1565c0;
    text-align: right;
  }
  @media (max-width: 575px) {
    .po-section-card .card-body { padding: 16px !important; }
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

const CreatePurchaseOrder = () => {
  const history = useHistory();
  const location = useLocation();
  const shopId = localStorage.getItem('shopId');

  const [formData, setFormData] = useState({
    purchaseOrderNumber: `PO-${Date.now()}`,
    vendorDetails: { name: '', gstin: '', address: '', state: '', phone: '', email: '' },
    expectedDeliveryDate: '',
    notes: '',
    termsAndConditions: 'Please deliver within the expected date.'
  });

  const [items, setItems] = useState([
    { catalogItemId: '', name: '', hsnCode: '', quantity: 1, unitPrice: 0, taxRate: 18, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalAmount: 0, serialNumbers: [] }
  ]);

  const [catalogItems, setCatalogItems] = useState([]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await getCatalogData({}, token);
        const itemsList = [];
        if (res.data?.data) {
          res.data.data.forEach(cat => {
            (cat.items || []).forEach(item => {
              if (item.has_variants && item.variants && item.variants.length > 0) {
                item.variants.forEach(v => {
                  itemsList.push({
                    _id: `${item._id}_${v.size_name}`,
                    name: `${item.item_name} (${v.size_name})`,
                    baseName: `${item.item_name} (${v.size_name})`,
                    price: v.price || item.item_price || 0,
                    unit: item.unit || 'pcs'
                  });
                });
              } else {
                itemsList.push({
                  _id: String(item._id),
                  name: item.item_name,
                  baseName: item.item_name,
                  price: item.item_price || 0,
                  unit: item.unit || 'pcs'
                });
              }
            });
          });
        }
        setCatalogItems(itemsList);
      } catch (error) {
        console.error('Error fetching catalog data:', error);
      }
    };
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (location.state?.items && location.state.items.length > 0) {
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
          catalogItemId: match ? match._id : 'custom',
          name: nameVal,
          hsnCode: item.hsn_code || item.hsnCode || '',
          quantity: qty,
          unitPrice: price,
          taxRate,
          cgstAmount: item.cgstAmount || item.cgst || (taxAmount / 2),
          sgstAmount: item.sgstAmount || item.sgst || (taxAmount / 2),
          igstAmount: item.igstAmount || item.igst || 0,
          totalAmount: item.totalAmount || (baseAmount + taxAmount),
          serialNumbers: item.serialNumbers || []
        };
      });
      setItems(mappedItems);
    }
    if (location.state?.customer) {
      setFormData(prev => ({
        ...prev,
        vendorDetails: {
          ...prev.vendorDetails,
          name: location.state.customer.name || '',
          phone: location.state.customer.phone || '',
          address: location.state.customer.address || '',
          state: location.state.customer.state || '',
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
        newItems[index].unitPrice = match.price;
        const qty = Number(newItems[index].quantity) || 1;
        const price = Number(match.price) || 0;
        const taxRate = Number(newItems[index].taxRate) || 18;
        const baseAmount = qty * price;
        const taxAmount = (baseAmount * taxRate) / 100;
        newItems[index].cgstAmount = taxAmount / 2;
        newItems[index].sgstAmount = taxAmount / 2;
        newItems[index].igstAmount = 0;
        newItems[index].totalAmount = baseAmount + taxAmount;
      } else {
        newItems[index].catalogItemId = 'custom';
      }
    } else {
      newItems[index].catalogItemId = '';
    }
    setItems(newItems);
  };

  const handleVendorChange = (e) => {
    setFormData({ ...formData, vendorDetails: { ...formData.vendorDetails, [e.target.name]: e.target.value } });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    const qty = Number(newItems[index].quantity) || 0;
    const price = Number(newItems[index].unitPrice) || 0;
    const taxRate = Number(newItems[index].taxRate) || 0;
    
    const baseAmount = qty * price;
    const taxAmount = (baseAmount * taxRate) / 100;
    
    newItems[index].cgstAmount = taxAmount / 2;
    newItems[index].sgstAmount = taxAmount / 2;
    newItems[index].igstAmount = 0;
    newItems[index].totalAmount = baseAmount + taxAmount;

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { catalogItemId: '', name: '', hsnCode: '', quantity: 1, unitPrice: 0, taxRate: 18, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalAmount: 0, serialNumbers: [] }]);
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
      subTotal += (item.quantity * item.unitPrice);
      totalCGST += item.cgstAmount;
      totalSGST += item.sgstAmount;
      totalIGST += item.igstAmount;
    });

    const grandTotal = subTotal + totalCGST + totalSGST + totalIGST;
    return { subTotal, totalCGST, totalSGST, totalIGST, grandTotal };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const summary = calculateSummary();
    
    const payload = {
      ...formData,
      shopId,
      items,
      summary
    };

    try {
      await createPurchaseOrder(payload);
      toast.success('Purchase Order created successfully!');
      history.push('/accounting');
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Failed to create purchase order.');
    }
  };

  const summary = calculateSummary();

  return (
    <>
      <style>{styles}</style>

      {/* Page Header */}
      <div className="qsr-page-title-container">
        <h1 className="qsr-page-title">Create Purchase Order</h1>
        <BreadcrumbList items={breadcrumbs} />
      </div>

      <Form onSubmit={handleSubmit}>
        {/* Section 1: Vendor Details */}
        <Card className="po-section-card">
          <Card.Body className="p-4">
            <div className="po-section-title">
              <CsLineIcons icon="user" size="15" /> Vendor / Supplier Details
            </div>
            <Row className="g-3">
              <Col xs={12} md={6}>
                <div className="po-field">
                  <Form.Label>Vendor Name *</Form.Label>
                  <Form.Control type="text" name="name" value={formData.vendorDetails.name} onChange={handleVendorChange} required placeholder="Supplier name or company" />
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="po-field">
                  <Form.Label>GSTIN</Form.Label>
                  <Form.Control type="text" name="gstin" value={formData.vendorDetails.gstin} onChange={handleVendorChange} placeholder="15-digit GST number" />
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div className="po-field">
                  <Form.Label>State *</Form.Label>
                  <Form.Control type="text" name="state" value={formData.vendorDetails.state} onChange={handleVendorChange} required />
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div className="po-field">
                  <Form.Label>Expected Delivery Date</Form.Label>
                  <Form.Control type="date" name="expectedDeliveryDate" value={formData.expectedDeliveryDate} onChange={handleFormChange} />
                </div>
              </Col>
              <Col xs={12} md={4}>
                <div className="po-field">
                  <Form.Label>Address</Form.Label>
                  <Form.Control type="text" name="address" value={formData.vendorDetails.address} onChange={handleVendorChange} placeholder="Supplier address" />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Section 2: Line Items */}
        <Card className="po-section-card">
          <Card.Body className="p-4">
            <div className="po-section-title">
              <CsLineIcons icon="box" size="15" /> Line Items
            </div>

            {items.map((item, index) => (
              <div className="po-line-card" key={index}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="po-line-num">{index + 1}</div>
                  <div className="flex-grow-1 po-field mb-0">
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
                    <button type="button" className="po-remove-btn" onClick={() => removeItem(index)}>×</button>
                  )}
                </div>

                <Row className="g-2">
                  <Col xs={6} sm={4} md={2}>
                    <div className="po-field">
                      <Form.Label>HSN Code</Form.Label>
                      <Form.Control type="text" value={item.hsnCode} onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)} placeholder="HSN" />
                    </div>
                  </Col>
                  <Col xs={6} sm={4} md={2}>
                    <div className="po-field">
                      <Form.Label>Quantity *</Form.Label>
                      <Form.Control type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required />
                    </div>
                  </Col>
                  <Col xs={6} sm={4} md={2}>
                    <div className="po-field">
                      <Form.Label>Unit Price (₹) *</Form.Label>
                      <Form.Control type="number" min="0" step="any" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} required />
                    </div>
                  </Col>
                  <Col xs={6} sm={4} md={2}>
                    <div className="po-field">
                      <Form.Label>Tax Rate (%)</Form.Label>
                      <Form.Select value={item.taxRate} onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}>
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </Form.Select>
                    </div>
                  </Col>
                  <Col xs={12} sm={8} md={4}>
                    <div className="po-field">
                      <Form.Label>Serial / IMEI (Optional)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Comma separated"
                        value={item.serialNumbers ? item.serialNumbers.join(', ') : ''}
                        onChange={(e) => handleItemChange(index, 'serialNumbers', e.target.value.split(',').map(s => s.trim()))}
                      />
                    </div>
                  </Col>
                </Row>

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="d-flex gap-2 flex-wrap">
                    {item.cgstAmount > 0 && <Badge bg="light" text="dark" className="border" style={{ fontSize: '0.7rem' }}>CGST ₹{item.cgstAmount.toFixed(2)}</Badge>}
                    {item.sgstAmount > 0 && <Badge bg="light" text="dark" className="border" style={{ fontSize: '0.7rem' }}>SGST ₹{item.sgstAmount.toFixed(2)}</Badge>}
                  </div>
                  <div className="po-item-total">₹{item.totalAmount.toFixed(2)}</div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline-primary" onClick={addItem} className="rounded-pill px-4 mt-2" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              <CsLineIcons icon="plus" size="14" className="me-1" /> Add Line Item
            </Button>
          </Card.Body>
        </Card>

        {/* Section 3: Summary */}
        <Card className="po-section-card">
          <Card.Body className="p-4">
            <div className="po-section-title">
              <CsLineIcons icon="dollar" size="15" /> Order Summary
            </div>
            <Row className="justify-content-end">
              <Col xs={12} md={6} lg={5}>
                <div className="po-summary-row">
                  <span className="po-summary-label">Subtotal</span>
                  <span className="po-summary-val">₹{summary.subTotal.toFixed(2)}</span>
                </div>
                {summary.totalCGST > 0 && (
                  <div className="po-summary-row">
                    <span className="po-summary-label">Total CGST</span>
                    <span className="po-summary-val">₹{summary.totalCGST.toFixed(2)}</span>
                  </div>
                )}
                {summary.totalSGST > 0 && (
                  <div className="po-summary-row">
                    <span className="po-summary-label">Total SGST</span>
                    <span className="po-summary-val">₹{summary.totalSGST.toFixed(2)}</span>
                  </div>
                )}
                <div className="po-grand-row">
                  <span>Grand Total</span>
                  <span>₹{summary.grandTotal.toFixed(2)}</span>
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
            <CsLineIcons icon="save" size="14" className="me-1" /> Save Purchase Order
          </Button>
        </div>
      </Form>
    </>
  );
};

export default CreatePurchaseOrder;
