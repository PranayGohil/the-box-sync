import React, { useState } from 'react';
import axios from 'axios';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
  .edit-table-area-modal-pill-input {
    border-radius: 12px !important;
    padding: 0.7rem 1.2rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
    font-size: 1rem !important;
    font-weight: 600 !important;
    color: #334155 !important;
    height: 48px !important;
  }
  .edit-table-area-modal-pill-input:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
    outline: none !important;
  }
  .edit-table-area-modal-custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .edit-table-area-modal-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .edit-table-area-modal-custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
`;

const EditTableAreaModal = ({ show, handleClose, data, onUpdateSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      area: data?.area || ''
    },
    validationSchema: Yup.object({
      area: Yup.string().required('Area name is required')
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        await axios.put(`${process.env.REACT_APP_API}/table/update/area/${data?.id}`, {
          area: values.area
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        handleClose();
        toast.success('Table area updated successfully!');
        onUpdateSuccess();
      } catch (err) {
        console.error("Edit failed:", err);
        toast.error(err.response?.data?.message || 'Failed to update table area.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered>
      <style>{customStyles}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#23b3f4' }}>
          Edit Dining Area
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <Form id="edit_table_area_form" onSubmit={formik.handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Area Name</Form.Label>
            <Form.Control
              type="text"
              name="area"
              placeholder="e.g. Terrace"
              value={formik.values.area}
              onChange={formik.handleChange}
              disabled={isSubmitting}
              className="edit-table-area-modal-pill-input shadow-sm bg-white"
            />
            {formik.touched.area && formik.errors.area && (
              <div className="text-danger small mt-1 fw-bold">{formik.errors.area}</div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button 
          variant="outline-light"
          onClick={handleClose} 
          disabled={isSubmitting}
          className="rounded-pill px-4 fw-bold edit-table-area-modal-custom-btn-outline btn btn-outline-primary"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit_table_area_form"
          disabled={isSubmitting}
          className="rounded-pill px-4 fw-bold edit-table-area-modal-custom-btn-outline d-flex align-items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <div className="d-flex align-items-center justify-content-center">
              <CsLineIcons icon="save" size="16" className="me-2" stroke="currentColor" />
              Update Area
            </div>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditTableAreaModal;