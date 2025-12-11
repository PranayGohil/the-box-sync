import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import { useFormik } from 'formik';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const EditRoomModal = ({ show, handleClose, data, fetchRoomData }) => {
    const [roomImages, setRoomImages] = useState([]);
    const [thumbnailIndex, setThumbnailIndex] = useState(0);
    const [newImages, setNewImages] = useState([]);
    const [categories, setCategories] = useState([]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API}/room/category/get`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setCategories(res.data.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    useEffect(() => {
        if (data?.room_imgs) {
            const existingImages = data.room_imgs.map((img) => ({
                image: img.image,
                is_thumbnail: img.is_thumbnail,
                preview: `${process.env.REACT_APP_UPLOAD_DIR}${img.image}`,
                isExisting: true,
            }));
            setRoomImages(existingImages);
            const thumbIndex = existingImages.findIndex((img) => img.is_thumbnail);
            setThumbnailIndex(thumbIndex >= 0 ? thumbIndex : 0);
        }
        fetchCategories();
        console.log('Edit Room Data:', data);
    }, [data]);

    const formik = useFormik({
        initialValues: {
            room_name: data?.room_name || '',
            room_no: data?.room_no || '',
            category: data?.category?._id || data?.category || '',
            room_details: data?.room_details || '',
            max_person: data?.max_person || '',
            room_price: data?.room_price || '',
            room_status: data?.room_status || 'Available',
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                const formData = new FormData();
                
                formData.append('room_name', values.room_name);
                formData.append('room_no', values.room_no);
                formData.append('category', values.category);
                formData.append('room_details', values.room_details);
                formData.append('max_person', values.max_person);
                formData.append('room_price', values.room_price);
                formData.append('room_status', values.room_status);

                // Send existing images data
                const existingImages = roomImages
                    .filter((img) => img.isExisting)
                    .map((img) => ({
                        image: img.image,
                        is_thumbnail: img.is_thumbnail,
                    }));
                formData.append('existing_images', JSON.stringify(existingImages));

                // Append new images
                newImages.forEach((img) => {
                    formData.append('room_imgs', img.file);
                });

                formData.append('thumbnail_index', thumbnailIndex);

                await axios.put(`${process.env.REACT_APP_API}/room/update/${data._id}`, formData, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                fetchRoomData();
                handleClose();
            } catch (err) {
                console.error('Error updating room:', err);
                toast.error('Error updating room');
            }
        },
    });

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const uploadedImages = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            is_thumbnail: false,
            isExisting: false,
        }));
        setRoomImages([...roomImages, ...uploadedImages]);
        setNewImages([...newImages, ...uploadedImages]);
    };

    const removeImage = (index) => {
        const updatedImages = roomImages.filter((_, i) => i !== index);

        // Update new images array if it's a new image
        if (!roomImages[index].isExisting) {
            const newImagesUpdated = newImages.filter((img) => img.preview !== roomImages[index].preview);
            setNewImages(newImagesUpdated);
        }

        // Update thumbnail index
        if (thumbnailIndex === index) {
            setThumbnailIndex(0);
            if (updatedImages.length > 0) {
                updatedImages[0].is_thumbnail = true;
            }
        } else if (thumbnailIndex > index) {
            setThumbnailIndex(thumbnailIndex - 1);
        }

        setRoomImages(updatedImages);
    };

    const setAsThumbnail = (index) => {
        const updatedImages = roomImages.map((img, i) => ({
            ...img,
            is_thumbnail: i === index,
        }));
        setRoomImages(updatedImages);
        setThumbnailIndex(index);
    };

    return (
        <Modal className="modal-right large" show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Edit Room</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Form id="edit_room_form" onSubmit={formik.handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Room Name</Form.Label>
                        <Form.Control
                            type="text"
                            name="room_name"
                            value={formik.values.room_name}
                            onChange={formik.handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Room Number</Form.Label>
                        <Form.Control
                            type="text"
                            name="room_no"
                            value={formik.values.room_no}
                            onChange={formik.handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                            name="category"
                            value={formik.values.category}
                            onChange={formik.handleChange}
                        >
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.category}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Room Details</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="room_details"
                            value={formik.values.room_details}
                            onChange={formik.handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Max Person</Form.Label>
                        <Form.Control
                            type="number"
                            name="max_person"
                            value={formik.values.max_person}
                            onChange={formik.handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Room Price</Form.Label>
                        <Form.Control
                            type="number"
                            name="room_price"
                            value={formik.values.room_price}
                            onChange={formik.handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Room Status</Form.Label>
                        <Form.Select
                            name="room_status"
                            value={formik.values.room_status}
                            onChange={formik.handleChange}
                        >
                            <option value="Available">Available</option>
                            <option value="Occupied">Occupied</option>
                            <option value="Maintenance">Maintenance</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Room Images</Form.Label>
                        <Form.Control
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        <Form.Text className="text-muted">
                            You can add multiple images. Click on an image to set it as thumbnail.
                        </Form.Text>
                    </Form.Group>

                    {roomImages.length > 0 && (
                        <Row className="mb-3">
                            <Col md={12}>
                                <div className="d-flex flex-wrap gap-3">
                                    {roomImages.map((img, index) => (
                                        <div
                                            key={index}
                                            className="position-relative"
                                            style={{
                                                width: '120px',
                                                height: '120px',
                                                border: img.is_thumbnail ? '3px solid #0d6efd' : '1px solid #dee2e6',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => setAsThumbnail(index)}
                                        >
                                            <img
                                                src={img.preview}
                                                alt={`Preview ${index}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            {img.is_thumbnail && (
                                                <Badge
                                                    bg="primary"
                                                    className="position-absolute top-0 start-0 m-1"
                                                    style={{ fontSize: '9px' }}
                                                >
                                                    Thumbnail
                                                </Badge>
                                            )}
                                            {img.isExisting && (
                                                <Badge
                                                    bg="success"
                                                    className="position-absolute bottom-0 start-0 m-1"
                                                    style={{ fontSize: '9px' }}
                                                >
                                                    Existing
                                                </Badge>
                                            )}
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage(index);
                                                }}
                                                style={{ padding: '2px 6px', fontSize: '12px' }}
                                            >
                                                <CsLineIcons icon="close" size="12" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </Col>
                        </Row>
                    )}
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="dark" type="submit" form="edit_room_form">
                    Update Room
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditRoomModal;