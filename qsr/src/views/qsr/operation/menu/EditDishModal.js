/* eslint-disable react/no-this-in-sfc, func-names */
import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

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
  .square-delete-btn {
    width: 36px !important;
    min-width: 36px !important;
    height: 36px !important;
    border-radius: 50% !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
  }
`;

const EditDishModal = ({ show, handleClose, data, fetchMenuData, menuData = [] }) => {
  const [previewImg, setPreviewImg] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(data?.quantity != null && data.quantity !== '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

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
      new Set(menuData.flatMap((c) => (c.dishes || []).flatMap((d) => (d.variants || []).map((v) => v.size_name?.trim()).filter(Boolean))))
    ).sort();
  }, [menuData]);

  const extraSuggestions = useMemo(() => {
    return Array.from(new Set(menuData.flatMap((c) => (c.dishes || []).flatMap((d) => (d.variants || []).map((v) => v.extra?.trim()).filter(Boolean))))).sort();
  }, [menuData]);

  const addonSuggestions = useMemo(() => {
    return Array.from(
      new Set(menuData.flatMap((c) => (c.dishes || []).flatMap((d) => (d.addons || []).map((a) => a.addon_name?.trim()).filter(Boolean))))
    ).sort();
  }, [menuData]);

  useEffect(() => {
    if (data?.dish_img) {
      setPreviewImg(`${process.env.REACT_APP_UPLOAD_DIR}${data.dish_img}`);
    }
    if (data?.quantity) {
      setShowAdvancedOptions(true);
    } else {
      setShowAdvancedOptions(false);
    }
    setLoading(false);
  }, [data]);

  const formik = useFormik({
    initialValues: {
      dish_name: data?.dish_name || '',
      description: data?.description || '',
      dish_img: null,
      is_special: data?.is_special || false,
      is_available: data?.is_available ?? true,
      hide_on_kot: data?.hide_on_kot || false,
      variants:
        data?.variants && data.variants.length > 0
          ? data.variants.map((v) => ({
              size_name: v.size_name || '',
              price: v.price || '',
              extra: v.extra || '',
              is_available: v.is_available ?? true,
            }))
          : [{ size_name: '', price: data?.dish_price || '', extra: '', is_available: true }],
      addons: data?.addons || [],
      meal_type: data?.meal_type || 'veg',
    },
    validationSchema: Yup.object().shape({
      dish_name: Yup.string().required('Dish name is required'),
      meal_type: Yup.string().required('Meal type is required'),
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
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('_id', data._id);
        formData.append('dish_name', values.dish_name);
        formData.append('description', values.description);
        formData.append('is_special', values.is_special);
        formData.append('is_available', values.is_available);
        formData.append('hide_on_kot', values.hide_on_kot);
        formData.append('meal_type', values.meal_type);

        let cleanedVariants = [];
        if (Array.isArray(values.variants)) {
          cleanedVariants = values.variants.map((v) => ({
            size_name: v.size_name || '',
            price: Number(v.price) || 0,
            extra: v.extra || '',
            is_available: v.is_available !== false,
          }));
        }
        formData.append('variants', JSON.stringify(cleanedVariants));
        formData.append('dish_price', cleanedVariants[0] ? Number(cleanedVariants[0].price) || 0 : 0);
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

        if (values.dish_img) {
          formData.append('dish_img', values.dish_img);
        }

        await axios.put(`${process.env.REACT_APP_API}/menu/update`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        fetchMenuData();
        toast.success('Dish updated successfully!');
        handleClose();
      } catch (err) {
        console.error('Error updating dish:', err);
        toast.error(err.response?.data?.message || 'Failed to update dish.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!show) {
      formik.resetForm();
      if (data?.dish_img) {
        setPreviewImg(`${process.env.REACT_APP_UPLOAD_DIR}${data.dish_img}`);
      } else {
        setPreviewImg(null);
      }
      setShowAdvancedOptions(data?.quantity != null && data.quantity !== '');
    }
  }, [show, data]);

  if (loading) {
    return (
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading...</p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered size="lg">
      <style>{customStyles}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#23b3f4' }}>
          <CsLineIcons icon="edit" className="me-2" />
          Edit Dish Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <Form id="edit_dish_form" onSubmit={formik.handleSubmit}>
          <Row className="g-3">
            <Col md={5}>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Dish Name</Form.Label>
                <Form.Control
                  type="text"
                  name="dish_name"
                  value={formik.values.dish_name}
                  onChange={formik.handleChange}
                  disabled={isSubmitting}
                  className="pill-input shadow-sm"
                  placeholder="Enter dish name"
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Meal Type</Form.Label>
                <Select
                  classNamePrefix="react-select"
                  options={[
                    { value: 'veg', label: 'Veg' },
                    { value: 'non-veg', label: 'Non-Veg' },
                    { value: 'egg', label: 'Egg' },
                  ]}
                  value={{
                    value: formik.values.meal_type,
                    label: formik.values.meal_type === 'veg' ? 'Veg' : formik.values.meal_type === 'non-veg' ? 'Non-Veg' : 'Egg',
                  }}
                  onChange={(selected) => formik.setFieldValue('meal_type', selected ? selected.value : 'veg')}
                  placeholder="Select type"
                  isDisabled={isSubmitting}
                  styles={selectStyles}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Dish Image</Form.Label>
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
                    id="edit-dish-img"
                    className="d-none"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.currentTarget.files[0];
                      formik.setFieldValue('dish_img', file);
                      if (file) setPreviewImg(URL.createObjectURL(file));
                    }}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="edit-dish-img" className="custom-btn-outline px-3 py-1 rounded-pill small fw-bold cursor-pointer mb-0 mt-2">
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
                  rows={2}
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  disabled={isSubmitting}
                  className="pill-input shadow-sm"
                  style={{ paddingLeft: '1.2rem' }}
                  placeholder="Add dish description..."
                />
              </Form.Group>
            </Col>

            <Col md={4} xs={6}>
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

            <Col md={4} xs={6}>
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

            <Col md={4} xs={6}>
              <div
                className="d-flex align-items-center gap-2 cursor-pointer mb-4"
                onClick={() => formik.setFieldValue('hide_on_kot', !formik.values.hide_on_kot)}
              >
                <div className={`custom-check ${formik.values.hide_on_kot ? 'active' : ''}`}>
                  {formik.values.hide_on_kot && <CsLineIcons icon="check" size="12" className="text-white" />}
                </div>
                <span className="fw-bold text-alternate small text-uppercase">Hide on KOT</span>
              </div>
            </Col>

            <Col md={12} className="mt-3">
              <div className="p-3 rounded-xl border mb-3 bg-white" style={{ borderRadius: '1rem', border: '1px solid #e5e7eb' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-primary mb-0" style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                    SIZES, PRICING & DETAILS
                  </h6>
                  {formik.errors.variants && typeof formik.errors.variants === 'string' && (
                    <div className="text-danger small fw-bold">{formik.errors.variants}</div>
                  )}
                </div>
                <div className="d-flex flex-column gap-2">
                  {(formik.values.variants || []).map((variant, vIdx) => (
                    <Row key={vIdx} className="g-2 align-items-end mb-2">
                      <Col xs={12} sm={4}>
                        <Form.Group>
                          <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                            Size / Variant Name (e.g. Regular, Small)
                          </Form.Label>
                          <CreatableSelect
                            styles={{
                              ...selectStyles,
                              control: (base, state) => ({
                                ...selectStyles.control(base, state),
                                minHeight: '38px',
                                borderRadius: '10px',
                              }),
                            }}
                            isClearable
                            menuPlacement="auto"
                            menuPortalTarget={document.body}
                            options={sizeSuggestions.map((opt) => ({ value: opt, label: opt }))}
                            value={variant.size_name ? { value: variant.size_name, label: variant.size_name } : null}
                            onChange={(selected) => formik.setFieldValue(`variants[${vIdx}].size_name`, selected ? selected.value : '')}
                            placeholder="e.g. Regular"
                          />
                          {formik.errors.variants?.[vIdx]?.size_name && <div className="text-danger small mt-1">{formik.errors.variants[vIdx].size_name}</div>}
                        </Form.Group>
                      </Col>
                      <Col xs={12} sm={3}>
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
                          {formik.errors.variants?.[vIdx]?.price && <div className="text-danger small mt-1">{formik.errors.variants[vIdx].price}</div>}
                        </Form.Group>
                      </Col>
                      <Col xs={10} sm={4}>
                        <Form.Group>
                          <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                            Extra Details (e.g. Serves 1-2)
                          </Form.Label>
                          <CreatableSelect
                            styles={{
                              ...selectStyles,
                              control: (base, state) => ({
                                ...selectStyles.control(base, state),
                                minHeight: '38px',
                                borderRadius: '10px',
                              }),
                            }}
                            isClearable
                            menuPlacement="auto"
                            menuPortalTarget={document.body}
                            options={extraSuggestions.map((opt) => ({ value: opt, label: opt }))}
                            value={variant.extra ? { value: variant.extra, label: variant.extra } : null}
                            onChange={(selected) => formik.setFieldValue(`variants[${vIdx}].extra`, selected ? selected.value : '')}
                            placeholder="e.g. Serves 1-2"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs="auto" className="pb-1">
                        <Button
                          variant="outline-danger"
                          onClick={() => {
                            const newVariants = [...formik.values.variants];
                            newVariants.splice(vIdx, 1);
                            formik.setFieldValue('variants', newVariants);
                          }}
                          disabled={formik.values.variants.length === 1}
                          className="square-delete-btn btn btn-outline-danger"
                        >
                          <CsLineIcons icon="bin" size="14" />
                        </Button>
                      </Col>
                    </Row>
                  ))}
                  <Button
                    type="button"
                    variant="outline-primary"
                    className="custom-btn-outline py-1 px-3 mt-2 d-flex align-items-center gap-1 align-self-start btn btn-outline-primary"
                    style={{ height: '34px', fontSize: '0.8rem', borderRadius: '8px' }}
                    onClick={() => {
                      formik.setFieldValue('variants', [...formik.values.variants, { size_name: '', price: '', extra: '', is_available: true }]);
                    }}
                  >
                    <CsLineIcons icon="plus" size="12" />
                    Add Size/Variant
                  </Button>
                </div>
              </div>
            </Col>

            <Col md={12} className="mt-2">
              <div className="p-3 rounded-xl border mb-3 bg-white" style={{ borderRadius: '1rem', border: '1px solid #e5e7eb' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-primary mb-0" style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                    CONFIGURE ADD-ONS (OPTIONAL)
                  </h6>
                </div>
                <div className="d-flex flex-column gap-2">
                  {(formik.values.addons || []).map((addon, aIdx) => (
                    <Row key={aIdx} className="g-2 align-items-end mb-2">
                      <Col xs={8} sm={6}>
                        <Form.Group>
                          <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                            Add-on Name (e.g. Extra Sauce)
                          </Form.Label>
                          <CreatableSelect
                            styles={{
                              ...selectStyles,
                              control: (base, state) => ({
                                ...selectStyles.control(base, state),
                                minHeight: '38px',
                                borderRadius: '10px',
                              }),
                            }}
                            isClearable
                            menuPlacement="auto"
                            menuPortalTarget={document.body}
                            options={addonSuggestions.map((opt) => ({ value: opt, label: opt }))}
                            value={addon.addon_name ? { value: addon.addon_name, label: addon.addon_name } : null}
                            onChange={(selected) => formik.setFieldValue(`addons[${aIdx}].addon_name`, selected ? selected.value : '')}
                            placeholder="Add-on Name"
                          />
                          {formik.errors.addons?.[aIdx]?.addon_name && <div className="text-danger small mt-1">{formik.errors.addons[aIdx].addon_name}</div>}
                        </Form.Group>
                      </Col>
                      <Col xs={3} sm={4}>
                        <Form.Group>
                          <Form.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                            Price (Extra charge)
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name={`addons[${aIdx}].price`}
                            value={addon.price || ''}
                            onChange={formik.handleChange}
                            placeholder="Price"
                            className="pill-input"
                            style={{ height: '38px', borderRadius: '10px' }}
                            isInvalid={formik.touched.addons?.[aIdx]?.price && !!formik.errors.addons?.[aIdx]?.price}
                          />
                          {formik.errors.addons?.[aIdx]?.price && <div className="text-danger small mt-1">{formik.errors.addons[aIdx].price}</div>}
                        </Form.Group>
                      </Col>
                      <Col xs="auto" className="pb-1">
                        <Button
                          variant="outline-danger"
                          onClick={() => {
                            const newAddons = [...formik.values.addons];
                            newAddons.splice(aIdx, 1);
                            formik.setFieldValue('addons', newAddons);
                          }}
                          className="square-delete-btn btn btn-outline-danger"
                        >
                          <CsLineIcons icon="bin" size="14" />
                        </Button>
                      </Col>
                    </Row>
                  ))}
                  <Button
                    type="button"
                    variant="outline-primary"
                    className="custom-btn-outline py-1 px-3 mt-2 d-flex align-items-center gap-1 align-self-start btn btn-outline-primary"
                    style={{ height: '34px', fontSize: '0.8rem', borderRadius: '8px' }}
                    onClick={() => {
                      formik.setFieldValue('addons', [...formik.values.addons, { addon_name: '', price: '', is_available: true }]);
                    }}
                  >
                    <CsLineIcons icon="plus" size="12" />
                    Add Add-on
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
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
              Update Dish
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditDishModal;
