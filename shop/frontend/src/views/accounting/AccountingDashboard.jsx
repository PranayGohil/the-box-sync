import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, Button, Table } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const AccountingDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);

  const fetchData = async () => {
    try {
      const shopId = localStorage.getItem('shopId'); 
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const invRes = await axios.get(`http://localhost:5000/api/accounting/invoices?shopId=${shopId}`, config);
      const quotRes = await axios.get(`http://localhost:5000/api/accounting/quotations?shopId=${shopId}`, config);

      
      setInvoices(invRes.data.data);
      setQuotations(quotRes.data.data);
    } catch (error) {
      console.error('Error fetching accounting data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleDownloadPDF = (type, id) => {
    window.open(`http://localhost:5000/api/accounting/${type}/${id}/pdf`, '_blank');
  };

  return (
    <>
      <div className="page-title-container mb-3">
        <Row>
          <Col className="mb-2">
            <h1 className="mb-2 pb-0 display-4">Accounting & Billing</h1>
          </Col>
          <Col xs="12" sm="auto" className="d-flex align-items-center justify-content-end">
            <Button variant="outline-primary" as={NavLink} to="/accounting/create-invoice" className="me-2">
              Create GST Invoice
            </Button>
            <Button variant="primary" as={NavLink} to="/accounting/create-quotation">
              Create Quotation
            </Button>
          </Col>
        </Row>
      </div>

      <Row>
        <Col xl="6">
          <Card className="mb-5">
            <Card.Body>
              <h2 className="small-title">Recent Invoices</h2>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Inv #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td>{inv.invoiceNumber}</td>
                      <td>{inv.customerDetails.name}</td>
                      <td>₹{inv.summary.grandTotal}</td>
                      <td>{inv.paymentStatus}</td>
                      <td>
                        <Button variant="link" size="sm" onClick={() => handleDownloadPDF('invoices', inv._id)}>PDF</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col xl="6">
          <Card className="mb-5">
            <Card.Body>
              <h2 className="small-title">Recent Quotations</h2>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Quote #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q._id}>
                      <td>{q.quotationNumber}</td>
                      <td>{q.customerDetails.name}</td>
                      <td>₹{q.summary.grandTotal}</td>
                      <td>{q.status}</td>
                      <td>
                        <Button variant="link" size="sm" onClick={() => handleDownloadPDF('quotations', q._id)}>PDF</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AccountingDashboard;
