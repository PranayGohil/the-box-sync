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
  const [panImagePreview, setPanImagePreview] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [payingEntities, setPayingEntities] = useState([]);
  const [payrollConfig, setPayrollConfig] = useState(null);
  const [globalLeavePolicies, setGlobalLeavePolicies] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState({
    photo: false,
    front_image: false,
    back_image: false,
    pan_image: false,
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

  // States for adding custom components inline
  const [showAddEarningModal, setShowAddEarningModal] = useState(false);
  const [showAddDeductionModal, setShowAddDeductionModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');

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
    pan_number: Yup.string().required('PAN Number is required'),
    pincode: Yup.string()
      .required('Pincode is required')
      .matches(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits')
      .test('match-city', 'Pincode does not match the selected city', async function (value) {
        // eslint-disable-next-line react/no-this-in-sfc
        const { city, country } = this.parent;
        if (!value || value.length !== 6 || country !== 'India' || !city) return true;

        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
          const data = await response.json();
          if (data && data[0].Status === 'Success') {
            const postOffices = data[0].PostOffice;
            const cityLower = city.toLowerCase().replace(/[^a-z0-9]/g, '');
            return postOffices.some(po => {
              const district = (po.District || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              const block = (po.Block || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              const division = (po.Division || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              const name = (po.Name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              return (
                (district && district.includes(cityLower)) ||
                (block && block.includes(cityLower)) ||
                (division && division.includes(cityLower)) ||
                (name && name.includes(cityLower)) ||
                (district && cityLower.includes(district)) ||
                (name && cityLower.includes(name))
              );
            });
          }
          return false;
        } catch (e) {
          return true;
        }
      }),
    gender: Yup.string().required('Gender is required'),

    phone_no: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),

    email: Yup.string().required('Email is required').email('Enter a valid email address'),

    salary: Yup.number()
      .typeError('Salary must be a number')
      .positive('Must be positive')
      .nullable()
      .notRequired(),
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
      scheduled_date: Yup.string().nullable(),
      base: Yup.string().oneOf(['basic', 'gross', 'net']).nullable()
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

      salary: '',
      salary_calculation_base: 'working_days',
      attendance_method: 'any',
      weekly_off_policy: 'global',
      custom_weekly_offs: [{ day: 'Sunday', type: 'all_weeks', weeks: [] }],
      leave_policy_configuration: [],
      shift_id: '',
      position: '',
      branch_id: '',
      paying_entity_id: '',
      photo: '',
      document_type: '',
      id_number: '',
      front_image: '',
      back_image: '',
      pan_number: '',
      pan_image: '',
      uan_number: '',
      bank_account: {
        account_number: '',
        bank_name: '',
        ifsc_code: '',
        branch: '',
      },
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
        scheduled_date: '',
        base: 'basic'
      }
    },
    validationSchema: addStaff,
    onSubmit: async (values, { setSubmitting }) => {
      setLoading((prev) => ({ ...prev, submitting: true }));
      setFileUploadError(null);
      try {
        const formData = new FormData();

        Object.keys(values).forEach((key) => {
          if (key !== 'photo' && key !== 'front_image' && key !== 'back_image' && key !== 'pan_image') {
            if (['salary_structure', 'increment_plan', 'custom_weekly_offs', 'leave_policy_configuration', 'bank_account'].includes(key)) {
              formData.append(key, JSON.stringify(values[key]));
            } else {
              formData.append(key, values[key]);
            }
          }
        });

        if (values.photo) formData.append('photo', values.photo);
        if (values.front_image) formData.append('front_image', values.front_image);
        if (values.back_image) formData.append('back_image', values.back_image);
        if (values.pan_image) formData.append('pan_image', values.pan_image);
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

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

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
            const { x, y, width, height } = resized.detection.box;
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#23b3f4';
            ctx.strokeRect(x, y, width, height);
            ctx.font = 'bold 12px Inter, sans-serif';
            const labelText = 'FACE DETECTED';
            const textWidth = ctx.measureText(labelText).width;
            ctx.save();
            ctx.translate(x + (textWidth + 16) / 2, y - 15);
            ctx.scale(-1, 1);
            ctx.fillStyle = 'rgba(35, 179, 244, 0.85)';
            ctx.fillRect(-(textWidth + 16) / 2, -10, textWidth + 16, 20);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, -textWidth / 2, 4);
            ctx.restore();
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



  const base64ToFile = (base64String, filename) => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

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

        // Convert captured face to file and set to photo
        const capturedFile = base64ToFile(screenshot, 'photo.jpg');
        setFieldValue('photo', capturedFile);
        setPhotoPreview(screenshot);

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

  const grossSalary = Object.values(values.salary_structure?.custom_earnings || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const pfPercentage = Number(values.salary_structure?.deductions?.pf_percentage || 0);
  const esiPercentage = Number(values.salary_structure?.deductions?.esi_percentage || 0);
  const ptAmount = Number(values.salary_structure?.deductions?.pt || 0);
  const basicSalary = Number(values.salary_structure?.custom_earnings?.basic || 0);
  const statConfig = payrollConfig?.statutory_config || {};

  let pfDeduction = 0;
  if (statConfig?.pf?.is_mandatory) {
    const limit = statConfig.pf.salary_limit || 0;
    let pfBase = basicSalary;
    if (limit > 0 && pfBase > limit) pfBase = limit;
    pfDeduction = parseFloat((pfBase * (pfPercentage / 100)).toFixed(2));
  } else {
    pfDeduction = parseFloat((basicSalary * (pfPercentage / 100)).toFixed(2));
  }

  let esiDeduction = 0;
  if (statConfig?.esi?.is_mandatory) {
    const limit = statConfig.esi.gross_limit || 21000;
    if (grossSalary <= limit) {
      esiDeduction = parseFloat((grossSalary * (esiPercentage / 100)).toFixed(2));
    }
  } else {
    esiDeduction = parseFloat((grossSalary * (esiPercentage / 100)).toFixed(2));
  }

  const ptDeduction = ptAmount;
  const totalCustomDeductions = Object.values(values.salary_structure?.custom_deductions || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const totalDeductions = pfDeduction + esiDeduction + ptDeduction + totalCustomDeductions;
  const netSalary = grossSalary - totalDeductions;

  const safeGrossSalary = Number.isNaN(grossSalary) ? 0 : grossSalary;
  const safeTotalDeductions = Number.isNaN(totalDeductions) ? 0 : totalDeductions;
  const safeNetSalary = Number.isNaN(netSalary) ? 0 : netSalary;

  const activeEarnings = payrollConfig?.custom_earnings?.filter(e => e.is_active) || [];
  const hasEarnings = activeEarnings.length > 0;
  const activeCustomDeductions = payrollConfig?.custom_deductions?.filter(d => d.is_active) || [];
  const hasStatutoryDeductions = !!(statConfig?.pf?.is_mandatory ||
    statConfig?.esi?.is_mandatory ||
    statConfig?.pt?.is_applicable);
  const hasDeductions = activeCustomDeductions.length > 0 || hasStatutoryDeductions;
  const hasGlobalWeeklyOff = payrollConfig?.global_weekly_offs && payrollConfig.global_weekly_offs.length > 0;

  useEffect(() => {
    if (values.salary !== safeGrossSalary) {
      setFieldValue('salary', safeGrossSalary);
    }
  }, [safeGrossSalary, values.salary, setFieldValue]);

  useEffect(() => {
    if (payrollConfig && !hasGlobalWeeklyOff && values.weekly_off_policy === 'global') {
      setFieldValue('weekly_off_policy', 'custom');
    }
  }, [payrollConfig, hasGlobalWeeklyOff, values.weekly_off_policy, setFieldValue]);

  const isInitialBranchLoad = useRef(true);

  useEffect(() => {
    if (isInitialBranchLoad.current) {
      isInitialBranchLoad.current = false;
      return;
    }

    const fetchBranchLeavePolicy = async () => {
      try {
        const branchId = values.branch_id || '';
        const token = localStorage.getItem('token');
        const url = branchId
          ? `${process.env.REACT_APP_API}/leave-policy?branch_id=${branchId}`
          : `${process.env.REACT_APP_API}/leave-policy`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success) {
          setGlobalLeavePolicies(res.data.data.leave_types || []);

          const mapped = (res.data.data.leave_types || []).map(lt => ({
            leave_type_id: lt.leave_type_id,
            is_active: false
          }));
          setFieldValue('leave_policy_configuration', mapped);
        }
      } catch (err) {
        console.error('Failed to fetch leave policy for branch', err);
      }
    };

    const fetchBranchPayrollConfig = async () => {
      try {
        const branchId = values.branch_id || '';
        const token = localStorage.getItem('token');
        const url = branchId
          ? `${process.env.REACT_APP_API}/payroll-config?branch_id=${branchId}`
          : `${process.env.REACT_APP_API}/payroll-config`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success && res.data.data) {
          const configData = res.data.data;
          setPayrollConfig(configData);

          const activeConfigEarnings = (configData.custom_earnings || []).filter(e => e.is_active);
          const initialCustomEarnings = {};
          activeConfigEarnings.forEach(e => {
            initialCustomEarnings[e.id] = 0;
          });
          setFieldValue('salary_structure.custom_earnings', initialCustomEarnings);

          const activeDeductions = (configData.custom_deductions || []).filter(d => d.is_active);
          const initialCustomDeductions = {};
          activeDeductions.forEach(d => {
            initialCustomDeductions[d.id] = 0;
          });
          setFieldValue('salary_structure.custom_deductions', initialCustomDeductions);

          if (configData.statutory_config?.pf?.is_mandatory) {
            setFieldValue('salary_structure.deductions.pf_percentage', configData.statutory_config.pf.employee_percentage);
          } else {
            setFieldValue('salary_structure.deductions.pf_percentage', 0);
          }
          if (configData.statutory_config?.esi?.is_mandatory) {
            setFieldValue('salary_structure.deductions.esi_percentage', configData.statutory_config.esi.employee_percentage);
          } else {
            setFieldValue('salary_structure.deductions.esi_percentage', 0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch payroll config for branch', err);
      }
    };

    fetchBranchLeavePolicy();
    fetchBranchPayrollConfig();
  }, [values.branch_id, setFieldValue]);

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

        const [positionsRes, configRes, leavePolicyRes, nextIdRes, branchesRes, shiftsRes, payingEntitiesRes] = await Promise.all([
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
          }),
          axios.get(`${process.env.REACT_APP_API}/branch/all`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${process.env.REACT_APP_API}/shift/all`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${process.env.REACT_APP_API}/paying-entity/all`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          })
        ]);

        setPositions(positionsRes.data.data);
        if (payingEntitiesRes.data?.success) {
          const pEntities = payingEntitiesRes.data.data || [];
          setPayingEntities(pEntities);
          const defaultPe = pEntities.find(p => p.is_default);
          if (defaultPe) {
            setFieldValue('paying_entity_id', defaultPe._id);
          }
        }
        if (branchesRes.data?.success) {
          setBranches(branchesRes.data.data);
        }
        if (shiftsRes.data?.success) {
          setShifts(shiftsRes.data.data);
        }
        if (nextIdRes.data?.success) {
          formik.setFieldValue('staff_id', nextIdRes.data.data);
        }

        if (leavePolicyRes?.data?.success && leavePolicyRes?.data?.data?.leave_types) {
          setGlobalLeavePolicies(leavePolicyRes.data.data.leave_types);

          const mapped = leavePolicyRes.data.data.leave_types.map(lt => ({
            leave_type_id: lt.leave_type_id,
            is_active: false
          }));
          formik.setFieldValue('leave_policy_configuration', mapped);

        }

        if (configRes.data.success && configRes.data.data) {
          setPayrollConfig(configRes.data.data);

          // Pre-fill initial custom_earnings values
          const activeConfigEarnings = (configRes.data.data.custom_earnings || []).filter(e => e.is_active);
          const initialCustomEarnings = {};
          activeConfigEarnings.forEach(e => {
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

          // Pre-fill statutory deductions values from active config
          if (configRes.data.data.statutory_config?.pf?.is_mandatory) {
            formik.setFieldValue('salary_structure.deductions.pf_percentage', configRes.data.data.statutory_config.pf.employee_percentage);
          }
          if (configRes.data.data.statutory_config?.esi?.is_mandatory) {
            formik.setFieldValue('salary_structure.deductions.esi_percentage', configRes.data.data.statutory_config.esi.employee_percentage);
          }
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

  const handleAddCustomEarning = async () => {
    if (!newFieldName.trim()) return;
    const newId = newFieldName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    if (payrollConfig?.custom_earnings?.some(e => e.id === newId)) {
      toast.error('An earning component with this name already exists.');
      return;
    }

    try {
      const updatedEarnings = [...(payrollConfig?.custom_earnings || [])];
      updatedEarnings.push({ id: newId, label: newFieldName.trim(), is_active: true });

      const updatedConfig = { ...payrollConfig, custom_earnings: updatedEarnings };
      const response = await axios.put(`${process.env.REACT_APP_API}/payroll-config`, updatedConfig, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.data.success) {
        toast.success('Earning component added successfully.');
        setPayrollConfig(response.data.data);
        formik.setFieldValue(`salary_structure.custom_earnings.${newId}`, 0);
        setShowAddEarningModal(false);
        setNewFieldName('');
      } else {
        toast.error(response.data.message || 'Failed to add earning component.');
      }
    } catch (error) {
      console.error('Error adding earning component:', error);
      toast.error('Server error adding earning component.');
    }
  };

  const handleAddCustomDeduction = async () => {
    if (!newFieldName.trim()) return;
    const newId = newFieldName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    if (payrollConfig?.custom_deductions?.some(d => d.id === newId)) {
      toast.error('A deduction component with this name already exists.');
      return;
    }

    try {
      const updatedDeductions = [...(payrollConfig?.custom_deductions || [])];
      updatedDeductions.push({ id: newId, label: newFieldName.trim(), is_active: true });

      const updatedConfig = { ...payrollConfig, custom_deductions: updatedDeductions };
      const response = await axios.put(`${process.env.REACT_APP_API}/payroll-config`, updatedConfig, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.data.success) {
        toast.success('Deduction component added successfully.');
        setPayrollConfig(response.data.data);
        formik.setFieldValue(`salary_structure.custom_deductions.${newId}`, 0);
        setShowAddDeductionModal(false);
        setNewFieldName('');
      } else {
        toast.error(response.data.message || 'Failed to add deduction component.');
      }
    } catch (error) {
      console.error('Error adding deduction component:', error);
      toast.error('Server error adding deduction component.');
    }
  };

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
    if (fileInput) fileInput.value = '';
  };

  const handleCropComplete = async (croppedFile) => {
    const { fieldName, setPreview } = cropperState;
    setUploadingFiles((prev) => ({ ...prev, [fieldName]: true }));

    const previewUrl = URL.createObjectURL(croppedFile);
    setPreview(previewUrl);
    setFieldValue(fieldName, croppedFile);

    setUploadingFiles((prev) => ({ ...prev, [fieldName]: false }));
  };

  if (loading.initial) {
    return (
      <div className="container-fluid px-lg-4 px-xl-5 pb-5">
        <HtmlHead title={title} description={description} />
        <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
          <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
          <h5 className="fw-bold">Initializing Form...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-lg-4 px-xl-5 pb-5">
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4 mt-3 mt-lg-0">
        <Row className="g-3 align-items-center">
          <Col md={7}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
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
                  <div className="section-header mb-4">
                    <div className="d-flex align-items-center gap-2 mb-0">
                      <div className="bg-soft-primary p-2 rounded-3">
                        <CsLineIcons icon="user" size="20" className="text-primary" />
                      </div>
                      <h5 className="fw-bold mb-0">Personal Details</h5>
                    </div>
                  </div>

                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
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
                      <Form.Group>
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
                      <Form.Group>
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
                      <Form.Group>
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
                      <Form.Group>
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
                          />
                        </div>
                        {touched.birth_date && errors.birth_date && (
                          <div className="text-danger mt-1 small">{errors.birth_date}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
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
                          />
                        </div>
                        {touched.joining_date && errors.joining_date && (
                          <div className="text-danger mt-1 small">{errors.joining_date}</div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col xs={12}>
                      <Form.Group>
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
                      <Form.Group>
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
                      <Form.Group>
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
                      <Form.Group>
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
                      <Form.Group>
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
                          placeholder="Your Email ID"
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
                    <div className="d-flex align-items-center gap-2 mb-0">
                      <div className="bg-soft-primary p-2 rounded-3">
                        <CsLineIcons icon="suitcase" size="20" className="text-primary" />
                      </div>
                      <h5 className="fw-bold mb-0">Employment & Payroll</h5>
                    </div>
                  </div>

                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Group>
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
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Branch</Form.Label>
                        <Form.Select
                          name="branch_id"
                          value={values.branch_id}
                          onChange={handleChange}
                          isInvalid={touched.branch_id && errors.branch_id}
                          disabled={loading.submitting}
                          style={{ height: '38px', borderRadius: '8px' }}
                        >
                          <option value="">Select Branch</option>
                          {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>{branch.name}</option>
                          ))}
                        </Form.Select>
                        {touched.branch_id && errors.branch_id && <div className="text-danger mt-1 small fw-bold">{errors.branch_id}</div>}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Shift Timing</Form.Label>
                        <Form.Select
                          name="shift_id"
                          value={values.shift_id}
                          onChange={handleChange}
                          isInvalid={touched.shift_id && errors.shift_id}
                          disabled={loading.submitting}
                          style={{ height: '38px', borderRadius: '8px' }}
                        >
                          <option value="">Select Shift</option>
                          {shifts.map(shift => (
                            <option key={shift._id} value={shift._id}>{shift.name} ({shift.start_time} - {shift.end_time})</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Paying Company Account</Form.Label>
                        <Form.Select
                          name="paying_entity_id"
                          value={values.paying_entity_id}
                          onChange={handleChange}
                          disabled={loading.submitting}
                          style={{ height: '38px', borderRadius: '8px' }}
                        >
                          <option value="">Default Company Account</option>
                          {payingEntities.map(pe => (
                            <option key={pe._id} value={pe._id}>{pe.company_name} {pe.bank_name ? `(${pe.bank_name})` : ''}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
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
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Work Location</Form.Label>
                        <div className="d-flex gap-2">
                          <div
                            className={`flex-fill text-center py-2 px-3 rounded-3 border fw-semibold small ${values.attendance_method !== 'wfh' ? 'bg-primary text-white border-primary' : 'bg-light text-muted border-secondary'}`}
                            style={{ cursor: loading.submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                            onClick={() => { if (!loading.submitting) setFieldValue('attendance_method', 'any'); }}
                          >
                            Office
                          </div>
                          <div
                            className={`flex-fill text-center py-2 px-3 rounded-3 border fw-semibold small ${values.attendance_method === 'wfh' ? 'bg-primary text-white border-primary' : 'bg-light text-muted border-secondary'}`}
                            style={{ cursor: loading.submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                            onClick={() => { if (!loading.submitting) setFieldValue('attendance_method', 'wfh'); }}
                          >
                            Work From Home
                          </div>
                        </div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                          {values.attendance_method === 'wfh'
                            ? 'Permanently remote — no WFH leave required each day'
                            : 'Must submit & get WFH leave approved to work remotely'}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  {(hasEarnings || hasDeductions) && (
                    <>
                      <hr className="my-4 opacity-50" />

                      <h6 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                        <CsLineIcons icon="money" size="18" />
                        Salary Structure Breakdown
                      </h6>
                      <Row className="g-3">
                        {hasEarnings && (
                          <Col md={hasDeductions ? 6 : 12}>
                            <div className="bg-light rounded-3 p-3 shadow-sm border border-faint h-100">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="small fw-bold text-muted text-uppercase letter-spacing-1">Monthly Earnings</div>
                                <Button
                                  variant="none"
                                  size="sm"
                                  className="text-primary p-0 d-flex align-items-center gap-1 hover-scale"
                                  onClick={() => {
                                    setNewFieldName('');
                                    setShowAddEarningModal(true);
                                  }}
                                >
                                  <CsLineIcons icon="plus" size="14" /> Add Field
                                </Button>
                              </div>
                              {payrollConfig?.custom_earnings?.filter(e => e.is_active).map((earning, idx) => (
                                <Form.Group className="mb-2" key={earning.id}>
                                  <Form.Label className="small fw-bold opacity-75">{earning.label}</Form.Label>
                                  <Form.Control
                                    type="number"
                                    name={`salary_structure.custom_earnings.${earning.id}`}
                                    value={values.salary_structure?.custom_earnings?.[earning.id] ?? ''}
                                    onChange={(e) => setFieldValue(`salary_structure.custom_earnings.${earning.id}`, e.target.value === '' ? '' : Number(e.target.value))}
                                    onFocus={() => {
                                      if (values.salary_structure?.custom_earnings?.[earning.id] === 0) {
                                        setFieldValue(`salary_structure.custom_earnings.${earning.id}`, '');
                                      }
                                    }}
                                    size="sm"
                                  />
                                </Form.Group>
                              ))}
                              {(!payrollConfig?.custom_earnings || payrollConfig.custom_earnings.filter(e => e.is_active).length === 0) && (
                                <div className="text-muted small">No active earning components defined.</div>
                              )}
                            </div>
                          </Col>
                        )}
                        {hasDeductions && (
                          <Col md={hasEarnings ? 6 : 12}>
                            <div className="bg-light rounded-3 p-3 shadow-sm border border-faint h-100">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="small fw-bold text-muted text-uppercase letter-spacing-1">Deductions</div>
                                <Button
                                  variant="none"
                                  size="sm"
                                  className="text-primary p-0 d-flex align-items-center gap-1 hover-scale"
                                  onClick={() => {
                                    setNewFieldName('');
                                    setShowAddDeductionModal(true);
                                  }}
                                >
                                  <CsLineIcons icon="plus" size="14" /> Add Field
                                </Button>
                              </div>

                              {payrollConfig?.statutory_config?.pf?.is_mandatory && (
                                <Form.Group className="mb-2">
                                  <Form.Label className="small fw-bold opacity-75">PF (%)</Form.Label>
                                  <Form.Control
                                    type="number"
                                    name="salary_structure.deductions.pf_percentage"
                                    value={values.salary_structure?.deductions?.pf_percentage ?? ''}
                                    onChange={(e) => setFieldValue('salary_structure.deductions.pf_percentage', e.target.value === '' ? '' : Number(e.target.value))}
                                    onFocus={() => {
                                      if (values.salary_structure?.deductions?.pf_percentage === 0) {
                                        setFieldValue('salary_structure.deductions.pf_percentage', '');
                                      }
                                    }}
                                    isInvalid={touched.salary_structure?.deductions?.pf_percentage && !!errors.salary_structure?.deductions?.pf_percentage}
                                    size="sm"
                                  />
                                  {touched.salary_structure?.deductions?.pf_percentage && errors.salary_structure?.deductions?.pf_percentage && (
                                    <div className="text-danger mt-1 small fw-bold">{errors.salary_structure.deductions.pf_percentage}</div>
                                  )}
                                </Form.Group>
                              )}

                              {payrollConfig?.statutory_config?.esi?.is_mandatory && (
                                <Form.Group className="mb-2">
                                  <Form.Label className="small fw-bold opacity-75">ESI (%)</Form.Label>
                                  <Form.Control
                                    type="number"
                                    name="salary_structure.deductions.esi_percentage"
                                    value={values.salary_structure?.deductions?.esi_percentage ?? ''}
                                    onChange={(e) => setFieldValue('salary_structure.deductions.esi_percentage', e.target.value === '' ? '' : Number(e.target.value))}
                                    onFocus={() => {
                                      if (values.salary_structure?.deductions?.esi_percentage === 0) {
                                        setFieldValue('salary_structure.deductions.esi_percentage', '');
                                      }
                                    }}
                                    isInvalid={touched.salary_structure?.deductions?.esi_percentage && !!errors.salary_structure?.deductions?.esi_percentage}
                                    size="sm"
                                  />
                                  {touched.salary_structure?.deductions?.esi_percentage && errors.salary_structure?.deductions?.esi_percentage && (
                                    <div className="text-danger mt-1 small fw-bold">{errors.salary_structure.deductions.esi_percentage}</div>
                                  )}
                                </Form.Group>
                              )}

                              {payrollConfig?.statutory_config?.pt?.is_applicable && (
                                <Form.Group className="mb-2">
                                  <Form.Label className="small fw-bold opacity-75">PT (Monthly)</Form.Label>
                                  <Form.Control
                                    type="number"
                                    name="salary_structure.deductions.pt"
                                    value={values.salary_structure?.deductions?.pt ?? ''}
                                    onChange={(e) => setFieldValue('salary_structure.deductions.pt', e.target.value === '' ? '' : Number(e.target.value))}
                                    onFocus={() => {
                                      if (values.salary_structure?.deductions?.pt === 0) {
                                        setFieldValue('salary_structure.deductions.pt', '');
                                      }
                                    }}
                                    isInvalid={touched.salary_structure?.deductions?.pt && !!errors.salary_structure?.deductions?.pt}
                                    size="sm"
                                  />
                                  {touched.salary_structure?.deductions?.pt && errors.salary_structure?.deductions?.pt && (
                                    <div className="text-danger mt-1 small fw-bold">{errors.salary_structure.deductions.pt}</div>
                                  )}
                                </Form.Group>
                              )}

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
                                        value={values.salary_structure?.custom_deductions?.[deduction.id] ?? ''}
                                        onChange={(e) => setFieldValue(`salary_structure.custom_deductions.${deduction.id}`, e.target.value === '' ? '' : Number(e.target.value))}
                                        onFocus={() => {
                                          if (values.salary_structure?.custom_deductions?.[deduction.id] === 0) {
                                            setFieldValue(`salary_structure.custom_deductions.${deduction.id}`, '');
                                          }
                                        }}
                                        size="sm"
                                      />
                                    </Form.Group>
                                  ))}
                                </>
                              )}

                              {(!payrollConfig?.statutory_config?.pf?.is_mandatory &&
                                !payrollConfig?.statutory_config?.esi?.is_mandatory &&
                                !payrollConfig?.statutory_config?.pt?.is_applicable &&
                                (!payrollConfig?.custom_deductions || payrollConfig.custom_deductions.filter(d => d.is_active).length === 0)) && (
                                  <div className="text-muted small">No active deduction components defined.</div>
                                )}
                            </div>
                          </Col>
                        )}
                      </Row>

                      <div className="bg-light rounded-3 p-3 shadow-sm border border-faint mt-4">
                        <Row className="g-3 align-items-center">
                          <Col md={4} className="text-center text-md-start">
                            <div className="small fw-bold text-muted text-uppercase mb-1">Total Salary (Gross)</div>
                            <h4 className="fw-bold text-success mb-0">₹ {safeGrossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                          </Col>
                          <Col md={4} className="text-center text-md-start border-start border-faint">
                            <div className="small fw-bold text-muted text-uppercase mb-1">Total Deductions</div>
                            <h4 className="fw-bold text-danger mb-0">₹ {safeTotalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                          </Col>
                          <Col md={4} className="text-center text-md-start border-start border-faint">
                            <div className="small fw-bold text-muted text-uppercase mb-1">Net Salary</div>
                            <h4 className="fw-bold text-primary mb-0">₹ {safeNetSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                          </Col>
                        </Row>
                      </div>
                    </>
                  )}

                  <hr className="my-4 opacity-50" />
                  <h6 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
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
                            options={hasGlobalWeeklyOff ? [
                              { value: 'global', label: 'Global Company Policy (Use Settings)' },
                              { value: 'custom', label: 'Custom Employee Policy' }
                            ] : [
                              { value: 'custom', label: 'Custom Employee Policy' }
                            ]}
                            value={values.weekly_off_policy ? { label: values.weekly_off_policy === 'custom' ? 'Custom Employee Policy' : 'Global Company Policy (Use Settings)', value: values.weekly_off_policy } : null}
                            onChange={(selected) => setFieldValue('weekly_off_policy', selected ? selected.value : 'custom')}
                            onBlur={() => formik.setFieldTouched('weekly_off_policy', true)}
                          />
                          {values.weekly_off_policy === 'global' && (
                            <div className="mt-2 text-muted small fw-medium ms-1">
                              Active Policy: <span className="text-primary fw-bold">{(() => {
                                const branch = branches.find(b => b._id === values.branch_id);
                                const branchName = branch ? `${branch.name} Branch` : 'Global / All Branches';
                                const weekOffsStr = (payrollConfig?.global_weekly_offs || [])
                                  .map(wo => `${wo.day}${wo.type === 'specific_weeks' ? ` (Weeks: ${wo.weeks.join(', ')})` : ''}`)
                                  .join(', ') || 'None';
                                return `${branchName} - ${weekOffsStr}`;
                              })()}</span>
                            </div>
                          )}
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
                  {globalLeavePolicies && globalLeavePolicies.length > 0 && (
                    <>
                      <h6 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                        <CsLineIcons icon="calendar" size="18" />
                        Leave Policy Configuration
                      </h6>
                      <div className="bg-light rounded-3 p-3 shadow-sm border border-faint mb-4">
                        <Row className="g-3">
                          {globalLeavePolicies.map((policy, idx) => {
                            const currentConfig = values.leave_policy_configuration?.find(c => c.leave_type_id === policy.leave_type_id);
                            const isChecked = currentConfig ? currentConfig.is_active : false;
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
                      </div>
                      <hr className="my-4 opacity-50" />
                    </>
                  )}
                  <h6 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                    <CsLineIcons icon="trend-up" size="18" />
                    Upcoming Increment Plan
                  </h6>
                  <div className="bg-light rounded-3 p-3 shadow-sm border border-faint">
                    <Row className="g-3 align-items-end">
                      <Col md={3}>
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
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Increment Base</Form.Label>
                          <Select
                            classNamePrefix="react-select"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            name="increment_plan.base"
                            options={[
                              { value: 'basic', label: `Basic Salary (₹${basicSalary})` },
                              { value: 'gross', label: `Gross Salary (₹${safeGrossSalary})` },
                              { value: 'net', label: `Net Salary (₹${safeNetSalary})` }
                            ]}
                            value={values.increment_plan?.base ? {
                              value: values.increment_plan.base,
                              label: values.increment_plan.base === 'basic' ? `Basic Salary (₹${basicSalary})` :
                                values.increment_plan.base === 'gross' ? `Gross Salary (₹${safeGrossSalary})` :
                                  `Net Salary (₹${safeNetSalary})`
                            } : { value: 'basic', label: `Basic Salary (₹${basicSalary})` }}
                            onChange={(selected) => setFieldValue('increment_plan.base', selected ? selected.value : 'basic')}
                            onBlur={() => formik.setFieldTouched('increment_plan.base', true)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
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
                      <Col md={3}>
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
                      <div className="mt-3 p-3 bg-white border rounded small text-muted">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <CsLineIcons icon="info-hexagon" size="18" className="text-info" />
                          <span className="fw-bold text-info">Increment Projection</span>
                        </div>
                        {(() => {
                          const val = Number(values.increment_plan.value) || 0;
                          const type = values.increment_plan.type || 'percentage';
                          const base = values.increment_plan.base || 'basic';

                          let baseAmount = 0;
                          let baseLabel = '';
                          if (base === 'basic') {
                            baseAmount = basicSalary;
                            baseLabel = 'Basic Salary';
                          } else if (base === 'gross') {
                            baseAmount = safeGrossSalary;
                            baseLabel = 'Gross Salary';
                          } else if (base === 'net') {
                            baseAmount = safeNetSalary;
                            baseLabel = 'Net Salary';
                          }

                          const incrementAmt = type === 'percentage' ? (baseAmount * val) / 100 : val;
                          const newBaseAmount = baseAmount + incrementAmt;

                          return (
                            <div className="fw-medium">
                              <div>An increment of <strong>{type === 'percentage' ? `${val}%` : `₹${val}`}</strong> calculated on <strong>{baseLabel} (₹{baseAmount.toLocaleString('en-IN')})</strong>.</div>
                              <div className="mt-2 pt-2 border-top">
                                Calculated Increment Amount: <strong className="text-success fs-6">₹{incrementAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                              </div>
                              <div className="mt-1">
                                Projected New {baseLabel}: <strong className="text-primary fs-6">₹{newBaseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                              </div>
                              <div className="mt-2 text-uppercase text-muted" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                                Scheduled execution date: <strong>{new Date(values.increment_plan.scheduled_date).toLocaleDateString()}</strong>
                              </div>
                            </div>
                          );
                        })()}
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
                  <div className="section-header text-start mb-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="camera" size="20" className="text-primary" />
                      Profile Photo
                    </h5>
                  </div>

                  <div className="d-flex flex-column align-items-center">
                    <div className="preview-container mb-3 shadow-sm border-2">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="preview-image" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        <CsLineIcons icon="user" size="40" className="text-muted opacity-20" />
                      )}
                    </div>

                    <Form.Group className="w-100">
                      <div className="text-center">
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
                      {touched.photo && errors.photo && <div className="text-danger mt-2 small fw-bold">{errors.photo}</div>}
                    </Form.Group>
                  </div>
                </Card.Body>
              </Card>

              {/* Account & Compliance Section */}
              <Card className="glass-card border-0 mb-4">
                <Card.Body className="p-4">
                  <div className="section-header mb-4">
                    <div className="d-flex align-items-center gap-2 mb-0">
                      <div className="bg-soft-primary p-2 rounded-3">
                        <CsLineIcons icon="wallet" size="20" className="text-primary" />
                      </div>
                      <h5 className="fw-bold mb-0">Bank & Compliance Details</h5>
                    </div>
                  </div>

                  <Row className="g-4 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Account Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="bank_account.account_number"
                          placeholder="Enter Account Number"
                          value={values.bank_account.account_number}
                          onChange={handleChange}
                          disabled={loading.submitting}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>IFSC Code</Form.Label>
                        <Form.Control
                          type="text"
                          name="bank_account.ifsc_code"
                          placeholder="Enter IFSC Code"
                          value={values.bank_account.ifsc_code}
                          onChange={handleChange}
                          disabled={loading.submitting}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Bank Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="bank_account.bank_name"
                          placeholder="Enter Bank Name"
                          value={values.bank_account.bank_name}
                          onChange={handleChange}
                          disabled={loading.submitting}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Branch</Form.Label>
                        <Form.Control
                          type="text"
                          name="bank_account.branch"
                          placeholder="Enter Branch Name"
                          value={values.bank_account.branch}
                          onChange={handleChange}
                          disabled={loading.submitting}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>PF / UAN Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="uan_number"
                          placeholder="Enter PF or UAN Number"
                          value={values.uan_number}
                          onChange={handleChange}
                          disabled={loading.submitting}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Documents Section */}
              <Card className="glass-card border-0 mb-4">
                <Card.Body className="p-4">
                  <div className="section-header mb-4">
                    <div className="d-flex align-items-center gap-2 mb-0">
                      <div className="bg-soft-primary p-2 rounded-3">
                        <CsLineIcons icon="shield" size="20" className="text-primary" />
                      </div>
                      <h5 className="fw-bold mb-0">Identification</h5>
                    </div>
                  </div>

                  <div className="bg-light rounded p-3 mb-4 border border-faint">
                    <h6 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                      <CsLineIcons icon="credit-card" size="18" />
                      PAN Card Details (Required)
                    </h6>
                    <Form.Group className="mb-4">
                      <Form.Label>PAN Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="pan_number"
                        placeholder="Enter PAN Number"
                        value={values.pan_number}
                        onChange={handleChange}
                        isInvalid={touched.pan_number && errors.pan_number}
                        disabled={loading.submitting}
                      />
                      <Form.Control.Feedback type="invalid">{errors.pan_number}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-0">
                      <Form.Label>PAN Card Image</Form.Label>
                      <div className="id-preview-container mb-2" style={{ border: '2px dashed #ddd', borderRadius: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f9f9f9', minHeight: '150px' }}>
                        {panImagePreview ? (
                          <img src={panImagePreview} alt="PAN Card" className="preview-image" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                        ) : (
                          <div className="text-center p-4">
                            <CsLineIcons icon="file-image" size="32" className="text-muted mb-2" />
                            <div className="small text-muted">No Image Selected</div>
                          </div>
                        )}
                      </div>
                      <Form.Control
                        type="file"
                        id="pan-image-upload"
                        className="d-none"
                        accept="image/*"
                        onChange={(e) => handleFileChange('pan_image', e.target.files[0], setPanImagePreview, 1.58)}
                      />
                      <div className="d-flex flex-column gap-3 align-items-start w-100">
                        <Button
                          as="label"
                          htmlFor="pan-image-upload"
                          className="custom-btn-outline px-4"
                          style={{ maxWidth: 'fit-content' }}
                          disabled={loading.submitting || uploadingFiles.pan_image}
                        >
                          {uploadingFiles.pan_image ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" />}
                          {panImagePreview ? 'Change PAN Image' : 'Upload PAN Image'}
                        </Button>
                      </div>
                    </Form.Group>
                  </div>

                  <div className="bg-light rounded p-3 mb-4 border border-faint">
                    <h6 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                      <CsLineIcons icon="file-text" size="18" />
                      Additional Identification (Required)
                    </h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Document Type</Form.Label>
                      <Select
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        name="document_type"
                        options={[
                          { value: 'Aadhar Card', label: 'Aadhar Card' },
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
                      <div className="id-preview-container mb-2" style={{ border: '2px dashed #ddd', borderRadius: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f9f9f9', minHeight: '150px' }}>
                        {frontImagePreview ? (
                          <img src={frontImagePreview} alt="Front" className="preview-image" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
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

                      </div>
                    </Form.Group>

                    {(values.document_type === 'National Identity Card' || values.document_type === 'Aadhar Card') && (
                      <Form.Group className="mb-4">
                        <Form.Label>Back Image</Form.Label>
                        <div className="id-preview-container mb-2" style={{ border: '2px dashed #ddd', borderRadius: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f9f9f9', minHeight: '150px' }}>
                          {backImagePreview ? (
                            <img src={backImagePreview} alt="Back" className="preview-image" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
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
                        </div>
                      </Form.Group>
                    )}

                    <div className="d-flex justify-content-center mt-4 pt-3 border-top" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <Button
                        variant="primary"
                        type="submit"
                        className="custom-btn-outline px-5 py-3 w-100"
                        disabled={loading.submitting || uploadingFiles.photo || uploadingFiles.front_image || uploadingFiles.back_image || uploadingFiles.pan_image}
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
                  </div>
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
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">AI Face Capture Terminal</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column align-items-center pt-2">
            <style>{`
              .modal-webcam-container {
                position: relative;
                width: 100%;
                max-width: 640px;
                aspect-ratio: 16/9;
                margin: 0 auto;
                background: #0f172a;
                border-radius: 1.25rem;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 0 0 4px rgba(35, 179, 244, 0.2);
                border: 3px solid #e2e8f0;
              }
            `}</style>

            {loading.faceModels ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <h5>Loading Face Detection...</h5>
                <p className="text-muted">Please wait while we initialize the camera</p>
              </div>
            ) : (
              <>
                <p className="text-muted text-center mb-4 small" style={{ maxWidth: '500px' }}>
                  Position yourself in the center of the frame. Once the AI system successfully locks onto your face and displays <span className="text-success fw-bold">FACE DETECTED</span>, press the button below to capture.
                </p>

                <div className="modal-webcam-container">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored={true}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      facingMode: 'user',
                      aspectRatio: 16 / 9
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 1,
                    }}
                  />

                  <canvas
                    id="faceCanvas"
                    width={640}
                    height={360}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 5,
                      pointerEvents: 'none',
                      transform: 'scaleX(-1)',
                    }}
                  />
                </div>

                <div className="mt-4 mb-2 text-center">
                  <Button
                    variant={faceBox ? "primary" : "outline-secondary"}
                    className="custom-btn-outline px-5 py-2.5 d-flex align-items-center gap-2"
                    disabled={!faceBox || isCapturing}
                    onClick={handleFaceCapture}
                    style={{ borderRadius: '50px' }}
                  >
                    {isCapturing ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <CsLineIcons icon="camera" size="18" />
                        Capture & Enroll
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="link" className="text-muted text-decoration-none" onClick={() => setShowFaceModal(false)} disabled={isCapturing}>
              Cancel
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

        {/* Modal for adding custom earning field inline */}
        <Modal show={showAddEarningModal} onHide={() => setShowAddEarningModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Add Custom Earning Field</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Earning Name (e.g. Travel Allowance)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter name"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomEarning()}
                className="form-control-premium"
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="none" className="custom-btn-primary-outline text-nowrap rounded" size="sm" onClick={() => setShowAddEarningModal(false)}>Cancel</Button>
            <Button variant="primary" className="rounded" size="sm" onClick={handleAddCustomEarning}>Add Earning</Button>
          </Modal.Footer>
        </Modal>

        {/* Modal for adding custom deduction field inline */}
        <Modal show={showAddDeductionModal} onHide={() => setShowAddDeductionModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Add Custom Deduction Field</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Deduction Name (e.g. Welfare Fund)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter name"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomDeduction()}
                className="form-control-premium"
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="none" className="custom-btn-primary-outline text-nowrap rounded" size="sm" onClick={() => setShowAddDeductionModal(false)}>Cancel</Button>
            <Button variant="primary" className="rounded" size="sm" onClick={handleAddCustomDeduction}>Add Deduction</Button>
          </Modal.Footer>
        </Modal>
    </div>
  );
};

export default AddStaff;