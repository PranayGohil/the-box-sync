import React, { useState } from 'react';
import axios from 'axios';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';



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
        setError(err.response?.data?.message || 'Failed to update table.')
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered>
      
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#1ea8e7' }}>
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
              className="shadow-sm"
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
              className="shadow-sm"
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
          onClick={handleClose} 
          disabled={isSubmitting}
          className="rounded-pill px-4 fw-bold edit-table-modal-custom-btn-outline"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit_table_form"
          disabled={isSubmitting}
          className="rounded-pill px-4 fw-bold edit-table-modal-custom-btn-outline"
        >
          {isSubmitting ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <div className="d-flex align-items-center">
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