import React, { useState } from 'react';
import axios from 'axios';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const EditTableModal = ({ show, handleClose, data, onUpdateSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        toast.error(err.response?.data?.message || 'Failed to update table.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Modal className="modal-right large" show={show} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <CsLineIcons icon="edit" className="me-2" />
          Edit Table
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form id="edit_table_form" onSubmit={formik.handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Table No</Form.Label>
            <Form.Control
              type="text"
              name="table_no"
              value={formik.values.table_no}
              onChange={formik.handleChange}
              disabled={isSubmitting}
            />
            <small className="text-danger ms-2 fw-bold">
              {formik.errors.table_no}
            </small>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Max Person</Form.Label>
            <Form.Control
              type="number"
              name="max_person"
              value={formik.values.max_person}
              onChange={formik.handleChange}
              disabled={isSubmitting}
            />
            <small className="text-danger ms-2 fw-bold">
              {formik.errors.max_person}
            </small>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="dark"
          type="submit"
          form="edit_table_form"
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
          ) : 'Update Table'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditTableModal;