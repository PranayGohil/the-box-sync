import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import { useFormik } from 'formik';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Select from 'react-select';

const customStyles = `
  .pill-input {
    border-radius: 12px !important;
    padding: 0.7rem 1.2rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
  }
  .pill-input:focus {
    border-color: #1ea8e7 !important;
    box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.1) !important;
    outline: none !important;
  }
  .custom-btn-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .custom-btn-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
  }
  .custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .modal-footer {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-end !important;
    gap: 0.75rem !important;
    border-top: none !important;
    padding: 1.5rem !important;
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
    background: #1ea8e7 !important;
    border-color: #1ea8e7 !important;
  }
`;

const EditDishModal = ({ show, handleClose, data, fetchMenuData }) => {
  const [previewImg, setPreviewImg] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(data?.quantity != null && data.quantity !== '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

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
      dish_price: data?.dish_price || '',
      description: data?.description || '',
      quantity: data?.quantity || '',
      unit: data?.unit || '',
      dish_img: null,
      is_special: data?.is_special || false,
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('_id', data._id);
        formData.append('dish_name', values.dish_name);
        formData.append('dish_price', values.dish_price);
        formData.append('description', values.description);
        formData.append('quantity', values.quantity);
        formData.append('unit', values.unit);
        formData.append('is_special', values.is_special);

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
        <Modal.Title className="fw-bold" style={{ color: '#1ea8e7' }}>
          <CsLineIcons icon="edit" className="me-2" />
          Edit Dish Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <Form id="edit_dish_form" onSubmit={formik.handleSubmit}>
          <Row className="g-3">
            <Col md={8}>
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

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Dish Price</Form.Label>
                <Form.Control
                  type="text"
                  name="dish_price"
                  value={formik.values.dish_price}
                  onChange={formik.handleChange}
                  disabled={isSubmitting}
                  className="pill-input shadow-sm"
                  placeholder="0.00"
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

            <Col md={6} xs={12}>
              <div 
                className="d-flex align-items-center gap-2 cursor-pointer mb-4"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                <div className={`custom-check ${showAdvancedOptions ? 'active' : ''}`}>
                  {showAdvancedOptions && <CsLineIcons icon="check" size="12" className="text-white" />}
                </div>
                <span className="fw-bold text-alternate small text-uppercase">Advanced Options</span>
              </div>
            </Col>

            <Col md={6} xs={12}>
              <div 
                className="d-flex align-items-center gap-2 cursor-pointer mb-4"
                onClick={() => formik.setFieldValue('is_special', !formik.values.is_special)}
              >
                <div className={`custom-check ${formik.values.is_special ? 'active' : ''}`}>
                  {formik.values.is_special && <CsLineIcons icon="check" size="12" className="text-white" />}
                </div>
                <span className="fw-bold text-alternate small text-uppercase">Special Dish</span>
              </div>
            </Col>

            {showAdvancedOptions && (
              <>
                <Col xs={6} md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Quantity</Form.Label>
                    <Form.Control
                      type="text"
                      name="quantity"
                      value={formik.values.quantity}
                      onChange={formik.handleChange}
                      disabled={isSubmitting}
                      className="pill-input shadow-sm"
                      placeholder="e.g. 1"
                    />
                  </Form.Group>
                </Col>
                <Col xs={6} md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Unit</Form.Label>
                    <Select
                      classNamePrefix="react-select"
                      menuPlacement="auto"
                      menuPortalTarget={document.body}
                      options={[
                        { value: 'kg', label: 'kg' },
                        { value: 'g', label: 'g' },
                        { value: 'litre', label: 'litre' },
                        { value: 'ml', label: 'ml' },
                        { value: 'piece', label: 'piece' },
                        { value: 'plate', label: 'Plate' },
                        { value: 'portion', label: 'Portion' },
                      ]}
                      value={formik.values.unit ? { value: formik.values.unit, label: formik.values.unit } : null}
                      onChange={(selected) => formik.setFieldValue('unit', selected ? selected.value : '')}
                      placeholder="Select Unit"
                      isDisabled={isSubmitting}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          minHeight: '45px',
                          border: state.isFocused ? '1px solid #1ea8e7' : '1px solid #e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 4px rgba(30, 168, 231, 0.1)' : 'none',
                          backgroundColor: '#fff',
                          '&:hover': { border: '1px solid #1ea8e7' },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                          border: '1px solid #e5e7eb',
                          zIndex: 9999,
                        }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected ? '#1ea8e7' : state.isFocused ? '#f0f9ff' : 'white',
                          color: state.isSelected ? 'white' : '#333',
                          padding: '10px 15px',
                          '&:active': { backgroundColor: '#1ea8e7', color: 'white' },
                        })
                      }}
                    />
                  </Form.Group>
                </Col>
              </>
            )}
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
        <Button
          type="submit"
          form="edit_dish_form"
          disabled={isSubmitting}
          className="px-5 py-2 custom-btn-outline d-flex align-items-center gap-2"
        >
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