import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { Country, State, City } from 'country-state-city';
import { toast } from 'react-toastify';

const AddStaff = () => {
  const title = 'Add Staff';
  const description = 'Add a new staff member.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'staff', text: 'Staff Management' },
    { to: 'staff/add-staff', title: 'Add Staff' },
  ];

  const history = useHistory();

  const [fileUploadError, setFileUploadError] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [positions, setPositions] = useState([]);

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
      .test('fileSize', 'File size is too large', (value) => !value || (value && value.size <= 2 * 1024 * 1024))
      .test('fileType', 'Unsupported file format', (value) => !value || (value && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type))),

    document_type: Yup.string().required('Document type is required').oneOf(['National Identity Card', 'Pan Card', 'Voter Card'], 'Invalid document type'),

    // Validate ID number depending on document_type (use when so we don't need `this`)
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

    // Front image always required
    front_image: Yup.mixed()
      .required('Front ID image is required')
      .test('fileSize', 'File size is too large', (value) => !value || (value && value.size <= 2 * 1024 * 1024))
      .test('fileType', 'Unsupported file format', (value) => !value || (value && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type))),

    // Back image - required only for Aadhar (use when instead of this.parent)
    back_image: Yup.mixed()
      .when('document_type', (docType, schema) => {
        if (docType === 'National Identity Card') {
          return schema.required('Back ID image is required for Aadhar card');
        }
        return schema.notRequired();
      })
      .test('fileSize', 'File size is too large', (value) => !value || (value && value.size <= 2 * 1024 * 1024))
      .test('fileType', 'Unsupported file format', (value) => !value || (value && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type))),
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
      try {
        const formData = new FormData();

        // Append all text fields
        Object.keys(values).forEach((key) => {
          if (key !== 'photo' && key !== 'front_image' && key !== 'back_image') {
            formData.append(key, values[key]);
          }
        });

        // Append files
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
        setFileUploadError('Staff submission failed. Please try again.');
        toast.error('Add staff failed.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  useEffect(() => {
    setCountries(Country.getAllCountries());
    const fetchPositions = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API}/staff/get-positions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPositions(response.data.data);
      } catch (error) {
        console.error('Error fetching positions:', error);
        toast.error('Failed to fetch positions.');
      }
    };
    fetchPositions();
  }, []);

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

  const handleFileChange = (fieldName, file, setPreview) => {
    setFieldValue(fieldName, file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container">
            <Row className="align-items-center">
              <Col>
                <h1 className="mb-0 pb-0 display-4">Add Staff</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="auto">
                <Button variant="outline-primary" onClick={() => history.push('/staff/view')}>
                  View Staff
                </Button>
              </Col>
            </Row>
          </div>

          {fileUploadError && (
            <div className="alert alert-danger" role="alert">
              {fileUploadError}
            </div>
          )}

          <Form onSubmit={handleSubmit}>
            {/* Personal Details Card */}
            <Card body className="mb-4">
              <h5 className="mb-3">Personal Details</h5>

              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Staff ID</Form.Label>
                    <Form.Control type="text" name="staff_id" value={values.staff_id} onChange={handleChange} isInvalid={touched.staff_id && errors.staff_id} />
                    <Form.Control.Feedback type="invalid">{errors.staff_id}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>First Name</Form.Label>
                    <Form.Control type="text" name="f_name" value={values.f_name} onChange={handleChange} isInvalid={touched.f_name && errors.f_name} />
                    <Form.Control.Feedback type="invalid">{errors.f_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control type="text" name="l_name" value={values.l_name} onChange={handleChange} isInvalid={touched.l_name && errors.l_name} />
                    <Form.Control.Feedback type="invalid">{errors.l_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Birthday</Form.Label>
                    <Form.Control
                      type="date"
                      name="birth_date"
                      value={values.birth_date}
                      onChange={handleChange}
                      isInvalid={touched.birth_date && errors.birth_date}
                    />
                    <Form.Control.Feedback type="invalid">{errors.birth_date}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Joining Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="joining_date"
                      value={values.joining_date}
                      onChange={handleChange}
                      isInvalid={touched.joining_date && errors.joining_date}
                    />
                    <Form.Control.Feedback type="invalid">{errors.joining_date}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col>
                  <Form.Group>
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="address"
                      value={values.address}
                      onChange={handleChange}
                      isInvalid={touched.address && errors.address}
                    />
                    <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Country</Form.Label>
                    <Form.Select name="country" value={values.country} onChange={handleCountryChange} isInvalid={touched.country && errors.country}>
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country.isoCode} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.country}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>State</Form.Label>
                    <Form.Select
                      name="state"
                      value={values.state}
                      onChange={handleStateChange}
                      disabled={!values.country}
                      isInvalid={touched.state && errors.state}
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state.isoCode} value={state.name}>
                          {state.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.state}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>City</Form.Label>
                    <Form.Select name="city" value={values.city} onChange={handleChange} disabled={!values.state} isInvalid={touched.city && errors.city}>
                      <option value="">Select City</option>
                      {cities.map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Contact No.</Form.Label>
                    <Form.Control
                      type="number"
                      name="phone_no"
                      value={values.phone_no}
                      onChange={handleChange}
                      isInvalid={touched.phone_no && errors.phone_no}
                    />
                    <Form.Control.Feedback type="invalid">{errors.phone_no}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" name="email" value={values.email} onChange={handleChange} isInvalid={touched.email && errors.email} />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Position</Form.Label>
                    <Form.Control
                      list="positions"
                      name="position"
                      value={values.position}
                      onChange={handleChange}
                      isInvalid={touched.position && errors.position}
                    />
                    <datalist id="positions">
                      {positions.map((pos, index) => (
                        <option key={index} value={pos} />
                      ))}
                    </datalist>
                    <Form.Control.Feedback type="invalid">{errors.position}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Salary</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="salary"
                      value={values.salary}
                      onChange={handleChange}
                      isInvalid={touched.salary && errors.salary}
                    />
                    <Form.Control.Feedback type="invalid">{errors.salary}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            {/* ID Proof Card */}
            <Card body className="mb-4">
              <h5 className="mb-3">ID Proof & Documents</h5>

              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Photo</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        handleFileChange('photo', file, setPhotoPreview);
                      }}
                      isInvalid={touched.photo && errors.photo}
                    />
                    <Form.Control.Feedback type="invalid">{errors.photo}</Form.Control.Feedback>
                    {photoPreview && (
                      <div className="mt-2">
                        <img src={photoPreview} alt="Photo Preview" className="img-thumbnail" style={{ maxWidth: '150px', maxHeight: '150px' }} />
                      </div>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>ID Card Type</Form.Label>
                    <Form.Select
                      name="document_type"
                      value={values.document_type}
                      onChange={handleChange}
                      isInvalid={touched.document_type && errors.document_type}
                    >
                      <option value="">Select ID Type</option>
                      <option value="National Identity Card">National Identity Card</option>
                      <option value="Pan Card">Pan Card</option>
                      <option value="Voter Card">Voter Card</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.document_type}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>ID Card Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="id_number"
                      value={values.id_number}
                      onChange={handleChange}
                      isInvalid={touched.id_number && errors.id_number}
                      placeholder={
                        values.document_type === 'National Identity Card'
                          ? 'XXXX XXXX XXXX'
                          : values.document_type === 'Pan Card'
                          ? 'ABCDE1234F'
                          : values.document_type === 'Voter Card'
                          ? 'ABC1234567'
                          : 'Enter ID number'
                      }
                    />
                    <Form.Control.Feedback type="invalid">{errors.id_number}</Form.Control.Feedback>
                    {values.document_type === 'National Identity Card' && <Form.Text className="text-muted">Format: 12 digits (XXXX XXXX XXXX)</Form.Text>}
                    {values.document_type === 'Pan Card' && (
                      <Form.Text className="text-muted">Format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)</Form.Text>
                    )}
                    {values.document_type === 'Voter Card' && (
                      <Form.Text className="text-muted">Format: 3 letters followed by 7 digits (e.g., ABC1234567)</Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>ID Card Front Image</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        handleFileChange('front_image', file, setFrontImagePreview);
                      }}
                      isInvalid={touched.front_image && errors.front_image}
                    />
                    <Form.Control.Feedback type="invalid">{errors.front_image}</Form.Control.Feedback>
                    {frontImagePreview && (
                      <div className="mt-2">
                        <img src={frontImagePreview} alt="Front Image Preview" className="img-thumbnail" style={{ maxWidth: '150px', maxHeight: '150px' }} />
                      </div>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      ID Card Back Image
                      {values.document_type === 'National Identity Card' && <span className="text-danger"> *</span>}
                      {values.document_type && values.document_type !== 'National Identity Card' && <span className="text-muted"> (Optional)</span>}
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        handleFileChange('back_image', file, setBackImagePreview);
                      }}
                      isInvalid={touched.back_image && errors.back_image}
                    />
                    <Form.Control.Feedback type="invalid">{errors.back_image}</Form.Control.Feedback>
                    {values.document_type === 'National Identity Card' && <Form.Text className="text-muted">Back image is required for Aadhar card</Form.Text>}
                    {backImagePreview && (
                      <div className="mt-2">
                        <img src={backImagePreview} alt="Back Image Preview" className="img-thumbnail" style={{ maxWidth: '150px', maxHeight: '150px' }} />
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            <div className="d-flex justify-content-start">
              <Button variant="success" type="submit" className="mx-2 px-4">
                Add Staff
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </>
  );
};

export default AddStaff;
