import React, { useEffect, useState } from 'react';
import { Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';

const Gst = () => {
    const title = 'Tax Info';
    const description = 'Update your GST and tax information.';

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'settings', text: 'Settings' },
        { to: 'settings/tax', title: 'Tax Info' },
    ];

    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [error, setError] = useState('');

    const [profile, setProfile] = useState({
        gst_no: '',
        cgst: 0,
        sgst: 0,
        vat: 0,
    });

    const [intialProfile, setIntialProfile] = useState({ ...profile });

    useEffect(() => {
        const fetchTaxInfo = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                const data = res.data.user || res.data;

                setProfile({
                    gst_no: data.gst_no || '',
                    cgst: data.taxInfo?.cgst || 0,
                    sgst: data.taxInfo?.sgst || 0,
                    vat: data.taxInfo?.vat || 0,
                });

                setIntialProfile({
                    gst_no: data.gst_no || '',
                    cgst: data.taxInfo?.cgst || 0,
                    sgst: data.taxInfo?.sgst || 0,
                    vat: data.taxInfo?.vat || 0,
                });
            } catch (err) {
                console.error('Failed to load tax info', err);
                setError('Failed to load tax info.');
            } finally {
                setLoading(false);
            }
        };

        fetchTaxInfo();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setIntialProfile((prev) => ({
            ...prev,
            [name]: name === 'cgst' || name === 'sgst' || name === 'vat' ? parseFloat(value) : value,
        }));
    };

    const handleSave = async () => {
        if (!intialProfile.gst_no) {
            setError('GST number is required.');
            return;
        }

        try {
            setError('');
            await axios.put(
                `${process.env.REACT_APP_API}/user/update-tax`,
                {
                    gst_no: intialProfile.gst_no,
                    taxInfo: {
                        cgst: intialProfile.cgst,
                        sgst: intialProfile.sgst,
                        vat: intialProfile.vat,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            setProfile({ ...intialProfile });
            setEditMode(false);
        } catch (err) {
            console.error('Failed to update tax info', err);
            setError('Update failed. Please try again.');
        }
    };

    const handleCancel = () => {
        setIntialProfile({ ...profile });
        setEditMode(false);
        setError('');
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

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

                    <section className="scroll-section" id="taxForm">
                        <Card body className="mb-5">
                            <Form>
                                <Row className="mb-4">
                                    <Col md="6">
                                        <Form.Label>GST Number</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="gst_no"
                                            value={intialProfile.gst_no}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                        />
                                    </Col>
                                </Row>

                                <Row className="mb-4">
                                    <Col md="4">
                                        <Form.Label>CGST (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="cgst"
                                            value={intialProfile.cgst}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                        />
                                    </Col>
                                    <Col md="4">
                                        <Form.Label>SGST (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="sgst"
                                            value={intialProfile.sgst}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                        />
                                    </Col>
                                    <Col md="4">
                                        <Form.Label>VAT (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="vat"
                                            value={intialProfile.vat}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                        />
                                    </Col>
                                </Row>

                                {error && <p className="text-danger">{error}</p>}

                                <div className="mt-4">
                                    {editMode ? (
                                        <>
                                            <Button variant="primary" onClick={handleSave} className="me-2">
                                                Save
                                            </Button>
                                            <Button variant="secondary" onClick={handleCancel}>
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <Button variant="outline-primary" onClick={() => setEditMode(true)}>
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </Form>
                        </Card>
                    </section>
                </Col>
            </Row>
        </>
    );
};

export default Gst;
