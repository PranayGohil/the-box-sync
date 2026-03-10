import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useFormik } from 'formik';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import CreatableSelect from 'react-select/creatable';

const EditDishCategoryModal = ({ show, handleClose, data, fetchMenuData }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [counterOptions, setCounterOptions] = useState([]);

    useEffect(() => {
        // Fetch existing counters for the dropdown
        const fetchCounters = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API}/menu/get-counter-options`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                const options = response.data.data.map((counter) => ({
                    value: counter,
                    label: counter,
                }));
                setCounterOptions(options);
            } catch (err) {
                console.error('Error fetching counters:', err);
                toast.error('Failed to load counters.');
            }
        };

        fetchCounters();
    }, []);

    const formik = useFormik({
        initialValues: {
            category: data?.category || '',
            counter: data?.counter || '',
            hide_on_kot: data?.hide_on_kot || false,
            meal_type: data?.meal_type || 'veg',
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            setIsSubmitting(true);
            try {
                const payload = {
                    category: values.category,
                    counter: values.counter,
                    hide_on_kot: values.hide_on_kot,
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
                    <p className="mt-3">Loading...</p>
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
                        <Form.Label>Counter</Form.Label>
                        <CreatableSelect
                            isClearable
                            onChange={(selected) => {
                                const counter = selected ? selected.value : '';
                                formik.setFieldValue('counter', counter);
                            }}
                            options={counterOptions}
                            value={counterOptions.find((option) => option.value === formik.values.counter) || null}
                            placeholder="Select or create a counter"
                            isDisabled={isSubmitting}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            label="Hide on KOT"
                            checked={formik.values.hide_on_kot}
                            onChange={() => formik.setFieldValue('hide_on_kot', !formik.values.hide_on_kot)}
                            disabled={isSubmitting}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="dark" onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
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
                        'Update'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditDishCategoryModal;