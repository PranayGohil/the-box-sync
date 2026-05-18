import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner, Row, Col } from 'react-bootstrap';
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

    const selectStyles = {
        control: (base, state) => ({
            ...base,
            borderRadius: '12px',
            padding: '4px',
            border: state.isFocused ? '1px solid #1ea8e7' : '1px solid #e5e7eb',
            boxShadow: state.isFocused ? '0 0 0 4px rgba(30, 168, 231, 0.1)' : 'none',
            backgroundColor: '#fff',
            '&:hover': { border: '1px solid #1ea8e7' },
        }),
    };

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
        <Modal show={show} onHide={handleClose} backdrop="static" centered size="lg">
            
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold" style={{ color: '#1ea8e7' }}>
                    <CsLineIcons icon="edit" className="me-2" />
                    Edit Category Details
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="py-4">
                <Form id="edit_category_form" onSubmit={formik.handleSubmit}>
                    <Row className="g-4">
                        <Col md={12}>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-3">Meal Type</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                {['veg', 'egg', 'non-veg'].map((type) => (
                                    <div
                                        key={type}
                                        className={`edit-dish-category-modal-radio-pill ${formik.values.meal_type === type ? 'active' : ''}`}
                                        onClick={() => formik.setFieldValue('meal_type', type)}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </div>
                                ))}
                            </div>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Category Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="category"
                                    value={formik.values.category}
                                    onChange={formik.handleChange}
                                    placeholder="e.g. Main Course"
                                    disabled={isSubmitting}
                                    className="edit-dish-category-modal-pill-input shadow-sm"
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Counter</Form.Label>
                                <CreatableSelect
                                    isClearable
                                    onChange={(selected) => {
                                        const counter = selected ? selected.value : '';
                                        formik.setFieldValue('counter', counter);
                                    }}
                                    options={counterOptions}
                                    value={counterOptions.find((option) => option.value === formik.values.counter) || (formik.values.counter ? { value: formik.values.counter, label: formik.values.counter } : null)}
                                    placeholder="Select counter"
                                    isDisabled={isSubmitting}
                                    styles={selectStyles}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <div 
                                className="d-flex align-items-center gap-2 cursor-pointer"
                                onClick={() => formik.setFieldValue('hide_on_kot', !formik.values.hide_on_kot)}
                            >
                                <div className={`edit-dish-category-modal-custom-check ${formik.values.hide_on_kot ? 'active' : ''}`}>
                                    {formik.values.hide_on_kot && <CsLineIcons icon="check" size="12" className="text-white" />}
                                </div>
                                <span className="fw-bold text-alternate small text-uppercase">Hide on KOT</span>
                            </div>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button 
                    variant="outline-light" 
                    onClick={handleClose} 
                    disabled={isSubmitting}
                    className="rounded-pill px-4 fw-bold edit-dish-category-modal-custom-btn-outline btn btn-outline-primary"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="edit_category_form"
                    disabled={isSubmitting}
                    className="px-5 py-2 edit-dish-category-modal-custom-btn-outline d-flex align-items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" />
                            Updating...
                        </>
                    ) : (
                        <>
                            <CsLineIcons icon="save" size="18" />
                            Update Category
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditDishCategoryModal;