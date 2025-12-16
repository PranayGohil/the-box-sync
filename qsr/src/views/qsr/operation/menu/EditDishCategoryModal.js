import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useFormik } from 'formik';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const EditDishCategoryModal = ({ show, handleClose, data, fetchMenuData }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const formik = useFormik({
        initialValues: {
            category: data?.category || '',
            meal_type: data?.meal_type || 'veg',
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            setIsSubmitting(true);
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
                toast.success('Category updated successfully!');
                handleClose();
            } catch (err) {
                console.error('Error updating category:', err);
                toast.error(err.response?.data?.message || 'Failed to update category.');
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    useEffect(() => {
        if (data) {
            setLoading(false);
        }
    }, [data]);

    if (loading) {
        return (
            <Modal show={show} onHide={handleClose} centered>
                <Modal.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading category data...</p>
                </Modal.Body>
            </Modal>
        );
    }

    return (
        <Modal
            className="modal-right large"
            show={show}
            onHide={handleClose}
            backdrop="static"
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <CsLineIcons icon="edit" className="me-2" />
                    Edit Category
                </Modal.Title>
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
                            disabled={isSubmitting}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Meal Type</Form.Label>
                        <div className="d-flex gap-3">
                            {['veg', 'egg', 'non-veg'].map((type) => (
                                <Form.Check
                                    inline
                                    key={type}
                                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                                    name="meal_type"
                                    type="radio"
                                    id={`meal-${type}`}
                                    checked={formik.values.meal_type === type}
                                    onChange={() => formik.setFieldValue('meal_type', type)}
                                    disabled={isSubmitting}
                                />
                            ))}
                        </div>
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
                    form="edit_category_form"
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
                        'Update Category'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditDishCategoryModal;