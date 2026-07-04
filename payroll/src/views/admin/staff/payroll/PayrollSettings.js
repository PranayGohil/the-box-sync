import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Spinner, Badge, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import Select from 'react-select';
import { getPayrollConfig, updatePayrollConfig } from 'api/payrollConfig';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactQuill from 'react-quill';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'react-quill/dist/quill.snow.css';

const WEEK_DAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

const INDIAN_STATES = [
    { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
    { value: 'Assam', label: 'Assam' },
    { value: 'Bihar', label: 'Bihar' },
    { value: 'Chhattisgarh', label: 'Chhattisgarh' },
    { value: 'Goa', label: 'Goa' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Haryana', label: 'Haryana' },
    { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
    { value: 'Jharkhand', label: 'Jharkhand' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Kerala', label: 'Kerala' },
    { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Manipur', label: 'Manipur' },
    { value: 'Meghalaya', label: 'Meghalaya' },
    { value: 'Mizoram', label: 'Mizoram' },
    { value: 'Nagaland', label: 'Nagaland' },
    { value: 'Odisha', label: 'Odisha' },
    { value: 'Punjab', label: 'Punjab' },
    { value: 'Rajasthan', label: 'Rajasthan' },
    { value: 'Sikkim', label: 'Sikkim' },
    { value: 'Tamil Nadu', label: 'Tamil Nadu' },
    { value: 'Telangana', label: 'Telangana' },
    { value: 'Tripura', label: 'Tripura' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
    { value: 'Uttarakhand', label: 'Uttarakhand' },
    { value: 'West Bengal', label: 'West Bengal' }
];

const PREDEFINED_PT_SLABS = {
    'Andhra Pradesh': [
        { min_salary: 0, max_salary: 15000, amount: 0 },
        { min_salary: 15001, max_salary: 20000, amount: 150 },
        { min_salary: 20001, max_salary: 9999999, amount: 200 }
    ],
    'Arunachal Pradesh': [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
    'Assam': [
        { min_salary: 0, max_salary: 10000, amount: 0 },
        { min_salary: 10001, max_salary: 15000, amount: 150 },
        { min_salary: 15001, max_salary: 25000, amount: 180 },
        { min_salary: 25001, max_salary: 9999999, amount: 208 }
    ],
    'Bihar': [
        { min_salary: 0, max_salary: 25000, amount: 0 },
        { min_salary: 25001, max_salary: 9999999, amount: 208 }
    ],
    'Chhattisgarh': [
        { min_salary: 0, max_salary: 18000, amount: 0 },
        { min_salary: 18001, max_salary: 9999999, amount: 208 }
    ],
    'Goa': [
        { min_salary: 0, max_salary: 5000, amount: 0 },
        { min_salary: 5001, max_salary: 9999999, amount: 200 }
    ],
    'Gujarat': [
        { min_salary: 0, max_salary: 11999, amount: 0 },
        { min_salary: 12000, max_salary: 9999999, amount: 200 }
    ],
    'Haryana': [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
    'Himachal Pradesh': [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
    'Jharkhand': [
        { min_salary: 0, max_salary: 25000, amount: 0 },
        { min_salary: 25001, max_salary: 9999999, amount: 208 }
    ],
    'Karnataka': [
        { min_salary: 0, max_salary: 14999, amount: 0 },
        { min_salary: 15000, max_salary: 9999999, amount: 200 }
    ],
    'Kerala': [
        { min_salary: 0, max_salary: 11999, amount: 0 },
        { min_salary: 12000, max_salary: 9999999, amount: 208 }
    ],
    'Madhya Pradesh': [
        { min_salary: 0, max_salary: 18750, amount: 0 },
        { min_salary: 18751, max_salary: 25000, amount: 125 },
        { min_salary: 25001, max_salary: 33333, amount: 167 },
        { min_salary: 33334, max_salary: 9999999, amount: 212 }
    ],
    'Maharashtra': [
        { min_salary: 0, max_salary: 7500, amount: 0 },
        { min_salary: 7501, max_salary: 10000, amount: 175 },
        { min_salary: 10001, max_salary: 9999999, amount: 200 }
    ],
    'Manipur': [
        { min_salary: 0, max_salary: 4999, amount: 0 },
        { min_salary: 5000, max_salary: 7000, amount: 100 },
        { min_salary: 7001, max_salary: 9999999, amount: 208 }
    ],
    'Meghalaya': [
        { min_salary: 0, max_salary: 4166, amount: 0 },
        { min_salary: 4167, max_salary: 9999999, amount: 208 }
    ],
    'Mizoram': [
        { min_salary: 0, max_salary: 4999, amount: 0 },
        { min_salary: 5000, max_salary: 9999999, amount: 208 }
    ],
    'Nagaland': [
        { min_salary: 0, max_salary: 3999, amount: 0 },
        { min_salary: 4000, max_salary: 9999999, amount: 208 }
    ],
    'Odisha': [
        { min_salary: 0, max_salary: 13333, amount: 0 },
        { min_salary: 13334, max_salary: 25000, amount: 125 },
        { min_salary: 25001, max_salary: 9999999, amount: 200 }
    ],
    'Punjab': [
        { min_salary: 0, max_salary: 9999999, amount: 200 }
    ],
    'Rajasthan': [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
    'Sikkim': [
        { min_salary: 0, max_salary: 19999, amount: 0 },
        { min_salary: 20000, max_salary: 29999, amount: 125 },
        { min_salary: 30000, max_salary: 39999, amount: 150 },
        { min_salary: 40000, max_salary: 9999999, amount: 200 }
    ],
    'Tamil Nadu': [
        { min_salary: 0, max_salary: 3500, amount: 0 },
        { min_salary: 3501, max_salary: 5000, amount: 22 },
        { min_salary: 5001, max_salary: 7500, amount: 52 },
        { min_salary: 7501, max_salary: 10000, amount: 115 },
        { min_salary: 10001, max_salary: 12500, amount: 171 },
        { min_salary: 12501, max_salary: 9999999, amount: 208 }
    ],
    'Telangana': [
        { min_salary: 0, max_salary: 15000, amount: 0 },
        { min_salary: 15001, max_salary: 20000, amount: 150 },
        { min_salary: 20001, max_salary: 9999999, amount: 200 }
    ],
    'Tripura': [
        { min_salary: 0, max_salary: 7499, amount: 0 },
        { min_salary: 7500, max_salary: 9999999, amount: 208 }
    ],
    'Uttar Pradesh': [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
    'Uttarakhand': [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
    'West Bengal': [
        { min_salary: 0, max_salary: 10000, amount: 0 },
        { min_salary: 10001, max_salary: 15000, amount: 110 },
        { min_salary: 15001, max_salary: 25000, amount: 130 },
        { min_salary: 25001, max_salary: 40000, amount: 150 },
        { min_salary: 40001, max_salary: 9999999, amount: 200 }
    ]
};

const PayrollSettings = () => {
    const title = 'Payroll Global Settings';
    const description = 'Configure statutory deductions, active earnings, and organizational rules.';
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'staff/view', text: 'Staff' },
        { to: 'payroll/settings', title: 'Settings' }
    ];

    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);

    // States for Attendance / Wi-Fi IP restrictions
    const [adminPublicIp, setAdminPublicIp] = useState('');
    const [localAllowedIps, setLocalAllowedIps] = useState('');

    const [newEarningLabel, setNewEarningLabel] = useState('');
    const [newDeductionLabel, setNewDeductionLabel] = useState('');

    const [expandEPF, setExpandEPF] = useState(false);
    const [expandESI, setExpandESI] = useState(false);
    const [expandPT, setExpandPT] = useState(false);

    const [config, setConfig] = useState({
        custom_earnings: [],
        custom_deductions: [],
        global_weekly_offs: [{ day: 'Sunday', type: 'all_weeks', weeks: [] }],
        statutory_config: {
            pf: { is_mandatory: false, employee_percentage: 12, employer_percentage: 12, salary_limit: 15000, auto_calculate: true },
            esi: { is_mandatory: false, employee_percentage: 0.75, employer_percentage: 3.25, gross_limit: 21000, auto_calculate: true },
            pt: { is_applicable: false, state: '', slabs: [] }
        },
        org_rules: {
            leave_year_start: 'january',
            weekly_off_days: [0],
            half_day_hours: 4,
            full_day_hours: 8,
            lunch_start_time: '01:00 PM',
            lunch_end_time: '02:00 PM',
            notice_period_days: 30,
            shift_start_time: '09:00 AM',
            late_threshold_minutes: 0,
            shift_end_time: '06:00 PM'
        },
        network_restrictions: {
            is_enabled: false,
            allowed_ips: []
        },
        wfh_config: {
            min_interval: 3,
            max_interval: 15,
            idle_threshold: 5
        },
        document_templates: {
            joining_letter_pdf: null,
            joining_letter_template: ""
        }
    });

    const defaultJoiningLetter = `<p><strong>Subject: Offer of Employment</strong></p><p><br></p><p>Dear [First Name],</p><p><br></p><p>We are thrilled to offer you the position of <strong>[Job Title]</strong> with our company. Your expected joining date is <strong>[Date of Joining]</strong>. Your starting basic salary will be <strong>[Basic Salary]</strong>.</p><p><br></p><p>Your Staff ID is: <strong>[Staff ID]</strong></p><p><br></p><p>Welcome to the team!</p><p><br></p><p>Sincerely,</p><p>Management</p>`;

    const quillRef = useRef(null);

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['clean']
        ],
    };

    const handleTemplateChange = (content) => {
        setConfig(prev => ({
            ...prev,
            document_templates: {
                ...prev.document_templates,
                joining_letter_template: content
            }
        }));
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are supported.');
            return;
        }

        try {
            setUploadingPdf(true);
            const formData = new FormData();
            formData.append('pdf_template', file);

            const res = await axios.post(`${process.env.REACT_APP_API}/upload/uploadtemplate`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (res.data.success) {
                setConfig(prev => ({
                    ...prev,
                    document_templates: {
                        ...prev.document_templates,
                        joining_letter_pdf: res.data.filepath
                    }
                }));
                setIsDirty(true);
                toast.success('PDF Template uploaded successfully! Remember to save settings.');
            }
        } catch (err) {
            console.error('Error uploading PDF template:', err);
            toast.error('Failed to upload PDF template.');
        } finally {
            setUploadingPdf(false);
        }
    };

    const insertVariable = (variableName) => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            const cursorPosition = editor.getSelection()?.index || editor.getLength();
            editor.insertText(cursorPosition, `[${variableName}]`);
            editor.setSelection(cursorPosition + variableName.length + 2);
        }
    };

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const res = await getPayrollConfig();
            if (res.success && res.data) {
                const statutory = res.data.statutory_config || {};
                if (statutory.pf?.is_mandatory) setExpandEPF(true);
                if (statutory.esi?.is_mandatory) setExpandESI(true);
                if (statutory.pt?.is_applicable) setExpandPT(true);

                // Merge with defaults to prevent undefined errors
                const fetchedConfig = {
                    custom_earnings: res.data.custom_earnings || [],
                    custom_deductions: res.data.custom_deductions || [],
                    global_weekly_offs: res.data.global_weekly_offs && res.data.global_weekly_offs.length > 0 ? res.data.global_weekly_offs : [{ day: 'Sunday', type: 'all_weeks', weeks: [] }],
                    statutory_config: {
                        pf: { ...config.statutory_config.pf, ...(res.data.statutory_config?.pf || {}) },
                        esi: { ...config.statutory_config.esi, ...(res.data.statutory_config?.esi || {}) },
                        pt: { ...config.statutory_config.pt, ...(res.data.statutory_config?.pt || {}) },
                    },
                    org_rules: { ...config.org_rules, ...(res.data.org_rules || {}) },
                    network_restrictions: {
                        is_enabled: res.data.network_restrictions?.is_enabled || false,
                        allowed_ips: res.data.network_restrictions?.allowed_ips || []
                    },
                    wfh_config: {
                        min_interval: res.data.wfh_config?.min_interval || 3,
                        max_interval: res.data.wfh_config?.max_interval || 15,
                        idle_threshold: res.data.wfh_config?.idle_threshold || 5
                    },
                    document_templates: {
                        joining_letter_pdf: res.data.document_templates?.joining_letter_pdf || null,
                        joining_letter_template: res.data.document_templates?.joining_letter_template || defaultJoiningLetter
                    }
                };
                setConfig(fetchedConfig);
                setOriginalConfig(JSON.parse(JSON.stringify(fetchedConfig)));
                setLocalAllowedIps((res.data.network_restrictions?.allowed_ips || []).join(', '));
                setIsDirty(false);
            }
        } catch (err) {
            toast.error("Failed to load payroll configuration");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfig(); }, []);

    // Fetch admin's current IP as seen by our backend
    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API}/kiosk/me`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        .then(res => {
            if (res.data && res.data.client_ip) {
                setAdminPublicIp(res.data.client_ip);
            }
        })
        .catch(err => console.error('Failed to get backend IP', err));
    }, []);

    // Time conversion helpers
    const convertTo24HourInput = (time12) => {
        if (!time12) return '';
        const parts = time12.split(' ');
        if (parts.length !== 2) return '';
        const [time, period] = parts;
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        else if (period === 'AM' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const convertFromTimeInput = (time24) => {
        if (!time24) return '';
        const [hoursStr, minutesStr] = time24.split(':');
        let hours = parseInt(hoursStr, 10);
        const minutes = minutesStr;
        const period = hours >= 12 ? 'PM' : 'AM';
        hours %= 12;
        hours = hours || 12;
        return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
    };

    const updateNetwork = (field, val) => {
        setConfig(prev => ({
            ...prev,
            network_restrictions: {
                ...prev.network_restrictions,
                [field]: val
            }
        }));
    };

    const updateWfh = (field, val) => {
        setConfig(prev => ({
            ...prev,
            wfh_config: {
                ...prev.wfh_config,
                [field]: val
            }
        }));
    };

    const handleAllowedIpsChange = (value) => {
        setLocalAllowedIps(value);
        const parsedIps = value.split(',').map(ip => ip.trim()).filter(ip => ip !== '');
        setConfig(prev => ({
            ...prev,
            network_restrictions: {
                ...prev.network_restrictions,
                allowed_ips: parsedIps
            }
        }));
    };

    const addCurrentIp = () => {
        if (!adminPublicIp) return;
        const currentIps = [...(config.network_restrictions?.allowed_ips || [])];
        if (!currentIps.includes(adminPublicIp)) {
            currentIps.push(adminPublicIp);
            handleAllowedIpsChange(currentIps.join(', '));
        }
    };

    useEffect(() => {
        if (!originalConfig) return;
        const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);
        setIsDirty(hasChanges);
    }, [config, originalConfig]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await updatePayrollConfig(config);
            if (res.success) {
                toast.success('Settings updated successfully');
                setOriginalConfig(JSON.parse(JSON.stringify(config)));
                setIsDirty(false);
            } else {
                toast.error(res.message || 'Failed to update settings');
            }
        } catch (err) {
            toast.error('Server error updating settings');
        } finally {
            setSaving(false);
        }
    };

    const discardChanges = () => {
        if (originalConfig) {
            setConfig(JSON.parse(JSON.stringify(originalConfig)));
            setLocalAllowedIps((originalConfig.network_restrictions?.allowed_ips || []).join(', '));
            setIsDirty(false);
            toast.info('Changes discarded');
        }
    };

    
    const handleAddGlobalWeeklyOff = () => {
        setConfig(prev => ({
            ...prev,
            global_weekly_offs: [...prev.global_weekly_offs, { day: 'Saturday', type: 'all_weeks', weeks: [] }]
        }));
    };

    const handleRemoveGlobalWeeklyOff = (index) => {
        const current = [...config.global_weekly_offs];
        current.splice(index, 1);
        setConfig(prev => ({ ...prev, global_weekly_offs: current }));
    };

    const handleUpdateGlobalWeeklyOff = (index, field, value) => {
        const current = [...config.global_weekly_offs];
        current[index][field] = value;
        setConfig(prev => ({ ...prev, global_weekly_offs: current }));
    };

    const toggleSpecificWeek = (index, weekNum) => {
        const current = [...config.global_weekly_offs];
        const weeks = [...current[index].weeks];
        if (weeks.includes(weekNum)) {
            current[index].weeks = weeks.filter(w => w !== weekNum);
        } else {
            current[index].weeks.push(weekNum);
        }
        setConfig(prev => ({ ...prev, global_weekly_offs: current }));
    };

    // ── Update Handlers ─────────────────────────────────────────────────────────

    const toggleEarning = (idx) => {
        const current = [...config.custom_earnings];
        current[idx].is_active = !current[idx].is_active;
        setConfig({ ...config, custom_earnings: current });
    };

    const addCustomEarning = () => {
        if (!newEarningLabel.trim()) return;
        const newId = newEarningLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const current = [...config.custom_earnings];
        
        // Prevent duplicate IDs
        if (current.some(e => e.id === newId)) {
            toast.error("An earning component with this name already exists");
            return;
        }

        current.push({ id: newId, label: newEarningLabel.trim(), is_active: true });
        setConfig({ ...config, custom_earnings: current });
        setNewEarningLabel('');
    };

    const deleteCustomEarning = (idx) => {
        const current = [...config.custom_earnings];
        current.splice(idx, 1);
        setConfig({ ...config, custom_earnings: current });
    };

    const toggleDeduction = (idx) => {
        const current = [...config.custom_deductions];
        current[idx].is_active = !current[idx].is_active;
        setConfig({ ...config, custom_deductions: current });
    };

    const addCustomDeduction = () => {
        if (!newDeductionLabel.trim()) return;
        const newId = newDeductionLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const current = [...config.custom_deductions];
        
        // Prevent duplicate IDs
        if (current.some(e => e.id === newId)) {
            toast.error("A deduction component with this name already exists");
            return;
        }

        current.push({ id: newId, label: newDeductionLabel.trim(), is_active: true });
        setConfig({ ...config, custom_deductions: current });
        setNewDeductionLabel('');
    };

    const deleteCustomDeduction = (idx) => {
        const current = [...config.custom_deductions];
        current.splice(idx, 1);
        setConfig({ ...config, custom_deductions: current });
    };

    const toggleWeekDay = (dayValue) => {
        const current = [...config.org_rules.weekly_off_days];
        const idx = current.indexOf(dayValue);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(dayValue);
        setConfig({ ...config, org_rules: { ...config.org_rules, weekly_off_days: current } });
    };

    const updatePF = (key, value) => {
        setConfig(prev => ({
            ...prev, statutory_config: {
                ...prev.statutory_config, pf: { ...prev.statutory_config.pf, [key]: value }
            }
        }));
    };

    const updateESI = (key, value) => {
        setConfig(prev => ({
            ...prev, statutory_config: {
                ...prev.statutory_config, esi: { ...prev.statutory_config.esi, [key]: value }
            }
        }));
    };

    const updatePT = (key, value) => {
        setConfig(prev => ({
            ...prev, statutory_config: {
                ...prev.statutory_config, pt: { ...prev.statutory_config.pt, [key]: value }
            }
        }));
    };

    const handleStateChange = (selected) => {
        const stateName = selected ? selected.value : '';
        const defaultSlabs = PREDEFINED_PT_SLABS[stateName] || [];
        
        setConfig(prev => ({
            ...prev, statutory_config: {
                ...prev.statutory_config, pt: { 
                    ...prev.statutory_config.pt, 
                    state: stateName,
                    slabs: defaultSlabs.length > 0 ? defaultSlabs : prev.statutory_config.pt.slabs
                }
            }
        }));
    };

    const updateOrg = (key, value) => {
        setConfig(prev => ({
            ...prev, org_rules: { ...prev.org_rules, [key]: value }
        }));
    };

    const addPTSlab = () => {
        const slabs = [...config.statutory_config.pt.slabs, { min_salary: 0, max_salary: 0, amount: 0 }];
        updatePT('slabs', slabs);
    };

    const removePTSlab = (idx) => {
        const slabs = [...config.statutory_config.pt.slabs];
        slabs.splice(idx, 1);
        updatePT('slabs', slabs);
    };

    const updateSlab = (idx, field, val) => {
        const slabs = [...config.statutory_config.pt.slabs];
        slabs[idx][field] = Number(val) || 0;
        updatePT('slabs', slabs);
    };


    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;

    const customStyles = `
      .custom-btn-primary-outline {
        border: 1px solid #1ea8e7 !important;
        color: #1ea8e7 !important;
        background-color: #ffffff !important;
        transition: all 0.2s ease-in-out !important;
        font-weight: 600 !important;
      }
      .custom-btn-primary-outline:hover {
        background-color: #1ea8e7 !important;
        color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
        transform: translateY(-2px);
      }
      .custom-btn-primary-outline:hover svg {
        stroke: #ffffff !important;
        color: #ffffff !important;
      }
      .custom-btn-primary-outline:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }
      .react-select-premium {
        font-weight: 600 !important;
      }
      .react-select-premium .react-select__control {
        border-radius: 10px !important;
        border: 1px solid #dee2e6 !important;
        background-color: #ffffff !important;
        height: 40px !important;
        min-height: 40px !important;
        cursor: pointer !important;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out !important;
        box-shadow: none !important;
      }
      .react-select-premium .react-select__control:hover {
        border-color: #cbd5e1 !important;
      }
      .react-select-premium .react-select__control--is-focused,
      .react-select-premium .react-select__control--menu-is-open {
        border-color: #1ea8e7 !important;
        box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.1) !important;
      }
      .react-select-premium .react-select__single-value {
        color: #334155 !important;
        font-size: 0.9rem !important;
        padding-left: 0.25rem !important;
      }
      .react-select-premium .react-select__placeholder {
        color: #94a3b8 !important;
        font-size: 0.9rem !important;
        padding-left: 0.25rem !important;
      }
      .react-select-premium .react-select__indicator-separator {
        display: none !important;
      }
      .react-select-premium .react-select__dropdown-indicator {
        color: #94a3b8 !important;
        padding-right: 0.75rem !important;
        transition: color 0.15s ease !important;
      }
      .react-select-premium .react-select__dropdown-indicator:hover {
        color: #64748b !important;
      }
      .react-select-premium .react-select__menu {
        border-radius: 10px !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
        border: 1px solid #1ea8e7 !important;
        overflow: hidden !important;
        z-index: 9999 !important;
        margin-top: 5px !important;
        background-color: #ffffff !important;
      }
      .react-select-premium .react-select__menu-list {
        padding: 4px !important;
      }
      .react-select-premium .react-select__option {
        font-size: 0.9rem !important;
        font-weight: 600 !important;
        color: #475569 !important;
        padding: 0.5rem 0.75rem !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        background-color: transparent !important;
      }
      .react-select-premium .react-select__option--is-focused {
        background-color: #f1f5f9 !important;
        color: #1ea8e7 !important;
      }
      .react-select-premium .react-select__option--is-selected {
        background-color: #f1f5f9 !important;
        color: #1ea8e7 !important;
      }
      .custom-table-glass {
        border-collapse: separate !important;
        border-spacing: 0 0.5rem !important;
      }
      .custom-table-glass thead th {
        border-bottom: none !important;
        background: transparent !important;
        font-size: 0.72rem !important;
        color: #64748b !important;
        letter-spacing: 0.05em;
        padding: 0.9rem 1.5rem;
      }
      .custom-table-glass tbody tr {
        background: #ffffff !important;
        box-shadow: 0 4px 10px rgba(0,0,0,0.03) !important;
        transition: all 0.2s ease;
      }
      .custom-table-glass tbody tr:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(0,0,0,0.05) !important;
      }
      .custom-table-glass tbody td {
        border-top: 1px solid #edf2f7 !important;
        border-bottom: 1px solid #edf2f7 !important;
        padding: 1rem 1.5rem !important;
        vertical-align: middle !important;
        background: transparent !important;
      }
      .custom-table-glass tbody td:first-child {
        border-left: 1px solid #edf2f7 !important;
        border-top-left-radius: 12px !important;
        border-bottom-left-radius: 12px !important;
      }
      .custom-table-glass tbody td:last-child {
        border-right: 1px solid #edf2f7 !important;
        border-top-right-radius: 12px !important;
        border-bottom-right-radius: 12px !important;
      }
      .hover-scale {
        transition: transform 0.2s ease;
      }
      .hover-scale:hover {
        transform: scale(1.15);
      }
      .glass-card {
        background: #ffffff !important;
        border: 1px solid #edf2f7 !important;
        border-radius: 1.5rem !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .glass-card:hover {
        box-shadow: 0 15px 40px rgba(30, 168, 231, 0.08) !important;
        border-color: rgba(30, 168, 231, 0.2) !important;
      }
      /* Custom Form Controls inputs */
      .form-control-premium {
        border-radius: 10px !important;
        border: 1px solid #dee2e6 !important;
        box-shadow: none !important;
        padding: 0.6rem 1rem !important;
        transition: all 0.2s ease !important;
      }
      .form-control-premium:focus {
        border-color: #1ea8e7 !important;
        box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.1) !important;
      }

      .settings-floating-bar {
        position: fixed !important;
        bottom: 24px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 1050 !important;
        width: 90% !important;
        max-width: 600px !important;
        background: rgba(255, 255, 255, 0.95) !important;
        backdrop-filter: blur(10px) !important;
        border-radius: 50px !important;
        border: 1px solid rgba(226, 232, 240, 0.8) !important;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
        animation: settingsSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
      }
      @keyframes settingsSlideUp {
        from {
          bottom: -80px;
          opacity: 0;
        }
        to {
          bottom: 24px;
          opacity: 1;
        }
      }

      @media (max-width: 575.98px) {
        .settings-floating-bar {
          bottom: 0 !important;
          left: 0 !important;
          transform: none !important;
          width: 100% !important;
          max-width: 100% !important;
          border-radius: 0 !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: none !important;
          padding: 0.75rem 1rem !important;
          flex-direction: column !important;
          gap: 10px !important;
          align-items: center !important;
          text-align: center !important;
          animation: settingsSlideUpMobile 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
        }
        .settings-floating-bar .d-flex {
          width: 100% !important;
        }
        .settings-floating-bar button {
          flex: 1 !important;
          text-align: center !important;
        }
        @keyframes settingsSlideUpMobile {
          from {
            bottom: -120px;
            opacity: 0;
          }
          to {
            bottom: 0;
            opacity: 1;
          }
        }
      }
    `;

    return (
        <div className="container-fluid pb-5">
            <style>{customStyles}</style>
            <HtmlHead title={title} description={description} />
            {/* Header Title & Controls aligned beautifully in one row */}
            <div className="page-title-container mb-4 mt-3 mt-lg-0">
                <Row className="g-3 align-items-center">
                    <Col xs="12" md="6">
                        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
                            {title}
                        </h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    
                    <Col xs="12" md="6" className="d-flex flex-wrap justify-content-md-end align-items-center gap-3">
                        <Button variant="none" onClick={() => history.go(-1)} className="btn-icon btn-icon-start custom-btn-primary-outline rounded-pill shadow-sm" style={{ height: '40px' }}>
                            <CsLineIcons icon="arrow-left" size="18" /> <span>Back</span>
                        </Button>
                        <Button variant="none" onClick={handleSave} disabled={saving} className="btn-icon btn-icon-start custom-btn-primary-outline rounded-pill shadow-sm" style={{ height: '40px' }}>
                            {saving ? <Spinner size="sm" animation="border" /> : <CsLineIcons icon="save" size="18" />} <span>Save Settings</span>
                        </Button>
                    </Col>
                </Row>
            </div>

            <Row className="g-4 mb-5">
                {/* ── Organizational Rules ── */}
                <Col xs="12">
                    <Card className="h-100 glass-card">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4 text-primary">Organizational Rules</h5>
                            <Row className="g-4">
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Leave Cycle Start Month</Form.Label>
                                        <Select
                                            options={[
                                                { value: 'january', label: 'January (Jan - Dec)' },
                                                { value: 'april', label: 'April (Apr - Mar)' }
                                            ]}
                                            value={[{ value: 'january', label: 'January (Jan - Dec)' }, { value: 'april', label: 'April (Apr - Mar)' }].find(opt => opt.value === config.org_rules.leave_year_start)}
                                            onChange={(selected) => updateOrg('leave_year_start', selected ? selected.value : 'january')}
                                            classNamePrefix="react-select"
                                            className="react-select-premium shadow-sm"
                                            isSearchable={false}
                                        />
                                        <Form.Text className="text-muted ms-1">Common in India: April</Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Weekly Off Days</Form.Label>
                                        <div className="d-flex flex-wrap gap-2 mt-1">
                                            {WEEK_DAYS.map(day => (
                                                <Badge 
                                                    key={day.value}
                                                    bg={config.org_rules.weekly_off_days.includes(day.value) ? 'primary' : 'light'}
                                                    text={config.org_rules.weekly_off_days.includes(day.value) ? 'white' : 'dark'}
                                                    className="cursor-pointer border py-2 px-3 shadow-sm"
                                                    style={{ borderRadius: '8px', transition: 'all 0.2s' }}
                                                    onClick={() => toggleWeekDay(day.value)}
                                                >
                                                    {day.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Full Day Hours</Form.Label>
                                        <Form.Control type="number" value={config.org_rules.full_day_hours} onChange={e => updateOrg('full_day_hours', Number(e.target.value))} className="form-control-premium shadow-sm" />
                                    </Form.Group>
                                </Col>
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Half Day Hours</Form.Label>
                                        <Form.Control type="number" value={config.org_rules.half_day_hours} onChange={e => updateOrg('half_day_hours', Number(e.target.value))} className="form-control-premium shadow-sm" />
                                    </Form.Group>
                                </Col>
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Lunch Start Time</Form.Label>
                                        <Form.Control type="text" value={config.org_rules.lunch_start_time || ''} onChange={e => updateOrg('lunch_start_time', e.target.value)} placeholder="e.g. 01:00 PM" className="form-control-premium shadow-sm" />
                                    </Form.Group>
                                </Col>
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Lunch End Time</Form.Label>
                                        <Form.Control type="text" value={config.org_rules.lunch_end_time || ''} onChange={e => updateOrg('lunch_end_time', e.target.value)} placeholder="e.g. 02:00 PM" className="form-control-premium shadow-sm" />
                                    </Form.Group>
                                </Col>
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Notice Period (Days)</Form.Label>
                                        <Form.Control type="number" value={config.org_rules.notice_period_days || 30} onChange={e => updateOrg('notice_period_days', Number(e.target.value))} className="form-control-premium shadow-sm" />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ── Attendance Settings & Shift Management ── */}
                <Col xs="12">
                    <Card className="h-100 glass-card">
                        <Card.Body className="p-4">
                            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
                                <h5 className="fw-bold mb-0 text-primary">Attendance Settings & Shifts</h5>
                                <Button 
                                    variant="none" 
                                    className="btn-icon btn-icon-start custom-btn-primary-outline rounded-pill shadow-sm w-100 w-sm-auto"
                                    onClick={() => history.push('/payroll/roster')}
                                    style={{ height: '40px' }}
                                >
                                    <CsLineIcons icon="calendar" size="18" /> <span>Shift Management</span>
                                </Button>
                            </div>
                            
                            <h6 className="fw-bold mb-1 text-dark">Shift & Timing Rules</h6>
                            <p className="text-muted small mb-3">
                                Configure the official shift start/end times and the late arrival grace period. These values are used to automatically flag late check-ins and overtime check-outs.
                            </p>
                            <Row className="g-4 mb-4">
                                <Col md="4">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Shift Start Time</Form.Label>
                                        <Form.Control 
                                            type="time" 
                                            value={convertTo24HourInput(config.org_rules.shift_start_time)} 
                                            onChange={e => updateOrg('shift_start_time', convertFromTimeInput(e.target.value))} 
                                            className="form-control-premium shadow-sm" 
                                        />
                                        <Form.Text className="text-muted ms-1">Official shift start (e.g. 09:00 AM)</Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md="4">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Late Grace Period (Minutes)</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            min={0}
                                            max={120}
                                            value={config.org_rules.late_threshold_minutes} 
                                            onChange={e => updateOrg('late_threshold_minutes', Number(e.target.value))} 
                                            className="form-control-premium shadow-sm" 
                                        />
                                        <Form.Text className="text-muted ms-1">0 = no grace, 15 = 15-min allowance</Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md="4">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Shift End Time</Form.Label>
                                        <Form.Control 
                                            type="time" 
                                            value={convertTo24HourInput(config.org_rules.shift_end_time)} 
                                            onChange={e => updateOrg('shift_end_time', convertFromTimeInput(e.target.value))} 
                                            className="form-control-premium shadow-sm" 
                                        />
                                        <Form.Text className="text-muted ms-1">Check-out after this = overtime</Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <hr className="my-4 opacity-50" />

                            <h6 className="fw-bold mb-1 text-dark">Network Restrictions (Office Wi-Fi)</h6>
                            <p className="text-muted small mb-3">
                                Restrict check-in and check-out to specific networks by entering their public IP addresses.
                            </p>
                            <Row className="g-4 mb-4">
                                <Col md="4" className="d-flex align-items-center">
                                    <Form.Check 
                                        type="switch"
                                        id="network-restrict-switch"
                                        label={<span className="fw-semibold text-dark small ms-2">Enable IP Restrictions</span>}
                                        checked={config.network_restrictions.is_enabled}
                                        onChange={e => updateNetwork('is_enabled', e.target.checked)}
                                        className="mt-2"
                                    />
                                </Col>
                                <Col md="8">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Allowed Public IP Addresses (Comma separated)</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="e.g. 192.168.1.1, 203.0.113.5"
                                            value={localAllowedIps} 
                                            onChange={e => handleAllowedIpsChange(e.target.value)} 
                                            className="form-control-premium shadow-sm" 
                                            disabled={!config.network_restrictions.is_enabled}
                                        />
                                        {adminPublicIp && (
                                            <div className="mt-2 d-flex align-items-center gap-2">
                                                <span className="text-muted small">Your current IP is: <strong>{adminPublicIp}</strong></span>
                                                <Button 
                                                    variant="link" 
                                                    className="p-0 text-decoration-none small" 
                                                    style={{ fontSize: '0.75rem' }}
                                                    disabled={!config.network_restrictions.is_enabled}
                                                    onClick={addCurrentIp}
                                                >
                                                    + Add Current IP
                                                </Button>
                                            </div>
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>

                            <hr className="my-4 opacity-50" />

                            <h6 className="fw-bold mb-1 text-dark">Work From Home (WFH) Tracking Settings</h6>
                            <p className="text-muted small mb-3">
                                Configure the random snapshot intervals and idle time threshold for employees working from home.
                            </p>
                            <Row className="g-4">
                                <Col md="4">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Min Interval (Minutes)</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            min="1"
                                            value={config.wfh_config.min_interval} 
                                            onChange={e => updateWfh('min_interval', Number(e.target.value))} 
                                            className="form-control-premium shadow-sm" 
                                        />
                                        <Form.Text className="text-muted ms-1">Minimum time between random snapshots.</Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md="4">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Max Interval (Minutes)</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            min="1"
                                            value={config.wfh_config.max_interval} 
                                            onChange={e => updateWfh('max_interval', Number(e.target.value))} 
                                            className="form-control-premium shadow-sm" 
                                        />
                                        <Form.Text className="text-muted ms-1">Maximum time between random snapshots.</Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md="4">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Idle Threshold (Minutes)</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            min="1"
                                            value={config.wfh_config.idle_threshold} 
                                            onChange={e => updateWfh('idle_threshold', Number(e.target.value))} 
                                            className="form-control-premium shadow-sm" 
                                        />
                                        <Form.Text className="text-muted ms-1">Time before system marks employee as idle.</Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ── Active Earnings ── */}
                <Col xs="12" xl="6">
                    <Card className="h-100 glass-card">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0 text-primary">Active Earnings Components</h5>
                            </div>
                            <p className="text-muted mb-4 small fw-medium">Select which earning components are actively used. Unchecking these will hide them from Staff creation forms.</p>
                            
                            <Form.Group className="mb-4 d-flex gap-2">
                                <Form.Control 
                                    type="text" 
                                    placeholder="Enter custom earning name (e.g. Bonus)" 
                                    className="form-control-premium shadow-sm"
                                    value={newEarningLabel}
                                    onChange={(e) => setNewEarningLabel(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addCustomEarning()}
                                />
                                <Button variant="none" className="custom-btn-primary-outline text-nowrap rounded" onClick={addCustomEarning}>
                                    <CsLineIcons icon="plus" size="18" className="me-1" /> Add
                                </Button>
                            </Form.Group>

                            <div className="d-flex flex-column gap-3">
                                {config.custom_earnings.map((opt, idx) => (
                                    <div key={opt.id} className="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
                                        <Form.Check
                                            type="switch"
                                            id={`switch-${opt.id}`}
                                            label={<span className="fw-bold ms-1 text-dark">{opt.label}</span>}
                                            checked={opt.is_active}
                                            onChange={() => toggleEarning(idx)}
                                            className="mb-0"
                                        />
                                        <Button variant="none" size="sm" className="text-danger p-0 m-0 hover-scale" onClick={() => deleteCustomEarning(idx)}>
                                            <CsLineIcons icon="bin" size="18" />
                                        </Button>
                                    </div>
                                ))}
                                {config.custom_earnings.length === 0 && (
                                    <div className="text-center text-muted small p-3">No earning components defined</div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ── Deductions Components ── */}
                <Col xs="12" xl="6">
                    <Card className="h-100 glass-card">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0 text-primary">Deductions Components</h5>
                            </div>
                            <p className="text-muted mb-4 small fw-medium">Configure active statutory deductions like Provident Fund (EPF), Employee State Insurance (ESI), and Professional Tax (PT), or define custom deductions.</p>

                            <Form.Group className="mb-4 d-flex gap-2">
                                <Form.Control 
                                    type="text" 
                                    placeholder="Enter custom deduction name (e.g. Loans)" 
                                    className="form-control-premium shadow-sm"
                                    value={newDeductionLabel}
                                    onChange={(e) => setNewDeductionLabel(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addCustomDeduction()}
                                />
                                <Button variant="none" className="custom-btn-primary-outline text-nowrap rounded" onClick={addCustomDeduction}>
                                    <CsLineIcons icon="plus" size="18" className="me-1" /> Add
                                </Button>
                            </Form.Group>

                            <div className="d-flex flex-column gap-3">
                                {/* EPF Component */}
                                <div className="p-3 border rounded bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Form.Check
                                            type="switch"
                                            id="switch-epf"
                                            label={<span className="fw-bold ms-1 text-dark">Provident Fund (EPF)</span>}
                                            checked={config.statutory_config.pf.is_mandatory}
                                            onChange={e => {
                                                updatePF('is_mandatory', e.target.checked);
                                                if (e.target.checked) setExpandEPF(true);
                                            }}
                                            className="mb-0"
                                        />
                                        {config.statutory_config.pf.is_mandatory && (
                                            <Button variant="none" size="sm" className="text-primary p-0 m-0 hover-scale" onClick={() => setExpandEPF(!expandEPF)}>
                                                <CsLineIcons icon={expandEPF ? "chevron-up" : "gear"} size="18" />
                                            </Button>
                                        )}
                                    </div>

                                    {config.statutory_config.pf.is_mandatory && expandEPF && (
                                        <div className="mt-3 pt-3 border-top">
                                            <Row className="g-3">
                                                <Col md="4">
                                                    <Form.Group>
                                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Employee Contribution (%)</Form.Label>
                                                        <Form.Control type="number" step="0.01" value={config.statutory_config.pf.employee_percentage} onChange={e => updatePF('employee_percentage', Number(e.target.value))} className="form-control-premium shadow-sm" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md="4">
                                                    <Form.Group>
                                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Employer Contribution (%)</Form.Label>
                                                        <Form.Control type="number" step="0.01" value={config.statutory_config.pf.employer_percentage} onChange={e => updatePF('employer_percentage', Number(e.target.value))} className="form-control-premium shadow-sm" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md="4">
                                                    <Form.Group>
                                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Basic Salary Limit (₹)</Form.Label>
                                                        <Form.Control type="number" value={config.statutory_config.pf.salary_limit} onChange={e => updatePF('salary_limit', Number(e.target.value))} className="form-control-premium shadow-sm" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md="12">
                                                    <Form.Text className="text-muted ms-1">Statutory limit is ₹15,000. Set to 0 to apply to all basic salaries without a cap.</Form.Text>
                                                </Col>
                                            </Row>
                                        </div>
                                    )}
                                </div>

                                {/* ESI Component */}
                                <div className="p-3 border rounded bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Form.Check
                                            type="switch"
                                            id="switch-esi"
                                            label={<span className="fw-bold ms-1 text-dark">Employee State Insurance (ESI)</span>}
                                            checked={config.statutory_config.esi.is_mandatory}
                                            onChange={e => {
                                                updateESI('is_mandatory', e.target.checked);
                                                if (e.target.checked) setExpandESI(true);
                                            }}
                                            className="mb-0"
                                        />
                                        {config.statutory_config.esi.is_mandatory && (
                                            <Button variant="none" size="sm" className="text-primary p-0 m-0 hover-scale" onClick={() => setExpandESI(!expandESI)}>
                                                <CsLineIcons icon={expandESI ? "chevron-up" : "gear"} size="18" />
                                            </Button>
                                        )}
                                    </div>

                                    {config.statutory_config.esi.is_mandatory && expandESI && (
                                        <div className="mt-3 pt-3 border-top">
                                            <Row className="g-3">
                                                <Col md="4">
                                                    <Form.Group>
                                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Employee Contribution (%)</Form.Label>
                                                        <Form.Control type="number" step="0.01" value={config.statutory_config.esi.employee_percentage} onChange={e => updateESI('employee_percentage', Number(e.target.value))} className="form-control-premium shadow-sm" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md="4">
                                                    <Form.Group>
                                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Employer Contribution (%)</Form.Label>
                                                        <Form.Control type="number" step="0.01" value={config.statutory_config.esi.employer_percentage} onChange={e => updateESI('employer_percentage', Number(e.target.value))} className="form-control-premium shadow-sm" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md="4">
                                                    <Form.Group>
                                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Gross Salary Limit (₹)</Form.Label>
                                                        <Form.Control type="number" value={config.statutory_config.esi.gross_limit} onChange={e => updateESI('gross_limit', Number(e.target.value))} className="form-control-premium shadow-sm" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md="12">
                                                    <Form.Text className="text-muted ms-1">ESI applies only if gross salary is ≤ ₹21,000.</Form.Text>
                                                </Col>
                                            </Row>
                                        </div>
                                    )}
                                </div>

                                {/* PT Component */}
                                <div className="p-3 border rounded bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Form.Check
                                            type="switch"
                                            id="switch-pt"
                                            label={<span className="fw-bold ms-1 text-dark">Professional Tax (PT)</span>}
                                            checked={config.statutory_config.pt.is_applicable}
                                            onChange={e => {
                                                updatePT('is_applicable', e.target.checked);
                                                if (e.target.checked) setExpandPT(true);
                                            }}
                                            className="mb-0"
                                        />
                                        {config.statutory_config.pt.is_applicable && (
                                            <Button variant="none" size="sm" className="text-primary p-0 m-0 hover-scale" onClick={() => setExpandPT(!expandPT)}>
                                                <CsLineIcons icon={expandPT ? "chevron-up" : "gear"} size="18" />
                                            </Button>
                                        )}
                                    </div>

                                    {config.statutory_config.pt.is_applicable && expandPT && (
                                        <div className="mt-3 pt-3 border-top">
                                            <Row className="g-3 align-items-end mb-4">
                                                <Col md="6">
                                                    <Form.Group>
                                                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">State</Form.Label>
                                                        <Select
                                                            options={INDIAN_STATES}
                                                            value={INDIAN_STATES.find(opt => opt.value === config.statutory_config.pt.state)}
                                                            onChange={handleStateChange}
                                                            placeholder="Select State"
                                                            classNamePrefix="react-select"
                                                            className="react-select-premium shadow-sm"
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <h6 className="mb-3 mt-4 text-primary fw-bold">Tax Slabs (Monthly)</h6>
                                            {config.statutory_config.pt.slabs.length === 0 ? (
                                                <div className="text-muted mb-3 bg-white p-3 rounded text-center border">No slabs added. Click below to add a salary range.</div>
                                            ) : (
                                                <>
                                                    {/* Desktop View */}
                                                    <div className="table-responsive d-none d-md-block mb-4">
                                                        <Table hover className="mb-0 custom-table-glass">
                                                            <thead>
                                                                <tr>
                                                                    <th className="text-muted fw-bold small text-uppercase ps-4">Min Salary (₹)</th>
                                                                    <th className="text-muted fw-bold small text-uppercase">Max Salary (₹)</th>
                                                                    <th className="text-muted fw-bold small text-uppercase">PT Amount (₹/mo)</th>
                                                                    <th className="text-muted fw-bold small text-uppercase text-center pe-4" style={{ width: '100px' }}>Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {config.statutory_config.pt.slabs.map((slab, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="align-middle ps-4"><Form.Control type="number" size="sm" value={slab.min_salary} onChange={e => updateSlab(idx, 'min_salary', e.target.value)} className="form-control-premium shadow-sm" style={{ height: '35px', minHeight: '35px' }} /></td>
                                                                        <td className="align-middle"><Form.Control type="number" size="sm" value={slab.max_salary} onChange={e => updateSlab(idx, 'max_salary', e.target.value)} className="form-control-premium shadow-sm" style={{ height: '35px', minHeight: '35px' }} /></td>
                                                                        <td className="align-middle"><Form.Control type="number" size="sm" value={slab.amount} onChange={e => updateSlab(idx, 'amount', e.target.value)} className="form-control-premium shadow-sm" style={{ height: '35px', minHeight: '35px' }} /></td>
                                                                        <td className="text-center align-middle pe-4">
                                                                            <Button variant="none" size="sm" className="text-danger p-1 hover-scale" onClick={() => removePTSlab(idx)}>
                                                                                <CsLineIcons icon="bin" size="18" />
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                    </div>

                                                    {/* Mobile View */}
                                                    <div className="d-block d-md-none mb-4">
                                                        {config.statutory_config.pt.slabs.map((slab, idx) => (
                                                            <Card key={idx} className="mb-3 border bg-white shadow-none" style={{ borderRadius: '12px' }}>
                                                                <Card.Body className="p-3">
                                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                                        <span className="fw-bold text-primary small">Slab {idx + 1}</span>
                                                                        <Button variant="none" size="sm" className="text-danger p-0 m-0" onClick={() => removePTSlab(idx)}>
                                                                            <CsLineIcons icon="bin" size="18" />
                                                                        </Button>
                                                                    </div>
                                                                    <Row className="g-3">
                                                                        <Col xs="6">
                                                                            <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Min (₹)</Form.Label>
                                                                            <Form.Control type="number" size="sm" value={slab.min_salary} onChange={e => updateSlab(idx, 'min_salary', e.target.value)} className="form-control-premium shadow-sm" />
                                                                        </Col>
                                                                        <Col xs="6">
                                                                            <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Max (₹)</Form.Label>
                                                                            <Form.Control type="number" size="sm" value={slab.max_salary} onChange={e => updateSlab(idx, 'max_salary', e.target.value)} className="form-control-premium shadow-sm" />
                                                                        </Col>
                                                                        <Col xs="12">
                                                                            <Form.Label className="small fw-bold text-muted text-uppercase mb-1">PT Amount (₹/mo)</Form.Label>
                                                                            <Form.Control type="number" size="sm" value={slab.amount} onChange={e => updateSlab(idx, 'amount', e.target.value)} className="form-control-premium shadow-sm" />
                                                                        </Col>
                                                                    </Row>
                                                                </Card.Body>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                            <Button variant="none" size="sm" onClick={addPTSlab} className="custom-btn-primary-outline rounded-pill px-4 mt-2 shadow-sm">
                                                <CsLineIcons icon="plus" size="14" className="me-2" /> Add New Slab
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Custom Deductions */}
                                {config.custom_deductions && config.custom_deductions.map((opt, idx) => (
                                    <div key={opt.id} className="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
                                        <Form.Check
                                            type="switch"
                                            id={`switch-${opt.id}`}
                                            label={<span className="fw-bold ms-1 text-dark">{opt.label}</span>}
                                            checked={opt.is_active}
                                            onChange={() => toggleDeduction(idx)}
                                            className="mb-0"
                                        />
                                        <Button variant="none" size="sm" className="text-danger p-0 m-0 hover-scale" onClick={() => deleteCustomDeduction(idx)}>
                                            <CsLineIcons icon="bin" size="18" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ── Document Templates ── */}
                <Col xl="12">
                    <Card className="glass-card">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0 text-primary">Joining Letter Template</h5>
                            </div>
                            <p className="text-muted mb-3 small fw-medium">
                                Design the joining letter that will be sent to staff members as a PDF attachment. 
                                Click any of the buttons below to insert the placeholder into your letter. These placeholders will be automatically replaced with the staff's actual data when sent:
                            </p>
                            <div className="mb-4 p-3 bg-light rounded border d-flex flex-wrap gap-2">
                                <Button variant="outline-info" size="sm" onClick={() => insertVariable('First Name')} className="rounded-pill fw-bold">
                                    + [First Name]
                                </Button>
                                <Button variant="outline-info" size="sm" onClick={() => insertVariable('Last Name')} className="rounded-pill fw-bold">
                                    + [Last Name]
                                </Button>
                                <Button variant="outline-info" size="sm" onClick={() => insertVariable('Job Title')} className="rounded-pill fw-bold">
                                    + [Job Title]
                                </Button>
                                <Button variant="outline-info" size="sm" onClick={() => insertVariable('Date of Joining')} className="rounded-pill fw-bold">
                                    + [Date of Joining]
                                </Button>
                                <Button variant="outline-info" size="sm" onClick={() => insertVariable('Basic Salary')} className="rounded-pill fw-bold">
                                    + [Basic Salary]
                                </Button>
                                <Button variant="outline-info" size="sm" onClick={() => insertVariable('Staff ID')} className="rounded-pill fw-bold">
                                    + [Staff ID]
                                </Button>
                            </div>

                            {/* Upload Custom Template PDF */}
                            <div className="mb-4 p-3 bg-light rounded border">
                                <Form.Group>
                                    <Form.Label className="fw-bold text-dark small text-uppercase mb-2">Upload Custom Joining Letter PDF Template</Form.Label>
                                    <div className="d-flex align-items-center gap-3">
                                        <Form.Control
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handlePdfUpload}
                                            style={{ display: 'none' }}
                                            id="pdf-template-upload-input"
                                        />
                                        <label htmlFor="pdf-template-upload-input" className="btn btn-outline-primary rounded-pill px-4 mb-0 fw-bold d-inline-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                                            <CsLineIcons icon="upload" size="16" /> {uploadingPdf ? 'Uploading PDF...' : 'Choose PDF File'}
                                        </label>
                                        {config.document_templates?.joining_letter_pdf ? (
                                            <div className="d-flex align-items-center gap-2 text-success small fw-semibold">
                                                <CsLineIcons icon="check-circle" size="18" className="text-success" />
                                                <span>Custom PDF: {config.document_templates.joining_letter_pdf.split('/').pop()}</span>
                                                <Button 
                                                    variant="link" 
                                                    className="p-0 text-danger ms-2 small fw-bold"
                                                    onClick={() => {
                                                        setConfig(prev => ({
                                                            ...prev,
                                                            document_templates: {
                                                                ...prev.document_templates,
                                                                joining_letter_pdf: null
                                                            }
                                                        }));
                                                        setIsDirty(true);
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-muted small">No custom PDF template uploaded (falls back to HTML template).</span>
                                        )}
                                    </div>
                                    <small className="text-muted d-block mt-2" style={{ fontSize: '0.75rem' }}>
                                        Supports fillable PDF forms (AcroForm fields: <code>first_name</code>, <code>last_name</code>, <code>position</code>, <code>joining_date</code>, <code>salary</code>, <code>staff_id</code>) or standard flat PDFs (text overlays automatically on top).
                                    </small>
                                </Form.Group>
                            </div>

                            <div className="bg-white rounded border">
                                <ReactQuill 
                                    ref={quillRef}
                                    theme="snow"
                                    value={config.document_templates?.joining_letter_template || ''}
                                    onChange={handleTemplateChange}
                                    modules={modules}
                                    placeholder="Draft your joining letter template here..."
                                    style={{ minHeight: '300px', fontSize: '15px' }}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Premium Floating Save Settings Bar */}
            {isDirty && (
                <div className="settings-floating-bar py-3 px-4 shadow-lg d-flex align-items-center justify-content-between">
                    <span className="fw-bold text-dark d-flex align-items-center">
                        <CsLineIcons icon="info-circle" className="text-warning me-2" size="18" /> 
                        You have unsaved changes
                    </span>
                    <div className="d-flex gap-2">
                        <Button variant="light" onClick={discardChanges} className="rounded-pill px-4" style={{ fontWeight: 'bold' }}>Discard</Button>
                        <Button variant="primary" onClick={handleSave} disabled={saving} className="rounded-pill px-4" style={{ fontWeight: 'bold' }}>
                            {saving ? <Spinner size="sm" animation="border" className="me-1" /> : <CsLineIcons icon="save" size="14" className="me-1" />} 
                            Save Settings
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollSettings;
