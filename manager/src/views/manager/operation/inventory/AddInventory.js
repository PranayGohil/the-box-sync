// Manager Side Inventory for Add Request
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import * as Yup from 'yup';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import axios from 'axios';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';

const validationSchema = Yup.object({
  items: Yup.array()
    .of(
      Yup.object().shape({
        item_name: Yup.string().required('Item Name is required'),
        unit: Yup.string().required('Unit is required'),
        item_quantity: Yup.number().typeError('Quantity must be a number').required('Item Quantity is required').positive('Quantity must be greater than 0'),
      })
    )
    .min(1, 'At least one item is required'),
  status: Yup.string().required('Status is required'),
});

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
    .modern-input:disabled {
      background: #f1f5f9 !important;
      color: #94a3b8 !important;
      border-color: #e2e8f0 !important;
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
    .add-btn-premium {
      background: #ffffff !important;
      border: 2px dashed #23b3f4 !important;
      color: #23b3f4 !important;
      border-radius: 12px !important;
      width: 100%;
      padding: 1rem !important;
      font-weight: 700 !important;
      transition: all 0.3s ease !important;
    }
    .add-btn-premium:hover {
      background: rgba(35, 179, 244, 0.05) !important;
      border-style: solid !important;
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
    .remove-btn:hover:not(:disabled) {
      background: #f43f5e;
      color: #ffffff;
    }
    .remove-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
`;

function AddInventory() {
  const title = 'Add Inventory';
  const description = 'Add new inventory items.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/add-inventory', title: 'Add Inventory' },
  ];

  const history = useHistory();
  const [itemOptions, setItemOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      items: [{ item_name: '', unit: '', item_quantity: '' }],
      status: 'Requested',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setIsSubmitting(true);
      try {
        await axios.post(`${process.env.REACT_APP_API}/inventory/add-request`, values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        toast.success('Inventory request added successfully!');
        history.push('/operations/requested-inventory');
      } catch (err) {
        console.error('Error adding inventory:', err);
        toast.error(err.response?.data?.message || 'Failed to add inventory request.');
      } finally {
        setIsSubmitting(false);
        setSubmitting(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  useEffect(() => {
    const fetchItemSuggestions = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API}/inventory/get-suggestions?types=item`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        setItemOptions((data.items || []).map((i) => ({ label: i, value: i })));
      } catch (err) {
        console.error('Failed to load item suggestions', err);
        toast.error('Failed to fetch item suggestions.');
      }
    };

    fetchItemSuggestions();
  }, []);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...values.items];
    updatedItems[index][field] = value;
    setFieldValue('items', updatedItems);
  };

  const addItem = () => {
    setFieldValue('items', [...values.items, { item_name: '', unit: '', item_quantity: '' }]);
  };

  const removeItem = (index) => {
    const filtered = values.items.filter((_, i) => i !== index);
    setFieldValue('items', filtered);
  };

  return (
      <div className="inventory-container">
        <style>{customStyles}</style>
        <HtmlHead title={title} description={description} />
        <div className="container-fluid px-lg-5">
          <div className="page-title-container mb-4 mt-n3">
            <Row className="g-3 align-items-center">
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
                <Button variant="outline-primary" className="rounded-pill px-4 fw-bold border-2" onClick={() => history.push('/operations/inventory-history')}>
                  <CsLineIcons icon="arrow-left" size="16" className="me-2" /> Back to History
                </Button>
              </Col>
            </Row>
          </div>

          <Form onSubmit={handleSubmit}>
            <Card className="page-card border-0">
              <Card.Body className="p-4 p-lg-5">
                <div className="section-label"><CsLineIcons icon="shopping-basket" size="18" /> Requested Item List</div>
                <div className="item-header-row d-none d-lg-flex">
                  <div style={{ flex: 4 }}>Item Description</div>
                  <div style={{ flex: 2 }}>Quantity</div>
                  <div style={{ flex: 2 }}>Unit</div>
                  <div style={{ width: '60px' }} />
                </div>

                {values.items.map((item, index) => {
                  const itemErrors = errors.items?.[index] || {};
                  const itemTouched = touched.items?.[index] || {};

                  return (
                    <div key={index} className="item-row-card">
                      <Row className="w-100 g-3 align-items-center">
                        <Col xs={12} lg={4}>
                          <div className="input-group-label d-lg-none">Item Name</div>
                          <div className="select-modern">
                            <CreatableSelect
                              isClearable
                              isDisabled={isSubmitting}
                              options={itemOptions}
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              value={item.item_name ? { label: item.item_name, value: item.item_name } : null}
                              onChange={(selected) => handleItemChange(index, 'item_name', selected ? selected.value : '')}
                              placeholder="Select or create item"
                              classNamePrefix="react-select"
                            />
                          </div>
                          {itemTouched.item_name && itemErrors.item_name && <div className="text-danger small mt-1 ps-2 fw-bold">{itemErrors.item_name}</div>}
                        </Col>

                        <Col xs={6} lg={2.5}>
                          <div className="input-group-label d-lg-none">Quantity</div>
                          <Form.Control
                            type="number"
                            className="modern-input"
                            placeholder="Qty"
                            value={item.item_quantity}
                            onChange={(e) => handleItemChange(index, 'item_quantity', e.target.value)}
                            isInvalid={itemTouched.item_quantity && itemErrors.item_quantity}
                            disabled={isSubmitting}
                            min="1"
                            step="0.01"
                          />
                        </Col>

                        <Col xs={6} lg={2.5}>
                          <div className="input-group-label d-lg-none">Unit</div>
                          <Form.Select
                            className="modern-input"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            isInvalid={itemTouched.unit && itemErrors.unit}
                            disabled={isSubmitting}
                          >
                            <option value="">Unit</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="litre">ltr</option>
                            <option value="ml">ml</option>
                            <option value="piece">pc</option>
                          </Form.Select>
                        </Col>

                        <Col xs={12} lg="auto" className="text-end">
                          <button type="button" className="remove-btn ms-auto" onClick={() => removeItem(index)} disabled={isSubmitting || values.items.length === 1}>
                            <CsLineIcons icon="bin" size="16" />
                          </button>
                        </Col>
                      </Row>
                    </div>
                  );
                })}

                <div className="mt-4 mb-5">
                  <Button variant="outline-primary" className="add-btn-premium" onClick={addItem} disabled={isSubmitting}>
                    <CsLineIcons icon="plus" className="me-2" /> Add Another Item
                  </Button>
                </div>

                <div className="text-end pt-4 border-top">
                  <Button type="submit" variant="outline-primary" className="rounded-pill px-5 fw-bold border-2 w-100 w-md-auto" disabled={isSubmitting} style={{ height: '52px' }}>
                    {isSubmitting ? (
                      <Spinner animation="border" size="sm" className="me-2" />
                    ) : (
                      <CsLineIcons icon="send" className="me-2" />
                    )}
                    {isSubmitting ? 'Processing Request...' : 'Submit Inventory Request'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Form>
        </div>
      </div>
  );
}

export default AddInventory;
