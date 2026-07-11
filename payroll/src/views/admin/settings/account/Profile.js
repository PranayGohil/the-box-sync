import React, { useState, useEffect } from 'react';
import { Button, Form, Card, Col, Row, Image, Spinner, Alert, Badge } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ImageCropperModal from 'components/cropper/ImageCropperModal';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Country, State, City } from 'country-state-city';

const Profile = () => {
  const title = 'Profile & Address';
  const description = 'Manage your restaurant profile and location details.';

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
    address: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [cropperState, setCropperState] = useState({ show: false, imageSrc: '', aspect: undefined });
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState({ countries: true, states: false, cities: false });

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
    address: Yup.string().required('Address is required').min(10, 'Address must be at least 10 characters'),
    country: Yup.string().required('Country is required'),
    state: Yup.string().required('State is required'),
    city: Yup.string().required('City is required'),
    pincode: Yup.string()
      .required('Pin code is required')
      .matches(/^[0-9]{6}$/, 'Pin code must be exactly 6 digits'),
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
          mobile: data.mobile || '',
          fssai_no: data.fssai_no || '',
          address: data.address || '',
          country: data.country || '',
          state: data.state || '',
          city: data.city || '',
          pincode: data.pincode || '',
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

  const handleCountryChange = (countryName, setFieldValue) => {
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

  const handleStateChange = (stateName, countryName, setFieldValue) => {
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
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropperState({ show: true, imageSrc: reader.result, aspect: undefined });
      });
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleCropComplete = (croppedFile) => {
    setLogoFile(croppedFile);
    setLogoPreview(URL.createObjectURL(croppedFile));
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

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const response = await axios.put(`${process.env.REACT_APP_API}/user/update`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedData = response.data.user || response.data;
      setProfile({ ...values, logo: updatedData.logo || profile.logo });
      setLogoFile(null);
      setLogoPreview('');
      setEditMode(false);
      toast.success('Profile updated successfully!');
      // window.location.reload(); // Removed to maintain SPA feel, but data is updated in state
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

  const customStyles = `
    .glass-card {
      background: rgba(255, 255, 255, 0.8) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-radius: 20px !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07) !important;
      transition: transform 0.3s ease, box-shadow 0.3s ease !important;
    }
    .glass-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.12) !important;
    }
    .custom-btn-outline {
      background: transparent !important;
      border: 1px solid #1ea8e7 !important;
      color: #1ea8e7 !important;
      border-radius: 50px !important;
      padding: 0.6rem 1.5rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
    }
    .custom-btn-outline:hover {
      background: #1ea8e7 !important;
      color: #ffffff !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(30, 168, 231, 0.3) !important;
    }
    .custom-btn-danger {
      background: transparent !important;
      border: 1px solid #cf2637 !important;
      color: #cf2637 !important;
      border-radius: 50px !important;
      padding: 0.6rem 1.5rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .custom-btn-danger i, .custom-btn-danger svg {
      color: #cf2637 !important;
      transition: color 0.3s ease !important;
    }
    .custom-btn-danger:hover {
      background: #cf2637 !important;
      color: #ffffff !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(207, 38, 55, 0.3) !important;
    }
    .custom-btn-danger:hover i, .custom-btn-danger:hover svg {
      color: #ffffff !important;
    }
    .section-header {
      border-left: 4px solid #1ea8e7;
      padding-left: 15px;
      margin-bottom: 25px;
    }
    .appearance-none {
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%231ea8e7' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 12px;
    }
  `;

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <style>{customStyles}</style>
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
      <style>{customStyles}</style>
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
        }}
        validationSchema={validationSchema}
        onSubmit={handleEditSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, resetForm, setFieldValue }) => (
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              <Col lg={4}>
                <Card className="glass-card border-0 mb-4 text-center">
                  <Card.Body className="p-4 d-flex flex-column align-items-center">
                    <div className="section-header text-start w-100 mb-4">
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

                    {editMode ? (
                      <div className="w-100 mt-auto">
                        <input type="file" id="logo-upload" className="d-none" accept="image/*" onChange={handleLogoChange} disabled={uploadingLogo || saving} />
                        <Button as="label" htmlFor="logo-upload" className="custom-btn-outline w-100 mb-2" disabled={uploadingLogo || saving}>
                          {uploadingLogo ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                          {getLogoSrc() ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                        <small className="text-muted d-block">JPG/PNG (Max 5MB)</small>
                      </div>
                    ) : (
                      <div className="mt-auto py-2 text-center">
                        <Badge bg="soft-primary" className="text-primary px-4 py-2 rounded-pill fw-bold">
                          Official Store
                        </Badge>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={8}>
                <Card className="glass-card border-0 h-100">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div className="section-header mb-0">
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                          <CsLineIcons icon="user" size="20" className="text-primary" />
                          Business Credentials
                        </h5>
                      </div>
                      {!editMode && (
                        <Button variant="none" className="custom-btn-outline" onClick={() => setEditMode(true)}>
                          <CsLineIcons icon="edit" size="18" />
                          Edit Profile
                        </Button>
                      )}
                    </div>

                    <Row className="g-4">
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
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">FSSAI Registration No. *</Form.Label>
                          <Form.Control type="text" name="fssai_no" value={values.fssai_no} onChange={handleChange} onBlur={handleBlur} disabled={!editMode || saving} isInvalid={touched.fssai_no && errors.fssai_no} className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""} />
                          <Form.Control.Feedback type="invalid">{errors.fssai_no}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="section-header mt-5">
                      <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="pin" size="20" className="text-primary" />
                        Physical Location
                      </h5>
                    </div>

                    <Row className="g-4">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Full Address *</Form.Label>
                          <Form.Control as="textarea" rows={3} name="address" value={values.address} onChange={handleChange} onBlur={handleBlur} disabled={!editMode || saving} isInvalid={touched.address && errors.address} className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""} style={{ resize: 'none' }} />
                          <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Country *</Form.Label>
                          <Form.Select name="country" value={values.country} onChange={(e) => handleCountryChange(e.target.value, setFieldValue)} onBlur={handleBlur} disabled={!editMode || saving} isInvalid={touched.country && errors.country} className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold appearance-none" : "appearance-none"}>
                            <option value="">Select Country</option>
                            {countries.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">{errors.country}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">State *</Form.Label>
                          <Form.Select name="state" value={values.state} onChange={(e) => handleStateChange(e.target.value, values.country, setFieldValue)} onBlur={handleBlur} disabled={!editMode || saving || !values.country} isInvalid={touched.state && errors.state} className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold appearance-none" : "appearance-none"}>
                            <option value="">Select State</option>
                            {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">{errors.state}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">City *</Form.Label>
                          <Form.Select name="city" value={values.city} onChange={handleChange} onBlur={handleBlur} disabled={!editMode || saving || !values.state} isInvalid={touched.city && errors.city} className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold appearance-none" : "appearance-none"}>
                            <option value="">Select City</option>
                            {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Pin Code *</Form.Label>
                          <Form.Control type="text" name="pincode" value={values.pincode} onChange={handleChange} onBlur={handleBlur} disabled={!editMode || saving} isInvalid={touched.pincode && errors.pincode} className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""} maxLength={6} />
                          <Form.Control.Feedback type="invalid">{errors.pincode}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    {error && <Alert variant="danger" className="mt-4 glass-card border-0">{error}</Alert>}

                    {editMode && (
                      <div className="d-flex gap-3 mt-5">
                        <Button variant="none" className="custom-btn-outline px-4" onClick={() => handleCancel(resetForm)} disabled={saving || isSubmitting}>
                          <CsLineIcons icon="close" size="18" />
                          Cancel
                        </Button>
                        <Button variant="none" className="custom-btn-outline px-5" type="submit" disabled={saving || isSubmitting}>
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
          <Card className="glass-card border-0 p-5 shadow-lg text-center">
            <Spinner animation="grow" variant="primary" className="mb-4" />
            <h4 className="fw-bold">Updating Data</h4>
            <p className="text-muted mb-0">Synchronizing your credentials and location.</p>
          </Card>
        </div>
      )}
      <ImageCropperModal
        show={cropperState.show}
        onHide={() => setCropperState({ ...cropperState, show: false })}
        imageSrc={cropperState.imageSrc}
        onCropComplete={handleCropComplete}
        initialAspect={cropperState.aspect}
      />
    </div>
  );
};

export default Profile;
