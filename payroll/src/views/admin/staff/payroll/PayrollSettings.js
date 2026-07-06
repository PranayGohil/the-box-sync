import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Spinner, Badge, Table, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import Select from 'react-select';
import { getPayrollConfig, updatePayrollConfig, getWordTemplateHtml } from 'api/payrollConfig';
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
    const [uploadingWord, setUploadingWord] = useState(false);

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
            joining_letter_template: "",
            joining_letter_word: null
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

    const handleWordUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
            toast.error('Only Word document files (.docx) are supported.');
            return;
        }

        try {
            setUploadingWord(true);
            const formData = new FormData();
            formData.append('word_template', file);

            const res = await axios.post(`${process.env.REACT_APP_API}/upload/uploadword`, formData, {
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
                        joining_letter_word: res.data.filepath,
                        joining_letter_word_html: null
                    }
                }));
                setIsDirty(true);
                toast.success('Word template uploaded successfully! Remember to save settings.');
            }
        } catch (err) {
            console.error('Error uploading Word template:', err);
            toast.error('Failed to upload Word template.');
        } finally {
            setUploadingWord(false);
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
                        joining_letter_template: res.data.document_templates?.joining_letter_template || defaultJoiningLetter,
                        joining_letter_word: res.data.document_templates?.joining_letter_word || null,
                        joining_letter_word_html: res.data.document_templates?.joining_letter_word_html || null
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

    const toggleEarning = (idx) => {
        const current = [...config.custom_earnings];
        current[idx].is_active = !current[idx].is_active;
        setConfig({ ...config, custom_earnings: current });
    };

    const addCustomEarning = () => {
        if (!newEarningLabel.trim()) return;
        const newId = newEarningLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const current = [...config.custom_earnings];

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

    const availablePlaceholders = useMemo(() => {
        const base = [
            '[First Name]', '[Last Name]', '[Full Name]',
            '[Job Title]', '[Date of Joining]', '[Basic Salary]',
            '[Staff ID]', '[Email]', '[Phone]', '[Department]', '[Company Name]',
            '[Birth Date]', '[Address]', '[Country]', '[State]', '[City]', '[Gender]', '[Pincode]',
            '[PAN Number]', '[UAN Number]', '[ESI IP Number]', '[Bank Name]', '[Account Number]',
            '[IFSC Code]', '[Bank Branch]', '[Document Type]', '[ID Number]',
            '[Gross Salary]', '[HRA]', '[Conveyance]', '[Medical Allowance]', '[Special Allowance]', '[Other Allowance]'
        ];

        const extra = [];
        if (config?.custom_earnings) {
            config.custom_earnings.forEach(earning => {
                if (earning.is_active && earning.label) {
                    extra.push(`[${earning.label.trim()}]`);
                }
            });
        }
        if (config?.statutory_config?.pf?.is_mandatory) {
            extra.push('[EPF Deduction]');
        }
        if (config?.statutory_config?.esi?.is_mandatory) {
            extra.push('[ESI Deduction]');
        }
        if (config?.statutory_config?.pt?.is_applicable) {
            extra.push('[PT Deduction]');
        }
        if (config?.custom_deductions) {
            config.custom_deductions.forEach(deduction => {
                if (deduction.is_active && deduction.label) {
                    extra.push(`[${deduction.label.trim()}]`);
                }
            });
        }
        return Array.from(new Set([...base, ...extra]));
    }, [config]);

    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;

    const customStyles = `
      .custom-btn-primary-outline { border: 1px solid #1ea8e7 !important; color: #1ea8e7 !important; background-color: #ffffff !important; transition: all 0.2s ease-in-out !important; font-weight: 600 !important; }
      .custom-btn-primary-outline:hover { background-color: #1ea8e7 !important; color: #ffffff !important; box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important; transform: translateY(-2px); }
      .react-select-premium { font-weight: 600 !important; }
      .react-select-premium .react-select__control { border-radius: 10px !important; border: 1px solid #dee2e6 !important; background-color: #ffffff !important; height: 40px !important; min-height: 40px !important; cursor: pointer !important; box-shadow: none !important; }
      .react-select-premium .react-select__control--is-focused { border-color: #1ea8e7 !important; box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.1) !important; }
      .custom-table-glass { border-collapse: separate !important; border-spacing: 0 0.5rem !important; }
      .custom-table-glass thead th { border-bottom: none !important; background: transparent !important; font-size: 0.72rem !important; color: #64748b !important; letter-spacing: 0.05em; padding: 0.9rem 1.5rem; }
      .custom-table-glass tbody tr { background: #ffffff !important; box-shadow: 0 4px 10px rgba(0,0,0,0.03) !important; transition: all 0.2s ease; }
      .custom-table-glass tbody td { border-top: 1px solid #edf2f7 !important; border-bottom: 1px solid #edf2f7 !important; padding: 1rem 1.5rem !important; vertical-align: middle !important; background: transparent !important; }
      .glass-card { background: #ffffff !important; border: 1px solid #edf2f7 !important; border-radius: 1.5rem !important; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02) !important; }
      .form-control-premium { border-radius: 10px !important; border: 1px solid #dee2e6 !important; box-shadow: none !important; padding: 0.6rem 1rem !important; }
      .form-control-premium:focus { border-color: #1ea8e7 !important; box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.1) !important; }
      .settings-floating-bar { position: fixed !important; bottom: 24px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 1050 !important; width: 90% !important; max-width: 600px !important; background: rgba(255, 255, 255, 0.95) !important; backdrop-filter: blur(10px) !important; border-radius: 50px !important; border: 1px solid rgba(226, 232, 240, 0.8) !important; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important; }
    `;

    return (
        <div className="container-fluid pb-5">
            <style>{customStyles}</style>
            <HtmlHead title={title} description={description} />
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
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs="12" xl="6">
                    <Card className="h-100 glass-card">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4 text-primary">Active Earnings Components</h5>
                            <div className="d-flex flex-column gap-3">
                                {config.custom_earnings.map((opt, idx) => (
                                    <div key={opt.id} className="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
                                        <Form.Check type="switch" id={`switch-${opt.id}`} label={<span className="fw-bold ms-1 text-dark">{opt.label}</span>} checked={opt.is_active} onChange={() => toggleEarning(idx)} />
                                        <Button variant="none" size="sm" className="text-danger p-0 m-0" onClick={() => deleteCustomEarning(idx)}><CsLineIcons icon="bin" size="18" /></Button>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs="12" xl="6">
                    <Card className="h-100 glass-card">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4 text-primary">Deductions Components</h5>
                            <div className="d-flex flex-column gap-3">
                                {config.custom_deductions && config.custom_deductions.map((opt, idx) => (
                                    <div key={opt.id} className="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
                                        <Form.Check type="switch" id={`switch-${opt.id}`} label={<span className="fw-bold ms-1 text-dark">{opt.label}</span>} checked={opt.is_active} onChange={() => toggleDeduction(idx)} />
                                        <Button variant="none" size="sm" className="text-danger p-0 m-0" onClick={() => deleteCustomDeduction(idx)}><CsLineIcons icon="bin" size="18" /></Button>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl="12">
                    <Card className="glass-card">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4 text-primary">Joining Letter Template</h5>
                            <div className="mb-4 p-3 rounded border bg-light">
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <Form.Control type="file" accept=".docx,.doc" onChange={handleWordUpload} style={{ display: 'none' }} id="word-template-upload-input" />
                                    <label htmlFor="word-template-upload-input" className="btn custom-btn-primary-outline rounded mb-0">
                                        {uploadingWord ? 'Uploading...' : 'Choose Word File (.docx)'}
                                    </label>
                                    {config.document_templates?.joining_letter_word && (
                                        <Button variant="none" className="custom-btn-primary-outline rounded" onClick={() => history.push(`${history.location.pathname}/word-editor`)}>
                                            <CsLineIcons icon="edit" size="16" className="me-1" /> Edit Letter
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <ReactQuill
                                ref={quillRef}
                                theme="snow"
                                value={config.document_templates?.joining_letter_template || ''}
                                onChange={handleTemplateChange}
                                modules={modules}
                                placeholder="Draft your joining letter email body here..."
                                style={{ minHeight: '300px', fontSize: '15px' }}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

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
