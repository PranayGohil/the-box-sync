/* eslint-disable react/no-this-in-sfc, func-names */
import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, Spinner, Row, Col, Table } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import PrintBarcodeModal from './PrintBarcodeModal';

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
    min-height: 60px !important;
    height: auto !important;
  }
  @media (max-width: 767.98px) {
    textarea.pill-input {
      min-height: 130px !important;
    }
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
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .modal-footer {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.75rem !important;
    border-top: none !important;
    padding: 1.5rem !important;
  }
  .modal-footer .btn {
    width: 100% !important;
    margin: 0 !important;
  }
  @media (min-width: 576px) {
    .modal-footer {
      flex-direction: row !important;
      justify-content: flex-end !important;
    }
    .modal-footer .btn {
      width: auto !important;
    }
  }
  @media (max-width: 575px) {
    .modal-dialog {
      margin: 0.5rem !important;
    }
    .modal-body {
      padding: 1rem !important;
    }
    .modal-header {
      padding: 1rem 1rem 0 1rem !important;
    }
  }
  .custom-check {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  .custom-check.active {
    background: #23b3f4 !important;
    border-color: #23b3f4 !important;
  }

`;

const EditItemModal = ({ show, handleClose, data, fetchCatalogData, catalogData = [], storePreferences = 'optional', shopType = 'Other' }) => {
  const [previewImg, setPreviewImg] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(data?.quantity != null && data.quantity !== '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [printBarcodeData, setPrintBarcodeData] = useState(null);

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '10px',
      padding: '0px',
      border: state.isFocused ? '1px solid #23b3f4' : '1px solid #e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(35, 179, 244, 0.1)' : 'none',
      backgroundColor: '#fff',
      fontSize: '0.88rem',
      fontWeight: '600',
      minHeight: '38px',
      height: '38px',
      '&:hover': { border: '1px solid #23b3f4' },
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  const sizeSuggestions = useMemo(() => {
    return Array.from(
      new Set(
        catalogData.flatMap((c) =>
          (c.items || []).flatMap((d) =>
            (d.variants || []).map((v) => v.size_name?.trim()).filter(Boolean)
          )
        )
      )
    ).sort();
  }, [catalogData]);

  const extraSuggestions = useMemo(() => {
    return Array.from(
      new Set(
        catalogData.flatMap((c) =>
          (c.items || []).flatMap((d) =>
            (d.variants || []).map((v) => v.extra?.trim()).filter(Boolean)
          )
        )
      )
    ).sort();
  }, [catalogData]);

  const addonSuggestions = useMemo(() => {
    return Array.from(
      new Set(
        catalogData.flatMap((c) =>
          (c.items || []).flatMap((d) =>
            (d.addons || []).map((a) => a.addon_name?.trim()).filter(Boolean)
          )
        )
      )
    ).sort();
  }, [catalogData]);



  useEffect(() => {
    if (data?.item_img) {
      setPreviewImg(`${process.env.REACT_APP_UPLOAD_DIR}${data.item_img}`);
    }
    if (data?.quantity) {
      setShowAdvancedOptions(true);
    } else {
      setShowAdvancedOptions(false);
    }
    setLoading(false);
  }, [data]);

  let variantLabel = "Variant / Size Name";
  if (['Grocery Shop', 'Super Market', 'Dairy / Milk Shop', 'Sweet Shop / Mithai'].includes(shopType)) {
    variantLabel = "Weight / Volume";
  } else if (['Clothing / Garment'].includes(shopType)) {
    variantLabel = "Size & Color";
  } else if (['Hardware Shop', 'Electronics & Mobile'].includes(shopType)) {
    variantLabel = "Model / Spec";
  }

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      item_name: data?.item_name || '',
      description: data?.description || '',
      item_img: null,
      is_special: data?.is_special || false,
      is_available: data?.is_available !== false,
      barcode: data?.barcode || '',
      variants:
        data?.variants && data.variants.length > 0
          ? data.variants.map((v) => ({ ...v, price: v.price || '' }))
          : [{ size_name: '', price: '', extra: '', barcode: '', is_available: true }],
      addons: data?.addons || [],
      type: data?.type || 'veg',
    },
    validationSchema: Yup.object().shape({
      item_name: Yup.string().required('Item name is required'),
      type: Yup.string().required('Type is required'),
      description: Yup.string(),
      variants: Yup.array()
        .of(
          Yup.object().shape({
            size_name: Yup.string(),
            price: Yup.number().typeError('Must be a number').required('Price is required'),
            extra: Yup.string(),
          })
        )
        .min(1, 'At least one variant/price is required'),
      addons: Yup.array().of(
        Yup.object().shape({
          addon_name: Yup.string().required('Addon name is required'),
          price: Yup.number().typeError('Must be a number').required('Price is required'),
        })
      ),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('_id', data._id);
        formData.append('item_name', values.item_name);
        formData.append('description', values.description);
        formData.append('is_special', values.is_special);
        formData.append('is_available', values.is_available);
        formData.append('barcode', values.barcode);
        formData.append('hide_on_kot', values.hide_on_kot);
        formData.append('type', values.type);

        let cleanedVariants = [];
        if (Array.isArray(values.variants)) {
          cleanedVariants = values.variants.map((v) => ({
            size_name: v.size_name || '',
            price: Number(v.price) || 0,
            extra: v.extra || '',
            barcode: v.barcode || '',
            is_available: v.is_available !== false,
          }));
        }
        formData.append('variants', JSON.stringify(cleanedVariants));
        formData.append('item_price', cleanedVariants[0] ? Number(cleanedVariants[0].price) || 0 : 0);
        formData.append('has_variants', cleanedVariants.length > 1);

        let cleanedAddons = [];
        if (Array.isArray(values.addons)) {
          cleanedAddons = values.addons
            .filter((a) => a.addon_name && a.addon_name.trim() !== '')
            .map((a) => ({
              addon_name: a.addon_name,
              price: Number(a.price) || 0,
              is_available: a.is_available !== false,
            }));
        }
        formData.append('addons', JSON.stringify(cleanedAddons));

        if (values.item_img) {
          formData.append('item_img', values.item_img);
        }

        await axios.put(`${process.env.REACT_APP_API}/catalog/update`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        fetchCatalogData();
        toast.success('Item updated successfully!');
        handleClose();
      } catch (err) {
        console.error('Error updating item:', err);
        toast.error(err.response?.data?.message || 'Failed to update item.');
      } finally {
        setIsSubmitting(false);
      }
    },
  },);

  useEffect(() => {
    if (!show) {
      formik.resetForm();
      if (data?.item_img) {
        setPreviewImg(`${process.env.REACT_APP_UPLOAD_DIR}${data.item_img}`);
      } else {
        setPreviewImg(null);
      }
      setShowAdvancedOptions(data?.quantity != null && data.quantity !== '');
    }
  }, [show, data]);

  if (loading) {
    return (
      <Modal show={show} onHide={handleClose} centered>
        <style>{customStyles}</style>
        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center p-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-3 fw-bold text-muted small">Loading Item Data...</div>
          </div>
        ) : ( 
          <Modal.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading...</p>
          </Modal.Body>
        )}
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered size="lg">
      <style>{customStyles}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#23b3f4' }}>
          <CsLineIcons icon="edit" className="me-2" />
          Edit Item Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        {(() => {
          const selectedCatObj = catalogData.find(c => c.category === data?.category);
          const isFoodCategory = selectedCatObj ? selectedCatObj.is_food_category : false;
          const shouldShowDietary = storePreferences === 'mandatory' || (storePreferences === 'optional' && isFoodCategory);

          return (
            <Form id="edit_dish_form" onSubmit={formik.handleSubmit}>
              <Row className="g-3">
                <Col md={shouldShowDietary ? 5 : 8}>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Item Name</Form.Label>
                <Form.Control
                  type="text"
                  name="item_name"
                  value={formik.values.item_name}
                  onChange={formik.handleChange}
                  disabled={isSubmitting}
                  className="pill-input shadow-sm"
                  placeholder="Enter item name"
                />
              </Form.Group>
            </Col>

            {shouldShowDietary && (
              <Col md={3}>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Type</Form.Label>
                  <Select
                    classNamePrefix="react-select"
                    options={[
                      { value: 'veg', label: 'Veg' },
                      { value: 'non-veg', label: 'Non-Veg' },
                      { value: 'egg', label: 'Egg' },
                    ]}
                    value={{
                      value: formik.values.type,
                      label: formik.values.type === 'veg' ? 'Veg' : formik.values.type === 'non-veg' ? 'Non-Veg' : 'Egg'
                    }}
                    onChange={(selected) => formik.setFieldValue('type', selected ? selected.value : 'veg')}
                    placeholder="Select type"
                    isDisabled={isSubmitting}
                    styles={selectStyles}
                  />
                </Form.Group>
              </Col>
            )}

            <Col md={4}>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Item Image</Form.Label>
                <div className="d-flex flex-column align-items-center gap-2 p-3 rounded-xl border-dashed" style={{ border: '2px dashed #e5e7eb' }}>
                  {previewImg ? (
                    <img src={previewImg} alt="Preview" className="rounded shadow-sm" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                  ) : (
                    <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                      <CsLineIcons icon="image" size="40" className="text-muted" />
                    </div>
                  )}
                  <input
                    type="file"
                    id="edit-item-img"
                    className="d-none"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.currentTarget.files[0];
                      formik.setFieldValue('item_img', file);
                      if (file) setPreviewImg(URL.createObjectURL(file));
                    }}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="edit-item-img" className="custom-btn-outline px-3 py-1 rounded-pill small fw-bold cursor-pointer mb-0 mt-2">
                    <CsLineIcons icon="upload" size="14" className="me-1" />
                    {previewImg ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  disabled={isSubmitting}
                  className="pill-input shadow-sm"
                  style={{ paddingLeft: '1.2rem' }}
                  placeholder="Add item description..."
                />
              </Form.Group>
            </Col>

            <Col xs={4}>
              <div
                className="d-flex align-items-center gap-2 cursor-pointer mb-4"
                onClick={() => formik.setFieldValue('is_special', !formik.values.is_special)}
              >
                <div className={`custom-check ${formik.values.is_special ? 'active' : ''}`}>
                  {formik.values.is_special && <CsLineIcons icon="check" size="12" className="text-white" />}
                </div>
                <span className="fw-bold text-alternate small text-uppercase">Special</span>
              </div>
            </Col>

            <Col xs={4}>
              <div
                className="d-flex align-items-center gap-2 cursor-pointer mb-4"
                onClick={() => formik.setFieldValue('is_available', !formik.values.is_available)}
              >
                <div className={`custom-check ${formik.values.is_available ? 'active' : ''}`}>
                  {formik.values.is_available && <CsLineIcons icon="check" size="12" className="text-white" />}
                </div>
                <span className="fw-bold text-alternate small text-uppercase">Available</span>
              </div>
            </Col>

            <Col md={12} className="mt-3">
              <div className="p-3 p-md-4 rounded-xl border bg-white" style={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-primary mb-0" style={{ fontSize: '1rem' }}>
                    Inventory & Pricing
                  </h6>
                  {typeof formik.errors?.variants === 'string' && (
                    <div className="text-danger small fw-bold">{formik.errors.variants}</div>
                  )}
                </div>

                {/* Desktop Table Layout */}
                <div className="table-responsive d-none d-md-block">
                  <Table borderless hover className="align-middle mb-0">
                    <thead>
                      <tr className="border-bottom" style={{ color: '#64748b', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                        <th className="pb-2 text-uppercase">{variantLabel}</th>
                        <th className="pb-2 text-uppercase" width="140">Price (₹)</th>
                        <th className="pb-2 text-uppercase" width="200">Extra Details</th>
                        <th className="pb-2 text-uppercase" width="280">Barcode</th>
                        <th className="pb-2 text-uppercase text-center" width="60" />
                      </tr>
                    </thead>
                    <tbody>
                      {(formik.values.variants || []).map((variant, vIdx) => (
                        <tr key={vIdx} className="border-bottom border-light">
                          <td className="py-3">
                            <CreatableSelect
                              styles={selectStyles}
                              isClearable
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              options={sizeSuggestions.map((opt) => ({ value: opt, label: opt }))}
                              value={variant.size_name ? { value: variant.size_name, label: variant.size_name } : null}
                              onChange={(selected) => formik.setFieldValue(`variants[${vIdx}].size_name`, selected ? selected.value : '')}
                              placeholder="e.g. 1kg"
                            />
                            {formik.errors.variants?.[vIdx]?.size_name && (
                              <div className="text-danger small mt-1">{formik.errors.variants[vIdx].size_name}</div>
                            )}
                          </td>
                          <td className="py-3">
                            <Form.Control
                              type="text"
                              name={`variants[${vIdx}].price`}
                              value={variant.price || ''}
                              onChange={formik.handleChange}
                              placeholder="Price"
                              className="pill-input"
                              style={{ height: '38px', borderRadius: '10px' }}
                              isInvalid={formik.touched.variants?.[vIdx]?.price && !!formik.errors.variants?.[vIdx]?.price}
                            />
                            {formik.errors.variants?.[vIdx]?.price && (
                              <div className="text-danger small mt-1">{formik.errors.variants[vIdx].price}</div>
                            )}
                          </td>
                          <td className="py-3">
                            <CreatableSelect
                              styles={selectStyles}
                              isClearable
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              options={extraSuggestions.map((opt) => ({ value: opt, label: opt }))}
                              value={variant.extra ? { value: variant.extra, label: variant.extra } : null}
                              onChange={(selected) => formik.setFieldValue(`variants[${vIdx}].extra`, selected ? selected.value : '')}
                              placeholder="Optional"
                            />
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-1">
                              <Form.Control
                                type="text"
                                name={`variants[${vIdx}].barcode`}
                                value={variant.barcode || ''}
                                onChange={formik.handleChange}
                                placeholder="Barcode"
                                className="pill-input"
                                style={{ height: '38px', borderRadius: '10px' }}
                              />
                              <Button
                                variant="outline-primary"
                                className="flex-shrink-0 d-flex align-items-center justify-content-center px-3"
                                style={{ height: '38px', borderRadius: '10px' }}
                                onClick={() => formik.setFieldValue(`variants[${vIdx}].barcode`, Math.floor(100000000000 + Math.random() * 900000000000).toString())}
                              >
                                <span className="fw-bold" style={{ fontSize: '0.85rem' }}>Gen</span>
                              </Button>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <Button
                              variant="outline-danger"
                              onClick={() => {
                                const newVariants = [...formik.values.variants];
                                newVariants.splice(vIdx, 1);
                                formik.setFieldValue('variants', newVariants);
                              }}
                              disabled={formik.values.variants.length === 1}
                              style={{ height: '34px', width: '34px', minWidth: '34px', borderRadius: '50%', padding: 0 }}
                              className="d-flex align-items-center justify-content-center btn btn-outline-danger mx-auto"
                            >
                              <CsLineIcons icon="bin" size="14" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="5" className="pt-3 pb-0 border-0">
                          <Button
                            type="button"
                            variant="outline-primary"
                            className="custom-btn-outline py-1 px-3 d-flex align-items-center gap-1 btn btn-outline-primary"
                            style={{ height: '34px', fontSize: '0.85rem', borderRadius: '8px' }}
                            onClick={() => {
                              formik.setFieldValue('variants', [...formik.values.variants, { size_name: '', price: '', extra: '', barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(), is_available: true }]);
                            }}
                          >
                            <CsLineIcons icon="plus" size="12" />
                            Add Row
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>

                {/* Mobile Stacked Layout (Hidden on Desktop) */}
                <div className="d-flex d-md-none flex-column gap-2">
                  {(formik.values.variants || []).map((variant, vIdx) => (
                    <React.Fragment key={vIdx}>
                      {vIdx > 0 && <hr className="my-3" style={{ borderTop: '1px dashed #cbd5e1' }} />}
                      <Row className="g-2 align-items-end mb-3 pb-3 border-bottom border-light">
                        <Col xs={10} className="order-1">
                          <Form.Group>
                            <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                              {variantLabel}
                            </Form.Label>
                            <CreatableSelect
                              styles={selectStyles}
                              isClearable
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              options={sizeSuggestions.map((opt) => ({ value: opt, label: opt }))}
                              value={variant.size_name ? { value: variant.size_name, label: variant.size_name } : null}
                              onChange={(selected) => formik.setFieldValue(`variants[${vIdx}].size_name`, selected ? selected.value : '')}
                              placeholder="e.g. 1kg"
                            />
                            {formik.errors.variants?.[vIdx]?.size_name && (
                              <div className="text-danger small mt-1">{formik.errors.variants[vIdx].size_name}</div>
                            )}
                          </Form.Group>
                        </Col>
                        <Col xs={6} className="order-3">
                          <Form.Group>
                            <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                              Price (₹)
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name={`variants[${vIdx}].price`}
                              value={variant.price || ''}
                              onChange={formik.handleChange}
                              placeholder="Price"
                              className="pill-input"
                              style={{ height: '38px', borderRadius: '10px' }}
                              isInvalid={formik.touched.variants?.[vIdx]?.price && !!formik.errors.variants?.[vIdx]?.price}
                            />
                            {formik.errors.variants?.[vIdx]?.price && (
                              <div className="text-danger small mt-1">{formik.errors.variants[vIdx].price}</div>
                            )}
                          </Form.Group>
                        </Col>
                        <Col xs={6} className="order-4">
                          <Form.Group>
                            <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                              Extra Details
                            </Form.Label>
                            <CreatableSelect
                              styles={selectStyles}
                              isClearable
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              options={extraSuggestions.map((opt) => ({ value: opt, label: opt }))}
                              value={variant.extra ? { value: variant.extra, label: variant.extra } : null}
                              onChange={(selected) => formik.setFieldValue(`variants[${vIdx}].extra`, selected ? selected.value : '')}
                              placeholder="Optional"
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} className="order-5">
                          <Form.Group>
                            <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                              Barcode
                            </Form.Label>
                            <div className="d-flex align-items-center gap-1">
                              <Form.Control
                                type="text"
                                name={`variants[${vIdx}].barcode`}
                                value={variant.barcode || ''}
                                onChange={formik.handleChange}
                                placeholder="Barcode"
                                className="pill-input"
                                style={{ height: '38px', borderRadius: '10px' }}
                              />
                              <Button
                                variant="outline-primary"
                                className="flex-shrink-0 d-flex align-items-center justify-content-center px-3"
                                style={{ height: '38px', borderRadius: '10px' }}
                                onClick={() => formik.setFieldValue(`variants[${vIdx}].barcode`, Math.floor(100000000000 + Math.random() * 900000000000).toString())}
                              >
                                <span className="fw-bold" style={{ fontSize: '0.85rem' }}>Gen</span>
                              </Button>
                            </div>
                          </Form.Group>
                        </Col>
                        <Col xs={2} className="order-2 d-flex flex-column justify-content-end pb-1 px-1">
                          <Form.Label className="d-none d-sm-block mb-1" style={{ fontSize: '0.75rem', visibility: 'hidden' }}>
                            Delete
                          </Form.Label>
                          <Button
                            variant="outline-danger"
                            onClick={() => {
                              const newVariants = [...formik.values.variants];
                              newVariants.splice(vIdx, 1);
                              formik.setFieldValue('variants', newVariants);
                            }}
                            disabled={formik.values.variants.length === 1}
                            style={{ height: '36px', width: '36px', minWidth: '36px', borderRadius: '50%', padding: 0 }}
                            className="flex-shrink-0 d-flex align-items-center justify-content-center btn btn-outline-danger"
                          >
                            <CsLineIcons icon="bin" size="14" />
                          </Button>
                        </Col>
                      </Row>
                    </React.Fragment>
                  ))}
                  <Button
                    type="button"
                    variant="outline-primary"
                    className="custom-btn-outline py-1 px-3 mt-2 d-flex align-items-center gap-1 align-self-start btn btn-outline-primary"
                    style={{ height: '34px', fontSize: '0.8rem', borderRadius: '8px' }}
                    onClick={() => {
                      formik.setFieldValue('variants', [...formik.values.variants, { size_name: '', price: '', extra: '', barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(), is_available: true }]);
                    }}
                  >
                    <CsLineIcons icon="plus" size="12" />
                    Add Row
                  </Button>
                </div>
              </div>
            </Col>

          </Row>
        </Form>
          );
        })()}
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button
          variant="outline-light"
          onClick={handleClose}
          disabled={isSubmitting}
          className="rounded-pill px-4 fw-bold custom-btn-outline btn btn-outline-primary"
        >
          Cancel
        </Button>
        <Button type="submit" form="edit_dish_form" disabled={isSubmitting} className="px-5 py-2 custom-btn-outline d-flex align-items-center gap-2">
          {isSubmitting ? (
            <>
              <Spinner as="span" animation="border" size="sm" />
              Updating...
            </>
          ) : (
            <>
              <CsLineIcons icon="save" size="18" />
              Update Item
            </>
          )}
        </Button>
      </Modal.Footer>

      <PrintBarcodeModal 
        show={!!printBarcodeData} 
        onHide={() => setPrintBarcodeData(null)} 
        barcodeValue={printBarcodeData?.barcodeValue}
        itemName={printBarcodeData?.itemName}
        variantName={printBarcodeData?.variantName}
      />
    </Modal>
  );
};

export default EditItemModal;
