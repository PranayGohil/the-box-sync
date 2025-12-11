import React, { useState } from 'react';
import axios from 'axios';
import { Button, Form, Modal } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

const EditTableModal = ({ show, handleClose, data, onUpdateSuccess }) => {

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
            <Form.Label>Table No</Form.Label>
            <Form.Control type="text" name="table_no" value={formik.values.table_no} onChange={formik.handleChange} />
            <small className="text-danger ms-2 fw-bold">
              {formik.errors.table_no}
            </small>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Max Person</Form.Label>
            <Form.Control type="text" name="max_person" value={formik.values.max_person} onChange={formik.handleChange} />
           <small className="text-danger ms-2 fw-bold">
              {formik.errors.max_person}
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

export default EditTableModal;