import React, { useState, useEffect } from 'react';
import { Button, Form, Card, Col, Row, Image, Spinner, Alert } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const Profile = () => {
    const title = 'Profile';
    const description = 'Manage your restaurant profile details.';

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'settings', text: 'Settings' },
        { to: 'settings/profile', title: 'Profile' },
    ];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [error, setError] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const [profile, setProfile] = useState({
        restaurant_code: '',
        name: '',
        logo: '',
        email: '',
        mobile: '',
    });

    const [intialProfile, setIntialProfile] = useState({
        restaurant_code: '',
        name: '',
        logo: '',
        email: '',
        mobile: '',
        logoFile: null,
        logoPreview: ''
    });

    // Fetch profile on mount
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
                    restaurant_code: data.restaurant_code || '',
                    name: data.name || '',
                    logo: data.logo || '',
                    email: data.email || '',
                    mobile: data.mobile || '',
                });
                setIntialProfile({
                    restaurant_code: data.restaurant_code || '',
                    name: data.name || '',
                    logo: data.logo || '',
                    email: data.email || '',
                    mobile: data.mobile || '',
                    logoFile: null,
                    logoPreview: ''
                });
            } catch (err) {
                console.error('Failed to load profile', err);
                setError('Failed to load profile data');
                toast.error('Failed to load profile data');
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
            setUploadingLogo(true);
            // Simulate upload for better UX
            setTimeout(() => {
                setIntialProfile((prev) => ({
                    ...prev,
                    logoFile: file,
                    logoPreview: URL.createObjectURL(file),
                }));
                setUploadingLogo(false);
            }, 500);
        }
    };

    const handleSave = async () => {
        if (!intialProfile.name || !intialProfile.email || !intialProfile.mobile) {
            setError('Please fill all the required fields.');
            return;
        }

        setSaving(true);
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

            setProfile({
                restaurant_code: intialProfile.restaurant_code,
                name: intialProfile.name,
                logo: intialProfile.logo,
                email: intialProfile.email,
                mobile: intialProfile.mobile,
            });
            setEditMode(false);
            toast.success('Profile updated successfully!');
        } catch (err) {
            console.error('Failed to update profile', err);
            setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIntialProfile({
            ...profile,
            logoFile: null,
            logoPreview: ''
        });
        setEditMode(false);
        setError('');
    };

    const getLogoSrc = () => {
        if (intialProfile.logoPreview) {
            return intialProfile.logoPreview;
        } 
        if (intialProfile.logo) {
            return `${process.env.REACT_APP_UPLOAD_DIR}${intialProfile.logo}`;
        }
        return '';
    };

    if (loading) {
        return (
            <>
                <HtmlHead title={title} description={description} />
                <Row>
                    <Col>
                        <div className="page-title-container">
                            <h1 className="mb-0 pb-0 display-4">{title}</h1>
                            <BreadcrumbList items={breadcrumbs} />
                        </div>
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" className="mb-3" />
                            <h5>Loading Profile Information...</h5>
                            <p className="text-muted">Please wait while we fetch your profile details</p>
                        </div>
                    </Col>
                </Row>
            </>
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
                                        {getLogoSrc() ? (
                                            <Image
                                                src={getLogoSrc()}
                                                roundedCircle
                                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                                className="mb-3"
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3"
                                                style={{ width: '150px', height: '150px', margin: '0 auto' }}
                                            >
                                                <CsLineIcons icon="image" size={48} className="text-muted" />
                                            </div>
                                        )}

                                        {editMode && (
                                            <div className="position-relative">
                                                <Form.Control
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                    disabled={uploadingLogo || saving}
                                                />
                                                {uploadingLogo && (
                                                    <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                        <Spinner animation="border" size="sm" />
                                                    </div>
                                                )}
                                                {uploadingLogo && (
                                                    <small className="text-muted d-block mt-1">Uploading logo...</small>
                                                )}
                                            </div>
                                        )}
                                    </Col>
                                </Row>

                                {/* Profile Fields */}
                                <Row className="mb-4">
                                    <Col md="6">
                                        <Form.Label>Restaurant Code</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="restaurant_code"
                                            value={intialProfile.restaurant_code}
                                            disabled
                                            className="bg-light"
                                        />
                                    </Col>

                                    <Col md="6">
                                        <Form.Label>Restaurant Name *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={intialProfile.name}
                                            onChange={handleChange}
                                            disabled={!editMode || saving}
                                        />
                                    </Col>

                                    <Col md="6">
                                        <Form.Label>Email *</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={intialProfile.email}
                                            onChange={handleChange}
                                            disabled={!editMode || saving}
                                        />
                                    </Col>

                                    <Col md="6">
                                        <Form.Label>Phone *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="mobile"
                                            value={intialProfile.mobile}
                                            onChange={handleChange}
                                            disabled={!editMode || saving}
                                        />
                                    </Col>
                                </Row>

                                {error && (
                                    <Alert variant="danger" className="mb-3">
                                        <CsLineIcons icon="error" className="me-2" />
                                        {error}
                                    </Alert>
                                )}

                                {/* Actions */}
                                <div className="mt-4">
                                    {editMode ? (
                                        <>
                                            <Button
                                                variant="primary"
                                                onClick={handleSave}
                                                className="me-2"
                                                disabled={saving}
                                                style={{ minWidth: '100px' }}
                                            >
                                                {saving ? (
                                                    <>
                                                        <Spinner
                                                            as="span"
                                                            animation="border"
                                                            size="sm"
                                                            role="status"
                                                            aria-hidden="true"
                                                            className="me-2"
                                                        />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CsLineIcons icon="save" className="me-2" />
                                                        Save
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={handleCancel}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="outline-primary"
                                            onClick={() => setEditMode(true)}
                                        >
                                            <CsLineIcons icon="edit" className="me-2" />
                                            Edit Profile
                                        </Button>
                                    )}
                                </div>
                            </Form>

                            {/* Saving overlay */}
                            {saving && (
                                <div
                                    className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                        zIndex: 9999,
                                        backdropFilter: 'blur(2px)'
                                    }}
                                >
                                    <Card className="shadow-lg border-0" style={{ minWidth: '200px' }}>
                                        <Card.Body className="text-center p-4">
                                            <Spinner
                                                animation="border"
                                                variant="primary"
                                                className="mb-3"
                                                style={{ width: '3rem', height: '3rem' }}
                                            />
                                            <h5 className="mb-0">Updating Profile...</h5>
                                            <small className="text-muted">Please wait a moment</small>
                                        </Card.Body>
                                    </Card>
                                </div>
                            )}
                        </Card>
                    </section>
                </Col>
            </Row>
        </>
    );
};

export default Profile;