import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Button, Form, Modal } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { Formik, Form as FormikForm, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const ManageCustomers = () => {
    const title = 'Manage Customers';
    const description = 'Manage hotel customers';
    const history = useHistory();

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'operations', text: 'Operations' },
        { to: 'operations/customers', title: 'Customers' },
    ];

    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);


    const fetchCustomers = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API}/customer/get-all`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setCustomers(res.data.data);
            setFilteredCustomers(res.data.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (value) {
            const filtered = customers.filter(
                (c) =>
                    c.name.toLowerCase().includes(value.toLowerCase()) ||
                    c.phone.includes(value) ||
                    (c.email && c.email.toLowerCase().includes(value.toLowerCase()))
            );
            setFilteredCustomers(filtered);
        } else {
            setFilteredCustomers(customers);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await axios.delete(`${process.env.REACT_APP_API}/customer/delete/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                fetchCustomers();
            } catch (error) {
                alert(error.response?.data?.message || 'Error deleting customer');
            }
        }
    };

    const customerValidationSchema = Yup.object().shape({
        name: Yup.string().required('Name is required'),
        phone: Yup.string().required('Phone is required'),
        email: Yup.string().email('Invalid email'),
        address: Yup.string(),
        id_proof: Yup.string(),
    });

    const handleAddCustomer = async (values, { setSubmitting, resetForm }) => {
        try {
            await axios.post(`${process.env.REACT_APP_API}/customer/add`, values, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            fetchCustomers();
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding customer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditCustomer = async (values, { setSubmitting }) => {
        try {
            await axios.put(`${process.env.REACT_APP_API}/customer/update/${selectedCustomer._id}`, values, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            fetchCustomers();
            setShowEditModal(false);
            setSelectedCustomer(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating customer');
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
                        <Card.Header>
                            <Row className="align-items-center">
                                <Col md={8}>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by name, phone, or email..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                    />
                                </Col>
                                <Col md={4} className="text-end">
                                    <Button variant="primary" onClick={() => setShowAddModal(true)}>
                                        <CsLineIcons icon="plus" /> Add Customer
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Header>
                        <Card.Body>
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Phone</th>
                                            <th>Email</th>
                                            <th>ID Proof</th>
                                            <th>Tags</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((customer) => (
                                                <tr key={customer._id}>
                                                    <td>{customer.name}</td>
                                                    <td>{customer.phone}</td>
                                                    <td>{customer.email || 'N/A'}</td>
                                                    <td>{customer.id_proof || 'N/A'}</td>
                                                    <td>
                                                        {customer.tag && customer.tag.length > 0
                                                            ? customer.tag.join(', ')
                                                            : 'N/A'}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedCustomer(customer);
                                                                    setShowEditModal(true);
                                                                }}
                                                            >
                                                                <CsLineIcons icon="edit" size="12" />
                                                            </Button>
                                                            <Button
                                                                variant="outline-info"
                                                                size="sm"
                                                                onClick={() =>
                                                                    history.push(`/operations/customer-details/${customer._id}`)
                                                                }
                                                            >
                                                                <CsLineIcons icon="eye" size="12" />
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleDelete(customer._id)}
                                                            >
                                                                <CsLineIcons icon="bin" size="12" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4">
                                                    <p className="text-muted">No customers found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Add Customer Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add New Customer</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Formik
                        initialValues={{
                            name: '',
                            phone: '',
                            email: '',
                            address: '',
                            id_proof: '',
                            date_of_birth: '',
                            anniversary: '',
                            tag: [],
                        }}
                        validationSchema={customerValidationSchema}
                        onSubmit={handleAddCustomer}
                    >
                        {({ isSubmitting }) => (
                            <FormikForm>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Name *</Form.Label>
                                            <Field name="name" className="form-control" />
                                            <ErrorMessage name="name" component="div" className="text-danger" />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Phone *</Form.Label>
                                            <Field name="phone" className="form-control" />
                                            <ErrorMessage name="phone" component="div" className="text-danger" />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Field name="email" type="email" className="form-control" />
                                            <ErrorMessage name="email" component="div" className="text-danger" />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>ID Proof</Form.Label>
                                            <Field name="id_proof" className="form-control" placeholder="e.g. Aadhar, Passport" />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Address</Form.Label>
                                            <Field as="textarea" name="address" className="form-control" rows={2} />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date of Birth</Form.Label>
                                            <Field name="date_of_birth" type="date" className="form-control" />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Anniversary</Form.Label>
                                            <Field name="anniversary" type="date" className="form-control" />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-flex justify-content-end gap-2">
                                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Adding...' : 'Add Customer'}
                                    </Button>
                                </div>
                            </FormikForm>
                        )}
                    </Formik>
                </Modal.Body>
            </Modal>

            {/* Edit Customer Modal */}
            {selectedCustomer && (
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Customer</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Formik
                            initialValues={{
                                name: selectedCustomer.name || '',
                                phone: selectedCustomer.phone || '',
                                email: selectedCustomer.email || '',
                                address: selectedCustomer.address || '',
                                id_proof: selectedCustomer.id_proof || '',
                                date_of_birth: selectedCustomer.date_of_birth
                                    ? new Date(selectedCustomer.date_of_birth).toISOString().split('T')[0]
                                    : '',
                                anniversary: selectedCustomer.anniversary
                                    ? new Date(selectedCustomer.anniversary).toISOString().split('T')[0]
                                    : '',
                            }}
                            validationSchema={customerValidationSchema}
                            onSubmit={handleEditCustomer}
                        >
                            {({ isSubmitting }) => (
                                <FormikForm>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Name *</Form.Label>
                                                <Field name="name" className="form-control" />
                                                <ErrorMessage name="name" component="div" className="text-danger" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Phone *</Form.Label>
                                                <Field name="phone" className="form-control" />
                                                <ErrorMessage name="phone" component="div" className="text-danger" />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Email</Form.Label>
                                                <Field name="email" type="email" className="form-control" />
                                                <ErrorMessage name="email" component="div" className="text-danger" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>ID Proof</Form.Label>
                                                <Field name="id_proof" className="form-control" />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Address</Form.Label>
                                                <Field as="textarea" name="address" className="form-control" rows={2} />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Date of Birth</Form.Label>
                                                <Field name="date_of_birth" type="date" className="form-control" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Anniversary</Form.Label>
                                                <Field name="anniversary" type="date" className="form-control" />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <div className="d-flex justify-content-end gap-2">
                                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="primary" disabled={isSubmitting}>
                                            {isSubmitting ? 'Updating...' : 'Update Customer'}
                                        </Button>
                                    </div>
                                </FormikForm>
                            )}
                        </Formik>
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
};

export default ManageCustomers;