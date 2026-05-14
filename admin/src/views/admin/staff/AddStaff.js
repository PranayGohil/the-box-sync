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

    phone_no: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),

    email: Yup.string().required('Email is required').email('Enter a valid email address'),

    salary: Yup.number().required('Salary is required').positive('Salary must be a positive number'),

    position: Yup.string().required('Position is required'),

    photo: Yup.mixed()
      .required('Photo is required')
      .test('fileSize', 'File size is too large (max 2MB)', (value) => !value || (value && value.size <= 2 * 1024 * 1024))
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
      .test('fileSize', 'File size is too large (max 2MB)', (value) => !value || (value && value.size <= 2 * 1024 * 1024))
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
      .test('fileSize', 'File size is too large (max 2MB)', (value) => !value || (value && value.size <= 2 * 1024 * 1024))
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
        setFileUploadError(err.response?.data?.message || 'Staff submission failed. Please try again.');
        toast.error('Add staff failed.');
      } finally {
        setLoading((prev) => ({ ...prev, submitting: false }));
        setSubmitting(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

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

  const handleCountryChange = (event) => {
    const countryName = event.target.value;
    const selectedCountry = countries.find((c) => c.name === countryName);

    setFieldValue('country', countryName);
    setStates(selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : []);
    setCities([]);
    setFieldValue('state', '');
    setFieldValue('city', '');
  };

  const handleStateChange = (event) => {
    const stateName = event.target.value;
    const selectedCountry = countries.find((c) => c.name === values.country);
    const selectedState = states.find((s) => s.name === stateName);

    setFieldValue('state', stateName);
    setCities(selectedCountry && selectedState ? City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode) : []);
    setFieldValue('city', '');
  };

  const handleFileChange = async (fieldName, file, setPreview) => {
    setUploadingFiles((prev) => ({ ...prev, [fieldName]: true }));

    // Simulate file processing delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    setFieldValue(fieldName, file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }

    setUploadingFiles((prev) => ({ ...prev, [fieldName]: false }));
  };

  const customStyles = `
    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
      transition: all 0.3s ease;
    }
    .custom-btn-outline {
      background: #ffffff !important;
      border: 1px solid #1ea8e7 !important;
      color: #1ea8e7 !important;
      border-radius: 50px !important;
      padding: 0.5rem 1.5rem !important;
      font-weight: 500 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
    }
    .custom-btn-outline:hover {
      background: #1ea8e7 !important;
      color: #ffffff !important;
      border-color: #1ea8e7 !important;
      transform: translateY(-1px) !important;
    }
    .custom-btn-outline i, .custom-btn-outline svg {
      color: #1ea8e7 !important;
      transition: color 0.3s ease !important;
    }
    .custom-btn-outline:hover i, .custom-btn-outline:hover svg {
      color: #ffffff !important;
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
    .custom-btn-solid {
      background: #1ea8e7 !important;
      border: 1px solid #1ea8e7 !important;
      color: #ffffff !important;
      border-radius: 50px !important;
      padding: 0.6rem 1.5rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
    }
    .custom-btn-solid:hover {
      background: #0091d5 !important;
      border-color: #0091d5 !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(30, 168, 231, 0.3) !important;
    }
    .custom-btn-solid i, .custom-btn-solid svg {
      color: #ffffff !important;
    }
    .form-label {
      font-weight: 700;
      color: #4a5568;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      margin-bottom: 0.5rem;
    }
    .form-control, .form-select {
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      background-color: #f8fafc;
      transition: all 0.2s ease;
    }
    .form-control:focus, .form-select:focus {
      background-color: white;
      border-color: #1ea8e7;
      box-shadow: 0 0 0 3px rgba(30, 168, 231, 0.1);
    }
    .section-header {
      border-left: 4px solid #1ea8e7;
      padding-left: 1rem;
      margin-bottom: 1.5rem;
      color: #2d3748;
    }
    .preview-container {
      width: 120px;
      height: 120px;
      border-radius: 1rem;
      overflow: hidden;
      border: 2px dashed #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      margin-top: 10px;
    }
    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .id-preview-container {
      width: 100%;
      max-width: 300px;
      height: 180px;
      border-radius: 1rem;
      overflow: hidden;
      border: 2px dashed #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      margin-top: 10px;
    }
  `;

  if (loading.initial) {
    return (
      <div className="container-fluid py-5">
        <style>{customStyles}</style>
        <HtmlHead title={title} description={description} />
        <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
          <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
          <h5 className="fw-bold">Initializing Form...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      
      <div className="page-title-container mb-5">
        <Row className="g-3 align-items-center">
          <Col md={7}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col md={5} className="d-flex justify-content-md-end">
            <Button className="custom-btn-outline" onClick={() => history.push('/staff/view')} disabled={loading.submitting}>
              <CsLineIcons icon="arrow-left" size="18" /> Back to List
            </Button>
          </Col>
        </Row>
      </div>

      {fileUploadError && (
        <Alert variant="danger" className="glass-card border-0 mb-4 p-4 shadow-sm d-flex align-items-center gap-3">
          <CsLineIcons icon="error" size="24" className="text-danger" />
          <span className="fw-bold">{fileUploadError}</span>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">
          <Col lg={8}>
            {/* Main Details Section */}
            <Card className="glass-card border-0 mb-4">
              <Card.Body className="p-4">
                <div className="section-header">
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

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Birth Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="birth_date"
                        value={values.birth_date}
                        onChange={handleChange}
                        isInvalid={touched.birth_date && errors.birth_date}
                        disabled={loading.submitting}
                      />
                      <Form.Control.Feedback type="invalid">{errors.birth_date}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Joining Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="joining_date"
                        value={values.joining_date}
                        onChange={handleChange}
                        isInvalid={touched.joining_date && errors.joining_date}
                        disabled={loading.submitting}
                      />
                      <Form.Control.Feedback type="invalid">{errors.joining_date}</Form.Control.Feedback>
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

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Country</Form.Label>
                      <Form.Select
                        name="country"
                        value={values.country}
                        onChange={handleCountryChange}
                        isInvalid={touched.country && errors.country}
                        disabled={loading.submitting}
                      >
                        <option value="">Select Country</option>
                        {countries.map((country) => (
                          <option key={country.isoCode} value={country.name}>{country.name}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.country}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Select
                        name="state"
                        value={values.state}
                        onChange={handleStateChange}
                        disabled={!values.country || loading.submitting}
                        isInvalid={touched.state && errors.state}
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state.isoCode} value={state.name}>{state.name}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.state}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Select
                        name="city"
                        value={values.city}
                        onChange={handleChange}
                        disabled={!values.state || loading.submitting}
                        isInvalid={touched.city && errors.city}
                      >
                        <option value="">Select City</option>
                        {cities.map((city) => (
                          <option key={city.name} value={city.name}>{city.name}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
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
                  <Col md={6}>
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
            <Card className="glass-card border-0 mb-4">
              <Card.Body className="p-4">
                <div className="section-header">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <CsLineIcons icon="briefcase" size="20" className="text-primary" />
                    Employment & Payroll
                  </h5>
                </div>

                <Row className="g-3">
                  <Col md={6}>
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
                      />
                      {touched.position && errors.position && (
                        <div className="text-danger mt-1 small fw-bold">{errors.position}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
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
                  <Col xs={12}>
                    <div className="d-flex justify-content-center mt-4">
                      <Button 
                        variant="primary" 
                        type="submit" 
                        className="custom-btn-outline px-5 py-3"
                        disabled={loading.submitting || uploadingFiles.photo || uploadingFiles.front_image}
                      >
                        {loading.submitting ? (
                          <>
                            <Spinner animation="border" size="sm" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CsLineIcons icon="save" size="20" />
                            Register Staff Member
                          </>
                        )}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            {/* Profile Photo Section */}
            <Card className="glass-card border-0 mb-4 text-center">
              <Card.Body className="p-4">
                <div className="section-header text-start">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <CsLineIcons icon="camera" size="20" className="text-primary" />
                    Profile Photo
                  </h5>
                </div>
                
                <div className="d-flex flex-column align-items-center">
                  <div className="preview-container mb-3 shadow-sm border-2">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="preview-image" />
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
                      className="custom-btn-outline px-4 mx-auto"
                      style={{ maxWidth: 'fit-content' }}
                      disabled={loading.submitting || uploadingFiles.photo}
                    >
                      {uploadingFiles.photo ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    {touched.photo && errors.photo && (
                      <div className="text-danger mt-2 small fw-bold">{errors.photo}</div>
                    )}
                  </Form.Group>
                </div>
              </Card.Body>
            </Card>

            {/* Documents Section */}
            <Card className="glass-card border-0 mb-4">
              <Card.Body className="p-4">
                <div className="section-header">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <CsLineIcons icon="notepads" size="20" className="text-primary" />
                    Identification
                  </h5>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Document Type</Form.Label>
                  <Form.Select
                    name="document_type"
                    value={values.document_type}
                    onChange={handleChange}
                    isInvalid={touched.document_type && errors.document_type}
                    disabled={loading.submitting}
                  >
                    <option value="">Select ID Type</option>
                    <option value="National Identity Card">National Identity Card (Aadhar)</option>
                    <option value="Pan Card">PAN Card</option>
                    <option value="Voter Card">Voter ID</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.document_type}</Form.Control.Feedback>
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
                    <div className="id-preview-container mb-2">
                      {frontImagePreview ? (
                        <img src={frontImagePreview} alt="Front" className="preview-image" />
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
                    />                    <Button 
                      as="label" 
                      htmlFor="front-image-upload" 
                      className="custom-btn-outline px-4 mx-auto"
                      style={{ maxWidth: 'fit-content' }}
                      disabled={loading.submitting || uploadingFiles.front_image}
                    >
                      {uploadingFiles.front_image ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                      {frontImagePreview ? 'Change Front Image' : 'Upload Front Image'}
                    </Button>
                    {touched.front_image && errors.front_image && (
                      <div className="text-danger mt-1 small fw-bold">{errors.front_image}</div>
                    )}
                  </Form.Group>

                {values.document_type === 'National Identity Card' && (
                  <Form.Group className="mb-4">
                    <Form.Label>Back Image</Form.Label>
                    <div className="id-preview-container mb-2">
                      {backImagePreview ? (
                        <img src={backImagePreview} alt="Back" className="preview-image" />
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
                    <Button 
                      as="label" 
                      htmlFor="back-image-upload" 
                      className="custom-btn-outline px-4 mx-auto"
                      style={{ maxWidth: 'fit-content' }}
                      disabled={loading.submitting || uploadingFiles.back_image}
                    >
                      {uploadingFiles.back_image ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                      {backImagePreview ? 'Change Back Image' : 'Upload Back Image'}
                    </Button>
                    {touched.back_image && errors.back_image && (
                      <div className="text-danger mt-1 small fw-bold">{errors.back_image}</div>
                    )}
                  </Form.Group>
                )}
              </Card.Body>
            </Card>

          </Col>
        </Row>
      </Form>

      {/* Modern Overlay */}
      {loading.submitting && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
          <Card className="glass-card border-0 p-5 shadow-lg text-center" style={{ maxWidth: '400px' }}>
            <Spinner animation="grow" variant="primary" className="mb-4" />
            <h4 className="fw-bold">Securing Records</h4>
            <p className="text-muted mb-0">Please wait while we encrypt and store the staff profile and documents.</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AddStaff;

