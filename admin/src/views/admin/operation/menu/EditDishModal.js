
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';

const EditDishModal = ({ show, handleClose, data }) => {
    const [previewImg, setPreviewImg] = useState(null);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(!!data?.quantity);

    const formik = useFormik({
        initialValues: {
            dish_name: data?.dish_name || '',
            dish_price: data?.dish_price || '',
            description: data?.description || '',
            quantity: data?.quantity || '',
            unit: data?.unit || '',
            dish_img: data?.dish_img || null,
            is_special: data?.is_special || false,
        },
        enableReinitialize: true,
        onSubmit: (values) => {
            console.log('Updated dish:', values);
            handleClose();
        },
    });

    return (
        <Modal className="modal-right large" show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Edit Dish</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form id="edit_dish_form" onSubmit={formik.handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Dish Name</Form.Label>
                        <Form.Control type="text" name="dish_name" value={formik.values.dish_name} onChange={formik.handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Dish Price</Form.Label>
                        <Form.Control type="text" name="dish_price" value={formik.values.dish_price} onChange={formik.handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" name="description" value={formik.values.description} onChange={formik.handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Dish Image</Form.Label>
                        <Form.Control
                            type="file"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                formik.setFieldValue('dish_img', file);
                                if (file) setPreviewImg(URL.createObjectURL(file));
                            }}
                        />
                        {previewImg && <img src={previewImg} alt="Preview" className="img-thumbnail mt-2" style={{ maxWidth: '100px' }} />}
                    </Form.Group>
                    <Form.Check
                        type="checkbox"
                        label="Advanced Options"
                        checked={showAdvancedOptions}
                        onChange={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        className="mb-3"
                    />
                    {showAdvancedOptions && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Quantity</Form.Label>
                                <Form.Control type="text" name="quantity" value={formik.values.quantity} onChange={formik.handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Unit</Form.Label>
                                <Form.Select name="unit" value={formik.values.unit} onChange={formik.handleChange}>
                                    <option value="">Select Unit</option>
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="litre">litre</option>
                                    <option value="ml">ml</option>
                                    <option value="piece">piece</option>
                                </Form.Select>
                            </Form.Group>
                        </>
                    )}
                    <Form.Check
                        type="checkbox"
                        label="Special Dish"
                        checked={formik.values.is_special}
                        onChange={(e) => formik.setFieldValue('is_special', e.target.checked)}
                        className="mb-3"
                    />
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="dark" type="submit" form="edit_dish_form">
                    Update Dish
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditDishModal;