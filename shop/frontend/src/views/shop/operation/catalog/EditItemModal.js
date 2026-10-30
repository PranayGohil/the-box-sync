/* eslint-disable react/no-this-in-sfc, func-names, no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form as BForm, Spinner, Row, Col } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
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
`;

const EditItemModal = ({ show, handleClose, data, fetchCatalogData }) => {
  const [previewImg, setPreviewImg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removeExistingImg, setRemoveExistingImg] = useState(false);

  useEffect(() => {
    if (data?.item_img) {
      setPreviewImg(`${process.env.REACT_APP_UPLOAD_DIR || 'http://localhost:5003/uploads'}${data.item_img}`);
    } else {
      setPreviewImg(null);
    }
    setRemoveExistingImg(false);
  }, [data]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      item_name: data?.item_name || '',
      price: data?.item_price != null ? data.item_price : data?.variants?.[0]?.price ?? '',
      stock_quantity: data?.stock_quantity != null ? data.stock_quantity : data?.variants?.[0]?.stock_quantity ?? '',
      description: data?.description || '',
      allow_loose: data?.allow_loose || false,
      pieces_per_box: data?.pieces_per_box || 10,
      piece_price: data?.piece_price != null ? data.piece_price : '',
      unit_name: data?.unit_name || 'Box',
      sub_unit_name: data?.sub_unit_name || 'Pcs',
      item_img: null,
    },
    validationSchema: Yup.object().shape({
      item_name: Yup.string().trim().required('Item name is required'),
      price: Yup.number().typeError('Price must be a valid number').min(0, 'Price cannot be negative').required('Price is required'),
      description: Yup.string(),
      stock_quantity: Yup.number().typeError('Stock quantity must be a number').min(0, 'Stock quantity cannot be negative').nullable(),
      allow_loose: Yup.boolean(),
      pieces_per_box: Yup.number().when('allow_loose', {
        is: true,
        then: (schema) => schema.typeError('Must be a number').min(1, 'Min 1 piece per box').required('Required'),
        otherwise: (schema) => schema.nullable(),
      }),
      piece_price: Yup.number().when('allow_loose', {
        is: true,
        then: (schema) => schema.typeError('Must be a number').min(0, 'Cannot be negative').required('Required'),
        otherwise: (schema) => schema.nullable(),
      }),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('_id', data._id);
        formData.append('item_name', values.item_name.trim());
        const numPrice = Number(values.price) || 0;
        formData.append('item_price', numPrice);
        formData.append('price', numPrice);
        formData.append('description', values.description ? values.description.trim() : '');

        const numStock = values.stock_quantity !== '' && values.stock_quantity != null ? Number(values.stock_quantity) : '';
        formData.append('stock_quantity', numStock);

        const isLoose = values.allow_loose === true;
        formData.append('allow_loose', isLoose);
        const pcsPerBox = isLoose && Number(values.pieces_per_box) > 0 ? Number(values.pieces_per_box) : 1;
        formData.append('pieces_per_box', pcsPerBox);

        const pcPrice = isLoose
          ? values.piece_price !== '' && values.piece_price != null
            ? Number(values.piece_price)
            : Number((numPrice / pcsPerBox).toFixed(2))
          : '';
        formData.append('piece_price', pcPrice);

        formData.append('unit_name', values.unit_name ? values.unit_name.trim() : 'Box');
        formData.append('sub_unit_name', values.sub_unit_name ? values.sub_unit_name.trim() : 'Pcs');

        const updatedVariants = [
          {
            size_name: 'Regular',
            price: numPrice,
            extra: '',
            barcode: data?.variants?.[0]?.barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
            is_available: true,
            stock_quantity: numStock !== '' ? Number(numStock) : null,
          },
        ];
        formData.append('variants', JSON.stringify(updatedVariants));

        if (values.item_img) {
          formData.append('item_img', values.item_img);
        } else if (removeExistingImg) {
          formData.append('remove_image', 'true');
        }

        const apiBase = process.env.REACT_APP_API || 'http://localhost:5003/api';
        await axios.put(`${apiBase}/catalog/update`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        if (fetchCatalogData) fetchCatalogData();
        toast.success('Item updated successfully!');
        handleClose();
      } catch (error) {
        console.error('Error updating item:', error);
        let errorMsg = error.response?.data?.message || 'Something went wrong';
        if (typeof errorMsg === 'object') {
          errorMsg = Object.values(errorMsg).join(', ') || JSON.stringify(errorMsg);
        }
        toast.error(errorMsg);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleImageChange = (e) => {
    const { files } = e.currentTarget;
    const file = files && files[0];
    if (file) {
      formik.setFieldValue('item_img', file);
      setPreviewImg(URL.createObjectURL(file));
      setRemoveExistingImg(false);
    }
  };

  const handleRemoveImage = () => {
    formik.setFieldValue('item_img', null);
    setPreviewImg(null);
    setRemoveExistingImg(true);
  };

  return (
    <>
      <style>{customStyles}</style>
      <Modal show={show} onHide={handleClose} centered size="lg" backdrop="static">
        <Modal.Header closeButton className="border-bottom pb-3">
          <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center gap-2">
            <CsLineIcons icon="edit" size="18" className="text-primary" />
            Edit Item
          </Modal.Title>
        </Modal.Header>

        <BForm onSubmit={formik.handleSubmit}>
          <Modal.Body className="p-3 p-md-4">
            <Row className="g-3">
              {/* 1. Item Name */}
              <Col xs={12} md={6}>
                <BForm.Group>
                  <BForm.Label className="fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                    Item Name <span className="text-danger">*</span>
                  </BForm.Label>
                  <BForm.Control
                    type="text"
                    name="item_name"
                    value={formik.values.item_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.item_name && Boolean(formik.errors.item_name)}
                    className="pill-input"
                    placeholder="e.g. Electric Sparklers, Rocket"
                  />
                  <BForm.Control.Feedback type="invalid" className="small">
                    {formik.errors.item_name}
                  </BForm.Control.Feedback>
                </BForm.Group>
              </Col>

              {/* 2. Price (Box / Pack) */}
              <Col xs={12} sm={6} md={3}>
                <BForm.Group>
                  <BForm.Label className="fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                    Box Price (₹) <span className="text-danger">*</span>
                  </BForm.Label>
                  <BForm.Control
                    type="number"
                    step="any"
                    name="price"
                    value={formik.values.price}
                    onChange={(e) => {
                      const { value: val } = e.target;
                      formik.setFieldValue('price', val);
                      if (formik.values.allow_loose && Number(val) > 0) {
                        const pcs = Number(formik.values.pieces_per_box) || 10;
                        formik.setFieldValue('piece_price', (Number(val) / pcs).toFixed(2));
                      }
                    }}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.price && Boolean(formik.errors.price)}
                    className="pill-input"
                    placeholder="0.00"
                  />
                  <BForm.Control.Feedback type="invalid" className="small">
                    {formik.errors.price}
                  </BForm.Control.Feedback>
                </BForm.Group>
              </Col>

              {/* 3. Stock Qty */}
              <Col xs={12} sm={6} md={3}>
                <BForm.Group>
                  <BForm.Label className="fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                    Stock Qty (Boxes)
                  </BForm.Label>
                  <BForm.Control
                    type="number"
                    name="stock_quantity"
                    value={formik.values.stock_quantity}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.stock_quantity && Boolean(formik.errors.stock_quantity)}
                    className="pill-input"
                    placeholder="e.g. 50 (Optional)"
                  />
                  <BForm.Control.Feedback type="invalid" className="small">
                    {formik.errors.stock_quantity}
                  </BForm.Control.Feedback>
                </BForm.Group>
              </Col>

              {/* 4. Description */}
              <Col xs={12} md={7}>
                <BForm.Group>
                  <BForm.Label className="fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                    Description
                  </BForm.Label>
                  <BForm.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    className="pill-input"
                    placeholder="Add item description or specifications..."
                    style={{ resize: 'none' }}
                  />
                </BForm.Group>
              </Col>

              {/* 5. Add Image */}
              <Col xs={12} md={5}>
                <BForm.Group>
                  <BForm.Label className="fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                    Item Image
                  </BForm.Label>
                  <div className="d-flex align-items-center gap-2 pt-1">
                    <input type="file" id="edit-file-input" className="d-none" accept="image/*" onChange={handleImageChange} />
                    <label
                      htmlFor="edit-file-input"
                      className="custom-btn-outline px-3 py-2 rounded-pill small fw-bold cursor-pointer mb-0 d-inline-flex align-items-center justify-content-center"
                      style={{ height: '38px' }}
                    >
                      <CsLineIcons icon="upload" size="14" className="me-2" />
                      {previewImg ? 'Change Image' : 'Add Image'}
                    </label>

                    {previewImg && (
                      <div className="position-relative d-inline-block ms-2">
                        <img
                          src={previewImg}
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
                          onClick={handleRemoveImage}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </BForm.Group>
              </Col>

              {/* 6. Loose / Piece Selling Option (Crackers & Retail) */}
              <Col xs={12}>
                <div
                  className="p-3 rounded-3"
                  style={{
                    background: formik.values.allow_loose ? '#f0f9ff' : '#f8fafc',
                    border: formik.values.allow_loose ? '1px solid #bae6fd' : '1px dashed #cbd5e1',
                    borderRadius: '12px',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <label className="d-flex align-items-center gap-2 mb-0 cursor-pointer user-select-none">
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        checked={formik.values.allow_loose}
                        onChange={(e) => {
                          const { checked } = e.target;
                          formik.setFieldValue('allow_loose', checked);
                          if (checked && !formik.values.piece_price && Number(formik.values.price) > 0) {
                            const pcs = Number(formik.values.pieces_per_box) || 10;
                            formik.setFieldValue('piece_price', (Number(formik.values.price) / pcs).toFixed(2));
                          }
                        }}
                      />
                      <span className="fw-bold" style={{ fontSize: '0.86rem', color: formik.values.allow_loose ? '#0284c7' : '#475569' }}>
                        Sell in Loose / Individual Pieces? (e.g. crackers, sparkler sticks)
                      </span>
                    </label>
                  </div>

                  {formik.values.allow_loose && (
                    <div className="mt-3 pt-3 border-top" style={{ borderColor: '#e0f2fe' }}>
                      <Row className="g-2 g-md-3 align-items-center">
                        <Col xs={6} md={3}>
                          <BForm.Group>
                            <BForm.Label className="small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                              Pack Unit
                            </BForm.Label>
                            <BForm.Control
                              type="text"
                              name="unit_name"
                              value={formik.values.unit_name}
                              onChange={formik.handleChange}
                              className="pill-input bg-white"
                              placeholder="Box"
                            />
                          </BForm.Group>
                        </Col>

                        <Col xs={6} md={3}>
                          <BForm.Group>
                            <BForm.Label className="small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                              Pieces per Box <span className="text-danger">*</span>
                            </BForm.Label>
                            <BForm.Control
                              type="number"
                              min="1"
                              name="pieces_per_box"
                              value={formik.values.pieces_per_box}
                              onChange={(e) => {
                                const { value: val } = e.target;
                                formik.setFieldValue('pieces_per_box', val);
                                if (Number(val) > 0 && Number(formik.values.price) > 0) {
                                  formik.setFieldValue('piece_price', (Number(formik.values.price) / Number(val)).toFixed(2));
                                }
                              }}
                              isInvalid={formik.touched.pieces_per_box && Boolean(formik.errors.pieces_per_box)}
                              className="pill-input bg-white"
                              placeholder="10"
                            />
                            <BForm.Control.Feedback type="invalid" className="small">
                              {formik.errors.pieces_per_box}
                            </BForm.Control.Feedback>
                          </BForm.Group>
                        </Col>

                        <Col xs={6} md={3}>
                          <BForm.Group>
                            <BForm.Label className="small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                              Piece Unit
                            </BForm.Label>
                            <BForm.Control
                              type="text"
                              name="sub_unit_name"
                              value={formik.values.sub_unit_name}
                              onChange={formik.handleChange}
                              className="pill-input bg-white"
                              placeholder="Pcs"
                            />
                          </BForm.Group>
                        </Col>

                        <Col xs={6} md={3}>
                          <BForm.Group>
                            <BForm.Label className="small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                              Loose Piece Price (₹) <span className="text-danger">*</span>
                            </BForm.Label>
                            <BForm.Control
                              type="number"
                              step="any"
                              min="0"
                              name="piece_price"
                              value={formik.values.piece_price}
                              onChange={formik.handleChange}
                              isInvalid={formik.touched.piece_price && Boolean(formik.errors.piece_price)}
                              className="pill-input bg-white"
                              placeholder="0.00"
                            />
                            <BForm.Control.Feedback type="invalid" className="small">
                              {formik.errors.piece_price}
                            </BForm.Control.Feedback>
                          </BForm.Group>
                        </Col>
                      </Row>

                      <div className="small text-muted mt-2 d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
                        <span className="badge rounded-pill bg-info text-white" style={{ fontSize: '9px' }}>
                          Auto Calc
                        </span>
                        <span>
                          1 {formik.values.unit_name || 'Box'} = ₹{formik.values.price || '0'} • 1 {formik.values.sub_unit_name || 'Piece'} = ₹
                          {formik.values.piece_price || '0'} ({formik.values.pieces_per_box || 1} {formik.values.sub_unit_name || 'pcs'}/
                          {formik.values.unit_name || 'box'})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer className="border-top pt-3 d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" className="px-4 py-2 rounded-pill fw-bold" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-4 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : <CsLineIcons icon="check" size="16" />}
              Save Changes
            </Button>
          </Modal.Footer>
        </BForm>
      </Modal>
    </>
  );
};

export default EditItemModal;
