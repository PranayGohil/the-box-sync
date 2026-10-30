/* eslint-disable react/no-this-in-sfc, func-names, no-unused-vars */
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Col, Row, Button, Form as BForm, Spinner } from 'react-bootstrap';
import { Formik, Form, FieldArray, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
  .pill-input {
    border-radius: 10px !important;
    padding: 0.45rem 1rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
    font-size: 0.88rem !important;
    font-weight: 600 !important;
    color: #334155 !important;
  }
  input.pill-input {
    height: 38px !important;
  }
  textarea.pill-input {
    min-height: 50px !important;
    height: auto !important;
  }
  .pill-input:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
    outline: none !important;
  }
  .glass-card {
    background: #fff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.25rem !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
    transition: all 0.3s ease;
  }
  @media (max-width: 575px) {
    .container-fluid {
      padding-left: 8px !important;
      padding-right: 8px !important;
    }
    .glass-card {
      border-radius: 12px !important;
    }
    .glass-card .card-body {
      padding: 12px !important;
    }
  }
  .custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.2) !important;
  }
  .custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .add-more-btn {
    border: 2px dashed #38bdf8 !important;
    background: #f0f9ff !important;
    color: #0284c7 !important;
    border-radius: 14px !important;
    font-weight: 700 !important;
    font-size: 0.95rem !important;
    padding: 0.75rem 1.5rem !important;
    transition: all 0.2s ease;
  }
  .add-more-btn:hover {
    background: #e0f2fe !important;
    border-color: #0284c7 !important;
    color: #0369a1 !important;
    transform: translateY(-2px);
  }
  .item-card-box {
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    transition: box-shadow 0.2s ease;
  }
  .item-card-box:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }
`;

const createEmptyItem = () => ({
  item_name: '',
  price: '',
  description: '',
  stock_quantity: '',
  item_img: null,
});

const AddItems = () => {
  const title = 'Add Items';
  const description = 'Quickly add products and stock to your shop catalog';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/add-item', title: 'Add Items' },
  ];

  const history = useHistory();
  const [imagePreviews, setImagePreviews] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState('close'); // 'close' or 'add_another'

  const initialValues = {
    items: [createEmptyItem()],
  };

  const validationSchema = Yup.object().shape({
    items: Yup.array()
      .of(
        Yup.object().shape({
          item_name: Yup.string().trim().required('Item name is required'),
          price: Yup.number()
            .typeError('Price must be a valid number')
            .min(0, 'Price cannot be negative')
            .required('Price is required'),
          description: Yup.string(),
          stock_quantity: Yup.number()
            .typeError('Stock quantity must be a number')
            .min(0, 'Stock quantity cannot be negative')
            .nullable(),
        })
      )
      .min(1, 'Please add at least one item'),
  });

  const handleImageChange = (e, index, setFieldValue) => {
    const file = e.currentTarget.files && e.currentTarget.files[0];
    if (file) {
      setFieldValue(`items[${index}].item_img`, file);
      setImagePreviews((prev) => ({ ...prev, [index]: URL.createObjectURL(file) }));
    }
  };

  const removeImage = (index, setFieldValue) => {
    setFieldValue(`items[${index}].item_img`, null);
    setImagePreviews((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', 'General');
      formData.append('counter', '');
      formData.append('hide_on_kot', 'false');

      const dishData = values.items.map((item, index) => {
        if (item.item_img) {
          formData.append(`item_img_${index}`, item.item_img);
        }

        const numPrice = Number(item.price) || 0;
        const numStock =
          item.stock_quantity !== '' && item.stock_quantity != null ? Number(item.stock_quantity) : null;

        return {
          item_name: item.item_name.trim(),
          item_price: numPrice,
          price: numPrice,
          description: item.description ? item.description.trim() : '',
          stock_quantity: numStock,
          initial_stock: numStock != null ? numStock : 0,
          type: 'veg',
          barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
          variants: [
            {
              size_name: 'Regular',
              price: numPrice,
              extra: '',
              barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
              is_available: true,
              stock_quantity: numStock,
              initial_stock: numStock != null ? numStock : 0,
            },
          ],
          item_img: '',
        };
      });

      formData.append('items', JSON.stringify(dishData));
      const apiBase = process.env.REACT_APP_API || 'http://localhost:5003/api';

      const res = await axios.post(`${apiBase}/catalog/add`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      toast.success(res.data?.message || 'Item(s) added successfully!');
      resetForm({ values: { items: [createEmptyItem()] } });
      setImagePreviews({});

      if (submitAction === 'close') {
        history.push('/operations/manage-items');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      let errorMsg = error.response?.data?.message || 'Failed to save items.';
      if (typeof errorMsg === 'object') {
        errorMsg = Object.values(errorMsg).join(', ') || JSON.stringify(errorMsg);
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid qsr-page-container">
        <div className="qsr-page-title-container text-start mb-4">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto text-start">
              <h1 className="qsr-page-title mb-1">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, handleChange, setFieldValue, errors }) => (
            <Form>
              <Card className="glass-card mb-4 border-0">
                <Card.Body className="p-3 p-sm-4">
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <div className="d-flex flex-column gap-3">
                        {values.items.map((item, index) => (
                          <div key={index} className="item-card-box p-3 p-md-4">
                            {/* Card Header: Item count & remove button */}
                            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  className="badge rounded-pill px-3 py-2"
                                  style={{
                                    backgroundColor: 'rgba(35, 179, 244, 0.12)',
                                    color: '#0284c7',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  Item #{index + 1}
                                </span>
                              </div>
                              {values.items.length > 1 && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="btn-icon btn-icon-only rounded-circle border-0 d-flex align-items-center justify-content-center"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => {
                                    remove(index);
                                    setImagePreviews((prev) => {
                                      const updated = { ...prev };
                                      delete updated[index];
                                      return updated;
                                    });
                                  }}
                                  title="Remove this item"
                                >
                                  <CsLineIcons icon="bin" size="14" />
                                </Button>
                              )}
                            </div>

                            <Row className="g-3">
                              {/* 1. Item Name */}
                              <Col xs={12} md={6}>
                                <BForm.Group>
                                  <BForm.Label
                                    className="fw-bold text-muted text-uppercase mb-1"
                                    style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}
                                  >
                                    Item Name <span className="text-danger">*</span>
                                  </BForm.Label>
                                  <Field
                                    type="text"
                                    name={`items[${index}].item_name`}
                                    className="form-control pill-input"
                                    placeholder="e.g. Wireless Mouse, Cotton Shirt"
                                  />
                                  <ErrorMessage
                                    name={`items[${index}].item_name`}
                                    component="div"
                                    className="text-danger small mt-1"
                                  />
                                </BForm.Group>
                              </Col>

                              {/* 2. Price */}
                              <Col xs={12} sm={6} md={3}>
                                <BForm.Group>
                                  <BForm.Label
                                    className="fw-bold text-muted text-uppercase mb-1"
                                    style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}
                                  >
                                    Price (₹) <span className="text-danger">*</span>
                                  </BForm.Label>
                                  <Field
                                    type="number"
                                    step="any"
                                    name={`items[${index}].price`}
                                    className="form-control pill-input"
                                    placeholder="0.00"
                                  />
                                  <ErrorMessage
                                    name={`items[${index}].price`}
                                    component="div"
                                    className="text-danger small mt-1"
                                  />
                                </BForm.Group>
                              </Col>

                              {/* 3. Stock Qty */}
                              <Col xs={12} sm={6} md={3}>
                                <BForm.Group>
                                  <BForm.Label
                                    className="fw-bold text-muted text-uppercase mb-1"
                                    style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}
                                  >
                                    Stock Qty
                                  </BForm.Label>
                                  <Field
                                    type="number"
                                    name={`items[${index}].stock_quantity`}
                                    className="form-control pill-input"
                                    placeholder="e.g. 50 (Optional)"
                                  />
                                  <ErrorMessage
                                    name={`items[${index}].stock_quantity`}
                                    component="div"
                                    className="text-danger small mt-1"
                                  />
                                </BForm.Group>
                              </Col>

                              {/* 4. Description */}
                              <Col xs={12} md={7}>
                                <BForm.Group>
                                  <BForm.Label
                                    className="fw-bold text-muted text-uppercase mb-1"
                                    style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}
                                  >
                                    Description
                                  </BForm.Label>
                                  <Field
                                    as="textarea"
                                    rows={2}
                                    name={`items[${index}].description`}
                                    className="form-control pill-input"
                                    placeholder="Add item description, specifications or notes..."
                                    style={{ resize: 'none' }}
                                  />
                                </BForm.Group>
                              </Col>

                              {/* 5. Add Image */}
                              <Col xs={12} md={5}>
                                <BForm.Group>
                                  <BForm.Label
                                    className="fw-bold text-muted text-uppercase mb-1"
                                    style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}
                                  >
                                    Item Image
                                  </BForm.Label>
                                  <div className="d-flex align-items-center gap-2 pt-1">
                                    <input
                                      type="file"
                                      id={`file-input-${index}`}
                                      className="d-none"
                                      accept="image/*"
                                      onChange={(e) => handleImageChange(e, index, setFieldValue)}
                                    />
                                    <label
                                      htmlFor={`file-input-${index}`}
                                      className="custom-btn-outline px-3 py-2 rounded-pill small fw-bold cursor-pointer mb-0 d-inline-flex align-items-center justify-content-center"
                                      style={{ height: '38px' }}
                                    >
                                      <CsLineIcons icon="upload" size="14" className="me-2" />
                                      {item.item_img ? 'Change Image' : 'Add Image'}
                                    </label>

                                    {imagePreviews[index] && (
                                      <div className="position-relative d-inline-block ms-2">
                                        <img
                                          src={imagePreviews[index]}
                                          alt="Preview"
                                          className="rounded shadow-sm border"
                                          style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-danger position-absolute p-0 rounded-circle d-flex align-items-center justify-content-center"
                                          style={{
                                            top: '-6px',
                                            right: '-6px',
                                            width: '18px',
                                            height: '18px',
                                            lineHeight: '1',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                          }}
                                          onClick={() => removeImage(index, setFieldValue)}
                                          title="Remove image"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </BForm.Group>
                              </Col>
                            </Row>
                          </div>
                        ))}

                        {/* Option for Add More */}
                        <div className="text-center my-2">
                          <Button
                            type="button"
                            variant="light"
                            className="add-more-btn w-100 d-flex align-items-center justify-content-center gap-2 py-3"
                            onClick={() => push(createEmptyItem())}
                          >
                            <CsLineIcons icon="plus" size="16" />
                            <span>Add More Items</span>
                          </Button>
                        </div>

                        {/* Bottom Actions */}
                        <div className="d-flex flex-column flex-sm-row justify-content-end align-items-stretch align-items-sm-center gap-3 mt-4 pt-3 border-top">
                          <Button
                            type="button"
                            variant="outline-secondary"
                            className="px-4 py-2 fw-bold rounded-pill"
                            onClick={() => history.push('/operations/manage-items')}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            className="px-4 py-2 fw-bold shadow-sm rounded-pill d-flex justify-content-center align-items-center gap-2"
                            disabled={isSubmitting}
                            onClick={() => setSubmitAction('close')}
                          >
                            {isSubmitting && submitAction === 'close' ? (
                              <Spinner size="sm" />
                            ) : (
                              <CsLineIcons icon="save" size="18" />
                            )}
                            Save Items
                          </Button>
                          <Button
                            type="submit"
                            variant="success"
                            className="px-4 py-2 fw-bold shadow-sm rounded-pill d-flex justify-content-center align-items-center gap-2 text-white"
                            disabled={isSubmitting}
                            onClick={() => setSubmitAction('add_another')}
                          >
                            {isSubmitting && submitAction === 'add_another' ? (
                              <Spinner size="sm" />
                            ) : (
                              <CsLineIcons icon="plus" size="18" />
                            )}
                            Save & Add More
                          </Button>
                        </div>
                      </div>
                    )}
                  </FieldArray>
                </Card.Body>
              </Card>
            </Form>
          )}
        </Formik>

        {isSubmitting && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ background: 'rgba(255,255,255,0.8)', zIndex: 9999, backdropFilter: 'blur(4px)' }}
          >
            <Card className="glass-card border-0 shadow-lg text-center p-5">
              <Spinner animation="grow" style={{ color: '#23b3f4' }} className="mb-4" />
              <h4 className="fw-bold mb-1">Saving Items</h4>
              <p className="text-muted mb-0">Updating your catalog...</p>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default AddItems;
