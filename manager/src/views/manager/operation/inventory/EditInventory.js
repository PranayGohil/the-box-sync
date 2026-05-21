// Manager Side Inventory for Edit Request
import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
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
    border-radius: 1.5rem !important;
    border: 1px solid rgba(0,0,0,0.05) !important;
    box-shadow: 0 10px 40px rgba(0,0,0,0.02) !important;
    overflow: hidden;
  }
  @media (min-width: 992px) {
    .page-card {
      border-radius: 2rem !important;
    }
  }
  .section-label {
    font-size: 0.75rem;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .modern-input {
    border-radius: 20px !important;
    padding: 0.375rem 0.85rem !important;
    border: 1.5px solid #f1f5f9 !important;
    font-weight: 600 !important;
    color: #334155 !important;
    transition: all 0.3s ease !important;
    background: #fcfdfe !important;
    height: 38px !important;
    font-size: 0.875rem !important;
  }
  .modern-input:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35,179,244,0.1) !important;
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
    margin-bottom: 0.35rem;
    padding-left: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .item-header-row {
    display: flex;
    padding: 0 0.5rem;
    margin-bottom: 0.75rem;
    color: #94a3b8;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .item-row-card {
    background: #ffffff !important;
    border-radius: 1rem !important;
    border: 1px solid #f1f5f9 !important;
    padding: 0.875rem !important;
    margin-bottom: 0.875rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02) !important;
    transition: all 0.25s ease;
  }
  @media (min-width: 992px) {
    .item-row-card {
      border-radius: 1.25rem !important;
      padding: 1.125rem 1.375rem !important;
    }
  }
  .item-row-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.05) !important;
    border-color: rgba(35,179,244,0.2) !important;
  }
  .remove-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff1f2;
    color: #f43f5e;
    border: 1.5px solid #ffe4e6;
    transition: all 0.2s ease;
    cursor: pointer;
    flex-shrink: 0;
  }
  .remove-btn:hover:not(:disabled) {
    background: #f43f5e;
    color: #ffffff;
    border-color: #f43f5e;
  }
  .remove-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #f1f5f9;
    border-color: #e2e8f0;
    color: #94a3b8;
  }
  .select-modern .react-select__control {
    border-radius: 20px !important;
    border: 1.5px solid #f1f5f9 !important;
    min-height: 38px !important;
    max-height: 38px !important;
    background: #fcfdfe !important;
    font-weight: 600 !important;
    font-size: 0.875rem !important;
  }
  .select-modern .react-select__value-container {
    padding: 0 0.75rem !important;
  }
  .select-modern .react-select__indicators {
    height: 38px !important;
  }
  .select-modern .react-select__control--is-focused {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35,179,244,0.1) !important;
    background: #ffffff !important;
  }
  .delete-col {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-top: 0.35rem;
  }
  @media (max-width: 991.98px) {
    .delete-col {
      justify-content: flex-end;
      padding-top: 0;
      margin-top: 0.25rem;
    }
  }
`;

function EditInventory() {
  const { id } = useParams();
  const history = useHistory();
  const [itemOptions, setItemOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const title = 'Edit Inventory';
  const description = 'Edit inventory items.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: `operations/edit-inventory/${id}`, title: 'Edit Inventory' },
  ];

  const formik = useFormik({
    initialValues: {
      items: [{ item_name: '', unit: '', item_quantity: '' }],
      status: 'Requested',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setIsSubmitting(true);
      try {
        await axios.put(`${process.env.REACT_APP_API}/inventory/update/${id}`, values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        toast.success('Inventory request updated successfully!');
        history.push('/operations/requested-inventory');
      } catch (err) {
        console.error('Error updating inventory:', err);
        toast.error(err.response?.data?.message || 'Failed to update inventory request.');
      } finally {
        setIsSubmitting(false);
        setSubmitting(false);
      }
    },
  });

  const { values, handleSubmit, setFieldValue, errors, touched } = formik;

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

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        setError('');
        const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        setFieldValue('items', res.data.items);
        setFieldValue('status', res.data.status);
      } catch (err) {
        console.error('Failed to load inventory:', err);
        setError('Failed to load inventory details. Please try again.');
        toast.error('Failed to load inventory details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, [id, setFieldValue]);

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

  if (isLoading) {
    return (
      <div className="inventory-container">
        <style>{customStyles}</style>
        <HtmlHead title={title} description={description} />
        <div className="container-fluid px-3 px-lg-5">
          <div className="page-title-container mb-4 mt-n3">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </div>
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
            <h5>Loading...</h5>
            <p className="text-muted">Please wait while we fetch inventory information</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-container">
        <style>{customStyles}</style>
        <HtmlHead title={title} description={description} />
        <div className="container-fluid px-3 px-lg-5">
          <div className="page-title-container mb-4 mt-n3">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </div>
          <Alert variant="danger" className="my-4">
            <CsLineIcons icon="error" className="me-2" />
            {error}
            <div className="mt-3">
              <Button variant="outline-primary" onClick={() => history.push('/operations/requested-inventory')}>
                <CsLineIcons icon="arrow-left" className="me-2" />
                Back to Inventory List
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid px-3 px-lg-5">
        <div className="page-title-container mb-4 mt-n3">
          <Row className="g-3 align-items-center">
            <Col xs="12" md="7">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2 mt-1 mt-md-0">
              <Button
                variant="outline-primary"
                className="rounded-pill px-4 fw-bold border-2"
                onClick={() => history.push('/operations/inventory-history')}
              >
                <CsLineIcons icon="arrow-left" size="16" className="me-2" /> Back to History
              </Button>
            </Col>
          </Row>
        </div>

        <Form onSubmit={handleSubmit}>
          <Card className="page-card border-0">
            <Card.Body className="p-3 p-lg-5">
              <div className="section-label">
                <CsLineIcons icon="shopping-basket" size="18" /> Edit Item List
              </div>

              {values.items.map((item, index) => {
                const itemErrors = errors.items?.[index] || {};
                const itemTouched = touched.items?.[index] || {};

                return (
                  <div key={index} className="item-row-card">
                    <Row className="g-2 align-items-end">
                      {/* Item Name — full width on mobile, 4/12 on desktop */}
                      <Col xs={12} lg={4}>
                        <div className="input-group-label">Item Name</div>
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
                        {itemTouched.item_name && itemErrors.item_name && (
                          <div className="text-danger small mt-1 ps-1 fw-bold">{itemErrors.item_name}</div>
                        )}
                      </Col>

                      {/* Quantity — 5/12 on mobile, 3/12 on desktop */}
                      <Col xs={5} lg={3}>
                        <div className="input-group-label">Quantity</div>
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
                        {itemTouched.item_quantity && itemErrors.item_quantity && (
                          <div className="text-danger small mt-1 ps-1 fw-bold">{itemErrors.item_quantity}</div>
                        )}
                      </Col>

                      {/* Unit — 5/12 on mobile, 3/12 on desktop */}
                      <Col xs={5} lg={3}>
                        <div className="input-group-label">Unit</div>
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
                        {itemTouched.unit && itemErrors.unit && (
                          <div className="text-danger small mt-1 ps-1 fw-bold">{itemErrors.unit}</div>
                        )}
                      </Col>

                      {/* Delete: 2/12 on mobile (inline with Qty+Unit), auto on desktop */}
                      <Col xs={2} lg="auto" className="delete-col">
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeItem(index)}
                          disabled={isSubmitting || values.items.length === 1}
                        >
                          <CsLineIcons icon="bin" size="16" />
                        </button>
                      </Col>
                    </Row>
                  </div>
                );
              })}

              <div className="mt-3 mb-4">
                <Button variant="outline-primary" className="rounded-pill px-4 fw-bold border-2" onClick={addItem} disabled={isSubmitting}>
                  <CsLineIcons icon="plus" size="16" className="me-2" /> Add Another Item
                </Button>
              </div>

              <div className="pt-4 border-top">
                <Button
                  type="submit"
                  variant="outline-primary"
                  className="rounded-pill px-4 fw-bold border-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Spinner animation="border" size="sm" className="me-2" />
                  ) : (
                    <CsLineIcons icon="save" className="me-2" />
                  )}
                  {isSubmitting ? 'Updating Request...' : 'Update Inventory Request'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Form>
      </div>
    </div>
  );
}

export default EditInventory;
