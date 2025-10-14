import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Col, Row, Button, Form as BForm, Badge } from 'react-bootstrap';
import { Formik, Form, FieldArray, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const AddRoom = () => {
    const title = 'Add Rooms';
    const description = 'Form to add rooms using Formik and Yup';

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'operations', text: 'Operations' },
        { to: 'operations/add-room', title: 'Add Rooms' },
    ];

    const history = useHistory();
    const [categories, setCategories] = useState([]);
    const [roomImages, setRoomImages] = useState({}); // Store images per room index

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API}/room/category/get`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setCategories(res.data.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const initialValues = {
        category: '',
        rooms: [
            {
                room_name: '',
                room_no: '',
                room_details: '',
                max_person: '',
                // room_price: '',
                room_status: 'Available',
            },
        ],
    };

    const validationSchema = Yup.object().shape({
        category: Yup.string().required('Category is required'),
        rooms: Yup.array().of(
            Yup.object().shape({
                room_name: Yup.string().required('Room name is required'),
                room_no: Yup.string().required('Room number is required'),
                room_details: Yup.string(),
                max_person: Yup.number().typeError('Must be a number').required('Max person is required'),
                // room_price: Yup.number().typeError('Must be a number').required('Room price is required'),
                room_status: Yup.string().required('Room status is required'),
            })
        ),
    });

    const handleImageUpload = (e, roomIndex) => {
        const files = Array.from(e.target.files);
        const existingImages = roomImages[roomIndex] || [];

        const newImages = files.map((file, index) => ({
            file,
            preview: URL.createObjectURL(file),
            is_thumbnail: existingImages.length === 0 && index === 0,
        }));

        setRoomImages({
            ...roomImages,
            [roomIndex]: [...existingImages, ...newImages],
        });
    };

    const removeImage = (roomIndex, imageIndex) => {
        const images = roomImages[roomIndex] || [];
        const updatedImages = images.filter((_, i) => i !== imageIndex);

        // If removed image was thumbnail, set first image as thumbnail
        if (images[imageIndex]?.is_thumbnail && updatedImages.length > 0) {
            updatedImages[0].is_thumbnail = true;
        }

        setRoomImages({
            ...roomImages,
            [roomIndex]: updatedImages,
        });
    };

    const setAsThumbnail = (roomIndex, imageIndex) => {
        const images = roomImages[roomIndex] || [];
        const updatedImages = images.map((img, i) => ({
            ...img,
            is_thumbnail: i === imageIndex,
        }));

        setRoomImages({
            ...roomImages,
            [roomIndex]: updatedImages,
        });
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            const formData = new FormData();
            formData.append('category', values.category);

            // Prepare room data with image counts and thumbnail indices
            const roomData = values.rooms.map((room, index) => {
                const images = roomImages[index] || [];
                const thumbnailIndex = images.findIndex(img => img.is_thumbnail);

                return {
                    room_name: room.room_name,
                    room_no: room.room_no,
                    room_details: room.room_details,
                    max_person: room.max_person,
                    // room_price: room.room_price,
                    room_status: room.room_status,
                    image_count: images.length,
                    thumbnail_index: thumbnailIndex >= 0 ? thumbnailIndex : 0,
                };
            });

            formData.append('rooms', JSON.stringify(roomData));

            // Append all images with room index
            values.rooms.forEach((room, roomIndex) => {
                const images = roomImages[roomIndex] || [];
                images.forEach((img) => {
                    formData.append('room_imgs', img.file);
                    formData.append('room_indices', roomIndex); // Track which room each image belongs to
                });
            });

            const res = await axios.post(`${process.env.REACT_APP_API}/room/add`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            alert(res.data.message || 'Rooms saved successfully');
            resetForm();
            setRoomImages({});
            history.push('/operations/manage-rooms');
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Something went wrong!');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <HtmlHead title={title} description={description} />
            <Row>
                <Col>
                    <section className="scroll-section" id="title">
                        <div className="page-title-container">
                            <h1 className="mb-0 pb-0 display-4">{title}</h1>
                            <BreadcrumbList items={breadcrumbs} />
                        </div>
                    </section>

                    <section className="scroll-section" id="formRow">
                        <Card body className="mb-5">
                            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
                                {({ values, isSubmitting, setFieldValue }) => (
                                    <Form>
                                        <Row className="mb-4">
                                            <Col md={6}>
                                                <BForm.Group>
                                                    <BForm.Label>Room Category</BForm.Label>
                                                    <Field as="select" name="category" className="form-select">
                                                        <option value="">Select Category</option>
                                                        {categories.map((cat) => (
                                                            <option key={cat._id} value={cat._id}>
                                                                {cat.category}
                                                            </option>
                                                        ))}
                                                    </Field>
                                                    <ErrorMessage name="category" component="div" className="text-danger" />
                                                </BForm.Group>
                                            </Col>
                                        </Row>

                                        <h5 className="mb-3">Rooms</h5>
                                        <FieldArray name="rooms">
                                            {({ push, remove }) => (
                                                <>
                                                    {values.rooms.map((room, index) => (
                                                        <Card key={index} className="mb-4 p-3">
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <h6 className="mb-0">Room {index + 1}</h6>
                                                                {values.rooms.length > 1 && (
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            remove(index);
                                                                            const newRoomImages = { ...roomImages };
                                                                            delete newRoomImages[index];
                                                                            setRoomImages(newRoomImages);
                                                                        }}
                                                                    >
                                                                        Remove Room
                                                                    </Button>
                                                                )}
                                                            </div>

                                                            <Row>
                                                                <Col md={6}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Room Name</BForm.Label>
                                                                        <Field
                                                                            name={`rooms[${index}].room_name`}
                                                                            className="form-control"
                                                                            placeholder="e.g. Deluxe Suite 101"
                                                                        />
                                                                        <ErrorMessage name={`rooms[${index}].room_name`} component="div" className="text-danger" />
                                                                    </BForm.Group>
                                                                </Col>
                                                                <Col md={6}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Room Number</BForm.Label>
                                                                        <Field
                                                                            name={`rooms[${index}].room_no`}
                                                                            className="form-control"
                                                                            placeholder="e.g. 101"
                                                                        />
                                                                        <ErrorMessage name={`rooms[${index}].room_no`} component="div" className="text-danger" />
                                                                    </BForm.Group>
                                                                </Col>
                                                            </Row>

                                                            <Row className="mt-2">
                                                                <Col md={6}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Max Person</BForm.Label>
                                                                        <Field
                                                                            name={`rooms[${index}].max_person`}
                                                                            className="form-control"
                                                                            type="number"
                                                                            placeholder="e.g. 2"
                                                                        />
                                                                        <ErrorMessage name={`rooms[${index}].max_person`} component="div" className="text-danger" />
                                                                    </BForm.Group>
                                                                </Col>
                                                                {/* <Col md={4}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Room Price</BForm.Label>
                                                                        <Field
                                                                            name={`rooms[${index}].room_price`}
                                                                            className="form-control"
                                                                            type="number"
                                                                            placeholder="e.g. 5000"
                                                                        />
                                                                        <ErrorMessage name={`rooms[${index}].room_price`} component="div" className="text-danger" />
                                                                    </BForm.Group>
                                                                </Col> */}
                                                                <Col md={6}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Room Status</BForm.Label>
                                                                        <Field as="select" name={`rooms[${index}].room_status`} className="form-select">
                                                                            <option value="Available">Available</option>
                                                                            <option value="Occupied">Occupied</option>
                                                                            <option value="Maintenance">Maintenance</option>
                                                                        </Field>
                                                                    </BForm.Group>
                                                                </Col>
                                                            </Row>

                                                            <Row className="mt-2">
                                                                <Col md={12}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Room Details</BForm.Label>
                                                                        <Field
                                                                            as="textarea"
                                                                            rows={2}
                                                                            name={`rooms[${index}].room_details`}
                                                                            className="form-control"
                                                                            placeholder="Additional room details..."
                                                                        />
                                                                    </BForm.Group>
                                                                </Col>
                                                            </Row>

                                                            <Row className="mt-2">
                                                                <Col md={12}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Room Images</BForm.Label>
                                                                        <BForm.Control
                                                                            type="file"
                                                                            multiple
                                                                            accept="image/*"
                                                                            onChange={(e) => handleImageUpload(e, index)}
                                                                        />
                                                                        <BForm.Text className="text-muted">
                                                                            You can select multiple images. Click on an image to set it as thumbnail.
                                                                        </BForm.Text>
                                                                    </BForm.Group>
                                                                </Col>
                                                            </Row>

                                                            {roomImages[index] && roomImages[index].length > 0 && (
                                                                <Row className="mt-3">
                                                                    <Col md={12}>
                                                                        <div className="d-flex flex-wrap gap-3">
                                                                            {roomImages[index].map((img, imgIndex) => (
                                                                                <div
                                                                                    key={imgIndex}
                                                                                    className="position-relative"
                                                                                    style={{
                                                                                        width: '120px',
                                                                                        height: '120px',
                                                                                        border: img.is_thumbnail ? '3px solid #0d6efd' : '1px solid #dee2e6',
                                                                                        borderRadius: '8px',
                                                                                        overflow: 'hidden',
                                                                                        cursor: 'pointer',
                                                                                    }}
                                                                                    onClick={() => setAsThumbnail(index, imgIndex)}
                                                                                >
                                                                                    <img
                                                                                        src={img.preview}
                                                                                        alt={`Preview ${imgIndex}`}
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
                                                                                    <button
                                                                                        type="button"
                                                                                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            removeImage(index, imgIndex);
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
                                                        </Card>
                                                    ))}

                                                    <div className="d-flex gap-2 mt-3">
                                                        <Button
                                                            type="button"
                                                            variant="primary"
                                                            onClick={() =>
                                                                push({
                                                                    room_name: '',
                                                                    room_no: '',
                                                                    room_details: '',
                                                                    max_person: '',
                                                                    // room_price: '',
                                                                    room_status: 'Available',
                                                                })
                                                            }
                                                        >
                                                            + Add More Rooms
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </FieldArray>

                                        <div className="mt-4">
                                            <Button type="submit" variant="success" disabled={isSubmitting}>
                                                {isSubmitting ? 'Saving...' : 'Save Rooms'}
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </Card>
                    </section>
                </Col>
            </Row>
        </>
    );
};

export default AddRoom;