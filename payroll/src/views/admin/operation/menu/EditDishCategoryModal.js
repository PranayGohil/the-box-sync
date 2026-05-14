import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import { useFormik } from 'formik';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import CreatableSelect from 'react-select/creatable';

const customStyles = `
  .pill-input {
    border-radius: 12px !important;
    padding: 0.7rem 1.2rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
  }
  .pill-input:focus {
    border-color: #1ea8e7 !important;
    box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.1) !important;
    outline: none !important;
  }
  .custom-btn-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .custom-btn-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
  }
  .custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .modal-footer {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-end !important;
    gap: 0.75rem !important;
    border-top: none !important;
    padding: 1.5rem !important;
  }
  .custom-check {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  .custom-check.active {
    background: #1ea8e7 !important;
    border-color: #1ea8e7 !important;
  }
  .radio-pill {
    padding: 0.5rem 1.2rem;
    border-radius: 50px;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
    font-size: 0.85rem;
    color: #6b7280;
  }
  .radio-pill.active {
    background: #1ea8e7;
    color: #fff;
    border-color: #1ea8e7;
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.2);
  }
`;

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
            <style>{customStyles}</style>
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
                                        className={`radio-pill ${formik.values.meal_type === type ? 'active' : ''}`}
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
                                    className="pill-input shadow-sm"
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
                                <div className={`custom-check ${formik.values.hide_on_kot ? 'active' : ''}`}>
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
                    className="rounded-pill px-4 fw-bold custom-btn-outline btn btn-outline-primary"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="edit_category_form"
                    disabled={isSubmitting}
                    className="px-5 py-2 custom-btn-outline d-flex align-items-center gap-2"
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