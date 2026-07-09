import React, { useState, useEffect } from 'react';
import { Button, Form, Card, Col, Row, Spinner, Alert, Modal, Badge } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Country, State, City } from 'country-state-city';
import Select from 'react-select';

const Profile = () => {
  const title = 'Profile & Address';
  const description = 'Manage your restaurant profile and location details.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
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
    gst_no: '',
    address: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState({ countries: true, states: false, cities: false });

  // Compliance Modal State
  const [complianceModal, setComplianceModal] = useState({ show: false, type: null }); // type: 'gst' | 'fssai'
  const [complianceValue, setComplianceValue] = useState('');
  const [complianceSaving, setComplianceSaving] = useState(false);
  const [complianceError, setComplianceError] = useState('');

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
      .matches(/^[0-9]{14}$/, { message: 'FSSAI number must be exactly 14 digits', excludeEmptyString: true }),
    address: Yup.string().min(10, 'Address must be at least 10 characters'),
    country: Yup.string().required('Country is required'),
    state: Yup.string().required('State is required'),
    city: Yup.string().required('City is required'),
    pincode: Yup.string()
      .required('Pin code is required')
      .matches(/^[0-9]{6}$/, 'Pin code must be exactly 6 digits'),
    password: Yup.string().when(['email', 'mobile'], {
      is: (email, mobile) => {
        return (email && email !== profile.email) || (mobile && mobile !== profile.mobile);
      },
      then: (schema) => schema.required('Current password is required to change Email or Phone number'),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  // Load countries on mount
  useEffect(() => {
    setCountries(Country.getAllCountries());
    setLoadingStates((prev) => ({ ...prev, countries: false }));
  }, []);

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
        const profileData = {
          restaurant_code: data.restaurant_code || '',
          name: data.name || '',
          logo: data.logo || '',
          email: data.email || '',
          mobile: data.mobile ? String(data.mobile) : '',
          fssai_no: data.fssai_no || '',
          gst_no: data.gst_no || '',
          address: data.address || '',
          country: data.country || '',
          state: data.state || '',
          city: data.city || '',
          pincode: data.pincode ? String(data.pincode) : '',
        };

        setProfile(profileData);

        // Pre-load states and cities if data exists
        if (profileData.country) {
          const countryObj = Country.getAllCountries().find(c => c.name === profileData.country);
          if (countryObj) {
            const countryStates = State.getStatesOfCountry(countryObj.isoCode);
            setStates(countryStates);
            if (profileData.state) {
              const stateObj = countryStates.find(s => s.name === profileData.state);
              if (stateObj) {
                setCities(City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode));
              }
            }
          }
        }
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

  const handleCountryChange = (selected, setFieldValue) => {
    const countryName = selected ? selected.value : '';
    setFieldValue('country', countryName);
    setFieldValue('state', '');
    setFieldValue('city', '');
    setStates([]);
    setCities([]);

    if (countryName) {
      setLoadingStates((prev) => ({ ...prev, states: true }));
      const countryObj = Country.getAllCountries().find(c => c.name === countryName);
      if (countryObj) {
        setStates(State.getStatesOfCountry(countryObj.isoCode));
      }
      setLoadingStates((prev) => ({ ...prev, states: false }));
    }
  };

  const handleStateChange = (selected, countryName, setFieldValue) => {
    const stateName = selected ? selected.value : '';
    setFieldValue('state', stateName);
    setFieldValue('city', '');
    setCities([]);

    if (stateName && countryName) {
      setLoadingStates((prev) => ({ ...prev, cities: true }));
      const countryObj = Country.getAllCountries().find(c => c.name === countryName);
      if (countryObj) {
        const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(s => s.name === stateName);
        if (stateObj) {
          setCities(City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode));
        }
      }
      setLoadingStates((prev) => ({ ...prev, cities: false }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should not exceed 5MB');
        return;
      }
      setUploadingLogo(true);
      setTimeout(() => {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
        setUploadingLogo(false);
      }, 500);
    }
  };

  const openComplianceModal = (type) => {
    setComplianceValue(type === 'gst' ? profile.gst_no : profile.fssai_no);
    setComplianceError('');
    setComplianceModal({ show: true, type });
  };

  const handleComplianceSave = async () => {
    const { type } = complianceModal;
    setComplianceSaving(true);
    setComplianceError('');

    // Validate
    if (type === 'gst') {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (complianceValue && !gstRegex.test(complianceValue)) {
        setComplianceError('GST number format is invalid (e.g. 22AAAAA0000A1Z5)');
        setComplianceSaving(false);
        return;
      }
    }
    if (type === 'fssai') {
      if (complianceValue && !/^[0-9]{14}$/.test(complianceValue)) {
        setComplianceError('FSSAI number must be exactly 14 digits');
        setComplianceSaving(false);
        return;
      }
    }

    try {
      if (type === 'gst') {
        // Use update-tax endpoint for gst_no
        await axios.put(
          `${process.env.REACT_APP_API}/user/update-tax`,
          { gst_no: complianceValue, taxInfo: {} },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setProfile((prev) => ({ ...prev, gst_no: complianceValue }));
      } else {
        // Use general update endpoint for fssai_no
        const formData = new FormData();
        formData.append('fssai_no', complianceValue);
        await axios.put(`${process.env.REACT_APP_API}/user/update`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        setProfile((prev) => ({ ...prev, fssai_no: complianceValue }));
      }
      toast.success(`${type === 'gst' ? 'GST Number' : 'FSSAI Licence'} updated successfully!`);
      setComplianceModal({ show: false, type: null });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save. Please try again.';
      setComplianceError(msg);
    } finally {
      setComplianceSaving(false);
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
      formData.append('address', values.address);
      formData.append('country', values.country);
      formData.append('state', values.state);
      formData.append('city', values.city);
      formData.append('pincode', values.pincode);
      if (values.password) {
        formData.append('password', values.password);
      }

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await axios.put(`${process.env.REACT_APP_API}/user/update`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

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
    if (logoPreview) return logoPreview;
    if (profile.logo) return `${process.env.REACT_APP_UPLOAD_DIR}${profile.logo}`;
    return '';
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <HtmlHead title={title} description={description} />
        <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
          <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
          <h5 className="fw-bold">Loading Profile Details...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <HtmlHead title={title} description={description} />

      <Row className="g-3 align-items-center mb-4">
        <Col md={7}>
          <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
          <BreadcrumbList items={breadcrumbs} />
        </Col>
      </Row>

      <Formik
        initialValues={{
          restaurant_code: profile.restaurant_code,
          name: profile.name,
          email: profile.email,
          mobile: profile.mobile,
          fssai_no: profile.fssai_no,
          address: profile.address,
          country: profile.country,
          state: profile.state,
          city: profile.city,
          pincode: profile.pincode,
          password: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleEditSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, resetForm, setFieldValue }) => (
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              <Col lg={4}>
                <Card className="profile-glass-card border-0 mb-4 text-center">
                  <Card.Body className="p-4 d-flex flex-column align-items-center">
                    <div className="profile-section-header text-start w-100 mb-4">
                      <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="image" size="20" className="text-primary" />
                        Brand Identity
                      </h5>
                    </div>

                    <div className="mb-4 d-flex justify-content-center">
                      <div className="rounded-circle border border-4 border-light overflow-hidden shadow-sm bg-light d-flex align-items-center justify-content-center" style={{ width: '180px', height: '180px' }}>
                        {getLogoSrc() ? (
                          <img src={getLogoSrc()} alt="Logo" className="w-100 h-100 object-fit-cover" />
                        ) : (
                          <CsLineIcons icon="image" size="64" className="text-muted opacity-20" />
                        )}
                      </div>
                    </div>

                    {editMode && (
                      <div className="w-100 mt-auto">
                        <input type="file" id="logo-upload" className="d-none" accept="image/*" onChange={handleLogoChange} disabled={uploadingLogo || saving} />
                        <Button as="label" htmlFor="logo-upload" className="profile-custom-btn-outline w-100 mb-2" disabled={uploadingLogo || saving}>
                          {uploadingLogo ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                          {getLogoSrc() ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                        <small className="text-muted d-block">JPG/PNG (Max 5MB)</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={8}>
                <Card className="profile-glass-card border-0 h-100">
                  <Card.Body className="p-4">
                    <div className="d-flex profile-profile-header-container align-items-center justify-content-between mb-4">
                      <div className="profile-section-header mb-0">
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                          <CsLineIcons icon="user" size="20" className="text-primary" />
                          Business Credentials
                        </h5>
                      </div>
                      {!editMode && (
                        <Button variant="none" className="profile-custom-btn-outline w-md-auto w-100 mt-md-0 mt-2" onClick={() => setEditMode(true)}>
                          <CsLineIcons icon="edit" size="18" />
                          Edit Profile
                        </Button>
                      )}
                    </div>

                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Restaurant Code</Form.Label>
                          <Form.Control type="text" value={values.restaurant_code} disabled className="bg-light border-0 px-3 py-2 fw-bold text-primary" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Restaurant Name *</Form.Label>
                          <Form.Control type="text" name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} disabled={!editMode || saving} isInvalid={touched.name && errors.name} className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""} />
                          <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Email Address *</Form.Label>
                          <Form.Control type="email" name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} disabled={!editMode || saving} isInvalid={touched.email && errors.email} className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""} />
                          <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Phone Number *</Form.Label>
                          <Form.Control type="text" name="mobile" value={values.mobile} onChange={handleChange} onBlur={handleBlur} disabled={!editMode || saving} isInvalid={touched.mobile && errors.mobile} className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""} />
                          <Form.Control.Feedback type="invalid">{errors.mobile}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      {(editMode && (values.email !== profile.email || values.mobile !== profile.mobile)) && (
                        <Col md={12}>
                          <Form.Group className="mt-2 animate__animated animate__fadeIn">
                            <Form.Label className="small fw-bold text-danger">Current Password * (Required to change Email or Phone Number)</Form.Label>
                            <Form.Control
                              type="password"
                              name="password"
                              placeholder="Enter your current password to authorize this change"
                              value={values.password}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              disabled={saving}
                              isInvalid={touched.password && !!errors.password}
                            />
                            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      )}
                    </Row>

                    {/* Business Compliance Section */}
                    <div className="profile-section-header mt-5 mb-3">
                      <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="shield" size="20" className="text-primary" />
                        Business Compliance
                      </h5>
                    </div>
                    <Row className="g-3 mb-2">
                      {/* GST Number Card */}
                      <Col xs={12}>
                        <div
                          className="p-3 rounded-4 d-flex align-items-center justify-content-between flex-wrap gap-2"
                          style={{
                            background: profile.gst_no ? 'rgba(34, 197, 94, 0.06)' : 'rgba(249, 115, 22, 0.06)',
                            border: `1.5px dashed ${profile.gst_no ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.35)'}`,
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: 42, height: 42,
                                background: profile.gst_no ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.12)',
                              }}
                            >
                              <CsLineIcons icon="file-text" size="20" style={{ color: profile.gst_no ? '#22c55e' : '#f97316' }} />
                            </div>
                            <div className="text-truncate">
                              <div className="fw-bold text-dark small mb-0">GST Number</div>
                              {profile.gst_no ? (
                                <div className="text-muted" style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                                  {profile.gst_no}
                                </div>
                              ) : (
                                <Badge bg="warning" text="dark" className="rounded-pill px-2 py-1" style={{ fontSize: '0.7rem' }}>Not Added</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="none"
                            className="profile-custom-btn-outline px-3 py-1 flex-shrink-0"
                            style={{ fontSize: '0.78rem' }}
                            onClick={() => openComplianceModal('gst')}
                          >
                            <CsLineIcons icon={profile.gst_no ? 'edit' : 'plus'} size="14" className="me-1" />
                            {profile.gst_no ? 'Edit' : 'Add GST'}
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    <div className="profile-section-header mt-5">
                      <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="pin" size="20" className="text-primary" />
                        Location
                      </h5>
                    </div>

                    <Row className="g-3">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Full Address</Form.Label>
                          <Form.Control as="textarea" rows={3} name="address" value={values.address || ''} onChange={handleChange} onBlur={handleBlur} disabled={!editMode || saving} isInvalid={touched.address && errors.address} className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""} style={{ resize: 'none' }} />
                          <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4} xs={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold opacity-75">Country *</Form.Label>
                          {editMode ? (
                            <Select
                              classNamePrefix="react-select"
                              options={countries.map((c) => ({ label: c.name, value: c.name }))}
                              value={values.country ? { label: values.country, value: values.country } : null}
                              onChange={(selected) => handleCountryChange(selected, setFieldValue)}
                              placeholder="Select Country"
                              isDisabled={saving}
                              menuPortalTarget={document.body}
                              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                            />
                          ) : (
                            <Form.Control type="text" value={values.country || 'Not Specified'} disabled className="bg-light border-0 px-3 py-2 fw-bold" />
                          )}
                          {touched.country && errors.country && <div className="text-danger mt-1 small fw-bold">{errors.country}</div>}
                        </Form.Group>
                      </Col>
                      <Col md={4} xs={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold opacity-75">State *</Form.Label>
                          {editMode ? (
                            <Select
                              classNamePrefix="react-select"
                              options={states.map((s) => ({ label: s.name, value: s.name }))}
                              value={values.state ? { label: values.state, value: values.state } : null}
                              onChange={(selected) => handleStateChange(selected, values.country, setFieldValue)}
                              placeholder="Select State"
                              isDisabled={!values.country || saving}
                              menuPortalTarget={document.body}
                              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                            />
                          ) : (
                            <Form.Control type="text" value={values.state || 'Not Specified'} disabled className="bg-light border-0 px-3 py-2 fw-bold" />
                          )}
                          {touched.state && errors.state && <div className="text-danger mt-1 small fw-bold">{errors.state}</div>}
                        </Form.Group>
                      </Col>
                      <Col md={4} xs={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold opacity-75">City *</Form.Label>
                          {editMode ? (
                            <Select
                              classNamePrefix="react-select"
                              options={cities.map((c) => ({ label: c.name, value: c.name }))}
                              value={values.city ? { label: values.city, value: values.city } : null}
                              onChange={(selected) => setFieldValue('city', selected ? selected.value : '')}
                              placeholder="Select City"
                              isDisabled={!values.state || saving}
                              menuPortalTarget={document.body}
                              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                            />
                          ) : (
                            <Form.Control type="text" value={values.city || 'Not Specified'} disabled className="bg-light border-0 px-3 py-2 fw-bold" />
                          )}
                          {touched.city && errors.city && <div className="text-danger mt-1 small fw-bold">{errors.city}</div>}
                        </Form.Group>
                      </Col>
                      <Col md={4} xs={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold opacity-75">Pin Code *</Form.Label>
                          <Form.Control type="text" name="pincode" value={values.pincode} onChange={handleChange} onBlur={handleBlur} disabled={!editMode || saving} isInvalid={touched.pincode && errors.pincode} className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""} maxLength={6} />
                          <Form.Control.Feedback type="invalid">{errors.pincode}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    {error && <Alert variant="danger" className="mt-4 profile-glass-card border-0">{error}</Alert>}
                    {editMode && Object.keys(errors).length > 0 && (
                      <Alert variant="danger" className="mt-4 profile-glass-card border-0">
                        <div className="fw-bold mb-2">Please correct the following errors:</div>
                        <ul className="mb-0">
                          {Object.entries(errors).map(([field, msg]) => (
                            <li key={field}>{msg}</li>
                          ))}
                        </ul>
                      </Alert>
                    )}

                    {editMode && (
                      <div className="d-flex profile-button-group-responsive gap-3 mt-5">
                        <Button variant="none" className="profile-custom-btn-outline px-4" onClick={() => handleCancel(resetForm)} disabled={saving || isSubmitting}>
                          <CsLineIcons icon="close" size="18" />
                          Cancel
                        </Button>
                        <Button variant="none" className="profile-custom-btn-outline px-5" type="submit" disabled={saving || isSubmitting}>
                          {saving || isSubmitting ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CsLineIcons icon="save" size="20" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

            </Row>
          </Form>
        )}
      </Formik>

      {saving && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
          <Card className="profile-glass-card border-0 p-5 shadow-lg text-center">
            <Spinner animation="grow" variant="primary" className="mb-4" />
            <h4 className="fw-bold">Updating Data</h4>
            <p className="text-muted mb-0">Synchronizing your credentials and location.</p>
          </Card>
        </div>
      )}

      {/* Compliance Add/Edit Modal */}
      <Modal
        show={complianceModal.show}
        onHide={() => !complianceSaving && setComplianceModal({ show: false, type: null })}
        centered
        contentClassName="border-0 shadow-lg"
        style={{ borderRadius: '1.5rem' }}
      >
        <Modal.Header className="border-0 pb-0 px-4 pt-4" closeButton={!complianceSaving}>
          <Modal.Title className="fw-bold d-flex align-items-center gap-2" style={{ color: '#1ea8e7' }}>
            <CsLineIcons icon={complianceModal.type === 'gst' ? 'file-text' : 'tag'} size="22" style={{ color: '#1ea8e7' }} />
            {complianceModal.type === 'gst'
              ? (profile.gst_no ? 'Edit GST Number' : 'Add GST Number')
              : (profile.fssai_no ? 'Edit FSSAI Licence' : 'Add FSSAI Licence')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pt-3 pb-1">
          <p className="text-muted small mb-3">
            {complianceModal.type === 'gst'
              ? 'Enter your 15-digit GST Identification Number (GSTIN).'
              : 'Enter your 14-digit FSSAI Registration / Licence Number.'}
          </p>
          <Form.Group>
            <Form.Label className="small fw-bold opacity-75">
              {complianceModal.type === 'gst' ? 'GST Number' : 'FSSAI Licence No.'}
            </Form.Label>
            <Form.Control
              type="text"
              placeholder={complianceModal.type === 'gst' ? 'e.g. 22AAAAA0000A1Z5' : 'e.g. 12345678901234'}
              value={complianceValue}
              onChange={(e) => { setComplianceValue(e.target.value.toUpperCase()); setComplianceError(''); }}
              disabled={complianceSaving}
              maxLength={complianceModal.type === 'gst' ? 15 : 14}
              isInvalid={!!complianceError}
              autoFocus
            />
            {complianceError && <Form.Control.Feedback type="invalid">{complianceError}</Form.Control.Feedback>}
          </Form.Group>
          {complianceModal.type === 'fssai' && (
            <small className="text-muted d-block mt-2">Leave blank to remove existing FSSAI number.</small>
          )}
          {complianceModal.type === 'gst' && (
            <small className="text-muted d-block mt-2">Leave blank to remove existing GST number.</small>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pt-2 pb-4 d-flex gap-2">
          <Button
            variant="none"
            className="profile-custom-btn-outline px-4"
            onClick={() => setComplianceModal({ show: false, type: null })}
            disabled={complianceSaving}
          >
            <CsLineIcons icon="close" size="16" className="me-1" />
            Cancel
          </Button>
          <Button
            variant="none"
            className="profile-custom-btn-outline px-5"
            onClick={handleComplianceSave}
            disabled={complianceSaving}
          >
            {complianceSaving ? (
              <><Spinner as="span" animation="border" size="sm" className="me-2" />Saving...</>
            ) : (
              <><CsLineIcons icon="save" size="16" className="me-1" />Save</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Profile;
