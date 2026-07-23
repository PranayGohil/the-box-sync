import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table } from 'react-bootstrap';
import axios from 'axios';
import { useHistory, useLocation } from 'react-router-dom';

const CreateQuotation = () => {
  const history = useHistory();
  const location = useLocation();
  const shopId = localStorage.getItem('shopId');

  const [formData, setFormData] = useState({
    quotationNumber: `QT-${Date.now()}`,
    customerDetails: { name: '', gstin: '', address: '', state: '', phone: '', email: '' },
    notes: '',
    validUntil: ''
  });

  const [items, setItems] = useState([
    { name: '', hsnCode: '', quantity: 1, unitPrice: 0, taxRate: 18, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalAmount: 0 }
  ]);

  useEffect(() => {
    if (location.state?.items && location.state.items.length > 0) {
      const mappedItems = location.state.items.map(item => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.item_price || item.price) || 0;
        const taxRate = 18;
        const baseAmount = qty * price;
        const taxAmount = (baseAmount * taxRate) / 100;
        return {
          name: item.item_name || item.name || '',
          hsnCode: item.hsn_code || '',
          quantity: qty,
          unitPrice: price,
          taxRate,
          cgstAmount: taxAmount / 2,
          sgstAmount: taxAmount / 2,
          igstAmount: 0,
          totalAmount: baseAmount + taxAmount
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
          address: location.state.customer.address || '',
          gstin: location.state.customer.gst_no || ''
        }
      }));
    }
  }, [location.state]);

  const handleCustomerChange = (e) => {
    setFormData({ ...formData, customerDetails: { ...formData.customerDetails, [e.target.name]: e.target.value } });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Recalculate totals
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
    setItems([...items, { name: '', hsnCode: '', quantity: 1, unitPrice: 0, taxRate: 18, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalAmount: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
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
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/accounting/quotations', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Quotation created successfully!');
      history.push('/accounting');
    } catch (error) {
      console.error('Error creating quotation:', error);
      alert('Failed to create quotation.');
    }
  };

  return (
    <>
      <div className="page-title-container mb-3">
        <h1 className="mb-2 pb-0 display-4">Create Quotation</h1>
      </div>

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Body>
            <h2 className="small-title">Customer Details</h2>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label>Customer Name</Form.Label>
                <Form.Control type="text" name="name" value={formData.customerDetails.name} onChange={handleCustomerChange} required />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>State</Form.Label>
                <Form.Control type="text" name="state" value={formData.customerDetails.state} onChange={handleCustomerChange} required />
              </Col>
              <Col md={12} className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control type="text" name="address" value={formData.customerDetails.address} onChange={handleCustomerChange} />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Body>
            <h2 className="small-title">Line Items</h2>
            <Table responsive>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Tax Rate (%)</th>
                  <th>Total (Incl. Tax)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td><Form.Control type="text" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} required /></td>
                    <td><Form.Control type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required /></td>
                    <td><Form.Control type="number" min="0" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} required /></td>
                    <td><Form.Control type="number" value={item.taxRate} onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)} /></td>
                    <td>{item.totalAmount.toFixed(2)}</td>
                    <td><Button variant="danger" size="sm" onClick={() => removeItem(index)}>Remove</Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Button variant="outline-primary" onClick={addItem}>Add Item</Button>
          </Card.Body>
        </Card>

        <Button variant="primary" type="submit" className="mb-5">Save Quotation</Button>
      </Form>
    </>
  );
};

export default CreateQuotation;
