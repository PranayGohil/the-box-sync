import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { Country, State, City } from 'country-state-city';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

const EditStaff = () => {
  const title = 'Edit Staff';
  const description = 'Edit staff details.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: '/staff', text: 'Staff Management' },
    { to: '/staff/view', title: 'Edit Staff' },
  ];
  const { id } = useParams();
  const history = useHistory();
  const [loading, setLoading] = useState({ initial: true, submitting: false });
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

  const isFileObject = (val) => !!val && (val instanceof File || (typeof val === 'object' && 'size' in val && 'type' in val));

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const maxSize = 2 * 1024 * 1024;

  const editStaff = Yup.object({
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
    phone_no: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
    email: Yup.string().required('Email is required').email('Enter a valid email address'),
    salary: Yup.number().required('Salary is required').positive('Salary must be a positive number'),
    position: Yup.string().required('Position is required'),

    photo: Yup.mixed()
      .test('required-or-existing', 'Photo is required', (value) => {
        if (!value) return false;
        if (typeof value === 'string') return true;
        return isFileObject(value);
      })
      .test('fileSize', 'File size is too large (max 2MB)', (value) => {
        if (!value) return true;
        if (typeof value === 'string') return true;
        return isFileObject(value) ? value.size <= maxSize : true;
      })
      .test('fileType', 'Unsupported file format (JPEG, PNG, JPG, WebP only)', (value) => {
        if (!value) return true;
        if (typeof value === 'string') return true;
        return isFileObject(value) ? allowedTypes.includes(value.type) : true;
      }),

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
      .test('required-or-existing', 'Front ID image is required', (value) => {
        if (!value) return false;
        if (typeof value === 'string') return true;
        return isFileObject(value);
      })
      .test('fileSize', 'File size is too large (max 2MB)', (value) => {
        if (!value) return true;
        if (typeof value === 'string') return true;
        return isFileObject(value) ? value.size <= maxSize : true;
      })
      .test('fileType', 'Unsupported file format (JPEG, PNG, JPG, WebP only)', (value) => {
        if (!value) return true;
        if (typeof value === 'string') return true;
        return isFileObject(value) ? allowedTypes.includes(value.type) : true;
      }),

    back_image: Yup.mixed()
      .when('document_type', (docType, schema) => {
        if (docType === 'National Identity Card') {
          return schema.test('required-or-existing', 'Back ID image is required for Aadhar card', (value) => {
            if (!value) return false;
            if (typeof value === 'string') return true;
            return isFileObject(value);
          });
        }
        return schema;
      })
      .test('fileSize', 'File size is too large (max 2MB)', (value) => {
        if (!value) return true;
        if (typeof value === 'string') return true;
        return isFileObject(value) ? value.size <= maxSize : true;
      })
      .test('fileType', 'Unsupported file format (JPEG, PNG, JPG, WebP only)', (value) => {
        if (!value) return true;
        if (typeof value === 'string') return true;
        return isFileObject(value) ? allowedTypes.includes(value.type) : true;
      }),

    salary_structure: Yup.object().shape({
      earnings: Yup.object({
        basic: Yup.number().min(0, 'Must be 0 or more').required('Basic is required'),
        hra: Yup.number().min(0),
        conveyance: Yup.number().min(0),
        medical: Yup.number().min(0),
        special: Yup.number().min(0),
        other: Yup.number().min(0),
      }),
      deductions: Yup.object({
        pf_percentage: Yup.number().min(0).max(100),
        esi_percentage: Yup.number().min(0).max(100),
        pt: Yup.number().min(0),
      }),
    }),
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
    validationSchema: editStaff,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setLoading((prev) => ({ ...prev, submitting: true }));
      setFileUploadError(null);
      try {
        const formData = new FormData();
        Object.keys(values).forEach((key) => {
          if (!['photo', 'front_image', 'back_image'].includes(key)) {
            formData.append(key, values[key]);
          }
        });

        if (values.photo instanceof File) formData.append('photo', values.photo);
        if (values.front_image instanceof File) formData.append('front_image', values.front_image);
        if (values.back_image instanceof File) formData.append('back_image', values.back_image);

        await axios.put(`${process.env.REACT_APP_API}/staff/edit/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        toast.success('Staff updated successfully!');
        history.push('/staff/view');
      } catch (err) {
        console.error('Error updating staff:', err);
        setFileUploadError(err.response?.data?.message || 'Update failed. Please try again.');
        toast.error('Update failed.');
      } finally {
        setLoading((prev) => ({ ...prev, submitting: false }));
        setSubmitting(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  useEffect(() => {
    setCountries(Country.getAllCountries());

    const fetchData = async () => {
      try {
        setLoading((prev) => ({ ...prev, initial: true }));

        const [positionsRes, staffRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API}/staff/get-positions`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${process.env.REACT_APP_API}/staff/get/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        setPositions(positionsRes.data.data);

        const staff = staffRes.data.data;
        setFieldValue('staff_id', staff.staff_id);
        setFieldValue('f_name', staff.f_name);
        setFieldValue('l_name', staff.l_name);
        setFieldValue('birth_date', staff.birth_date);
        setFieldValue('joining_date', staff.joining_date);
        setFieldValue('address', staff.address);
        setFieldValue('country', staff.country);
        setFieldValue('state', staff.state);
        setFieldValue('city', staff.city);
        setFieldValue('phone_no', staff.phone_no);
        setFieldValue('email', staff.email);
        setFieldValue('salary', staff.salary);
        setFieldValue('position', staff.position);
        setFieldValue('document_type', staff.document_type);
        setFieldValue('id_number', staff.id_number);
        setFieldValue('photo', staff.photo || '');
        setFieldValue('front_image', staff.front_image || '');
        setFieldValue('back_image', staff.back_image || '');

        const selectedCountry = Country.getAllCountries().find((c) => c.name === staff.country);

        if (selectedCountry) {
          const countryStates = State.getStatesOfCountry(selectedCountry.isoCode);
          setStates(countryStates);

          const selectedState = countryStates.find((s) => s.name === staff.state);

          if (selectedState) {
            setCities(City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode));
          }
        }

        setPhotoPreview(staff.photo ? `${process.env.REACT_APP_UPLOAD_DIR}/${staff.photo}` : null);
        setFrontImagePreview(staff.front_image ? `${process.env.REACT_APP_UPLOAD_DIR}/${staff.front_image}` : null);
        if (staff.back_image) {
          setBackImagePreview(`${process.env.REACT_APP_UPLOAD_DIR}/${staff.back_image}`);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch staff data.');
      } finally {
        setLoading((prev) => ({ ...prev, initial: false }));
      }
    };

    fetchData();
  }, [id, setFieldValue]);

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

  const handleFileChange = async (fieldName, file, setPreview) => {
    setUploadingFiles((prev) => ({ ...prev, [fieldName]: true }));

    await new Promise((resolve) => setTimeout(resolve, 300));

    setFieldValue(fieldName, file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }

    setUploadingFiles((prev) => ({ ...prev, [fieldName]: false }));
  };

  

  if (loading.initial) {
    return (
      <div className="container-fluid py-5">
        
        <HtmlHead title={title} description={description} />
        <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
          <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
          <h5 className="fw-bold">Loading Staff Details...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-staff-staff-container pb-5">
      
      <HtmlHead title={title} description={description} />
      
      <div className="container-fluid px-lg-5">
        <div className="edit-staff-page-title-container mb-4 mt-5 mt-md-n3">
          <Row className="g-3 align-items-center">
            <Col md={7}>
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>
                {title}
              </h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="12" md="5" className="d-flex edit-staff-button-group-responsive justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button className="edit-staff-custom-btn-outline" onClick={() => history.push('/staff/view')} disabled={loading.submitting}>
                <CsLineIcons icon="arrow-left" size="18" /> Back to List
              </Button>
            </Col>
          </Row>
        </div>

      {fileUploadError && (
        <Alert variant="danger" className="mb-4 edit-staff-glass-card border-0">
          <CsLineIcons icon="error" className="me-2" />
          {fileUploadError}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">
          {/* Main Content Column */}
          <Col lg={8}>
            {/* Personal Details Card */}
            <Card className="edit-staff-glass-card border-0 mb-4">
              <Card.Body className="p-4">
                <div className="edit-staff-section-header mb-4">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <CsLineIcons icon="user" size="20" className="text-primary" />
                    Personal Details
                  </h5>
                </div>

                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Staff ID</Form.Label>
                      <Form.Control
                        type="text"
                        name="staff_id"
                        value={values.staff_id}
                        onChange={handleChange}
                        isInvalid={touched.staff_id && errors.staff_id}
                        disabled={loading.submitting}
                        className="bg-light border-0"
                      />
                      <Form.Control.Feedback type="invalid">{errors.staff_id}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="f_name"
                        value={values.f_name}
                        onChange={handleChange}
                        isInvalid={touched.f_name && errors.f_name}
                        disabled={loading.submitting}
                      />
                      <Form.Control.Feedback type="invalid">{errors.f_name}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="l_name"
                        value={values.l_name}
                        onChange={handleChange}
                        isInvalid={touched.l_name && errors.l_name}
                        disabled={loading.submitting}
                      />
                      <Form.Control.Feedback type="invalid">{errors.l_name}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-1">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Birthday</Form.Label>
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
                    <Form.Group>
                      <Form.Label className="small fw-bold">Joining Date</Form.Label>
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
                </Row>

                <Row className="g-3 mt-1">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="address"
                        value={values.address}
                        onChange={handleChange}
                        isInvalid={touched.address && errors.address}
                        disabled={loading.submitting}
                      />
                      <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-1">
                  <Col md={4} xs={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Country</Form.Label>
                      <Select
                        classNamePrefix="react-select"
                        options={countries.map((country) => ({ label: country.name, value: country.name }))}
                        value={values.country ? { label: values.country, value: values.country } : null}
                        onChange={(selected) => handleCountryChange(selected)}
                        isDisabled={loading.submitting}
                        placeholder="Select Country"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                      />
                      {touched.country && errors.country && <div className="text-danger mt-1 small fw-bold">{errors.country}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={4} xs={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">State</Form.Label>
                      <Select
                        classNamePrefix="react-select"
                        options={states.map((state) => ({ label: state.name, value: state.name }))}
                        value={values.state ? { label: values.state, value: values.state } : null}
                        onChange={(selected) => handleStateChange(selected)}
                        isDisabled={!values.country || loading.submitting}
                        placeholder="Select State"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                      />
                      {touched.state && errors.state && <div className="text-danger mt-1 small fw-bold">{errors.state}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={4} xs={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">City</Form.Label>
                      <Select
                        classNamePrefix="react-select"
                        options={cities.map((city) => ({ label: city.name, value: city.name }))}
                        value={values.city ? { label: values.city, value: values.city } : null}
                        onChange={(selected) => setFieldValue('city', selected ? selected.value : '')}
                        isDisabled={!values.state || loading.submitting}
                        placeholder="Select City"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                      />
                      {touched.city && errors.city && <div className="text-danger mt-1 small fw-bold">{errors.city}</div>}
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-1">
                  <Col md={6} xs={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Contact No.</Form.Label>
                      <Form.Control
                        type="number"
                        name="phone_no"
                        value={values.phone_no}
                        onChange={handleChange}
                        isInvalid={touched.phone_no && errors.phone_no}
                        disabled={loading.submitting}
                      />
                      <Form.Control.Feedback type="invalid">{errors.phone_no}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6} xs={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
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
            <Card className="edit-staff-glass-card border-0 mb-4">
              <Card.Body className="p-4">
                <div className="edit-staff-section-header mb-4">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <CsLineIcons icon="briefcase" size="20" className="text-primary" />
                    Employment & Payroll
                  </h5>
                </div>
 
                <Row className="g-3">
                  <Col md={6} xs={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Job Position</Form.Label>
                      <CreatableSelect
                        isClearable
                        isDisabled={loading.submitting}
                        options={positionOptions}
                        value={values.position ? { label: values.position, value: values.position } : null}
                        onChange={(selected) => setFieldValue('position', selected ? selected.value : '')}
                        onBlur={() => formik.setFieldTouched('position', true)}
                        placeholder="Select or type..."
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                      />
                      {touched.position && errors.position && (
                        <div className="text-danger mt-1 small fw-bold">{errors.position}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6} xs={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Salary (Base)</Form.Label>
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

                {/* Submit Button inside Card */}
                <div className="d-flex edit-staff-button-group-responsive justify-content-center mt-4">
                  <Button
                    className="edit-staff-custom-btn-outline px-5 py-3"
                    type="submit"
                    disabled={loading.submitting}
                  >
                    {loading.submitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CsLineIcons icon="save" size="20" />
                        Update Staff Member
                      </>
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar Content Column */}
          <Col lg={4}>
            {/* Profile Photo Card */}
            <Card className="edit-staff-glass-card border-0 mb-4 text-center">
              <Card.Body className="p-4">
                <div className="edit-staff-section-header text-start mb-3">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <CsLineIcons icon="camera" size="20" className="text-primary" />
                    Profile Photo
                  </h5>
                </div>

                <div className="mb-3 d-flex justify-content-center">
                  <div 
                    className="rounded-circle border border-3 border-light overflow-hidden shadow-sm bg-light d-flex align-items-center justify-content-center"
                    style={{ width: '150px', height: '150px' }}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Staff" className="w-100 h-100 object-fit-cover" />
                    ) : (
                      <CsLineIcons icon="user" size="64" className="text-muted opacity-20" />
                    )}
                  </div>
                </div>

                <input
                  type="file"
                  id="photo-upload"
                  className="d-none"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleFileChange('photo', file, setPhotoPreview);
                  }}
                  disabled={loading.submitting || uploadingFiles.photo}
                />
                <Button 
                  as="label" 
                  htmlFor="photo-upload" 
                  className="edit-staff-custom-btn-outline px-4 mx-auto"
                  style={{ maxWidth: 'fit-content' }}
                  disabled={loading.submitting || uploadingFiles.photo}
                >
                  {uploadingFiles.photo ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </Button>
              </Card.Body>
            </Card>

            {/* Identification Card */}
            <Card className="edit-staff-glass-card border-0 mb-4">
              <Card.Body className="p-4">
                <div className="edit-staff-section-header mb-4">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <CsLineIcons icon="badge" size="20" className="text-primary" />
                    Identification
                  </h5>
                </div>

                <Form.Group className="mb-3">
                  <Select
                    classNamePrefix="react-select"
                    options={[
                      { label: 'National Identity Card', value: 'National Identity Card' },
                      { label: 'Pan Card', value: 'Pan Card' },
                      { label: 'Voter Card', value: 'Voter Card' },
                    ]}
                    value={values.document_type ? { label: values.document_type, value: values.document_type } : null}
                    onChange={(selected) => setFieldValue('document_type', selected ? selected.value : '')}
                    placeholder="Select ID Type"
                    isDisabled={loading.submitting}
                    menuPortalTarget={document.body}
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                  />
                  {touched.document_type && errors.document_type && <div className="text-danger mt-1 small fw-bold">{errors.document_type}</div>}
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold">Document Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="id_number"
                    value={values.id_number}
                    onChange={handleChange}
                    isInvalid={touched.id_number && errors.id_number}
                    disabled={loading.submitting}
                    placeholder="Enter ID Number"
                  />
                  <Form.Control.Feedback type="invalid">{errors.id_number}</Form.Control.Feedback>
                </Form.Group>

                <div className="id-previews">
                  <div className="mb-3">
                    <div className="small text-muted mb-2 fw-bold text-uppercase opacity-50 letter-spacing-1">Front Image</div>
                    <div className="bg-light rounded-3 p-2 mb-2 text-center border border-dashed" style={{ minHeight: '120px' }}>
                      {frontImagePreview ? (
                        <img src={frontImagePreview} alt="Front" className="img-fluid rounded" style={{ maxHeight: '100px' }} />
                      ) : (
                        <div className="py-4"><CsLineIcons icon="image" size="32" className="text-muted opacity-20" /></div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="front-image-upload"
                      className="d-none"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleFileChange('front_image', file, setFrontImagePreview);
                      }}
                    />
                    <Button 
                      as="label" 
                      htmlFor="front-image-upload" 
                      className="edit-staff-custom-btn-outline px-4 mx-auto"
                      style={{ maxWidth: 'fit-content' }}
                      disabled={loading.submitting || uploadingFiles.front_image}
                    >
                      {uploadingFiles.front_image ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                      {frontImagePreview ? 'Change Front Image' : 'Upload Front Image'}
                    </Button>
                  </div>

                  {values.document_type === 'National Identity Card' && (
                    <div className="mb-2">
                      <div className="small text-muted mb-2 fw-bold text-uppercase opacity-50 letter-spacing-1">Back Image</div>
                      <div className="bg-light rounded-3 p-2 mb-2 text-center border border-dashed" style={{ minHeight: '120px' }}>
                        {backImagePreview ? (
                          <img src={backImagePreview} alt="Back" className="img-fluid rounded" style={{ maxHeight: '100px' }} />
                        ) : (
                          <div className="py-4"><CsLineIcons icon="image" size="32" className="text-muted opacity-20" /></div>
                        )}
                      </div>
                      <input
                        type="file"
                        id="back-image-upload"
                        className="d-none"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleFileChange('back_image', file, setBackImagePreview);
                        }}
                      />
                      <Button 
                        as="label" 
                        htmlFor="back-image-upload" 
                        className="edit-staff-custom-btn-outline px-4 mx-auto"
                        style={{ maxWidth: 'fit-content' }}
                        disabled={loading.submitting || uploadingFiles.back_image}
                      >
                        {uploadingFiles.back_image ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                        {backImagePreview ? 'Change Back Image' : 'Upload Back Image'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

          </Col>
        </Row>
      </Form>

      {/* Modern Overlay */}
      {loading.submitting && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
          <Card className="edit-staff-glass-card border-0 p-5 shadow-lg text-center" style={{ maxWidth: '400px' }}>
            <Spinner animation="grow" variant="primary" className="mb-4" />
            <h4 className="fw-bold">Updating Profile</h4>
            <p className="text-muted mb-0">Synchronizing records and securing identity documents.</p>
          </Card>
        </div>
      )}
    </div>
  </div>
);
};

export default EditStaff;
