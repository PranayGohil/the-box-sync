import React, { useState, useEffect, useContext, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { Country, State, City } from 'country-state-city';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { AuthContext } from 'contexts/AuthContext';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import ImageCropperModal from 'components/cropper/ImageCropperModal';

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
    faceModels: false,
  });
  const [fileUploadError, setFileUploadError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [payrollConfig, setPayrollConfig] = useState(null);
  const [globalLeavePolicies, setGlobalLeavePolicies] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState({
    photo: false,
    front_image: false,
    back_image: false,
  });

  const [cropperState, setCropperState] = useState({
    show: false,
    imageSrc: null,
    fieldName: null,
    setPreview: null,
    aspect: 1,
  });

  // Face capture states
  const [showFaceModal, setShowFaceModal] = useState(false);
  const webcamRef = useRef(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const faceDescriptorRef = useRef(null);
  const birthDateRef = useRef(null);
  const joiningDateRef = useRef(null);
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

    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),

    salary: Yup.number().required('Salary is required').positive('Salary must be a positive number'),
    salary_calculation_base: Yup.string().required('Salary calculation base is required').oneOf(['working_days', 'working_hours']),

    position: Yup.string().required('Position is required'),

    photo: Yup.mixed()
      .required('Photo is required')
      .test('fileSize', 'File size is too large (max 20MB)', (value) => !value || (value && value.size <= 20 * 1024 * 1024))
      .test(
        'fileType',
        'Unsupported file format (JPEG, PNG, JPG, WebP only)',
        (value) => !value || (value && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type))
      ),

    document_type: Yup.string().required('Document type is required').oneOf(['National Identity Card', 'Aadhar Card', 'Pan Card', 'Voter Card', 'Voter ID Card', 'Driving License', 'Passport'], 'Invalid document type'),

    id_number: Yup.string()
      .required('ID number is required')
      .when('document_type', (docType, schema) => {
        const aadharRegex = /^[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}$/;
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        const voterRegex = /^[A-Z]{3}[0-9]{7}$/;

        if (docType === 'National Identity Card' || docType === 'Aadhar Card') {
          return schema.matches(aadharRegex, 'Aadhar number must be 12 digits (format: XXXX XXXX XXXX)');
        }
        if (docType === 'Pan Card') {
          return schema.matches(panRegex, 'PAN card format must be ABCDE1234F (5 letters, 4 digits, 1 letter)');
        }
        if (docType === 'Voter Card' || docType === 'Voter ID Card') {
          return schema.matches(voterRegex, 'Voter ID format must be ABC1234567 (3 letters, 7 digits)');
        }
        return schema;
      }),

    front_image: Yup.mixed()
      .required('Front ID image is required')
      .test('fileSize', 'File size is too large (max 20MB)', (value) => !value || (value && value.size <= 20 * 1024 * 1024))
      .test(
        'fileType',
        'Unsupported file format (JPEG, PNG, JPG, WebP only)',
        (value) => !value || (value && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type))
      ),

    back_image: Yup.mixed()
      .when('document_type', (docType, schema) => {
        if (docType === 'National Identity Card' || docType === 'Aadhar Card') {
          return schema.required('Back ID image is required for Aadhar card');
        }
        return schema.notRequired();
      })
      .test('fileSize', 'File size is too large (max 20MB)', (value) => !value || (value && value.size <= 20 * 1024 * 1024))
      .test(
        'fileType',
        'Unsupported file format (JPEG, PNG, JPG, WebP only)',
        (value) => !value || (value && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type))
      ),

    salary_structure: Yup.object().shape({
      custom_earnings: Yup.object(),
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
    increment_plan: Yup.object().shape({
      type: Yup.string().oneOf(['percentage', 'flat']),
      value: Yup.number().min(0).nullable(),
      scheduled_date: Yup.string().nullable()
    }).nullable()
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
      password: '',
      salary: '',
      salary_calculation_base: 'working_days',
      weekly_off_policy: 'global',
      custom_weekly_offs: [{ day: 'Sunday', type: 'all_weeks', weeks: [] }],
      leave_policy_configuration: [],
      position: '',
      photo: '',
      document_type: '',
      id_number: '',
      front_image: '',
      back_image: '',
      salary_structure: {
        custom_earnings: {},
        custom_deductions: {},
        deductions: {
          pf_percentage: 0,
          esi_percentage: 0,
          pt: 0,
        },
      },
      increment_plan: {
        type: 'percentage',
        value: '',
        scheduled_date: ''
      }
    },
    validationSchema: addStaff,
    onSubmit: async (values, { setSubmitting }) => {
      setLoading((prev) => ({ ...prev, submitting: true }));
      setFileUploadError(null);
      try {
        const formData = new FormData();

        Object.keys(values).forEach((key) => {
          if (key !== 'photo' && key !== 'front_image' && key !== 'back_image') {
          if (key === 'salary_structure' || key === 'increment_plan' || key === 'custom_weekly_offs' || key === 'leave_policy_configuration') {
              formData.append(key, JSON.stringify(values[key]));
            } else {
              formData.append(key, values[key]);
            }
          }
        });

        if (values.photo) formData.append('photo', values.photo);
        if (values.front_image) formData.append('front_image', values.front_image);
        if (values.back_image) formData.append('back_image', values.back_image);
        const currentFaceDescriptor = faceDescriptorRef.current;
        if (currentFaceDescriptor) {
          formData.append('face_descriptor', JSON.stringify(currentFaceDescriptor));
        }

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
      setTimeout(() => {
        interval = setInterval(detectFace, 300);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
      const canvas = document.getElementById('faceCanvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [showFaceModal]);

  

  const handleFaceCapture = async () => {
    try {
      setIsCapturing(true);
      const screenshot = webcamRef.current.getScreenshot();
      const img = await faceapi.fetchImage(screenshot);
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      if (detection) {
        const descriptorArray = Array.from(detection.descriptor);
        setFaceDescriptor(descriptorArray);
        faceDescriptorRef.current = descriptorArray;
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

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  const handleAddCustomWeeklyOff = () => {
    const current = values.custom_weekly_offs ? [...values.custom_weekly_offs] : [];
    current.push({ day: 'Sunday', weeks: [] });
    setFieldValue('custom_weekly_offs', current);
  };

  const handleRemoveCustomWeeklyOff = (index) => {
    const current = [...values.custom_weekly_offs];
    current.splice(index, 1);
    setFieldValue('custom_weekly_offs', current);
  };

  const handleUpdateCustomWeeklyOff = (index, field, value) => {
    const current = [...values.custom_weekly_offs];
    current[index][field] = value;
    setFieldValue('custom_weekly_offs', current);
  };

  const toggleSpecificCustomWeek = (index, weekNum) => {
    const current = [...values.custom_weekly_offs];
    const weeks = current[index].weeks ? [...current[index].weeks] : [];
    if (weeks.includes(weekNum)) {
      current[index].weeks = weeks.filter(w => w !== weekNum);
    } else {
      current[index].weeks.push(weekNum);
    }
    setFieldValue('custom_weekly_offs', current);
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading((prev) => ({ ...prev, initial: true }));
        setCountries(Country.getAllCountries());

        const [positionsRes, configRes, leavePolicyRes, nextIdRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API}/staff/get-positions`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${process.env.REACT_APP_API}/payroll-config`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${process.env.REACT_APP_API}/leave-policy`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${process.env.REACT_APP_API}/staff/get-next-id`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          })
        ]);
        
        setPositions(positionsRes.data.data);
        if (nextIdRes.data?.success) {
          formik.setFieldValue('staff_id', nextIdRes.data.data);
        }

        if (leavePolicyRes?.data?.success && leavePolicyRes?.data?.data?.leave_types) {
          setGlobalLeavePolicies(leavePolicyRes.data.data.leave_types);
          
          const mapped = leavePolicyRes.data.data.leave_types.map(lt => ({
            leave_type_id: lt.leave_type_id,
            is_active: true
          }));
          formik.setFieldValue('leave_policy_configuration', mapped);
          
        }

        if (configRes.data.success && configRes.data.data) {
          setPayrollConfig(configRes.data.data);
          
          // Pre-fill initial custom_earnings values
          const activeEarnings = (configRes.data.data.custom_earnings || []).filter(e => e.is_active);
          const initialCustomEarnings = {};
          activeEarnings.forEach(e => {
            initialCustomEarnings[e.id] = 0;
          });
          formik.setFieldValue('salary_structure.custom_earnings', initialCustomEarnings);

          // Pre-fill initial custom_deductions values
          const activeDeductions = (configRes.data.data.custom_deductions || []).filter(d => d.is_active);
          const initialCustomDeductions = {};
          activeDeductions.forEach(d => {
            initialCustomDeductions[d.id] = 0;
          });
          formik.setFieldValue('salary_structure.custom_deductions', initialCustomDeductions);
        }
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

  const handleFileChange = (fieldName, file, setPreview, aspect = undefined) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropperState({
        show: true,
        imageSrc: reader.result?.toString() || "",
        fieldName,
        setPreview,
        aspect,
      });
    });
    reader.readAsDataURL(file);
    
    // To clear the file input so the same file can be selected again if cancelled
    const fileInput = document.getElementById(`${fieldName.replace('_', '-')}-upload`);
    if(fileInput) fileInput.value = '';
  };

  const handleCropComplete = async (croppedFile) => {
    const { fieldName, setPreview } = cropperState;
    setUploadingFiles((prev) => ({ ...prev, [fieldName]: true }));
    
    const previewUrl = URL.createObjectURL(croppedFile);
    setPreview(previewUrl);
    setFieldValue(fieldName, croppedFile);

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
      .add-staff-button-group-responsive {
        flex-direction: column !important;
        width: 100% !important;
        gap: 12px !important;
      }
      .add-staff-button-group-responsive button, .add-staff-button-group-responsive label, .add-staff-button-group-responsive a {
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
          <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
          <h5 className="fw-bold">Initializing Form...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="add-staff-staff-container pb-5">
      <style>{customStyles}</style>

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

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gender</Form.Label>
                      <Select
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        name="gender"
                        options={[
                          { value: 'Male', label: 'Male' },
                          { value: 'Female', label: 'Female' },
                          { value: 'Other', label: 'Other' }
                        ]}
                        value={values.gender ? { label: values.gender, value: values.gender } : null}
                        onChange={(selected) => setFieldValue('gender', selected ? selected.value : '')}
                        onBlur={() => formik.setFieldTouched('gender', true)}
                        isDisabled={loading.submitting}
                        placeholder="Select Gender"
                      />
                      {touched.gender && errors.gender && (
                        <div className="text-danger mt-1 small fw-bold">{errors.gender}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Birth Date</Form.Label>
                      <div className="position-relative date-input-container">
                        <Form.Control
                          ref={birthDateRef}
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
                          style={{ cursor: 'pointer', zIndex: 5 }}
                          onClick={() => birthDateRef.current?.showPicker()}
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
                          ref={joiningDateRef}
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
                          style={{ cursor: 'pointer', zIndex: 5 }}
                          onClick={() => joiningDateRef.current?.showPicker()}
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

                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Country</Form.Label>
                      <Select
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        name="country"
                        options={countries.map(c => ({ value: c.name, label: c.name }))}
                        value={values.country ? { label: values.country, value: values.country } : null}
                        onChange={handleCountryChange}
                        onBlur={() => formik.setFieldTouched('country', true)}
                        isDisabled={loading.submitting}
                        placeholder="Select Country"
                      />
                      {touched.country && errors.country && (
                        <div className="text-danger mt-1 small fw-bold">{errors.country}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Select
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        name="state"
                        options={states.map(s => ({ value: s.name, label: s.name }))}
                        value={values.state ? { label: values.state, value: values.state } : null}
                        onChange={handleStateChange}
                        onBlur={() => formik.setFieldTouched('state', true)}
                        isDisabled={!values.country || loading.submitting}
                        placeholder="Select State"
                      />
                      {touched.state && errors.state && (
                        <div className="text-danger mt-1 small fw-bold">{errors.state}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Select
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        name="city"
                        options={cities.map(c => ({ value: c.name, label: c.name }))}
                        value={values.city ? { label: values.city, value: values.city } : null}
                        onChange={(selected) => setFieldValue('city', selected ? selected.value : '')}
                        onBlur={() => formik.setFieldTouched('city', true)}
                        isDisabled={!values.state || loading.submitting}
                        placeholder="Select City"
                      />
                      {touched.city && errors.city && (
                        <div className="text-danger mt-1 small fw-bold">{errors.city}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
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

                  <Col md={4}>
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
                  <Col md={4}>
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
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          autoComplete="new-password"
                          placeholder="Password for staff login"
                          value={values.password}
                          onChange={handleChange}
                          isInvalid={touched.password && errors.password}
                          disabled={loading.submitting}
                          style={{ paddingRight: '40px' }}
                        />
                        <Button
                          variant="link"
                          className="position-absolute end-0 top-50 translate-middle-y me-2 p-0 text-muted"
                          style={{ zIndex: 5, textDecoration: 'none' }}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <CsLineIcons icon={showPassword ? 'eye-off' : 'eye'} size="18" />
                        </Button>
                      </div>
                      {touched.password && errors.password && (
                        <div className="text-danger mt-1 small">{errors.password}</div>
                      )}
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
                  <Col md={4}>
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
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                      />
                      {touched.position && errors.position && <div className="text-danger mt-1 small fw-bold">{errors.position}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Salary Calculation Base</Form.Label>
                      <Select
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        name="salary_calculation_base"
                        options={[
                          { value: 'working_days', label: 'Based on Working Days' },
                          { value: 'working_hours', label: 'Based on Working Hours' }
                        ]}
                        value={values.salary_calculation_base ? { label: values.salary_calculation_base === 'working_hours' ? 'Based on Working Hours' : 'Based on Working Days', value: values.salary_calculation_base } : null}
                        onChange={(selected) => setFieldValue('salary_calculation_base', selected ? selected.value : 'working_days')}
                        onBlur={() => formik.setFieldTouched('salary_calculation_base', true)}
                        isDisabled={loading.submitting}
                        placeholder="Select Base"
                      />
                      {touched.salary_calculation_base && errors.salary_calculation_base && (
                        <div className="text-danger mt-1 small fw-bold">{errors.salary_calculation_base}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
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

                <hr className="my-4 opacity-50" />

                <h6 className="fw-bold mb-3 text-primary">Salary Structure Breakdown</h6>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="bg-light rounded-3 p-3 shadow-sm border border-faint h-100">
                      <div className="small fw-bold text-muted mb-3 text-uppercase letter-spacing-1">Monthly Earnings</div>
                      {payrollConfig?.custom_earnings?.filter(e => e.is_active).map((earning, idx) => (
                        <Form.Group className="mb-2" key={earning.id}>
                          <Form.Label className="small fw-bold opacity-75">{earning.label}</Form.Label>
                          <Form.Control
                            type="number"
                            name={`salary_structure.custom_earnings.${earning.id}`}
                            value={values.salary_structure?.custom_earnings?.[earning.id] ?? 0}
                            onChange={(e) => setFieldValue(`salary_structure.custom_earnings.${earning.id}`, Number(e.target.value))}
                            size="sm"
                          />
                        </Form.Group>
                      ))}
                      {(!payrollConfig?.custom_earnings || payrollConfig.custom_earnings.filter(e => e.is_active).length === 0) && (
                        <div className="text-muted small">No active earning components defined.</div>
                      )}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="bg-light rounded-3 p-3 shadow-sm border border-faint">
                      <div className="small fw-bold text-muted mb-3 text-uppercase letter-spacing-1">Statutory Deductions</div>
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-bold opacity-75">PF (%)</Form.Label>
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
                        <Form.Label className="small fw-bold opacity-75">ESI (%)</Form.Label>
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
                        <Form.Label className="small fw-bold opacity-75">PT (Monthly)</Form.Label>
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

                      {payrollConfig?.custom_deductions?.filter(d => d.is_active).length > 0 && (
                        <>
                          <hr className="my-3 opacity-50" />
                          <div className="small fw-bold text-muted mb-3 text-uppercase letter-spacing-1">Custom Deductions</div>
                          {payrollConfig.custom_deductions.filter(d => d.is_active).map((deduction) => (
                            <Form.Group className="mb-2" key={deduction.id}>
                              <Form.Label className="small fw-bold opacity-75">{deduction.label}</Form.Label>
                              <Form.Control
                                type="number"
                                name={`salary_structure.custom_deductions.${deduction.id}`}
                                value={values.salary_structure?.custom_deductions?.[deduction.id] ?? 0}
                                onChange={(e) => setFieldValue(`salary_structure.custom_deductions.${deduction.id}`, Number(e.target.value))}
                                size="sm"
                              />
                            </Form.Group>
                          ))}
                        </>
                      )}
                    </div>
                  </Col>
                </Row>

                
                <hr className="my-4 opacity-50" />
                <h6 className="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
                  <CsLineIcons icon="calendar" size="18" />
                  Weekly Off Policy
                </h6>
                <div className="bg-light rounded-3 p-3 shadow-sm border border-faint mb-4">
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small fw-bold opacity-75">Select Policy</Form.Label>
                        <Select
                          classNamePrefix="react-select"
                          menuPortalTarget={document.body}
                          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                          name="weekly_off_policy"
                          options={[
                            { value: 'global', label: 'Global Company Policy (Use Settings)' },
                            { value: 'custom', label: 'Custom Employee Policy' }
                          ]}
                          value={values.weekly_off_policy ? { label: values.weekly_off_policy === 'custom' ? 'Custom Employee Policy' : 'Global Company Policy (Use Settings)', value: values.weekly_off_policy } : null}
                          onChange={(selected) => setFieldValue('weekly_off_policy', selected ? selected.value : 'global')}
                          onBlur={() => formik.setFieldTouched('weekly_off_policy', true)}
                        />
                      </Form.Group>
                    </Col>
                    
                    {values.weekly_off_policy === 'custom' && (
                      <Col md={12}>
                        <div className="d-flex justify-content-between align-items-center mb-2 mt-3">
                            <Form.Label className="small fw-bold opacity-75 mb-0">Custom Weekly Offs</Form.Label>
                            <Badge bg="primary" style={{ cursor: 'pointer' }} onClick={handleAddCustomWeeklyOff}>+ Add Day</Badge>
                        </div>
                        <div className="d-flex flex-column gap-3">
                            {values.custom_weekly_offs && values.custom_weekly_offs.map((woff, idx) => (
                                <div key={idx} className="p-3 border rounded-3 bg-white shadow-sm position-relative">
                                    {values.custom_weekly_offs.length > 1 && (
                                        <span 
                                            className="position-absolute top-0 end-0 p-2 text-danger" 
                                            style={{ cursor: 'pointer', zIndex: 10 }}
                                            onClick={() => handleRemoveCustomWeeklyOff(idx)}
                                        >
                                            <CsLineIcons icon="bin" size="15" />
                                        </span>
                                    )}
                                    <Row className="g-2">
                                        <Col md={6}>
                                            <Select
                                                classNamePrefix="react-select"
                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                options={[
                                                    { value: 'Sunday', label: 'Sunday' },
                                                    { value: 'Monday', label: 'Monday' },
                                                    { value: 'Tuesday', label: 'Tuesday' },
                                                    { value: 'Wednesday', label: 'Wednesday' },
                                                    { value: 'Thursday', label: 'Thursday' },
                                                    { value: 'Friday', label: 'Friday' },
                                                    { value: 'Saturday', label: 'Saturday' }
                                                ]}
                                                value={woff.day ? { value: woff.day, label: woff.day } : null}
                                                onChange={(selected) => handleUpdateCustomWeeklyOff(idx, 'day', selected.value)}
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Select
                                                classNamePrefix="react-select"
                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                options={[
                                                    { value: 'all_weeks', label: 'Every Week' },
                                                    { value: 'specific_weeks', label: 'Specific Weeks' }
                                                ]}
                                                value={woff.type ? { value: woff.type, label: woff.type === 'all_weeks' ? 'Every Week' : 'Specific Weeks' } : null}
                                                onChange={(selected) => handleUpdateCustomWeeklyOff(idx, 'type', selected.value)}
                                            />
                                        </Col>
                                    </Row>
                                    
                                    {woff.type === 'specific_weeks' && (
                                        <div className="mt-2">
                                            <div className="small text-muted mb-1">Select Weeks:</div>
                                            <div className="d-flex flex-wrap gap-2">
                                                {[1, 2, 3, 4, 5].map(w => (
                                                    <Badge
                                                        key={w}
                                                        bg={(woff.weeks || []).includes(w) ? 'primary' : 'light'}
                                                        text={(woff.weeks || []).includes(w) ? 'white' : 'dark'}
                                                        className="border cursor-pointer px-2 py-1"
                                                        onClick={() => toggleSpecificCustomWeek(idx, w)}
                                                    >
                                                        {w}{w === 1 ? 'st' : w === 2 ? 'nd' : w === 3 ? 'rd' : 'th'}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                      </Col>
                    )}
                  </Row>
                </div>

                <hr className="my-4 opacity-50" />
                <h6 className="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
                  <CsLineIcons icon="airplane" size="18" />
                  Leave Policy Configuration
                </h6>
                <div className="bg-light rounded-3 p-3 shadow-sm border border-faint mb-4">
                  {globalLeavePolicies.length === 0 ? (
                    <div className="text-muted small">No global leave policies configured.</div>
                  ) : (
                    <Row className="g-3">
                      {globalLeavePolicies.map((policy, idx) => {
                         const currentConfig = values.leave_policy_configuration?.find(c => c.leave_type_id === policy.leave_type_id);
                         const isChecked = currentConfig ? currentConfig.is_active : true;
                         return (
                           <Col md={4} key={policy.leave_type_id}>
                             <div className="d-flex justify-content-between align-items-center p-2 border rounded bg-white">
                               <div>
                                 <div className="fw-bold small">{policy.name}</div>
                                 <div className="text-muted" style={{ fontSize: '0.75rem' }}>{policy.days_per_year} Days / Year</div>
                               </div>
                               <Form.Check
                                 type="switch"
                                 id={`leave-switch-${policy.leave_type_id}`}
                                 checked={isChecked}
                                 onChange={(e) => {
                                    const newConfig = [...(values.leave_policy_configuration || [])];
                                    const index = newConfig.findIndex(c => c.leave_type_id === policy.leave_type_id);
                                    if (index >= 0) {
                                      newConfig[index].is_active = e.target.checked;
                                    } else {
                                      newConfig.push({ leave_type_id: policy.leave_type_id, is_active: e.target.checked });
                                    }
                                    setFieldValue('leave_policy_configuration', newConfig);
                                 }}
                               />
                             </div>
                           </Col>
                         );
                      })}
                    </Row>
                  )}
                </div>
                
                <hr className="my-4 opacity-50" />
                <h6 className="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
                  <CsLineIcons icon="trend-up" size="18" />
                  Upcoming Increment Plan
                </h6>
                <div className="bg-light rounded-3 p-3 shadow-sm border border-faint">
                  <Row className="g-3 align-items-end">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold opacity-75">Scheduled Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="increment_plan.scheduled_date"
                          value={values.increment_plan?.scheduled_date}
                          onChange={handleChange}
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold opacity-75">Increment Type</Form.Label>
                        <Select
                          classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                          name="increment_plan.type"
                          options={[
                            { value: 'percentage', label: 'Percentage (%)' },
                            { value: 'flat', label: 'Flat Amount (₹)' }
                          ]}
                          value={values.increment_plan?.type ? { label: values.increment_plan.type === 'percentage' ? 'Percentage (%)' : 'Flat Amount (₹)', value: values.increment_plan.type } : null}
                          onChange={(selected) => setFieldValue('increment_plan.type', selected ? selected.value : 'percentage')}
                          onBlur={() => formik.setFieldTouched('increment_plan.type', true)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold opacity-75">Increment Value</Form.Label>
                        <Form.Control
                          type="number"
                          name="increment_plan.value"
                          value={values.increment_plan?.value}
                          onChange={handleChange}
                          placeholder={values.increment_plan?.type === 'percentage' ? "e.g. 10" : "e.g. 5000"}
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  {values.increment_plan?.scheduled_date && values.increment_plan?.value > 0 && (
                    <div className="mt-3 p-2 bg-white border rounded small text-muted d-flex align-items-center gap-2">
                      <CsLineIcons icon="info-hexagon" size="14" className="text-info" />
                      <span>
                        An increment of <strong>{values.increment_plan.type === 'percentage' ? `${values.increment_plan.value}%` : `₹${values.increment_plan.value}`}</strong> is scheduled for <strong>{new Date(values.increment_plan.scheduled_date).toLocaleDateString()}</strong>.
                      </span>
                    </div>
                  )}
                </div>
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
                      onChange={(e) => handleFileChange('photo', e.target.files[0], setPhotoPreview, 1)}
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
                    {touched.photo && errors.photo && <div className="text-danger mt-2 small fw-bold">{errors.photo}</div>}
                    
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
                  <Select
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        name="document_type"
                        options={[
                          { value: 'Aadhar Card', label: 'Aadhar Card' },
                          { value: 'Pan Card', label: 'Pan Card' },
                          { value: 'National Identity Card', label: 'National Identity Card' },
                          { value: 'Driving License', label: 'Driving License' },
                          { value: 'Voter ID Card', label: 'Voter ID Card' },
                          { value: 'Passport', label: 'Passport' }
                        ]}
                        value={values.document_type ? { label: values.document_type, value: values.document_type } : null}
                        onChange={(selected) => {
                          setFieldValue('document_type', selected ? selected.value : '');
                          if (selected && selected.value !== 'National Identity Card' && selected.value !== 'Aadhar Card') {
                            setFieldValue('back_image', '');
                          }
                        }}
                        onBlur={() => formik.setFieldTouched('document_type', true)}
                        isDisabled={loading.submitting}
                        placeholder="Select Document"
                      />
                  {touched.document_type && errors.document_type && (
                    <div className="text-danger mt-1 small fw-bold">{errors.document_type}</div>
                  )}
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
                      onChange={(e) => handleFileChange('front_image', e.target.files[0], setFrontImagePreview, 1.58)}
                    />{' '}
                  <div className="d-flex flex-column gap-3 align-items-start w-100">
                    <Button
                      as="label"
                      htmlFor="front-image-upload"
                      className="custom-btn-outline px-4"
                      style={{ maxWidth: 'fit-content' }}
                      disabled={loading.submitting || uploadingFiles.front_image}
                    >
                      {uploadingFiles.front_image ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                      {frontImagePreview ? 'Change Front Image' : 'Upload Front Image'}
                    </Button>
                    {touched.front_image && errors.front_image && <div className="text-danger mt-1 small fw-bold">{errors.front_image}</div>}
                    
                    {values.document_type !== 'National Identity Card' && values.document_type !== 'Aadhar Card' && (
                      <Button
                        variant="primary"
                        type="submit"
                        className="custom-btn-outline w-100 py-3 mt-2"
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

                {(values.document_type === 'National Identity Card' || values.document_type === 'Aadhar Card') && (
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
                      onChange={(e) => handleFileChange('back_image', e.target.files[0], setBackImagePreview, 1.58)}
                    />
                    <div className="d-flex flex-column gap-3 align-items-start w-100">
                      <Button
                        as="label"
                        htmlFor="back-image-upload"
                        className="custom-btn-outline px-4"
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
                        className="custom-btn-outline w-100 py-3 mt-2"
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
          <Card className="glass-card border-0 p-5 shadow-lg text-center" style={{ maxWidth: '400px' }}>
            <Spinner animation="grow" variant="primary" className="mb-4" />
            <h4 className="fw-bold">Securing Records</h4>
            <p className="text-muted mb-0">Please wait while we encrypt and store the staff profile and documents.</p>
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

        <ImageCropperModal
          show={cropperState.show}
          onHide={() => setCropperState({ ...cropperState, show: false })}
          imageSrc={cropperState.imageSrc}
          onCropComplete={handleCropComplete}
          aspect={cropperState.aspect}
        />
    </div>
  </div>
);
};

export default AddStaff;