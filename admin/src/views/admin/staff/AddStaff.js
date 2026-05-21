import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { Country, State, City } from 'country-state-city';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

const AddStaff = () => {
  const title = 'Add Staff';
  const description = 'Add a new staff member.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'staff', text: 'Staff Management' },
    { to: 'staff/add-staff', title: 'Add Staff' },
  ];

  const history = useHistory();

  const [loading, setLoading] = useState({
    initial: true,
    positions: false,
    submitting: false,
  });
  const [fileUploadError, setFileUploadError] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState({
    photo: false,
    front_image: false,
    back_image: false,
  });

  // Common restaurant staff positions
  const commonPositions = [
    'Manager',
    'Assistant Manager',
    'Head Chef',
    'Sous Chef',
    'Line Cook',
    'Prep Cook',
    'Pastry Chef',
    'Waiter',
    'Waitress',
    'Server',
    'Host/Hostess',
    'Bartender',
    'Barista',
    'Busser',
    'Dishwasher',
    'Kitchen Helper',
    'Food Runner',
    'Cashier',
    'Supervisor',
    'Shift Leader',
    'Delivery Driver',
    'Receptionist',
    'Accountant',
    'HR Manager',
    'Marketing Manager',
    'Maintenance Staff',
    'Security Guard',
    'Cleaning Staff',
  ];

  const addStaff = Yup.object().shape({
    staff_id: Yup.string()
      .required('Staff ID is required')
      .matches(/^[A-Za-z0-9]+$/, 'Staff ID must be alphanumeric'),

    f_name: Yup.string()
      .required('First name is required')
      .matches(/^[A-Za-z\s]+$/, 'First name must only contain letters'),

    l_name: Yup.string()
      .required('Last name is required')
      .matches(/^[A-Za-z\s]+$/, 'Last name must only contain letters'),

    birth_date: Yup.date().required('Birth date is required').max(new Date(), 'Birth date cannot be in the future'),

    joining_date: Yup.date().required('Joining date is required').min(Yup.ref('birth_date'), 'Joining date must be after birth date'),

    address: Yup.string().required('Address is required'),
    country: Yup.string().required('Country is required'),
    state: Yup.string().required('State is required'),
    city: Yup.string().required('City is required'),
    pincode: Yup.string()
      .required('Pincode is required')
      .matches(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits'),
    gender: Yup.string().required('Gender is required'),

    phone_no: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),

    email: Yup.string().required('Email is required').email('Enter a valid email address'),

    salary: Yup.number().required('Salary is required').positive('Salary must be a positive number'),

    position: Yup.string().required('Position is required'),

    photo: Yup.mixed()
      .required('Photo is required')
      .test(
        'fileType',
        'Unsupported file format (JPEG, PNG, JPG, WebP only)',
        (value) => !value || (value && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type))
      ),

    document_type: Yup.string().required('Document type is required').oneOf(['National Identity Card', 'Pan Card', 'Voter Card'], 'Invalid document type'),

    id_number: Yup.string()
      .required('ID number is required')
      .when('document_type', (docType, schema) => {
        const aadharRegex = /^[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}$/;
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        const voterRegex = /^[A-Z]{3}[0-9]{7}$/;

        if (docType === 'National Identity Card') {
          return schema.matches(aadharRegex, 'Aadhar number must be 12 digits (format: XXXX XXXX XXXX)');
        }
        if (docType === 'Pan Card') {
          return schema.matches(panRegex, 'PAN card format must be ABCDE1234F (5 letters, 4 digits, 1 letter)');
        }
        if (docType === 'Voter Card') {
          return schema.matches(voterRegex, 'Voter ID format must be ABC1234567 (3 letters, 7 digits)');
        }
        return schema;
      }),

    front_image: Yup.mixed()
      .required('Front ID image is required')
      .test(
        'fileType',
        'Unsupported file format (JPEG, PNG, JPG, WebP only)',
        (value) => !value || (value && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type))
      ),

    back_image: Yup.mixed()
      .when('document_type', (docType, schema) => {
        if (docType === 'National Identity Card') {
          return schema.required('Back ID image is required for Aadhar card');
        }
        return schema.notRequired();
      })
      .test(
        'fileType',
        'Unsupported file format (JPEG, PNG, JPG, WebP only)',
        (value) => !value || (value && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type))
      ),
  });

  const formik = useFormik({
    initialValues: {
      staff_id: '',
      f_name: '',
      l_name: '',
      birth_date: '',
      joining_date: '',
      address: '',
      country: '',
      state: '',
      city: '',
      pincode: '',
      gender: '',
      phone_no: '',
      email: '',
      salary: '',
      position: '',
      photo: '',
      document_type: '',
      id_number: '',
      front_image: '',
      back_image: '',
    },
    validationSchema: addStaff,
    onSubmit: async (values, { setSubmitting }) => {
      setLoading((prev) => ({ ...prev, submitting: true }));
      setFileUploadError(null);
      try {
        const formData = new FormData();

        Object.keys(values).forEach((key) => {
          if (key !== 'photo' && key !== 'front_image' && key !== 'back_image') {
            formData.append(key, values[key]);
          }
        });

        if (values.photo) formData.append('photo', values.photo);
        if (values.front_image) formData.append('front_image', values.front_image);
        if (values.back_image) formData.append('back_image', values.back_image);

        const addResponse = await axios.post(`${process.env.REACT_APP_API}/staff/add`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        console.log('Staff added successfully:', addResponse.data);
        toast.success('Staff added successfully!');
        history.push('/staff/view');
      } catch (err) {
        console.error('Error during staff submission:', err);
        const serverError = err.response?.data?.error;
        const serverMessage = err.response?.data?.message;
        const errorMsg = Array.isArray(serverError)
          ? serverError.join(', ')
          : (serverError || serverMessage || 'Staff submission failed. Please try again.');
        setFileUploadError(errorMsg);
        toast.error('Add staff failed.');
      } finally {
        setLoading((prev) => ({ ...prev, submitting: false }));
        setSubmitting(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  const calendarStyles = `
    .date-input-container input[type="date"]::-webkit-calendar-picker-indicator {
      position: absolute !important;
      right: 12px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 24px !important;
      height: 24px !important;
      cursor: pointer !important;
      opacity: 0 !important;
      z-index: 5 !important;
    }
  `;


  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading((prev) => ({ ...prev, initial: true }));
        setCountries(Country.getAllCountries());

        const response = await axios.get(`${process.env.REACT_APP_API}/staff/get-positions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPositions(response.data.data);
      } catch (error) {
        console.error('Error fetching positions:', error);
        toast.error('Failed to fetch positions.');
      } finally {
        setLoading((prev) => ({ ...prev, initial: false }));
      }
    };
    initializeData();
  }, []);

  // Combine API positions with common positions and remove duplicates
  const allPositions = [...new Set([...commonPositions, ...positions])].sort();
  const positionOptions = allPositions.map((pos) => ({
    label: pos,
    value: pos,
  }));

  const handleCountryChange = (selected) => {
    const countryName = selected ? selected.value : '';
    const selectedCountry = countries.find((c) => c.name === countryName);
    setFieldValue('country', countryName);
    setStates(selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : []);
    setCities([]);
    setFieldValue('state', '');
    setFieldValue('city', '');
  };

  const handleStateChange = (selected) => {
    const stateName = selected ? selected.value : '';
    const selectedCountry = countries.find((c) => c.name === values.country);
    const selectedState = states.find((s) => s.name === stateName);
    setFieldValue('state', stateName);
    setCities(selectedCountry && selectedState ? City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode) : []);
    setFieldValue('city', '');
  };

  const convertToWebPAndResize = (file, maxSizeBytes = 500 * 1024) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            const maxDimension = 1920;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            let quality = 0.9;
            const attemptCompression = (q) => {
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    resolve(file);
                    return;
                  }
                  if (blob.size <= maxSizeBytes || q <= 0.1) {
                    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    const newFileName = `${originalName}.webp`;
                    const compressedFile = new File([blob], newFileName, {
                      type: 'image/webp',
                      lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                  } else {
                    attemptCompression(q - 0.1);
                  }
                },
                'image/webp',
                q
              );
            };

            attemptCompression(quality);
          } catch (e) {
            console.error('Error during canvas processing:', e);
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleFileChange = async (fieldName, file, setPreview) => {
    setUploadingFiles((prev) => ({ ...prev, [fieldName]: true }));

    let processedFile = file;
    if (file) {
      try {
        processedFile = await convertToWebPAndResize(file);
      } catch (err) {
        console.error('Failed to process image:', err);
      }
    }

    setFieldValue(fieldName, processedFile);
    if (processedFile) {
      setPreview(URL.createObjectURL(processedFile));
    }

    setUploadingFiles((prev) => ({ ...prev, [fieldName]: false }));
  };

  

  if (loading.initial) {
    return (
      <div className="container-fluid py-5">
        
        <HtmlHead title={title} description={description} />
        <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
          <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
          <h5 className="fw-bold">Initializing Form...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="add-staff-staff-container pb-5">
      <style>{calendarStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="container-fluid px-lg-5">
        <div className="add-staff-page-title-container mb-4 mt-5 mt-md-n3">
          <Row className="g-3 align-items-center">
            <Col md={7}>
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>
                {title}
              </h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="12" md="5" className="d-flex add-staff-button-group-responsive justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button className="add-staff-custom-btn-outline" onClick={() => history.push('/staff/view')} disabled={loading.submitting}>
                <CsLineIcons icon="arrow-left" size="18" /> Back to List
              </Button>
            </Col>
          </Row>
        </div>

        {fileUploadError && (
          <Alert variant="danger" className="add-staff-glass-card border-0 mb-4 p-4 shadow-sm d-flex align-items-center gap-3">
            <CsLineIcons icon="error" size="24" className="text-danger" />
            <span className="fw-bold">{fileUploadError}</span>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="g-4">
            <Col lg={8}>
              {/* Main Details Section */}
              <Card className="add-staff-glass-card border-0 mb-4">
                <Card.Body className="p-4">
                  <div className="add-staff-section-header">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="user" size="20" className="text-primary" />
                      Personal Information
                    </h5>
                  </div>

                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Staff ID</Form.Label>
                        <Form.Control
                          type="text"
                          name="staff_id"
                          placeholder="e.g. STF001"
                          value={values.staff_id}
                          onChange={handleChange}
                          isInvalid={touched.staff_id && errors.staff_id}
                          disabled={loading.submitting}
                        />
                        <Form.Control.Feedback type="invalid">{errors.staff_id}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>First Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="f_name"
                          placeholder="First Name"
                          value={values.f_name}
                          onChange={handleChange}
                          isInvalid={touched.f_name && errors.f_name}
                          disabled={loading.submitting}
                        />
                        <Form.Control.Feedback type="invalid">{errors.f_name}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="l_name"
                          placeholder="Last Name"
                          value={values.l_name}
                          onChange={handleChange}
                          isInvalid={touched.l_name && errors.l_name}
                          disabled={loading.submitting}
                        />
                        <Form.Control.Feedback type="invalid">{errors.l_name}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Gender</Form.Label>
                        <Form.Select
                          name="gender"
                          value={values.gender}
                          onChange={handleChange}
                          isInvalid={touched.gender && errors.gender}
                          disabled={loading.submitting}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{errors.gender}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Birth Date</Form.Label>
                        <div className="position-relative date-input-container">
                          <Form.Control
                            type="date"
                            name="birth_date"
                            value={values.birth_date}
                            onChange={handleChange}
                            isInvalid={touched.birth_date && errors.birth_date}
                            disabled={loading.submitting}
                            className="pe-5"
                          />
                          <div 
                            className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted"
                            style={{ pointerEvents: 'none', zIndex: 4 }}
                          >
                            <CsLineIcons icon="calendar" size="18" className="text-primary" />
                          </div>
                        </div>
                        {touched.birth_date && errors.birth_date && (
                          <div className="text-danger mt-1 small">{errors.birth_date}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Joining Date</Form.Label>
                        <div className="position-relative date-input-container">
                          <Form.Control
                            type="date"
                            name="joining_date"
                            value={values.joining_date}
                            onChange={handleChange}
                            isInvalid={touched.joining_date && errors.joining_date}
                            disabled={loading.submitting}
                            className="pe-5"
                          />
                          <div 
                            className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted"
                            style={{ pointerEvents: 'none', zIndex: 4 }}
                          >
                            <CsLineIcons icon="calendar" size="18" className="text-primary" />
                          </div>
                        </div>
                        {touched.joining_date && errors.joining_date && (
                          <div className="text-danger mt-1 small">{errors.joining_date}</div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col xs={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Residential Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          name="address"
                          placeholder="Complete Street Address..."
                          value={values.address}
                          onChange={handleChange}
                          isInvalid={touched.address && errors.address}
                          disabled={loading.submitting}
                        />
                        <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={3} xs={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Country</Form.Label>
                        <Select
                          classNamePrefix="react-select"
                          options={countries.map((c) => ({ label: c.name, value: c.name }))}
                          value={values.country ? { label: values.country, value: values.country } : null}
                          onChange={(selected) => handleCountryChange(selected)}
                          placeholder="Select Country"
                          isDisabled={loading.submitting}
                          menuPortalTarget={document.body}
                          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        />
                        {touched.country && errors.country && <div className="text-danger mt-1 small fw-bold">{errors.country}</div>}
                      </Form.Group>
                    </Col>
                    <Col md={3} xs={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>State</Form.Label>
                        <Select
                          classNamePrefix="react-select"
                          options={states.map((s) => ({ label: s.name, value: s.name }))}
                          value={values.state ? { label: values.state, value: values.state } : null}
                          onChange={(selected) => handleStateChange(selected)}
                          placeholder="Select State"
                          isDisabled={!values.country || loading.submitting}
                          menuPortalTarget={document.body}
                          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        />
                        {touched.state && errors.state && <div className="text-danger mt-1 small fw-bold">{errors.state}</div>}
                      </Form.Group>
                    </Col>
                    <Col md={3} xs={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>City</Form.Label>
                        <Select
                          classNamePrefix="react-select"
                          options={cities.map((c) => ({ label: c.name, value: c.name }))}
                          value={values.city ? { label: values.city, value: values.city } : null}
                          onChange={(selected) => setFieldValue('city', selected ? selected.value : '')}
                          placeholder="Select City"
                          isDisabled={!values.state || loading.submitting}
                          menuPortalTarget={document.body}
                          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        />
                        {touched.city && errors.city && <div className="text-danger mt-1 small fw-bold">{errors.city}</div>}
                      </Form.Group>
                    </Col>
                    <Col md={3} xs={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Pincode</Form.Label>
                        <Form.Control
                          type="text"
                          name="pincode"
                          placeholder="e.g. 400001"
                          value={values.pincode}
                          onChange={handleChange}
                          isInvalid={touched.pincode && errors.pincode}
                          disabled={loading.submitting}
                        />
                        <Form.Control.Feedback type="invalid">{errors.pincode}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6} xs={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="phone_no"
                          placeholder="10-digit number"
                          value={values.phone_no}
                          onChange={handleChange}
                          isInvalid={touched.phone_no && errors.phone_no}
                          disabled={loading.submitting}
                        />
                        <Form.Control.Feedback type="invalid">{errors.phone_no}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6} xs={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="email@restaurant.com"
                          value={values.email}
                          onChange={handleChange}
                          isInvalid={touched.email && errors.email}
                          disabled={loading.submitting}
                        />
                        <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
 
              {/* Employment & Payroll Section */}
              <Card className="add-staff-glass-card border-0 mb-4">
                <Card.Body className="p-4">
                  <div className="add-staff-section-header">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="briefcase" size="20" className="text-primary" />
                      Employment & Payroll
                    </h5>
                  </div>
 
                  <Row className="g-3">
                    <Col md={6} xs={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Job Position</Form.Label>
                        <CreatableSelect
                          isClearable
                          isDisabled={loading.submitting || loading.positions}
                          options={positionOptions}
                          value={values.position ? { label: values.position, value: values.position } : null}
                          onChange={(selected) => setFieldValue('position', selected ? selected.value : '')}
                          onBlur={() => formik.setFieldTouched('position', true)}
                          placeholder="Select or type..."
                          classNamePrefix="react-select"
                          menuPortalTarget={document.body}
                          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        />
                        {touched.position && errors.position && <div className="text-danger mt-1 small fw-bold">{errors.position}</div>}
                      </Form.Group>
                    </Col>
                    <Col md={6} xs={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Salary (Base)</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">₹</span>
                          <Form.Control
                            type="number"
                            name="salary"
                            placeholder="0.00"
                            value={values.salary}
                            onChange={handleChange}
                            isInvalid={touched.salary && errors.salary}
                            disabled={loading.submitting}
                          />
                          <Form.Control.Feedback type="invalid">{errors.salary}</Form.Control.Feedback>
                        </div>
                      </Form.Group>
                    </Col>


                  </Row>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              {/* Profile Photo Section */}
              <Card className="add-staff-glass-card border-0 mb-4 text-center">
                <Card.Body className="p-4">
                  <div className="add-staff-section-header text-start">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="camera" size="20" className="text-primary" />
                      Profile Photo
                    </h5>
                  </div>

                  <div className="d-flex flex-column align-items-center">
                    <div className="add-staff-preview-container mb-3 shadow-sm border-2">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="add-staff-preview-image" />
                      ) : (
                        <CsLineIcons icon="user" size="40" className="text-muted opacity-20" />
                      )}
                    </div>

                    <Form.Group className="w-100">
                      <Form.Control
                        type="file"
                        id="photo-upload"
                        className="d-none"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleFileChange('photo', file, setPhotoPreview);
                        }}
                      />
                      <Button
                        as="label"
                        htmlFor="photo-upload"
                        className="add-staff-custom-btn-outline px-4 mx-auto"
                        style={{ maxWidth: 'fit-content' }}
                        disabled={loading.submitting || uploadingFiles.photo}
                      >
                        {uploadingFiles.photo ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                      {touched.photo && errors.photo && <div className="text-danger mt-2 small fw-bold">{errors.photo}</div>}
                    </Form.Group>
                  </div>
                </Card.Body>
              </Card>

              {/* Documents Section */}
              <Card className="add-staff-glass-card border-0 mb-4">
                <Card.Body className="p-4">
                  <div className="add-staff-section-header">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="notepads" size="20" className="text-primary" />
                      Identification
                    </h5>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Document Type</Form.Label>
                    <Select
                      classNamePrefix="react-select"
                      options={[
                        { label: 'National Identity Card (Aadhar)', value: 'National Identity Card' },
                        { label: 'PAN Card', value: 'Pan Card' },
                        { label: 'Voter ID', value: 'Voter Card' },
                      ]}
                      value={
                        values.document_type
                          ? {
                              label:
                                values.document_type === 'National Identity Card'
                                  ? 'National Identity Card (Aadhar)'
                                  : values.document_type === 'Pan Card'
                                  ? 'PAN Card'
                                  : 'Voter ID',
                              value: values.document_type,
                            }
                          : null
                      }
                      onChange={(selected) => setFieldValue('document_type', selected ? selected.value : '')}
                      placeholder="Select ID Type"
                      isDisabled={loading.submitting}
                      menuPortalTarget={document.body}
                      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    />
                    {touched.document_type && errors.document_type && <div className="text-danger mt-1 small fw-bold">{errors.document_type}</div>}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Document Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="id_number"
                      placeholder="Enter ID Number"
                      value={values.id_number}
                      onChange={handleChange}
                      isInvalid={touched.id_number && errors.id_number}
                      disabled={loading.submitting}
                    />
                    <Form.Control.Feedback type="invalid">{errors.id_number}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Front Image</Form.Label>
                    <div className="id-add-staff-preview-container mb-2">
                      {frontImagePreview ? (
                        <img src={frontImagePreview} alt="Front" className="add-staff-preview-image" />
                      ) : (
                        <div className="text-center p-4">
                          <CsLineIcons icon="file-image" size="32" className="text-muted mb-2" />
                          <div className="small text-muted">No Image Selected</div>
                        </div>
                      )}
                    </div>
                    <Form.Control
                      type="file"
                      id="front-image-upload"
                      className="d-none"
                      accept="image/*"
                      onChange={(e) => handleFileChange('front_image', e.target.files[0], setFrontImagePreview)}
                    />{' '}
                    <div className="d-flex flex-column gap-3 align-items-start w-100">
                      <Button
                        as="label"
                        htmlFor="front-image-upload"
                        className="add-staff-custom-btn-outline px-4"
                        style={{ maxWidth: 'fit-content' }}
                        disabled={loading.submitting || uploadingFiles.front_image}
                      >
                        {uploadingFiles.front_image ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                        {frontImagePreview ? 'Change Front Image' : 'Upload Front Image'}
                      </Button>
                      {touched.front_image && errors.front_image && <div className="text-danger mt-1 small fw-bold">{errors.front_image}</div>}
                      
                      {values.document_type !== 'National Identity Card' && (
                        <Button
                          variant="primary"
                          type="submit"
                          className="add-staff-custom-btn-outline w-100 py-3 mt-2"
                          disabled={loading.submitting || uploadingFiles.photo || uploadingFiles.front_image}
                        >
                          {loading.submitting ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CsLineIcons icon="save" size="20" className="me-2" />
                              Register Staff Member
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </Form.Group>

                  {values.document_type === 'National Identity Card' && (
                    <Form.Group className="mb-4">
                      <Form.Label>Back Image</Form.Label>
                      <div className="id-add-staff-preview-container mb-2">
                        {backImagePreview ? (
                          <img src={backImagePreview} alt="Back" className="add-staff-preview-image" />
                        ) : (
                          <div className="text-center p-4">
                            <CsLineIcons icon="file-image" size="32" className="text-muted mb-2" />
                            <div className="small text-muted">No Image Selected</div>
                          </div>
                        )}
                      </div>
                      <Form.Control
                        type="file"
                        id="back-image-upload"
                        className="d-none"
                        accept="image/*"
                        onChange={(e) => handleFileChange('back_image', e.target.files[0], setBackImagePreview)}
                      />
                      <div className="d-flex flex-column gap-3 align-items-start w-100">
                        <Button
                          as="label"
                          htmlFor="back-image-upload"
                          className="add-staff-custom-btn-outline px-4"
                          style={{ maxWidth: 'fit-content' }}
                          disabled={loading.submitting || uploadingFiles.back_image}
                        >
                          {uploadingFiles.back_image ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                          {backImagePreview ? 'Change Back Image' : 'Upload Back Image'}
                        </Button>
                        {touched.back_image && errors.back_image && <div className="text-danger mt-1 small fw-bold">{errors.back_image}</div>}
                        
                        <Button
                          variant="primary"
                          type="submit"
                          className="add-staff-custom-btn-outline w-100 py-3 mt-2"
                          disabled={loading.submitting || uploadingFiles.photo || uploadingFiles.front_image || uploadingFiles.back_image}
                        >
                          {loading.submitting ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CsLineIcons icon="save" size="20" className="me-2" />
                              Register Staff Member
                            </>
                          )}
                        </Button>
                      </div>
                    </Form.Group>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>

        {/* Modern Overlay */}
        {loading.submitting && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, backdropFilter: 'blur(5px)' }}
          >
            <Card className="add-staff-glass-card border-0 p-5 shadow-lg text-center" style={{ maxWidth: '400px' }}>
              <Spinner animation="grow" variant="primary" className="mb-4" />
              <h4 className="fw-bold">Securing Records</h4>
              <p className="text-muted mb-0">Please wait while we encrypt and store the staff profile and documents.</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStaff;
