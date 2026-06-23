import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';

export default function ESSExpensePanel() {
  const title = 'Submit Expense Claim';
  const description = 'Upload your receipts for reimbursement';

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ category: '', amount: '', date: '', notes: '' });
  const [expenseCategories, setExpenseCategories] = useState(['Travel', 'Food & Dining', 'Office Supplies', 'Other']);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Expense claim submitted successfully!');
      setForm({ category: '', amount: '', date: '', notes: '' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container-fluid px-lg-4 px-xl-5 pb-5 pt-4">
      <HtmlHead title={title} description={description} />
      
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '1.5rem' }}>
            <Card.Body className="p-4 p-md-5">
              <h3 className="fw-bold mb-4">Submit Expense Claim</h3>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Expense Category</Form.Label>
                  <CreatableSelect
                    isClearable
                    options={expenseCategories.map(cat => ({ label: cat, value: cat }))}
                    value={form.category ? { label: form.category, value: form.category } : null}
                    onChange={(selected) => setForm({...form, category: selected ? selected.value : ''})}
                    onCreateOption={(inputValue) => {
                      setExpenseCategories((prev) => [...prev, inputValue]);
                      setForm({...form, category: inputValue});
                    }}
                    placeholder="Select or type category..."
                  />
                </Form.Group>
                
                <Row className="g-3 mb-3">
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label>Amount (₹)</Form.Label>
                      <Form.Control type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label>Date of Expense</Form.Label>
                      <Form.Control type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Upload Receipt Image</Form.Label>
                  <Form.Control type="file" accept="image/*" />
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100 rounded-pill py-2 fw-bold" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : 'Submit Claim'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
