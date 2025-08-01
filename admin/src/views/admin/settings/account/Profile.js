import React, { useState, useEffect } from 'react';
import { Button, Form, Card, Col, Row, Image, Spinner } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import axios from 'axios';

const Profile = () => {
    const title = 'Profile';
    const description = 'Manage your restaurant profile details.';

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'settings', text: 'Settings' },
        { to: 'settings/profile', title: 'Profile' },
    ];

    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [error, setError] = useState('');

    const [profile, setProfile] = useState({
        name: '',
        logo: '',
        email: '',
        mobile: '',
    });

    const [intialProfile, setIntialProfile] = useState({ ...profile });

    // ✅ Fetch profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                const data = res.data.user || res.data;
                setProfile({
                    name: data.name || '',
                    logo: data.logo || '',
                    email: data.email || '',
                    mobile: data.mobile || '',
                });
                setIntialProfile({
                    name: data.name || '',
                    logo: data.logo || '',
                    email: data.email || '',
                    mobile: data.mobile || '',
                });
            } catch (err) {
                console.error('Failed to load profile', err);
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setIntialProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setIntialProfile((prev) => ({
                ...prev,
                logoFile: file,
                logoPreview: URL.createObjectURL(file),
            }));
        }
    };


    const handleSave = async () => {
        if (!intialProfile.name || !intialProfile.email || !intialProfile.mobile) {
            setError('Please fill all the fields.');
            return;
        }
        try {
            setError('');
            const formData = new FormData();
            formData.append('name', intialProfile.name);
            formData.append('email', intialProfile.email);
            formData.append('mobile', intialProfile.mobile);

            if (intialProfile.logoFile) {
                formData.append('logo', intialProfile.logoFile);
            }

            await axios.put(`${process.env.REACT_APP_API}/user/update`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setProfile({ ...intialProfile });
            setEditMode(false);
        } catch (err) {
            console.error('Failed to update profile', err);
            setError('Failed to update profile. Please try again.');
        }
    };


    const handleCancel = () => {
        setIntialProfile({ ...profile });
        setEditMode(false);
        setError('');
    };

    let logoSrc = '';
    if (intialProfile.logoPreview) {
        logoSrc = intialProfile.logoPreview;
    } else if (intialProfile.logo) {
        logoSrc = `${process.env.REACT_APP_UPLOAD_DIR}${intialProfile.logo}`;
    }

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

                    <section className="scroll-section" id="profileForm">
                        <Card body className="mb-5">
                            <Form>

                                {/* Logo Display Row */}
                                <Row className="mb-4 justify-content-center text-center">
                                    <Col md="6">
                                        <Image
                                            src={logoSrc}
                                            roundedCircle
                                            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                            className="mb-3"
                                        />

                                        {editMode && (
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                            />
                                        )}
                                    </Col>
                                </Row>

                                {/* Profile Fields */}
                                <Row className="mb-4">
                                    <Col md="6">
                                        <Form.Label>Restaurant Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={intialProfile.name}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                        />
                                    </Col>

                                    <Col md="6">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={intialProfile.email}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                        />
                                    </Col>
                                </Row>

                                <Row className="mb-4">
                                    <Col md="6">
                                        <Form.Label>Phone</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="mobile"
                                            value={intialProfile.mobile}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                        />
                                    </Col>
                                </Row>

                                {error && <p className="text-danger">{error}</p>}

                                {/* Actions */}
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

export default Profile;
