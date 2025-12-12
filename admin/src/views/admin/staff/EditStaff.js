import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Modal, Alert } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { Country, State, City } from 'country-state-city';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { AuthContext } from 'contexts/AuthContext';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

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
    const [loading, setLoading] = useState(false);
    const [fileUploadError, setFileUploadError] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [frontImagePreview, setFrontImagePreview] = useState(null);
    const [backImagePreview, setBackImagePreview] = useState(null);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [positions, setPositions] = useState([]);

    // Face capture states
    const [showFaceModal, setShowFaceModal] = useState(false);
    const webcamRef = useRef(null);
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [faceBox, setFaceBox] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureStatus, setCaptureStatus] = useState('none');
    const [captureErrorMessage, setCaptureErrorMessage] = useState('');
    const { userSubscriptions, activePlans } = useContext(AuthContext);

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
                // value can be: File object (new upload), string (existing URL), or falsy
                if (!value) return false;
                if (typeof value === 'string') return true; // existing URL — OK
                return isFileObject(value); // must be a File-like object
            })
            .test('fileSize', 'File size is too large', (value) => {
                if (!value) return true;
                if (typeof value === 'string') return true; // existing URL — skip size check
                return isFileObject(value) ? value.size <= maxSize : true;
            })
            .test('fileType', 'Unsupported file format', (value) => {
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

        // Front image always required
        front_image: Yup.mixed()
            .test('required-or-existing', 'Front ID image is required', (value) => {
                if (!value) return false;
                if (typeof value === 'string') return true;
                return isFileObject(value);
            })
            .test('fileSize', 'File size is too large', (value) => {
                if (!value) return true;
                if (typeof value === 'string') return true;
                return isFileObject(value) ? value.size <= maxSize : true;
            })
            .test('fileType', 'Unsupported file format', (value) => {
                if (!value) return true;
                if (typeof value === 'string') return true;
                return isFileObject(value) ? allowedTypes.includes(value.type) : true;
            }),

        // Back image - required only for Aadhar (use when instead of this.parent)
        back_image: Yup.mixed()
            .when('document_type', (docType, schema) => {
                // if Aadhar, it's required — but allow existing URL string
                if (docType === 'National Identity Card') {
                    return schema.test('required-or-existing', 'Back ID image is required for Aadhar card', (value) => {
                        if (!value) return false;
                        if (typeof value === 'string') return true;
                        return isFileObject(value);
                    });
                }
                return schema; // not required for other document types
            })
            .test('fileSize', 'File size is too large', (value) => {
                if (!value) return true;
                if (typeof value === 'string') return true;
                return isFileObject(value) ? value.size <= maxSize : true;
            })
            .test('fileType', 'Unsupported file format', (value) => {
                if (!value) return true;
                if (typeof value === 'string') return true;
                return isFileObject(value) ? allowedTypes.includes(value.type) : true;
            }),
    });

    const loadModels = async () => {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    };

    useEffect(() => {
        if (activePlans.includes("Payroll By The Box")) {
            loadModels().then(() => {
                console.log('Face detection models loaded');
            });
        }
    }, []);

    // Replace your existing useEffect for face detection with this:
    useEffect(() => {
        let interval;
        const detectFace = async () => {
            if (webcamRef.current && webcamRef.current.video.readyState === 4 && faceapi.nets.tinyFaceDetector.params) {
                const { video } = webcamRef.current;
                const canvas = document.getElementById('faceCanvas');

                // Check if canvas exists before proceeding
                if (!canvas) {
                    return;
                }

                try {
                    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

                    const dims = faceapi.matchDimensions(canvas, video, true);
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    if (detection) {
                        const resized = faceapi.resizeResults(detection, dims);
                        faceapi.draw.drawDetections(canvas, resized);
                        setFaceBox(resized.detection.box);
                    } else {
                        setFaceBox(null);
                    }
                } catch (error) {
                    console.error('Face detection error:', error);
                    setFaceBox(null);
                }
            }
        };

        if (showFaceModal) {
            setIsDetecting(true);
            // Add a small delay to ensure the canvas is rendered
            setTimeout(() => {
                interval = setInterval(detectFace, 300);
            }, 100);
        }

        return () => {
            setIsDetecting(false);
            if (interval) {
                clearInterval(interval);
            }
            // Clear canvas safely
            const canvas = document.getElementById('faceCanvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
    }, [showFaceModal]);

    // Also update your handleFaceCapture function:
    const handleFaceCapture = async () => {
        try {
            setIsCapturing(true);
            const screenshot = webcamRef.current.getScreenshot();
            const img = await faceapi.fetchImage(screenshot);

            const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

            if (detection) {
                const descriptorArray = Array.from(detection.descriptor);
                console.log('Description Array', descriptorArray);
                setFaceDescriptor(descriptorArray);
                setCaptureStatus('success');
                setCaptureErrorMessage('');
            } else {
                setCaptureStatus('error');
                setCaptureErrorMessage('No face detected. Please try again.');
            }
        } catch (err) {
            console.error('Face capture error:', err);
            setCaptureStatus('error');
            setCaptureErrorMessage('Error capturing face. Try again.');
        } finally {
            setIsCapturing(false);
        }
    };

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

                // Add face descriptor if captured
                if (faceDescriptor) {
                    formData.append('face_encoding', JSON.stringify(faceDescriptor));
                }

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
                setFileUploadError('Update failed. Please try again.');
                toast.error('Update failed.');
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
                const res = await axios.get(`${process.env.REACT_APP_API}/staff/get-positions`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setPositions(res.data.data);
            } catch (error) {
                console.error('Error fetching positions:', error);
                toast.error('Failed to fetch positions.');
            }
        };

        const fetchStaffData = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API}/staff/get/${id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });

                const staff = res.data.data;
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

                // Set face descriptor if exists
                if (staff.face_encoding && staff.face_encoding.length > 0) {
                    setFaceDescriptor(staff.face_encoding);
                    setCaptureStatus('success');
                }

                // Find country by name to get ISO code
                const selectedCountry = Country.getAllCountries().find((c) => c.name === staff.country);

                if (selectedCountry) {
                    // Load states using the country ISO code
                    const countryStates = State.getStatesOfCountry(selectedCountry.isoCode);
                    setStates(countryStates);

                    // Find state by name to get ISO code
                    const selectedState = countryStates.find((s) => s.name === staff.state);

                    if (selectedState) {
                        // Load cities using both country and state ISO codes
                        setCities(City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode));
                    }
                }

                setPhotoPreview(`${process.env.REACT_APP_UPLOAD_DIR}/${staff.photo}`);
                setFrontImagePreview(`${process.env.REACT_APP_UPLOAD_DIR}/${staff.front_image}`);
                if (staff.back_image) {
                    setBackImagePreview(`${process.env.REACT_APP_UPLOAD_DIR}/${staff.back_image}`);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching staff data:', error);
                setLoading(false);
                toast.error('Failed to fetch staff data.');
            }
        };

        fetchPositions();
        fetchStaffData();
    }, [id, setFieldValue]);

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
                                <h1 className="mb-0 pb-0 display-4">Edit Staff</h1>
                                <BreadcrumbList items={breadcrumbs} />
                            </Col>
                            <Col xs="auto">
                                <Button variant="outline-primary" onClick={() => history.push('/staff/view')}>
                                    <CsLineIcons icon="eye" className="me-2" />
                                    View Staff
                                </Button>
                            </Col>
                        </Row>
                    </div>

                    {fileUploadError && (
                        <Alert variant="danger" className="mb-4">
                            {fileUploadError}
                        </Alert>
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
                                {values.document_type && values.document_type === 'National Identity Card' && (
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
                                )}
                            </Row>
                        </Card>

                        {activePlans.includes("Payroll By The Box") && (
                            <Card body className="mb-4">
                                <h5 className="mb-3">Face Capture</h5>

                                {captureStatus === 'success' ? (
                                    <Alert variant="success" className="mb-3">
                                        <CsLineIcons icon="check" className="me-2" />
                                        Face captured successfully. You can now update the staff record.
                                    </Alert>
                                ) : captureStatus === 'error' ? (
                                    <Alert variant="danger" className="mb-3">
                                        <CsLineIcons icon="warning" className="me-2" />
                                        {captureErrorMessage}
                                    </Alert>
                                ) : faceDescriptor && faceDescriptor.length > 0 ? (
                                    <Alert variant="info" className="mb-3">
                                        <CsLineIcons icon="info" className="me-2" />
                                        Face data is already captured. You can recapture if needed.
                                    </Alert>
                                ) : (
                                    <Alert variant="warning" className="mb-3">
                                        <CsLineIcons icon="warning" className="me-2" />
                                        Face data not captured yet. Please capture to proceed.
                                    </Alert>
                                )}

                                <Button
                                    variant={faceDescriptor && faceDescriptor.length > 0 ? 'outline-warning' : 'primary'}
                                    onClick={() => setShowFaceModal(true)}
                                    className="me-2"
                                >
                                    <CsLineIcons icon="camera" className="me-2" />
                                    {faceDescriptor && faceDescriptor.length > 0 ? 'Recapture Face' : 'Capture Face'}
                                </Button>
                            </Card>
                        )}

                        <div className="d-flex justify-content-start">
                            <Button variant="success" type="submit" className="mx-2 px-4">
                                <CsLineIcons icon="check" className="me-2" />
                                Submit Changes
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>

            {/* Face Capture Modal */}
            {activePlans.includes("Payroll By The Box") && (
                <Modal show={showFaceModal} onHide={() => setShowFaceModal(false)} centered size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Face Capture</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="d-flex flex-column align-items-center">
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '640px',
                                aspectRatio: '4 / 3',
                                margin: '0 auto',
                                background: '#000',
                            }}
                        >
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    facingMode: 'user',
                                }}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    zIndex: 1,
                                    borderRadius: '8px',
                                }}
                            />

                            <canvas
                                id="faceCanvas"
                                width={640}
                                height={480}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    zIndex: 2,
                                    pointerEvents: 'none',
                                }}
                            />
                        </div>

                        <Button
                            variant="primary"
                            className="mt-4"
                            disabled={!faceBox || isCapturing}
                            onClick={async () => {
                                await handleFaceCapture();
                                if (captureStatus === 'success') {
                                    setTimeout(() => {
                                        setShowFaceModal(false);
                                    }, 1000);
                                }
                            }}
                        >
                            {isCapturing ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                    Capturing...
                                </>
                            ) : (
                                <>
                                    <CsLineIcons icon="camera" className="me-2" />
                                    Capture Face
                                </>
                            )}
                        </Button>
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
};

export default EditStaff;
