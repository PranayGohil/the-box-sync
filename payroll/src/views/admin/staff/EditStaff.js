import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Modal, Alert, Spinner, Badge } from 'react-bootstrap';
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
  const [loading, setLoading] = useState({ initial: true, submitting: false, faceModels: false });
  const [fileUploadError, setFileUploadError] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [payrollConfig, setPayrollConfig] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState({
    photo: false,
    front_image: false,
    back_image: false,
  });
  // Face capture states
  const [showFaceModal, setShowFaceModal] = useState(false);
  const webcamRef = useRef(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [faceBox, setFaceBox] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState('none');
  const { activePlans } = useContext(AuthContext);
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
        basic: Yup.number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0, 'Must be 0 or more')
          .required('Basic is required'),
        hra: Yup.number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0),
        conveyance: Yup.number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0),
        medical: Yup.number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0),
        special: Yup.number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0),
        other: Yup.number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0),
      }),
      deductions: Yup.object({
        pf_percentage: Yup.number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0)
          .max(100),
        esi_percentage: Yup.number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0)
          .max(100),
        pt: Yup.number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0),
      }),
    }),
  });

  const loadModels = async () => {
    setLoading((prev) => ({ ...prev, faceModels: true }));
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    } catch (error) {
      toast.error('Failed to load face detection models');
    } finally {
      setLoading((prev) => ({ ...prev, faceModels: false }));
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    let interval;
    const detectFace = async () => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4 && faceapi.nets.tinyFaceDetector.params) {
        const { video } = webcamRef.current;
        const canvas = document.getElementById('faceCanvas');
        if (!canvas) return;
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
          setFaceBox(null);
        }
      }
    };
    if (showFaceModal) {
      setTimeout(() => { interval = setInterval(detectFace, 300); }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
      const canvas = document.getElementById('faceCanvas');
      if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    };
  }, [showFaceModal]);

  const handleFaceCapture = async () => {
    try {
      setIsCapturing(true);
      const screenshot = webcamRef.current.getScreenshot();
      const img = await faceapi.fetchImage(screenshot);
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      if (detection) {
        setFaceDescriptor(Array.from(detection.descriptor));
        setCaptureStatus('success');
        setShowFaceModal(false);
        toast.success('Face captured successfully!');
      } else {
        toast.error('No face detected. Please try again.');
      }
    } catch (err) {
      toast.error('Error capturing face. Try again.');
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
      salary_structure: {
        earnings: {
          basic: 0,
          hra: 0,
          conveyance: 0,
          medical: 0,
          special: 0,
          other: 0,
        },
        deductions: {
          pf_percentage: 0,
          esi_percentage: 0,
          pt: 0,
        },
      },
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
            if (key === 'salary_structure') {
              formData.append(key, JSON.stringify(values[key]));
            } else {
              formData.append(key, values[key]);
            }
          }
        });

        if (values.photo instanceof File) formData.append('photo', values.photo);
        if (values.front_image instanceof File) formData.append('front_image', values.front_image);
        if (values.back_image instanceof File) formData.append('back_image', values.back_image);
        if (faceDescriptor) formData.append('face_descriptor', JSON.stringify(faceDescriptor));

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
        const serverError = err.response?.data?.error;
        const serverMessage = err.response?.data?.message;
        const errorMsg = Array.isArray(serverError)
          ? serverError.join(', ')
          : (serverError || serverMessage || 'Update failed. Please try again.');
        setFileUploadError(errorMsg);
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
        const selectedCountry = Country.getAllCountries().find(
          (c) => c.name.toLowerCase() === staff.country?.toLowerCase() || c.isoCode.toLowerCase() === staff.country?.toLowerCase()
        );
        const countryVal = selectedCountry ? selectedCountry.name : (staff.country || '');
        setFieldValue('country', countryVal);

        let stateVal = staff.state || '';
        if (selectedCountry) {
          const countryStates = State.getStatesOfCountry(selectedCountry.isoCode);
          setStates(countryStates);

          const selectedState = countryStates.find(
            (s) => s.name.toLowerCase() === staff.state?.toLowerCase() || s.isoCode.toLowerCase() === staff.state?.toLowerCase()
          );

          if (selectedState) {
            stateVal = selectedState.name;
            setCities(City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode));
          }
        }
        setFieldValue('state', stateVal);
        setFieldValue('city', staff.city || '');
        if (staff.salary_structure) {
          setFieldValue('salary_structure', staff.salary_structure);
        }
        setFieldValue('phone_no', staff.phone_no || '');
        setFieldValue('email', staff.email || '');
        setFieldValue('salary', staff.salary || '');
        setFieldValue('position', staff.position || '');
        setFieldValue('document_type', staff.document_type || '');
        setFieldValue('id_number', staff.id_number || '');
        setFieldValue('photo', staff.photo || '');
        setFieldValue('front_image', staff.front_image || '');
        setFieldValue('back_image', staff.back_image || '');

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
      border-radius: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
      transition: all 0.3s ease;
    }
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
    .custom-btn-outline {
      border: 2px solid #23b3f4 !important;
      color: #23b3f4 !important;
      background-color: transparent !important;
      transition: all 0.3s ease !important;
      border-radius: 50px !important;
      font-weight: 700 !important;
      font-size: 0.85rem !important;
      padding: 0.6rem 1.5rem !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
    }
    .custom-btn-outline:hover {
      background-color: #23b3f4 !important;
      color: #fff !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(35, 179, 244, 0.2) !important;
    }
    .custom-btn-outline i, .custom-btn-outline svg {
      color: #23b3f4 !important;
      transition: color 0.3s ease !important;
    }
    .custom-btn-outline:hover i, .custom-btn-outline:hover svg {
      color: #ffffff !important;
    }
    .custom-btn-danger {
      background: transparent !important;
      border: 2px solid #cf2637 !important;
      color: #cf2637 !important;
      border-radius: 50px !important;
      padding: 0.6rem 1.5rem !important;
      font-weight: 700 !important;
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
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 20px rgba(207, 38, 55, 0.2) !important;
    }
    .custom-btn-danger:hover i, .custom-btn-danger:hover svg {
      color: #ffffff !important;
    }
    .custom-btn-solid {
      background-color: #23b3f4 !important;
      border: 2px solid #23b3f4 !important;
      color: #fff !important;
      transition: all 0.3s ease !important;
      border-radius: 50px !important;
      font-weight: 700 !important;
      font-size: 0.85rem !important;
      padding: 0.6rem 1.5rem !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
    }
    .custom-btn-solid:hover {
      background-color: #1ea8e7 !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(35, 179, 244, 0.3) !important;
    }
    .custom-btn-solid i, .custom-btn-solid svg {
      color: #ffffff !important;
    }
    .form-label {
      font-weight: 500 !important;
      color: #64748b !important;
      font-size: 0.85rem !important;
      text-transform: none !important;
      letter-spacing: normal !important;
      margin-bottom: 0.4rem !important;
      display: inline-block;
    }
    .form-control, .form-select {
      border-radius: 10px !important;
      padding: 0.5rem 0.75rem !important;
      border: 1px solid #dee2e6 !important;
      background-color: #ffffff !important;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out !important;
      font-size: 0.9rem !important;
      height: 40px !important;
    }
    .form-control:focus, .form-select:focus {
      background-color: white !important;
      border-color: #23b3f4 !important;
      box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
    }
    .section-header {
      border-left: 4px solid #23b3f4;
      padding-left: 1rem;
      margin-bottom: 2rem;
      color: #2d3748;
    }
    .preview-container {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      overflow: hidden;
      border: 4px solid #fff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
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
      height: 180px;
      border-radius: 1.25rem;
      overflow: hidden;
      border: 2px dashed #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      margin-bottom: 1rem;
    }
    @media (max-width: 768px) {
      .edit-staff-button-group-responsive {
        flex-direction: column !important;
        width: 100% !important;
        gap: 12px !important;
      }
      .edit-staff-button-group-responsive button, .edit-staff-button-group-responsive label, .edit-staff-button-group-responsive a {
        width: 100% !important;
        justify-content: center !important;
        padding: 0.75rem 1rem !important;
      }
    }
    @media (max-width: 576px) {
      .glass-card {
        border-radius: 1rem;
        padding: 1.25rem !important;
      }
    }
  `;

  if (loading.initial) {
    return (
      <div className="container-fluid py-5">
        <style>{customStyles}</style>
        <HtmlHead title={title} description={description} />
        <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
          <Spinner animation="border" style={{ color: '#23b3f4' }} className="mb-3" />
          <h5 className="fw-bold">Loading Staff Details...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-staff-staff-container pb-5">
      <style>{customStyles}</style>

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
              <Button className="custom-btn-outline" onClick={() => history.push('/staff/view')} disabled={loading.submitting}>
                <CsLineIcons icon="arrow-left" size="18" /> Back to List
              </Button>
            </Col>
          </Row>
        </div>

      {fileUploadError && (
        <Alert variant="danger" className="mb-4 glass-card border-0">
          <CsLineIcons icon="error" className="me-2" />
          {fileUploadError}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">
          {/* Main Content Column */}
          <Col lg={8}>
            {/* Personal Details Card */}
            <Card className="glass-card border-0 mb-4">
              <Card.Body className="p-4">
                <div className="section-header mb-4">
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
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Joining Date</Form.Label>
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
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Country</Form.Label>
                      <Form.Select
                        name="country"
                        value={values.country}
                        onChange={handleCountryChange}
                        isInvalid={touched.country && errors.country}
                        disabled={loading.submitting}
                      >
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
                      <Form.Label className="small fw-bold">State</Form.Label>
                      <Form.Select
                        name="state"
                        value={values.state}
                        onChange={handleStateChange}
                        disabled={!values.country || loading.submitting}
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
                      <Form.Label className="small fw-bold">City</Form.Label>
                      <Form.Select
                        name="city"
                        value={values.city}
                        onChange={handleChange}
                        disabled={!values.state || loading.submitting}
                        isInvalid={touched.city && errors.city}
                      >
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

                <Row className="g-3 mt-1">
                  <Col md={6}>
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
                  <Col md={6}>
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
            <Card className="glass-card border-0 mb-4">
              <Card.Body className="p-4">
                <div className="section-header mb-4">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <CsLineIcons icon="briefcase" size="20" className="text-primary" />
                    Employment & Payroll
                  </h5>
                </div>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Job Position</Form.Label>
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

                <hr className="my-4 opacity-5" />

                <h6 className="fw-bold mb-3 text-primary">Salary Structure Breakdown</h6>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="bg-light rounded-3 p-3">
                      <div className="small fw-bold text-muted mb-3 text-uppercase letter-spacing-1">Monthly Earnings</div>
                      <Form.Group className="mb-2">
                        <Form.Label className="x-small fw-bold">Basic Pay</Form.Label>
                        <Form.Control
                          type="number"
                          name="salary_structure.earnings.basic"
                          value={values.salary_structure?.earnings?.basic}
                          onChange={handleChange}
                          isInvalid={touched.salary_structure?.earnings?.basic && !!errors.salary_structure?.earnings?.basic}
                          size="sm"
                        />
                        {touched.salary_structure?.earnings?.basic && errors.salary_structure?.earnings?.basic && (
                          <div className="text-danger mt-1 small fw-bold">{errors.salary_structure.earnings.basic}</div>
                        )}
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label className="x-small fw-bold">HRA</Form.Label>
                        <Form.Control
                          type="number"
                          name="salary_structure.earnings.hra"
                          value={values.salary_structure?.earnings?.hra}
                          onChange={handleChange}
                          isInvalid={touched.salary_structure?.earnings?.hra && !!errors.salary_structure?.earnings?.hra}
                          size="sm"
                        />
                        {touched.salary_structure?.earnings?.hra && errors.salary_structure?.earnings?.hra && (
                          <div className="text-danger mt-1 small fw-bold">{errors.salary_structure.earnings.hra}</div>
                        )}
                      </Form.Group>
                      <Form.Group className="mb-0">
                        <Form.Label className="x-small fw-bold">Special Allowance</Form.Label>
                        <Form.Control
                          type="number"
                          name="salary_structure.earnings.special"
                          value={values.salary_structure?.earnings?.special}
                          onChange={handleChange}
                          isInvalid={touched.salary_structure?.earnings?.special && !!errors.salary_structure?.earnings?.special}
                          size="sm"
                        />
                        {touched.salary_structure?.earnings?.special && errors.salary_structure?.earnings?.special && (
                          <div className="text-danger mt-1 small fw-bold">{errors.salary_structure.earnings.special}</div>
                        )}
                      </Form.Group>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="bg-light rounded-3 p-3">
                      <div className="small fw-bold text-muted mb-3 text-uppercase letter-spacing-1">Statutory Deductions</div>
                      <Form.Group className="mb-2">
                        <Form.Label className="x-small fw-bold">PF (%)</Form.Label>
                        <Form.Control
                          type="number"
                          name="salary_structure.deductions.pf_percentage"
                          value={values.salary_structure?.deductions?.pf_percentage}
                          onChange={handleChange}
                          isInvalid={touched.salary_structure?.deductions?.pf_percentage && !!errors.salary_structure?.deductions?.pf_percentage}
                          size="sm"
                        />
                        {touched.salary_structure?.deductions?.pf_percentage && errors.salary_structure?.deductions?.pf_percentage && (
                          <div className="text-danger mt-1 small fw-bold">{errors.salary_structure.deductions.pf_percentage}</div>
                        )}
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label className="x-small fw-bold">ESI (%)</Form.Label>
                        <Form.Control
                          type="number"
                          name="salary_structure.deductions.esi_percentage"
                          value={values.salary_structure?.deductions?.esi_percentage}
                          onChange={handleChange}
                          isInvalid={touched.salary_structure?.deductions?.esi_percentage && !!errors.salary_structure?.deductions?.esi_percentage}
                          size="sm"
                        />
                        {touched.salary_structure?.deductions?.esi_percentage && errors.salary_structure?.deductions?.esi_percentage && (
                          <div className="text-danger mt-1 small fw-bold">{errors.salary_structure.deductions.esi_percentage}</div>
                        )}
                      </Form.Group>
                      <Form.Group className="mb-0">
                        <Form.Label className="x-small fw-bold">PT (Monthly)</Form.Label>
                        <Form.Control
                          type="number"
                          name="salary_structure.deductions.pt"
                          value={values.salary_structure?.deductions?.pt}
                          onChange={handleChange}
                          isInvalid={touched.salary_structure?.deductions?.pt && !!errors.salary_structure?.deductions?.pt}
                          size="sm"
                        />
                        {touched.salary_structure?.deductions?.pt && errors.salary_structure?.deductions?.pt && (
                          <div className="text-danger mt-1 small fw-bold">{errors.salary_structure.deductions.pt}</div>
                        )}
                      </Form.Group>
                    </div>
                  </Col>
                </Row>
                
                {/* Submit Button inside Card */}
                <div className="d-flex justify-content-center mt-4">
                  <Button
                    className="custom-btn-outline px-5 py-3"
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
            <Card className="glass-card border-0 mb-4 text-center">
              <Card.Body className="p-4">
                <div className="section-header text-start mb-3">
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
                  className="custom-btn-outline px-4 mx-auto"
                  style={{ maxWidth: 'fit-content' }}
                  disabled={loading.submitting || uploadingFiles.photo}
                >
                  {uploadingFiles.photo ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </Button>
                
                <div className="mt-3 text-center">
                  <Button
                    variant={faceDescriptor ? "success" : "outline-primary"}
                    className="custom-btn-outline px-4 mx-auto d-flex align-items-center justify-content-center gap-2"
                    onClick={() => setShowFaceModal(true)}
                    disabled={loading.submitting}
                    style={{ maxWidth: 'fit-content' }}
                  >
                    <CsLineIcons icon={faceDescriptor ? "check" : "camera"} size="18" /> 
                    {faceDescriptor ? "Face Captured" : "Capture Face"}
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Identification Card */}
            <Card className="glass-card border-0 mb-4">
              <Card.Body className="p-4">
                <div className="section-header mb-4">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <CsLineIcons icon="badge" size="20" className="text-primary" />
                    Identification
                  </h5>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Document Type</Form.Label>
                  <Form.Select
                    name="document_type"
                    value={values.document_type}
                    onChange={handleChange}
                    isInvalid={touched.document_type && errors.document_type}
                    disabled={loading.submitting}
                  >
                    <option value="">Select ID Type</option>
                    <option value="National Identity Card">National Identity Card</option>
                    <option value="Pan Card">Pan Card</option>
                    <option value="Voter Card">Voter Card</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.document_type}</Form.Control.Feedback>
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
                      className="custom-btn-outline px-4 mx-auto"
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
                        className="custom-btn-outline px-4 mx-auto"
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
          <Card className="glass-card border-0 p-5 shadow-lg text-center" style={{ maxWidth: '400px' }}>
            <Spinner animation="grow" variant="primary" className="mb-4" />
            <h4 className="fw-bold">Updating Profile</h4>
            <p className="text-muted mb-0">Synchronizing records and securing identity documents.</p>
          </Card>
        </div>
      )}

      {/* Face Capture Modal */}
      <Modal show={showFaceModal} onHide={() => setShowFaceModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Face Capture</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column align-items-center">
            {loading.faceModels ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <h5>Loading Face Detection...</h5>
                <p className="text-muted">Please wait while we initialize the camera</p>
              </div>
            ) : (
              <>
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

                {!faceBox && (
                  <Alert variant="warning" className="mt-3">
                    <CsLineIcons icon="warning" className="me-2" />
                    Please position your face in the frame
                  </Alert>
                )}

                <Button variant="primary" className="mt-4" disabled={!faceBox || isCapturing} onClick={handleFaceCapture} style={{ minWidth: '150px' }}>
                  {isCapturing ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <CsLineIcons icon="camera" className="me-2" />
                      Capture Face
                    </>
                  )}
                </Button>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFaceModal(false)} disabled={isCapturing}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
    </div>
  </div>
);
};

export default EditStaff;

