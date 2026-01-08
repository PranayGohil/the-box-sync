import React, { useState, useEffect } from 'react';
import { Button, Form, Card, Col, Row, Image, Spinner, Alert } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { Formik } from 'formik';
import * as Yup from 'yup';

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
    fssai_no: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Yup validation schema
  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Restaurant name is required')
      .min(3, 'Restaurant name must be at least 3 characters')
      .max(100, 'Restaurant name must not exceed 100 characters'),
    email: Yup.string().required('Email is required').email('Please enter a valid email address'),
    mobile: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
    fssai_no: Yup.string()
      .required('FSSAI number is required')
      .matches(/^[0-9]{14}$/, 'FSSAI number must be exactly 14 digits'),
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
          fssai_no: data.fssai_no || '',
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should not exceed 5MB');
        return;
      }

      setUploadingLogo(true);
      // Simulate upload for better UX
      setTimeout(() => {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
        setUploadingLogo(false);
      }, 500);
    }
  };

  const handleEditSubmit = async (values, { setSubmitting }) => {
    setSaving(true);
    try {
      setError('');
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('email', values.email);
      formData.append('mobile', values.mobile);
      formData.append('fssai_no', values.fssai_no);

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const response = await axios.put(`${process.env.REACT_APP_API}/user/update`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update profile state with new data
      const updatedData = response.data.user || response.data;
      setProfile({
        restaurant_code: values.restaurant_code,
        name: values.name,
        logo: updatedData.logo || profile.logo,
        email: values.email,
        mobile: values.mobile,
        fssai_no: values.fssai_no,
      });

      // Clear logo file states
      setLogoFile(null);
      setLogoPreview('');
      setEditMode(false);
      toast.success('Profile updated successfully!');
      window.location.reload();
    } catch (err) {
      console.error('Failed to update profile', err);
      const errorMessage = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  const handleCancel = (resetForm) => {
    resetForm();
    setLogoFile(null);
    setLogoPreview('');
    setEditMode(false);
    setError('');
  };

  const getLogoSrc = () => {
    if (logoPreview) {
      return logoPreview;
    }
    if (profile.logo) {
      return `${process.env.REACT_APP_UPLOAD_DIR}${profile.logo}`;
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
              <Formik
                initialValues={{
                  restaurant_code: profile.restaurant_code,
                  name: profile.name,
                  email: profile.email,
                  mobile: profile.mobile,
                  fssai_no: profile.fssai_no,
                }}
                validationSchema={validationSchema}
                onSubmit={handleEditSubmit}
                enableReinitialize
              >
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, resetForm }) => (
                  <Form onSubmit={handleSubmit}>
                    {/* Logo Display Row */}
                    <Row className="mb-4 justify-content-center text-center">
                      <Col md="6">
                        {getLogoSrc() ? (
                          <Image src={getLogoSrc()} roundedCircle style={{ width: '150px', height: '150px', objectFit: 'cover' }} className="mb-3" />
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
                            <Form.Control type="file" accept="image/*" onChange={handleLogoChange} disabled={uploadingLogo || saving} />
                            {uploadingLogo && (
                              <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                <Spinner animation="border" size="sm" />
                              </div>
                            )}
                            {uploadingLogo && <small className="text-muted d-block mt-1">Uploading logo...</small>}
                          </div>
                        )}
                      </Col>
                    </Row>

                    {/* Profile Fields */}
                    <Row className="mb-3">
                      <Col md="6" className="mb-3">
                        <Form.Group>
                          <Form.Label>Restaurant Code</Form.Label>
                          <Form.Control type="text" name="restaurant_code" value={values.restaurant_code} disabled className="bg-light" />
                        </Form.Group>
                      </Col>

                      <Col md="6" className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            Restaurant Name <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.name && errors.name}
                            isValid={touched.name && !errors.name && editMode}
                          />
                          <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md="6" className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            Email <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.email && errors.email}
                            isValid={touched.email && !errors.email && editMode}
                          />
                          <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md="6" className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            Phone <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="mobile"
                            value={values.mobile}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.mobile && errors.mobile}
                            isValid={touched.mobile && !errors.mobile && editMode}
                            placeholder="Enter 10-digit phone number"
                          />
                          <Form.Control.Feedback type="invalid">{errors.mobile}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md="6" className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            FSSAI No. <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="fssai_no"
                            value={values.fssai_no}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.fssai_no && errors.fssai_no}
                            isValid={touched.fssai_no && !errors.fssai_no && editMode}
                            placeholder="Enter 14-digit FSSAI number"
                          />
                          <Form.Control.Feedback type="invalid">{errors.fssai_no}</Form.Control.Feedback>
                        </Form.Group>
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
                            type="button"
                            variant="secondary"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCancel(resetForm);
                            }}
                            disabled={saving || isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button variant="primary" type="submit" className="ms-2" disabled={saving || isSubmitting} style={{ minWidth: '100px' }}>
                            {saving || isSubmitting ? (
                              <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CsLineIcons icon="save" className="me-2" />
                                Submit
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditMode(true);
                          }}
                        >
                          <CsLineIcons icon="edit" className="me-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </Form>
                )}
              </Formik>

              {/* Saving overlay */}
              {saving && (
                <div
                  className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 9999,
                    backdropFilter: 'blur(2px)',
                  }}
                >
                  <Card className="shadow-lg border-0" style={{ minWidth: '200px' }}>
                    <Card.Body className="text-center p-4">
                      <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
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
