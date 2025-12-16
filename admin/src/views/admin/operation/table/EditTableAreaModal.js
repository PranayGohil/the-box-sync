import React, { useState } from 'react';
import axios from 'axios';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const EditTableAreaModal = ({ show, handleClose, data, onUpdateSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      area: data?.area || ''
    },
    validationSchema: Yup.object({
      area: Yup.string().required('Table No is required')
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
    <Modal className="modal-right large" show={show} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <CsLineIcons icon="edit" className="me-2" />
          Edit Table Area
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form id="edit_table_form" onSubmit={formik.handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Area</Form.Label>
            <Form.Control
              type="text"
              name="area"
              value={formik.values.area}
              onChange={formik.handleChange}
              disabled={isSubmitting}
            />
            <small className="text-danger ms-2 fw-bold">
              {formik.errors.area}
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

export default EditTableAreaModal;