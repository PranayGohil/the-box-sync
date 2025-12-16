import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useFormik } from 'formik';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

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
          <p className="mt-3">Loading dish data...</p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal className="modal-right large" show={show} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <CsLineIcons icon="edit" className="me-2" />
          Edit Dish
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form id="edit_dish_form" onSubmit={formik.handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Dish Name</Form.Label>
            <Form.Control
              type="text"
              name="dish_name"
              value={formik.values.dish_name}
              onChange={formik.handleChange}
              disabled={isSubmitting}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Dish Price</Form.Label>
            <Form.Control
              type="text"
              name="dish_price"
              value={formik.values.dish_price}
              onChange={formik.handleChange}
              disabled={isSubmitting}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              disabled={isSubmitting}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Dish Image</Form.Label>
            <Form.Control
              type="file"
              name="dish_img"
              accept="image/*"
              onChange={(e) => {
                const file = e.currentTarget.files[0];
                formik.setFieldValue('dish_img', file);
                if (file) setPreviewImg(URL.createObjectURL(file));
              }}
              disabled={isSubmitting}
            />
            {previewImg && (
              <div className="mt-2">
                <img src={previewImg} alt="Preview" className="img-thumbnail" style={{ maxWidth: '100px' }} />
                <small className="text-muted d-block">Image preview</small>
              </div>
            )}
          </Form.Group>

          <Form.Check
            type="checkbox"
            label="Advanced Options"
            checked={showAdvancedOptions}
            onChange={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="mb-3"
            disabled={isSubmitting}
          />

          {showAdvancedOptions && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                  type="text"
                  name="quantity"
                  value={formik.values.quantity}
                  onChange={formik.handleChange}
                  disabled={isSubmitting}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Unit</Form.Label>
                <Form.Select
                  name="unit"
                  value={formik.values.unit}
                  onChange={formik.handleChange}
                  disabled={isSubmitting}
                >
                  <option value="">Select Unit</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="litre">litre</option>
                  <option value="ml">ml</option>
                  <option value="piece">piece</option>
                </Form.Select>
              </Form.Group>
            </>
          )}

          <Form.Check
            type="checkbox"
            label="Special Dish"
            checked={formik.values.is_special}
            onChange={(e) => formik.setFieldValue('is_special', e.target.checked)}
            className="mb-3"
            disabled={isSubmitting}
          />
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="dark"
          type="submit"
          form="edit_dish_form"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Updating...
            </>
          ) : (
            'Update Dish'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditDishModal;