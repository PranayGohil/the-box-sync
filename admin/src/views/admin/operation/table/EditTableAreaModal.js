import React, { useState } from 'react';
import axios from 'axios';
import { Button, Form, Modal } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

const EditTableAreaModal = ({ show, handleClose, data, onUpdateSuccess }) => {

  const formik = useFormik({
    initialValues: {
      area: data?.area || ''
    },
    validationSchema: Yup.object({
      area: Yup.string().required('Table No is required')
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      console.log(values);
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
        onUpdateSuccess();
      } catch (err) {
        console.error("Edit failed:", err);
        toast.error('Failed to update table.');
      }
    },
  });

  return (
    <Modal className="modal-right large" show={show} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Edit Table</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form id="edit_table_form" onSubmit={formik.handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Area</Form.Label>
            <Form.Control type="text" name="area" value={formik.values.area} onChange={formik.handleChange} />
            <small className="text-danger ms-2 fw-bold">
              {formik.errors.area}
            </small>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="dark" type="submit" form="edit_table_form">
          Update Table
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditTableAreaModal;