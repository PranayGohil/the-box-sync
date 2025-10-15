import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Button, Form, Badge, Alert } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { Formik, Form as FormikForm, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';

const CreateBooking = () => {
    const title = 'Create Booking';
    const description = 'Create a new room booking';
    const history = useHistory();

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'booking', text: 'Bookings' },
        { to: 'booking/create-booking', title: 'Create Booking' },
    ];

    const [customers, setCustomers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [dateRange, setDateRange] = useState({ check_in: '', check_out: '' });

    const fetchCustomers = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API}/customer/get-all`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setCustomers(res.data.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API}/room/category/get`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setCategories(res.data.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchCategories();
    }, []);

    const fetchAvailableRooms = async (checkIn, checkOut, categoryId) => {
        if (!checkIn || !checkOut || !categoryId) return;

        try {
            const res = await axios.get(`${process.env.REACT_APP_API}/hotel-booking/available-rooms`, {
                params: { check_in: checkIn, check_out: checkOut, category_id: categoryId },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setAvailableRooms(res.data.data || []);
        } catch (error) {
            console.error('Error fetching available rooms:', error);
            setAvailableRooms([]);
        }
    };

    const validationSchema = Yup.object().shape({
        customer_id: Yup.string().required('Customer is required'),
        check_in: Yup.date().required('Check-in date is required').min(new Date(), 'Check-in date must be in the future'),
        check_out: Yup.date()
            .required('Check-out date is required')
            .min(Yup.ref('check_in'), 'Check-out must be after check-in'),
        num_guests: Yup.number().required('Number of guests is required').min(1, 'At least 1 guest required'),
        category_id: Yup.string().required('Category is required'),
        subcategory_name: Yup.string().required('Subcategory is required'),
        room_id: Yup.string().required('Room is required'),
        total_price: Yup.number().required('Total price is required').min(0),
    });

    const calculateNights = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    };

    const calculateTotalPrice = (subcategory, checkIn, checkOut) => {
        if (!subcategory || !checkIn || !checkOut) return 0;
        const nights = calculateNights(checkIn, checkOut);
        return subcategory.current_price * nights;
    };

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const bookingData = {
                ...values,
            };

            await axios.post(`${process.env.REACT_APP_API}/hotel-booking/create`, bookingData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            alert('Booking created successfully!');
            history.push('/bookings');
        } catch (error) {
            console.error('Error creating booking:', error);
            alert(error.response?.data?.message || 'Error creating booking');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <HtmlHead title={title} description={description} />
            <Row>
                <Col>
                    <div className="page-title-container mb-4">
                        <h1 className="mb-0 pb-0 display-4">{title}</h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </div>

                    <Card>
                        <Card.Body>
                            <Formik
                                initialValues={{
                                    customer_id: '',
                                    check_in: '',
                                    check_out: '',
                                    num_guests: 1,
                                    category_id: '',
                                    subcategory_name: '',
                                    room_id: '',
                                    total_price: 0,
                                    special_request: '',
                                    source: 'Direct',
                                }}
                                validationSchema={validationSchema}
                                onSubmit={handleSubmit}
                            >
                                {({ values, setFieldValue, isSubmitting }) => (
                                    <FormikForm>
                                        <Row>
                                            {/* Customer Selection */}
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Customer *</Form.Label>
                                                    <div className="d-flex gap-2">
                                                        <Field as="select" name="customer_id" className="form-select">
                                                            <option value="">Select Customer</option>
                                                            {customers.map((customer) => (
                                                                <option key={customer._id} value={customer._id}>
                                                                    {customer.name} - {customer.phone}
                                                                </option>
                                                            ))}
                                                        </Field>
                                                        <Button
                                                            variant="outline-primary"
                                                            onClick={() => history.push('/booking/manage-customer')}
                                                        >
                                                            + New
                                                        </Button>
                                                    </div>
                                                    <ErrorMessage name="customer_id" component="div" className="text-danger" />
                                                </Form.Group>
                                            </Col>

                                            {/* Number of Guests */}
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Number of Guests *</Form.Label>
                                                    <Field type="number" name="num_guests" className="form-control" min="1" />
                                                    <ErrorMessage name="num_guests" component="div" className="text-danger" />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            {/* Check-in Date */}
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Check-in Date *</Form.Label>
                                                    <Field
                                                        type="date"
                                                        name="check_in"
                                                        className="form-control"
                                                        onChange={(e) => {
                                                            setFieldValue('check_in', e.target.value);
                                                            setDateRange({ ...dateRange, check_in: e.target.value });
                                                            if (dateRange.check_out && values.category_id) {
                                                                fetchAvailableRooms(e.target.value, dateRange.check_out, values.category_id);
                                                            }
                                                        }}
                                                    />
                                                    <ErrorMessage name="check_in" component="div" className="text-danger" />
                                                </Form.Group>
                                            </Col>

                                            {/* Check-out Date */}
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Check-out Date *</Form.Label>
                                                    <Field
                                                        type="date"
                                                        name="check_out"
                                                        className="form-control"
                                                        onChange={(e) => {
                                                            setFieldValue('check_out', e.target.value);
                                                            setDateRange({ ...dateRange, check_out: e.target.value });
                                                            if (dateRange.check_in && values.category_id) {
                                                                fetchAvailableRooms(dateRange.check_in, e.target.value, values.category_id);
                                                            }
                                                        }}
                                                    />
                                                    <ErrorMessage name="check_out" component="div" className="text-danger" />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        {/* Date Range Summary */}
                                        {values.check_in && values.check_out && (
                                            <Alert variant="info" className="mb-3">
                                                <strong>{calculateNights(values.check_in, values.check_out)} nights</strong> selected
                                            </Alert>
                                        )}

                                        <h5 className="mt-4 mb-3">Select Room Category & Type</h5>

                                        {/* Room Category Selection */}
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Form.Label>Room Category *</Form.Label>
                                                    <Row>
                                                        {categories.map((category) => (
                                                            <Col md={3} sm={6} key={category._id} className="mb-3">
                                                                <Card
                                                                    className={`h-100 cursor-pointer ${values.category_id === category._id ? 'border-primary border-3' : ''
                                                                        }`}
                                                                    onClick={() => {
                                                                        setFieldValue('category_id', category._id);
                                                                        setFieldValue('subcategory_name', '');
                                                                        setFieldValue('room_id', '');
                                                                        setFieldValue('total_price', 0);
                                                                        setSelectedCategory(category);
                                                                        setSelectedSubcategory(null);
                                                                        setAvailableRooms([]);
                                                                        if (values.check_in && values.check_out) {
                                                                            fetchAvailableRooms(values.check_in, values.check_out, category._id);
                                                                        }
                                                                    }}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    {category.room_imgs && category.room_imgs.length > 0 && (
                                                                        <Card.Img
                                                                            variant="top"
                                                                            src={`${process.env.REACT_APP_UPLOAD_DIR}${category.room_imgs.find((img) => img.is_thumbnail)?.image ||
                                                                                category.room_imgs[0]?.image
                                                                                }`}
                                                                            style={{ height: '150px', objectFit: 'cover' }}
                                                                        />
                                                                    )}
                                                                    <Card.Body>
                                                                        <div className="d-flex justify-content-between align-items-start">
                                                                            <h6>{category.category}</h6>
                                                                            {values.category_id === category._id && (
                                                                                <Badge bg="primary">Selected</Badge>
                                                                            )}
                                                                        </div>
                                                                    </Card.Body>
                                                                </Card>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                    <ErrorMessage name="category_id" component="div" className="text-danger" />
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Subcategory Selection */}
                                        {selectedCategory && selectedCategory.subcategory && (
                                            <Row>
                                                <Col md={12}>
                                                    <div className="mb-3">
                                                        <Form.Label>Room Type / Plan *</Form.Label>
                                                        <Row>
                                                            {selectedCategory.subcategory
                                                                .filter((sub) => sub.is_available)
                                                                .map((subcategory, index) => (
                                                                    <Col md={3} sm={6} key={index} className="mb-3">
                                                                        <Card
                                                                            className={`h-100 cursor-pointer ${values.subcategory_name === subcategory.subcategory_name
                                                                                ? 'border-success border-3'
                                                                                : ''
                                                                                }`}
                                                                            onClick={() => {
                                                                                setFieldValue('subcategory_name', subcategory.subcategory_name);
                                                                                setSelectedSubcategory(subcategory);
                                                                                setFieldValue('room_id', '');
                                                                                setFieldValue(
                                                                                    'total_price',
                                                                                    calculateTotalPrice(subcategory, values.check_in, values.check_out)
                                                                                );
                                                                            }}
                                                                            style={{ cursor: 'pointer' }}
                                                                        >
                                                                            <Card.Body>
                                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                    <h6>{subcategory.subcategory_name}</h6>
                                                                                    {values.subcategory_name === subcategory.subcategory_name && (
                                                                                        <Badge bg="success">Selected</Badge>
                                                                                    )}
                                                                                </div>
                                                                                {subcategory.description && (
                                                                                    <p className="text-muted small">{subcategory.description}</p>
                                                                                )}
                                                                                <hr />
                                                                                <div className="d-flex justify-content-between align-items-center">
                                                                                    <div>
                                                                                        <div className="text-muted small">Price per night</div>
                                                                                        <strong className="text-primary">₹{subcategory.current_price}</strong>
                                                                                    </div>
                                                                                    {values.check_in && values.check_out && (
                                                                                        <div className="text-end">
                                                                                            <div className="text-muted small">Total</div>
                                                                                            <strong className="text-success">
                                                                                                ₹{calculateTotalPrice(subcategory, values.check_in, values.check_out)}
                                                                                            </strong>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                {subcategory.is_refundable && (
                                                                                    <Badge bg="info" className="mt-2">
                                                                                        Refundable
                                                                                    </Badge>
                                                                                )}
                                                                            </Card.Body>
                                                                        </Card>
                                                                    </Col>
                                                                ))}
                                                        </Row>
                                                        <ErrorMessage name="subcategory_name" component="div" className="text-danger" />
                                                    </div>
                                                </Col>
                                            </Row>
                                        )}

                                        {/* Available Rooms */}
                                        {selectedSubcategory && availableRooms.length > 0 && (
                                            <Row>
                                                <Col md={12}>
                                                    <div className="mb-3">
                                                        <Form.Label>Assign Room *</Form.Label>
                                                        <Row>
                                                            {availableRooms.map((room) => (
                                                                <Col md={2} sm={4} xs={6} key={room._id} className="mb-3">
                                                                    <Card
                                                                        className={`h-100 cursor-pointer ${values.room_id === room._id ? 'border-warning border-3' : ''
                                                                            }`}
                                                                        onClick={() => {
                                                                            setFieldValue('room_id', room._id);
                                                                        }}
                                                                        style={{ cursor: 'pointer' }}
                                                                    >
                                                                        <Card.Body className="text-center">
                                                                            <h5 className="mb-2">Room {room.room_no}</h5>
                                                                            <p className="text-muted small mb-2">{room.room_name}</p>
                                                                            <Badge bg="secondary">Max: {room.max_person} guests</Badge>
                                                                            {values.room_id === room._id && (
                                                                                <div className="mt-2">
                                                                                    <Badge bg="warning">Assigned</Badge>
                                                                                </div>
                                                                            )}
                                                                        </Card.Body>
                                                                    </Card>
                                                                </Col>
                                                            ))}
                                                        </Row>
                                                        <ErrorMessage name="room_id" component="div" className="text-danger" />
                                                    </div>
                                                </Col>
                                            </Row>
                                        )}

                                        {selectedSubcategory && availableRooms.length === 0 && dateRange.check_in && dateRange.check_out && (
                                            <Alert variant="warning">
                                                No rooms available in this category for the selected dates. Please try different dates or category.
                                            </Alert>
                                        )}

                                        {selectedSubcategory && !dateRange.check_in && (
                                            <Alert variant="info">Please select check-in and check-out dates to see available rooms.</Alert>
                                        )}

                                        <h5 className="mt-4 mb-3">Booking Details</h5>

                                        <Row>
                                            {/* Booking Source */}
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Booking Source</Form.Label>
                                                    <Field as="select" name="source" className="form-select">
                                                        <option value="Direct">Direct</option>
                                                        <option value="Phone">Phone</option>
                                                        <option value="Walk-in">Walk-in</option>
                                                        <option value="Online">Online</option>
                                                        <option value="Agent">Agent</option>
                                                    </Field>
                                                </Form.Group>
                                            </Col>

                                            {/* Total Price */}
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Total Price *</Form.Label>
                                                    <Field
                                                        type="number"
                                                        name="total_price"
                                                        className="form-control"
                                                        readOnly
                                                        style={{ backgroundColor: '#f8f9fa' }}
                                                    />
                                                    <ErrorMessage name="total_price" component="div" className="text-danger" />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        {/* Special Request */}
                                        <Row>
                                            <Col md={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Special Requests</Form.Label>
                                                    <Field
                                                        as="textarea"
                                                        name="special_request"
                                                        className="form-control"
                                                        rows={3}
                                                        placeholder="Any special requirements..."
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        {/* Booking Summary */}
                                        {values.category_id && values.subcategory_name && values.room_id && (
                                            <Alert variant="success" className="mt-3">
                                                <h6>Booking Summary:</h6>
                                                <ul className="mb-0">
                                                    <li>
                                                        <strong>Category:</strong> {selectedCategory?.category}
                                                    </li>
                                                    <li>
                                                        <strong>Room Type:</strong> {selectedSubcategory?.subcategory_name}
                                                    </li>
                                                    <li>
                                                        <strong>Room Number:</strong>{' '}
                                                        {availableRooms.find((r) => r._id === values.room_id)?.room_no}
                                                    </li>
                                                    <li>
                                                        <strong>Nights:</strong> {calculateNights(values.check_in, values.check_out)}
                                                    </li>
                                                    <li>
                                                        <strong>Total Amount:</strong> ₹{values.total_price}
                                                    </li>
                                                </ul>
                                            </Alert>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="d-flex justify-content-end gap-2 mt-4">
                                            <Button variant="secondary" onClick={() => history.push('/bookings')}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" variant="primary" disabled={isSubmitting}>
                                                {isSubmitting ? 'Creating...' : 'Create Booking'}
                                            </Button>
                                        </div>
                                    </FormikForm>
                                )}
                            </Formik>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default CreateBooking;