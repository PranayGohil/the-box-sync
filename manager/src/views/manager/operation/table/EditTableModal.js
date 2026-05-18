import React, { useState } from 'react';
import axios from 'axios';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
  .edit-table-modal-pill-input {
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
  .edit-table-modal-pill-input:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
    outline: none !important;
  }
  .edit-table-modal-custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .edit-table-modal-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .edit-table-modal-custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
`;

const EditTableModal = ({ show, handleClose, data, onUpdateSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();

  const formik = useFormik({
    initialValues: {
      table_no: data?.table_no || '',
      max_person: data?.max_person || '',
    },
    validationSchema: Yup.object({
      table_no: Yup.string().required('Table No is required'),
      max_person: Yup.number().required('Max Person is required'),
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        await axios.put(`${process.env.REACT_APP_API}/table/update/${data?.id}`, {
          table_no: values.table_no,
          max_person: values.max_person,
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        handleClose();
        toast.success('Table updated successfully!');
        onUpdateSuccess();
      } catch (err) {
        console.error("Edit failed:", err);
        setError(err.response?.data?.message || 'Failed to update table.');
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
          Edit Table Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <Form id="edit_table_form" onSubmit={formik.handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Table Number</Form.Label>
            <Form.Control
              type="text"
              name="table_no"
              placeholder="e.g. T-01"
              value={formik.values.table_no}
              onChange={formik.handleChange}
              disabled={isSubmitting}
              className="edit-table-modal-pill-input shadow-sm bg-white"
            />
            {formik.touched.table_no && formik.errors.table_no && (
              <div className="text-danger small mt-1 fw-bold">{formik.errors.table_no}</div>
            )}
          </Form.Group>
          
          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Max Capacity</Form.Label>
            <Form.Control
              type="number"
              name="max_person"
              placeholder="0"
              value={formik.values.max_person}
              onChange={formik.handleChange}
              disabled={isSubmitting}
              className="edit-table-modal-pill-input shadow-sm bg-white"
            />
            {formik.touched.max_person && formik.errors.max_person && (
              <div className="text-danger small mt-1 fw-bold">{formik.errors.max_person}</div>
            )}
          </Form.Group>
          
          {error && (
            <div className='text-danger bg-light-danger p-2 rounded small fw-bold mb-3'>
              <CsLineIcons icon="error" size="14" className="me-2" />
              {error}
            </div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button 
          variant="outline-light"
          onClick={handleClose} 
          disabled={isSubmitting}
          className="rounded-pill px-4 fw-bold edit-table-modal-custom-btn-outline btn btn-outline-primary"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit_table_form"
          disabled={isSubmitting}
          className="rounded-pill px-4 fw-bold edit-table-modal-custom-btn-outline d-flex align-items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <div className="d-flex align-items-center justify-content-center">
              <CsLineIcons icon="save" size="16" className="me-2" stroke="currentColor" />
              Update Table
            </div>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditTableModal;