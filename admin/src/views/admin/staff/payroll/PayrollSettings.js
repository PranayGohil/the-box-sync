import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Spinner, Badge, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import Select from 'react-select';
import { getPayrollConfig, updatePayrollConfig } from 'api/payrollConfig';

const EARNING_OPTIONS = [
  { id: 'basic', label: 'Basic Salary' },
  { id: 'hra', label: 'HRA' },
  { id: 'conveyance', label: 'Conveyance' },
  { id: 'medical', label: 'Medical Allowance' },
  { id: 'special', label: 'Special Allowance' },
  { id: 'other', label: 'Other Allowance' },
];

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
  { value: 'West Bengal', label: 'West Bengal' },
];

const PREDEFINED_PT_SLABS = {
  'Andhra Pradesh': [
    { min_salary: 0, max_salary: 15000, amount: 0 },
    { min_salary: 15001, max_salary: 20000, amount: 150 },
    { min_salary: 20001, max_salary: 9999999, amount: 200 },
  ],
  'Arunachal Pradesh': [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
  Assam: [
    { min_salary: 0, max_salary: 10000, amount: 0 },
    { min_salary: 10001, max_salary: 15000, amount: 150 },
    { min_salary: 15001, max_salary: 25000, amount: 180 },
    { min_salary: 25001, max_salary: 9999999, amount: 208 },
  ],
  Bihar: [
    { min_salary: 0, max_salary: 25000, amount: 0 },
    { min_salary: 25001, max_salary: 9999999, amount: 208 },
  ],
  Chhattisgarh: [
    { min_salary: 0, max_salary: 18000, amount: 0 },
    { min_salary: 18001, max_salary: 9999999, amount: 208 },
  ],
  Goa: [
    { min_salary: 0, max_salary: 5000, amount: 0 },
    { min_salary: 5001, max_salary: 9999999, amount: 200 },
  ],
  Gujarat: [
    { min_salary: 0, max_salary: 11999, amount: 0 },
    { min_salary: 12000, max_salary: 9999999, amount: 200 },
  ],
  Haryana: [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
  'Himachal Pradesh': [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
  Jharkhand: [
    { min_salary: 0, max_salary: 25000, amount: 0 },
    { min_salary: 25001, max_salary: 9999999, amount: 208 },
  ],
  Karnataka: [
    { min_salary: 0, max_salary: 14999, amount: 0 },
    { min_salary: 15000, max_salary: 9999999, amount: 200 },
  ],
  Kerala: [
    { min_salary: 0, max_salary: 11999, amount: 0 },
    { min_salary: 12000, max_salary: 9999999, amount: 208 },
  ],
  'Madhya Pradesh': [
    { min_salary: 0, max_salary: 18750, amount: 0 },
    { min_salary: 18751, max_salary: 25000, amount: 125 },
    { min_salary: 25001, max_salary: 33333, amount: 167 },
    { min_salary: 33334, max_salary: 9999999, amount: 212 },
  ],
  Maharashtra: [
    { min_salary: 0, max_salary: 7500, amount: 0 },
    { min_salary: 7501, max_salary: 10000, amount: 175 },
    { min_salary: 10001, max_salary: 9999999, amount: 200 },
  ],
  Manipur: [
    { min_salary: 0, max_salary: 4999, amount: 0 },
    { min_salary: 5000, max_salary: 7000, amount: 100 },
    { min_salary: 7001, max_salary: 9999999, amount: 208 },
  ],
  Meghalaya: [
    { min_salary: 0, max_salary: 4166, amount: 0 },
    { min_salary: 4167, max_salary: 9999999, amount: 208 },
  ],
  Mizoram: [
    { min_salary: 0, max_salary: 4999, amount: 0 },
    { min_salary: 5000, max_salary: 9999999, amount: 208 },
  ],
  Nagaland: [
    { min_salary: 0, max_salary: 3999, amount: 0 },
    { min_salary: 4000, max_salary: 9999999, amount: 208 },
  ],
  Odisha: [
    { min_salary: 0, max_salary: 13333, amount: 0 },
    { min_salary: 13334, max_salary: 25000, amount: 125 },
    { min_salary: 25001, max_salary: 9999999, amount: 200 },
  ],
  Punjab: [{ min_salary: 0, max_salary: 9999999, amount: 200 }],
  Rajasthan: [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
  Sikkim: [
    { min_salary: 0, max_salary: 19999, amount: 0 },
    { min_salary: 20000, max_salary: 29999, amount: 125 },
    { min_salary: 30000, max_salary: 39999, amount: 150 },
    { min_salary: 40000, max_salary: 9999999, amount: 200 },
  ],
  'Tamil Nadu': [
    { min_salary: 0, max_salary: 3500, amount: 0 },
    { min_salary: 3501, max_salary: 5000, amount: 22 },
    { min_salary: 5001, max_salary: 7500, amount: 52 },
    { min_salary: 7501, max_salary: 10000, amount: 115 },
    { min_salary: 10001, max_salary: 12500, amount: 171 },
    { min_salary: 12501, max_salary: 9999999, amount: 208 },
  ],
  Telangana: [
    { min_salary: 0, max_salary: 15000, amount: 0 },
    { min_salary: 15001, max_salary: 20000, amount: 150 },
    { min_salary: 20001, max_salary: 9999999, amount: 200 },
  ],
  Tripura: [
    { min_salary: 0, max_salary: 7499, amount: 0 },
    { min_salary: 7500, max_salary: 9999999, amount: 208 },
  ],
  'Uttar Pradesh': [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
  Uttarakhand: [{ min_salary: 0, max_salary: 9999999, amount: 0 }],
  'West Bengal': [
    { min_salary: 0, max_salary: 10000, amount: 0 },
    { min_salary: 10001, max_salary: 15000, amount: 110 },
    { min_salary: 15001, max_salary: 25000, amount: 130 },
    { min_salary: 25001, max_salary: 40000, amount: 150 },
    { min_salary: 40001, max_salary: 9999999, amount: 200 },
  ],
};

const PayrollSettings = () => {
  const title = 'Payroll Global Settings';
  const description = 'Configure statutory deductions, active earnings, and organizational rules.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'staff/view', text: 'Staff' },
    { to: 'staff/payroll/settings', title: 'Settings' },
  ];

  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [expandEPF, setExpandEPF] = useState(false);
  const [expandESI, setExpandESI] = useState(false);
  const [expandPT, setExpandPT] = useState(false);

  const [newEarningLabel, setNewEarningLabel] = useState('');
  const [newDeductionLabel, setNewDeductionLabel] = useState('');

  const [config, setConfig] = useState({
    custom_earnings: [],
    custom_deductions: [],
    statutory_config: {
      pf: { is_mandatory: false, employee_percentage: 12, employer_percentage: 12, salary_limit: 15000, auto_calculate: true },
      esi: { is_mandatory: false, employee_percentage: 0.75, employer_percentage: 3.25, gross_limit: 21000, auto_calculate: true },
      pt: { is_applicable: false, state: '', slabs: [] },
    },
    org_rules: {
      leave_year_start: 'january',
      weekly_off_days: [0],
      half_day_hours: 4,
      full_day_hours: 8,
      lunch_start_time: '01:00 PM',
      lunch_end_time: '02:00 PM',
    },
  });

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
        setConfig({
          custom_earnings: res.data.custom_earnings || [],
          custom_deductions: res.data.custom_deductions || [],
          statutory_config: {
            pf: { ...config.statutory_config.pf, ...(res.data.statutory_config?.pf || {}) },
            esi: { ...config.statutory_config.esi, ...(res.data.statutory_config?.esi || {}) },
            pt: { ...config.statutory_config.pt, ...(res.data.statutory_config?.pt || {}) },
          },
          org_rules: { ...config.org_rules, ...(res.data.org_rules || {}) },
        });
      }
    } catch (err) {
      toast.error('Failed to load payroll configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await updatePayrollConfig(config);
      if (res.success) {
        toast.success('Settings updated successfully');
      } else {
        toast.error(res.message || 'Failed to update settings');
      }
    } catch (err) {
      toast.error('Server error updating settings');
    } finally {
      setSaving(false);
    }
  };

  // ── Update Handlers ─────────────────────────────────────────────────────────

  const toggleEarning = (idx) => {
    const current = [...config.custom_earnings];
    current[idx].is_active = !current[idx].is_active;
    setConfig({ ...config, custom_earnings: current });
  };

  const addCustomEarning = () => {
    if (!newEarningLabel.trim()) return;
    const newId = newEarningLabel
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');
    const current = [...config.custom_earnings];

    // Prevent duplicate IDs
    if (current.some((e) => e.id === newId)) {
      toast.error('An earning component with this name already exists');
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
    const newId = newDeductionLabel
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');
    const current = [...config.custom_deductions];

    // Prevent duplicate IDs
    if (current.some((e) => e.id === newId)) {
      toast.error('A deduction component with this name already exists');
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
    setConfig((prev) => ({
      ...prev,
      statutory_config: {
        ...prev.statutory_config,
        pf: { ...prev.statutory_config.pf, [key]: value },
      },
    }));
  };

  const updateESI = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      statutory_config: {
        ...prev.statutory_config,
        esi: { ...prev.statutory_config.esi, [key]: value },
      },
    }));
  };

  const updatePT = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      statutory_config: {
        ...prev.statutory_config,
        pt: { ...prev.statutory_config.pt, [key]: value },
      },
    }));
  };

  const handleStateChange = (selected) => {
    const stateName = selected ? selected.value : '';
    const defaultSlabs = PREDEFINED_PT_SLABS[stateName] || [];

    setConfig((prev) => ({
      ...prev,
      statutory_config: {
        ...prev.statutory_config,
        pt: {
          ...prev.statutory_config.pt,
          state: stateName,
          slabs: defaultSlabs.length > 0 ? defaultSlabs : prev.statutory_config.pt.slabs,
        },
      },
    }));
  };

  const updateOrg = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      org_rules: { ...prev.org_rules, [key]: value },
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

  if (loading)
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    );

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
    `;

  return (
    <div className="container-fluid qsr-page-container">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      {/* Header Title & Controls aligned beautifully in one row */}
      <div className="qsr-page-title-container">
        <Row className="g-3 align-items-center">
          <Col xs="12" md="6">
            <h1 className="qsr-page-title">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>

          <Col xs="12" md="6" className="d-flex flex-wrap justify-content-md-end align-items-center gap-3">
            <Button
              variant="none"
              onClick={() => history.go(-1)}
              className="btn-icon btn-icon-start custom-btn-primary-outline rounded-pill shadow-sm"
              style={{ height: '40px' }}
            >
              <CsLineIcons icon="arrow-left" size="18" /> <span>Back</span>
            </Button>
            <Button
              variant="none"
              onClick={handleSave}
              disabled={saving}
              className="btn-icon btn-icon-start custom-btn-primary-outline rounded-pill shadow-sm"
              style={{ height: '40px' }}
            >
              {saving ? <Spinner size="sm" animation="border" /> : <CsLineIcons icon="save" size="18" />} <span>Save Settings</span>
            </Button>
          </Col>
        </Row>
      </div>

      <Row className="g-4 mb-5">
        {/* ── Organizational Rules ── */}
        <Col xl="6">
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
                        { value: 'april', label: 'April (Apr - Mar)' },
                      ]}
                      value={[
                        { value: 'january', label: 'January (Jan - Dec)' },
                        { value: 'april', label: 'April (Apr - Mar)' },
                      ].find((opt) => opt.value === config.org_rules.leave_year_start)}
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
                      {WEEK_DAYS.map((day) => (
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
                    <Form.Control
                      type="number"
                      value={config.org_rules.full_day_hours}
                      onChange={(e) => updateOrg('full_day_hours', Number(e.target.value))}
                      className="form-control-premium shadow-sm"
                    />
                  </Form.Group>
                </Col>
                <Col md="6">
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Half Day Hours</Form.Label>
                    <Form.Control
                      type="number"
                      value={config.org_rules.half_day_hours}
                      onChange={(e) => updateOrg('half_day_hours', Number(e.target.value))}
                      className="form-control-premium shadow-sm"
                    />
                  </Form.Group>
                </Col>
                <Col md="6">
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Lunch Start Time</Form.Label>
                    <Form.Control
                      type="text"
                      value={config.org_rules.lunch_start_time || ''}
                      onChange={(e) => updateOrg('lunch_start_time', e.target.value)}
                      placeholder="e.g. 01:00 PM"
                      className="form-control-premium shadow-sm"
                    />
                  </Form.Group>
                </Col>
                <Col md="6">
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Lunch End Time</Form.Label>
                    <Form.Control
                      type="text"
                      value={config.org_rules.lunch_end_time || ''}
                      onChange={(e) => updateOrg('lunch_end_time', e.target.value)}
                      placeholder="e.g. 02:00 PM"
                      className="form-control-premium shadow-sm"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* ── Active Earnings ── */}
        {/* ── Active Earnings ── */}
        <Col xl="6">
          <Card className="h-100 glass-card">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0 text-primary">Active Earnings Components</h5>
              </div>
              <p className="text-muted mb-4 small fw-medium">
                Select which earning components are actively used. Unchecking these will hide them from Staff creation forms.
              </p>

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

              <div className="d-flex flex-column gap-3" style={{ maxHeight: '350px', overflowY: 'auto' }}>
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
                {config.custom_earnings.length === 0 && <div className="text-center text-muted small p-3">No earning components defined</div>}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* ── Deductions Components ── */}
        <Col xl="12">
          <Card className="glass-card">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0 text-primary">Deductions Components</h5>
              </div>
              <p className="text-muted mb-4 small fw-medium">
                Configure active statutory deductions like Provident Fund (EPF), Employee State Insurance (ESI), and Professional Tax (PT), or define custom
                deductions.
              </p>

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
                      onChange={(e) => {
                        updatePF('is_mandatory', e.target.checked);
                        if (e.target.checked) setExpandEPF(true);
                      }}
                      className="mb-0"
                    />
                    {config.statutory_config.pf.is_mandatory && (
                      <Button variant="none" size="sm" className="text-primary p-0 m-0 hover-scale" onClick={() => setExpandEPF(!expandEPF)}>
                        <CsLineIcons icon={expandEPF ? 'chevron-up' : 'gear'} size="18" />
                      </Button>
                    )}
                  </div>

                  {config.statutory_config.pf.is_mandatory && expandEPF && (
                    <div className="mt-3 pt-3 border-top">
                      <Row className="g-3">
                        <Col md="4">
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Employee Contribution (%)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={config.statutory_config.pf.employee_percentage}
                              onChange={(e) => updatePF('employee_percentage', Number(e.target.value))}
                              className="form-control-premium shadow-sm"
                            />
                          </Form.Group>
                        </Col>
                        <Col md="4">
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Employer Contribution (%)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={config.statutory_config.pf.employer_percentage}
                              onChange={(e) => updatePF('employer_percentage', Number(e.target.value))}
                              className="form-control-premium shadow-sm"
                            />
                          </Form.Group>
                        </Col>
                        <Col md="4">
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Basic Salary Limit (₹)</Form.Label>
                            <Form.Control
                              type="number"
                              value={config.statutory_config.pf.salary_limit}
                              onChange={(e) => updatePF('salary_limit', Number(e.target.value))}
                              className="form-control-premium shadow-sm"
                            />
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
                      onChange={(e) => {
                        updateESI('is_mandatory', e.target.checked);
                        if (e.target.checked) setExpandESI(true);
                      }}
                      className="mb-0"
                    />
                    {config.statutory_config.esi.is_mandatory && (
                      <Button variant="none" size="sm" className="text-primary p-0 m-0 hover-scale" onClick={() => setExpandESI(!expandESI)}>
                        <CsLineIcons icon={expandESI ? 'chevron-up' : 'gear'} size="18" />
                      </Button>
                    )}
                  </div>

                  {config.statutory_config.esi.is_mandatory && expandESI && (
                    <div className="mt-3 pt-3 border-top">
                      <Row className="g-3">
                        <Col md="4">
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Employee Contribution (%)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={config.statutory_config.esi.employee_percentage}
                              onChange={(e) => updateESI('employee_percentage', Number(e.target.value))}
                              className="form-control-premium shadow-sm"
                            />
                          </Form.Group>
                        </Col>
                        <Col md="4">
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Employer Contribution (%)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={config.statutory_config.esi.employer_percentage}
                              onChange={(e) => updateESI('employer_percentage', Number(e.target.value))}
                              className="form-control-premium shadow-sm"
                            />
                          </Form.Group>
                        </Col>
                        <Col md="4">
                          <Form.Group>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Gross Salary Limit (₹)</Form.Label>
                            <Form.Control
                              type="number"
                              value={config.statutory_config.esi.gross_limit}
                              onChange={(e) => updateESI('gross_limit', Number(e.target.value))}
                              className="form-control-premium shadow-sm"
                            />
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
                      onChange={(e) => {
                        updatePT('is_applicable', e.target.checked);
                        if (e.target.checked) setExpandPT(true);
                      }}
                      className="mb-0"
                    />
                    {config.statutory_config.pt.is_applicable && (
                      <Button variant="none" size="sm" className="text-primary p-0 m-0 hover-scale" onClick={() => setExpandPT(!expandPT)}>
                        <CsLineIcons icon={expandPT ? 'chevron-up' : 'gear'} size="18" />
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
                              value={INDIAN_STATES.find((opt) => opt.value === config.statutory_config.pt.state)}
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
                                  <th className="text-muted fw-bold small text-uppercase text-center pe-4" style={{ width: '100px' }}>
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {config.statutory_config.pt.slabs.map((slab, idx) => (
                                  <tr key={idx}>
                                    <td className="align-middle ps-4">
                                      <Form.Control
                                        type="number"
                                        size="sm"
                                        value={slab.min_salary}
                                        onChange={(e) => updateSlab(idx, 'min_salary', e.target.value)}
                                        className="form-control-premium shadow-sm"
                                        style={{ height: '35px', minHeight: '35px' }}
                                      />
                                    </td>
                                    <td className="align-middle">
                                      <Form.Control
                                        type="number"
                                        size="sm"
                                        value={slab.max_salary}
                                        onChange={(e) => updateSlab(idx, 'max_salary', e.target.value)}
                                        className="form-control-premium shadow-sm"
                                        style={{ height: '35px', minHeight: '35px' }}
                                      />
                                    </td>
                                    <td className="align-middle">
                                      <Form.Control
                                        type="number"
                                        size="sm"
                                        value={slab.amount}
                                        onChange={(e) => updateSlab(idx, 'amount', e.target.value)}
                                        className="form-control-premium shadow-sm"
                                        style={{ height: '35px', minHeight: '35px' }}
                                      />
                                    </td>
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
                                      <Form.Control
                                        type="number"
                                        size="sm"
                                        value={slab.min_salary}
                                        onChange={(e) => updateSlab(idx, 'min_salary', e.target.value)}
                                        className="form-control-premium shadow-sm"
                                      />
                                    </Col>
                                    <Col xs="6">
                                      <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Max (₹)</Form.Label>
                                      <Form.Control
                                        type="number"
                                        size="sm"
                                        value={slab.max_salary}
                                        onChange={(e) => updateSlab(idx, 'max_salary', e.target.value)}
                                        className="form-control-premium shadow-sm"
                                      />
                                    </Col>
                                    <Col xs="12">
                                      <Form.Label className="small fw-bold text-muted text-uppercase mb-1">PT Amount (₹/mo)</Form.Label>
                                      <Form.Control
                                        type="number"
                                        size="sm"
                                        value={slab.amount}
                                        onChange={(e) => updateSlab(idx, 'amount', e.target.value)}
                                        className="form-control-premium shadow-sm"
                                      />
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
                {config.custom_deductions &&
                  config.custom_deductions.map((opt, idx) => (
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
      </Row>
    </div>
  );
};

export default PayrollSettings;
