import React, { useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import axios from 'axios';

const EditDishCategoryModal = ({ show, handleClose, data, fetchMenuData }) => {
    const formik = useFormik({
        initialValues: {
            category: data?.category || '',
            meal_type: data?.meal_type || 'veg',
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                const payload = {
                    category: values.category,
                    meal_type: values.meal_type,
                };

                await axios.put(
                    `${process.env.REACT_APP_API}/menu/update/category/${data.id || data._id}`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                await fetchMenuData();
                handleClose();
            } catch (err) {
                console.error('Error updating category:', err);
            }
        },
    });

    // Optional: log incoming data for debugging
    useEffect(() => {
        if (data) {
            console.log('Edit Category Data:', data);
        }
    }, [data]);

    return (
        <Modal
            className="modal-right large"
            show={show}
            onHide={handleClose}
            backdrop="static"
        >
            <Modal.Header closeButton>
                <Modal.Title>Edit Category</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form id="edit_category_form" onSubmit={formik.handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Dish Category</Form.Label>
                        <Form.Control
                            type="text"
                            name="category"
                            value={formik.values.category}
                            onChange={formik.handleChange}
                            placeholder="Enter category name"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Meal Type</Form.Label>
                        <Form.Select
                            name="meal_type"
                            value={formik.values.meal_type}
                            onChange={formik.handleChange}
                        >
                            <option value="veg">Veg</option>
                            <option value="egg">Egg</option>
                            <option value="non-veg">Non-Veg</option>
                        </Form.Select>
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="dark" type="submit" form="edit_category_form">
                    Update Category
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditDishCategoryModal;
