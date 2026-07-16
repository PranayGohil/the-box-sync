import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner, Row, Col, Alert } from 'react-bootstrap';
import { useFormik } from 'formik';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import CreatableSelect from 'react-select/creatable';

const customStyles = `
  .edit-item-category-modal-pill-input {
    border-radius: 12px !important;
    padding: 0.7rem 1.2rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
    font-size: 1rem !important;
    font-weight: 600 !important;
    color: #334155 !important;
    height: 48px !important;
  }
  .edit-item-category-modal-pill-input:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
    outline: none !important;
  }
  .edit-item-category-modal-custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .edit-item-category-modal-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .edit-item-category-modal-custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .modal-footer {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.75rem !important;
    border-top: none !important;
    padding: 1.5rem !important;
  }
  .modal-footer .btn {
    width: 100% !important;
    margin: 0 !important;
  }
  @media (min-width: 576px) {
    .modal-footer {
      flex-direction: row !important;
      justify-content: flex-end !important;
    }
    .modal-footer .btn {
      width: auto !important;
    }
  }
  @media (max-width: 575px) {
    .modal-dialog {
      margin: 0.5rem !important;
    }
    .modal-body {
      padding: 1rem !important;
    }
    .modal-header {
      padding: 1rem 1rem 0 1rem !important;
    }
  }
  .edit-item-category-modal-radio-pill {
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 50px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 0.8rem;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  @media (max-width: 575px) {
    .edit-item-category-modal-radio-pill {
      flex: 1 1 0% !important;
      justify-content: center !important;
      font-size: 0.75rem !important;
      padding: 6px 8px !important;
    }
  }
  @media (min-width: 576px) {
    .edit-item-category-modal-radio-pill {
      padding: 8px 16px;
      gap: 8px;
      font-size: 0.85rem;
    }
  }
  .edit-item-category-modal-radio-pill:hover {
    background: #f9fafb;
  }
  .edit-item-category-modal-radio-pill.active.veg {
    background: #ecfdf5;
    border-color: #10b981;
    color: #047857;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  }
  .edit-item-category-modal-radio-pill.active.egg {
    background: #fffbeb;
    border-color: #f59e0b;
    color: #b45309;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
  }
  .edit-item-category-modal-radio-pill.active.non-veg {
    background: #fef2f2;
    border-color: #ef4444;
    color: #b91c1c;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
  }
  .edit-item-category-modal-custom-check {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  .edit-item-category-modal-custom-check.active {
    background: #23b3f4 !important;
    border-color: #23b3f4 !important;
  }
`;

const EditItemCategoryModal = ({ show, handleClose, data, fetchCatalogData, storePreferences }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [counterOptions, setCounterOptions] = useState([]);
    const [submissionError, setSubmissionError] = useState(null);

    useEffect(() => {
        const fetchCounters = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API}/catalog/get-counter-options`, {
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
            is_food_category: data?.is_food_category || false,
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            setIsSubmitting(true);
            setSubmissionError(null);
            try {
                const payload = {
                    category: values.category,
                    counter: values.counter,
                    hide_on_kot: values.hide_on_kot,
                };
                
                if (storePreferences === 'optional') {
                    payload.is_food_category = values.is_food_category;
                }

                await axios.put(
                    `${process.env.REACT_APP_API}/catalog/update/category/${data.id || data._id}`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                await fetchCatalogData();
                toast.success('Category updated successfully!');
                handleClose();
            } catch (err) {
                console.error('Error updating category:', err);
                const errMsg = err.response?.data?.message || 'Failed to update category.';
                setSubmissionError(errMsg);
                toast.error(errMsg);
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

    useEffect(() => {
        if (!show) {
            formik.resetForm();
            setSubmissionError(null);
        }
    }, [show]);

    const selectStyles = {
        control: (base, state) => ({
            ...base,
            borderRadius: '12px',
            padding: '4px',
            border: state.isFocused ? '1px solid #23b3f4' : '1px solid #e5e7eb',
            boxShadow: state.isFocused ? '0 0 0 4px rgba(35, 179, 244, 0.1)' : 'none',
            backgroundColor: '#fff',
            '&:hover': { border: '1px solid #23b3f4' },
        }),
    };

    if (loading) {
        return (
            <Modal show={show} onHide={handleClose} centered>
                <Modal.Body className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#23b3f4' }} />
                    <p className="mt-3 text-muted fw-bold">Loading details...</p>
                </Modal.Body>
            </Modal>
        );
    }

    return (
        <Modal show={show} onHide={handleClose} backdrop="static" centered size="lg">
            <style>{customStyles}</style>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold" style={{ color: '#23b3f4' }}>
                    <CsLineIcons icon="edit" className="me-2" />
                    Edit Category Details
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="py-4">
                {submissionError && (
                    <Alert variant="danger" className="mb-4 shadow-sm border-0 d-flex align-items-center gap-2" style={{ borderRadius: '12px' }}>
                        <CsLineIcons icon="error-hexagon" size="18" className="text-danger" />
                        <span className="small fw-bold text-danger">{submissionError}</span>
                    </Alert>
                )}
                <Form id="edit_category_form" onSubmit={formik.handleSubmit}>
                    <Row className="g-4">
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
                                    className="edit-item-category-modal-pill-input shadow-sm"
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

                        {/* <Col md={12}>
                            <div 
                                className="d-flex align-items-center gap-2 cursor-pointer"
                                onClick={() => formik.setFieldValue('hide_on_kot', !formik.values.hide_on_kot)}
                            >
                                <div className={`edit-item-category-modal-custom-check ${formik.values.hide_on_kot ? 'active' : ''}`}>
                                    {formik.values.hide_on_kot && <CsLineIcons icon="check" size="12" className="text-white" />}
                                </div>
                                <span className="fw-bold text-alternate small text-uppercase">Hide on KOT</span>
                            </div>
                        </Col> */}
                        {storePreferences === 'optional' && (
                            <Col md={12} className="mt-4">
                                <div className="d-flex align-items-center p-3 border rounded bg-light cursor-pointer" onClick={() => formik.setFieldValue('is_food_category', !formik.values.is_food_category)}>
                                    <div className={`edit-item-category-modal-custom-check ${formik.values.is_food_category ? 'active' : ''}`}>
                                        {formik.values.is_food_category && <CsLineIcons icon="check" size="12" className="text-white" />}
                                    </div>
                                    <div className="ms-3">
                                        <div className="fw-bold text-dark">This is a Food Category</div>
                                        <div className="text-muted small">Check this if items in this category need Veg/Non-Veg options.</div>
                                    </div>
                                </div>
                            </Col>
                        )}
                    </Row>
                </Form>
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button
                    variant="outline-light"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="rounded-pill px-4 fw-bold edit-item-category-modal-custom-btn-outline btn btn-outline-primary"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="edit_category_form"
                    disabled={isSubmitting}
                    className="px-5 py-2 edit-item-category-modal-custom-btn-outline d-flex align-items-center justify-content-center gap-2"
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

export default EditItemCategoryModal;