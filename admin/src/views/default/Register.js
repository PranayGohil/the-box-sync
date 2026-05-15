import React, { createRef, useState, useContext, useRef } from 'react';
import { Wizard, Steps, Step, WithWizard } from 'react-albus';
import { Button, Form, Spinner } from 'react-bootstrap';
import { useHistory, NavLink as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { Formik, Field } from 'formik';
import * as Yup from 'yup';
import { Country, State, City } from 'country-state-city';
import HtmlHead from 'components/html-head/HtmlHead';
import { AuthContext } from 'contexts/AuthContext';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const authStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .register-wrapper { min-height:100vh; display:flex; font-family:'Inter',sans-serif; background:#f0f4f8; }
  .reg-left { flex:1; background:linear-gradient(145deg,#0d1b2a 0%,#1a3a5c 40%,#0e6fa8 80%,#23b3f4 100%); display:flex; flex-direction:column; justify-content:center; align-items:flex-start; padding:3rem 4rem; position:relative; overflow:hidden; }
  .reg-left::before { content:''; position:absolute; top:-120px; right:-120px; width:400px; height:400px; border-radius:50%; background:rgba(35,179,244,0.15); filter:blur(60px); }
  .reg-brand { font-size:1.8rem; font-weight:900; color:#fff; letter-spacing:0.15em; margin-bottom:3rem; position:relative; z-index:1; }
  .reg-brand span { color:#23b3f4; }
  .reg-hero { font-size:2.6rem; font-weight:900; color:#fff; line-height:1.2; margin-bottom:1.5rem; position:relative; z-index:1; }
  .reg-hero span { color:#23b3f4; }
  .reg-sub { font-size:1rem; color:rgba(255,255,255,0.65); line-height:1.7; max-width:380px; margin-bottom:3rem; position:relative; z-index:1; }
  .reg-pills { display:flex; flex-direction:column; gap:0.75rem; position:relative; z-index:1; }
  .reg-pill { display:flex; align-items:center; gap:0.75rem; background:rgba(255,255,255,0.08); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.12); border-radius:50px; padding:0.6rem 1.25rem; color:rgba(255,255,255,0.85); font-size:0.85rem; font-weight:600; width:fit-content; }
  .reg-pill-dot { width:8px; height:8px; border-radius:50%; background:#23b3f4; flex-shrink:0; }
  
  .reg-right { width:520px; min-height:100vh; background:#fff; display:flex; flex-direction:column; justify-content:center; padding:2.5rem 3rem; box-shadow:-20px 0 60px rgba(0,0,0,0.08); overflow-y:auto; }
  .reg-eyebrow { font-size:0.7rem; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:#23b3f4; margin-bottom:0.4rem; }
  .reg-title { font-size:1.8rem; font-weight:900; color:#0f172a; margin-bottom:0.25rem; }
  .reg-subtitle { font-size:0.85rem; color:#64748b; font-weight:500; margin-bottom:2rem; }
  
  .reg-wizard-steps { display:flex; gap:0.5rem; margin-bottom:2rem; }
  .reg-step-item { flex:1; }
  .reg-step-btn { width:100%; padding:0.75rem 0.5rem; border-radius:0.875rem; font-size:0.72rem; font-weight:700; border:1.5px solid #e2e8f0; background:#f8fafc; color:#94a3b8; text-align:center; transition:all 0.2s; }
  .reg-step-btn small { display:block; font-size:0.65rem; font-weight:500; margin-top:2px; }
  .reg-step-item.step-doing .reg-step-btn { border-color:#23b3f4; background:rgba(35,179,244,0.06); color:#23b3f4; }
  .reg-step-item.step-done .reg-step-btn { border-color:#10b981; background:rgba(16,185,129,0.06); color:#10b981; }

  /* Input overrides — very high specificity */
  .reg-right .top-label { position:relative; margin-bottom:1.25rem !important; }
  .reg-right .top-label .form-label,
  .reg-right .top-label > label {
    position:absolute !important; top:0.55rem !important; left:1rem !important;
    font-size:0.65rem !important; font-weight:900 !important;
    text-transform:uppercase !important; letter-spacing:0.1em !important;
    color:#23b3f4 !important; pointer-events:none !important; z-index:5 !important;
    margin:0 !important; padding:0 !important; background: transparent !important;
  }
  .reg-right .top-label .form-control,
  .reg-right .top-label input.form-control,
  .reg-right .top-label select.form-control {
    padding:1.6rem 1rem 0.6rem !important;
    border:1.5px solid #23b3f4 !important;
    border-radius:0.875rem !important;
    font-size:0.9rem !important;
    font-weight:600 !important;
    color:#0f172a !important;
    background:#ffffff !important;
    box-shadow:none !important;
    transition:all 0.2s !important;
    height: auto !important;
  }
  .reg-right .top-label .form-control:focus {
    border-color:#23b3f4 !important;
    background:#fff !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.15) !important;
  }
  
  .reg-right input[type="file"].form-control {
    padding:1.6rem 1rem 0.6rem !important; /* Match other inputs */
    line-height: 1.2 !important;
    border:1.5px solid #23b3f4 !important;
    border-radius:0.875rem !important;
    background:#ffffff !important;
  }

  /* Specifically style the file input button to match premium look */
  .reg-right input[type="file"]::file-selector-button {
    border: none !important;
    background: #f1f5f9 !important;
    padding: 0.3rem 0.75rem !important;
    border-radius: 6px !important;
    color: #23b3f4 !important;
    font-weight: 700 !important;
    font-size: 0.75rem !important;
    margin-right: 0.75rem !important;
    cursor: pointer !important;
    transition: all 0.2s !important;
  }
  .reg-right input[type="file"]::file-selector-button:hover {
    background: #23b3f4 !important;
    color: #fff !important;
  }

  /* Pill outline button — Brand Styling */
  .btn-pill-outline {
    height: 3.2rem !important;
    padding: 0 1.75rem !important;
    border: 1.5px solid #23b3f4 !important;
    border-radius: 50px !important;
    font-size: 0.85rem !important;
    font-weight: 800 !important;
    color: #23b3f4 !important;
    background: #ffffff !important;
    white-space: nowrap !important;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    margin-left: 0.75rem !important;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.1) !important;
  }
  .btn-pill-outline:hover:not(:disabled) {
    background: #23b3f4 !important;
    color: #ffffff !important;
    box-shadow: 0 8px 20px rgba(35, 179, 244, 0.3) !important;
    transform: translateY(-1px);
  }
  .btn-pill-outline:disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
    border-color: #cbd5e1 !important;
    color: #94a3b8 !important;
    box-shadow: none !important;
  }

  .btn-auth-primary { 
    display:block; width:100%; padding:0.9rem 1.5rem !important; 
    border:1.5px solid #23b3f4 !important; 
    border-radius:50px !important; 
    font-size:0.95rem !important; 
    font-weight:800 !important; 
    color:#23b3f4 !important; 
    background:#ffffff !important; 
    transition:all 0.3s !important; 
    margin-top:1rem; 
    text-align:center; 
    cursor:pointer;
    text-decoration:none;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.1) !important;
  }
  .btn-auth-primary:hover:not(:disabled) { 
    background:#23b3f4 !important; 
    color:#ffffff !important;
    box-shadow: 0 8px 20px rgba(35, 179, 244, 0.3) !important;
    transform:translateY(-1px) !important; 
  }
  .btn-auth-primary:disabled { opacity:0.5 !important; cursor:not-allowed !important; }
  
  .btn-auth-outline { padding:0.9rem 1.75rem !important; border:1.5px solid #23b3f4 !important; border-radius:50px !important; font-size:0.9rem !important; font-weight:800 !important; color:#23b3f4 !important; background:#fff !important; transition:all 0.2s !important; }
  .btn-auth-outline:hover:not(:disabled) { background:#23b3f4 !important; color:#fff !important; }

  .reg-nav-btns { display:flex; gap:1rem; margin-top:2rem; }
  .reg-footer { text-align:center; margin-top:2rem; font-size:0.85rem; color:#64748b; font-weight:500; }
  .reg-footer a { color:#23b3f4; font-weight:800; text-decoration:none; }
  .reg-powered { text-align:center; margin-top:2rem; font-size:0.75rem; color:#94a3b8; }
  .reg-powered strong { color:#475569; font-weight:800; }
  
  @media (max-width:991px) { .reg-left { display:none; } .reg-right { width:100%; padding:2.5rem 1.75rem; box-shadow:none; } }
`;

const Register = () => {
  const history = useHistory();
  const title = 'Register — The Box';
  const description = 'Create your restaurant account on The Box.';

  const { login } = useContext(AuthContext);

  const forms = [createRef(null), createRef(null), createRef(null)];
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [fields, setFields] = useState({
    name: '', logo: '', email: '', mobile: '', address: '', country: '', country_code: '', state: '', state_code: '', city: '', pincode: '', fssai_no: '', gst_no: '', password: '', confirmPassword: '', verificationCode: '',
  });

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(0);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const countdownRef = useRef(null);

  const pinRegex = /^[1-9][0-9]{5}$/;
  const fssaiRegex = /^[0-9]{7,14}$/;
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?]).{8,}$/;

  const validationSchemas = [
    Yup.object({
      name: Yup.string().required('Restaurant name is required'),
      logo: Yup.mixed().required('Logo is required'),
      email: Yup.string().email('Invalid email').required('Email is required').test('email-exists', 'Email already exists', async (value) => {
        if (!value) return true;
        try { const res = await axios.post(`${process.env.REACT_APP_API}/user/check-email`, { email: value }); return !res.data.exists; } catch (err) { return false; }
      }),
      mobile: Yup.string().matches(/^\d{10}$/, 'Must be 10 digits').required('Phone number is required'),
    }),
    Yup.object({
      address: Yup.string().required('Address is required'),
      country: Yup.string().required('Country is required'),
      state: Yup.string().required('State is required'),
      city: Yup.string().required('City is required'),
      pincode: Yup.string().required('Zip code is required').matches(pinRegex, 'Enter a valid 6-digit PIN code'),
    }),
    Yup.object({
      fssai_no: Yup.string().required('FSSAI License Number is required').matches(fssaiRegex, 'Enter a valid FSSAI number (7 to 14 digits)'),
      gst_no: Yup.string().required('GST Number is required').matches(gstRegex, 'Enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5)'),
      password: Yup.string().required('Password is required').min(8, 'Password must be at least 8 characters').matches(passwordRegex, 'Password must include uppercase, lowercase, number and symbol'),
      confirmPassword: Yup.string().required('Confirm password is required').oneOf([Yup.ref('password')], 'Passwords must match'),
    }),
  ];

  const sendVerification = async (email, setFieldError, setFieldTouched) => {
    if (!email) { setFieldError('email', 'Enter an email first'); setFieldTouched('email', true, false); return; }
    setSendingVerification(true);
    try {
      const checkRes = await axios.post(`${process.env.REACT_APP_API}/user/check-email`, { email });
      if (checkRes.data.exists) { setFieldError("email", "Email already exists"); setFieldTouched("email", true, false); setSendingVerification(false); return; }
      setVerificationSent(false);
      const res = await axios.post(`${process.env.REACT_APP_API}/otp/send-verification`, { email });
      if (res.status === 200 && (res.data?.success ?? true)) {
        toast.success("Verification code sent to your email");
        setVerificationSent(true); setVerificationCountdown(60);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => { setVerificationCountdown(prev => { if (prev <= 1) { clearInterval(countdownRef.current); return 0; } return prev - 1; }); }, 1000);
        setFieldError("email", undefined);
      } else { setFieldError("email", res.data?.message || "Failed to send code"); setFieldTouched("email", true, false); }
    } catch (err) { setFieldError("email", "Failed to send verification code"); setFieldTouched("email", true, false); } finally { setSendingVerification(false); }
  };

  const verifyCode = async (email, setFieldError, setFieldTouched) => {
    if (!verificationCodeInput) { setFieldError('verificationCode', 'Enter verification code'); setFieldTouched('verificationCode', true, false); return; }
    setVerifyingCode(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/otp/verify-email`, { email, code: verificationCodeInput });
      if (res.status === 200 && (res.data?.verified ?? false)) {
        setIsEmailVerified(true); toast.success('Email verified');
        setFieldError('verificationCode', undefined); setFieldError('email', undefined);
        setVerificationSent(false); if (countdownRef.current) clearInterval(countdownRef.current);
      } else { setFieldError('verificationCode', res.data?.message || 'Invalid verification code'); setFieldTouched('verificationCode', true, false); }
    } catch (err) { setFieldError('verificationCode', 'Verification failed'); setFieldTouched('verificationCode', true, false); } finally { setVerifyingCode(false); }
  };

  const handleSubmit = async (finalData) => {
    setBottomNavHidden(true); setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(finalData).forEach((key) => { formData.append(key, finalData[key]); });
      const res = await axios.post(`${process.env.REACT_APP_API}/user/register`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data) { login(res.data.token, res.data.user); window.location.href = '/select-plan'; } else { toast.error('Something went wrong!'); }
    } catch (err) { setBottomNavHidden(false); toast.error('Something went wrong!'); } finally { setLoading(false); }
  };

  const stepFields = [['name', 'logo', 'email', 'mobile'], ['address', 'country', 'state', 'city', 'pincode'], ['fssai_no', 'gst_no', 'password', 'confirmPassword']];

  const onClickNext = async (goToNext, steps, step) => {
    const formIndex = steps.indexOf(step);
    const form = forms[formIndex].current;
    if (formIndex >= forms.length) return;
    const errors = await form.validateForm();
    const touchedFields = {}; stepFields[formIndex].forEach((field) => { touchedFields[field] = true; });
    form.setTouched(touchedFields, false);
    if (formIndex === 0 && !isEmailVerified) { form.setFieldError("email", "Please verify your email"); form.setTouched({ ...touchedFields, email: true }, false); return; }
    const stepHasErrors = stepFields[formIndex].some((field) => errors[field]);
    if (!stepHasErrors && form.isValid) {
      const newFields = { ...fields, ...form.values }; setFields(newFields);
      if (formIndex === forms.length - 1) { handleSubmit(newFields); } else { goToNext(); step.isDone = true; }
    }
  };

  const onClickPrev = (goToPrev, steps, step) => { if (steps.indexOf(step) <= 0) return; goToPrev(); };

  const getClassName = (steps, step, index, stepItem) => {
    if (steps.indexOf(step) === index) return 'step-doing';
    if (steps.indexOf(step) > index || stepItem.isDone) { stepItem.isDone = true; return 'step-done'; }
    return 'step';
  };

  const rightSide = (
    <div className="reg-right">
      <div className="reg-eyebrow">Restaurant Registration</div>
      <h2 className="reg-title">Create your account</h2>
      <p className="reg-subtitle">Set up your restaurant on The Box platform</p>
      <div className="wizard wizard-default">
        <Wizard>
          <WithWizard render={({ step, steps }) => (
            <div className="reg-wizard-steps">
              {steps.map((stepItem, index) => !stepItem.hideTopNav && (
                <div key={`topNavStep_${index}`} className={`reg-step-item ${getClassName(steps, step, index, stepItem)}`}>
                  <div className="reg-step-btn"><span>{stepItem.name}</span><small>{stepItem.desc}</small></div>
                </div>
              ))}
            </div>
          )} />
          <Steps>
            <Step id="step1" name="Restaurant" desc="Basic Info">
              <Formik innerRef={forms[0]} initialValues={fields} validationSchema={validationSchemas[0]} validateOnMount onSubmit={() => { }}>
                {({ errors, touched, setFieldValue, values, setFieldError, setFieldTouched }) => (
                  <Form>
                    <div className="mb-3 top-label"><Form.Label>RESTAURANT NAME</Form.Label><Field className="form-control" name="name" />{errors.name && touched.name && <div className="auth-error">{errors.name}</div>}</div>
                    <div className="mb-3 top-label"><Form.Label>LOGO</Form.Label><input type="file" className="form-control" accept="image/*" disabled={uploadingLogo} onChange={(e) => { const file = e.target.files[0]; if (file) { setUploadingLogo(true); setFieldValue('logo', file); setTimeout(() => { setPreviewLogo(URL.createObjectURL(file)); setUploadingLogo(false); }, 500); } }} />{errors.logo && touched.logo && <div className="auth-error">{errors.logo}</div>}{previewLogo && <img src={previewLogo} alt="Logo" className="img-thumbnail mt-2" style={{ maxWidth: '80px' }} />}</div>
                    <div className="mb-3 top-label"><Form.Label>EMAIL</Form.Label><div className="d-flex align-items-center"><Field className="form-control" style={{flex:1}} name="email" type="email" /><button type="button" className="btn-pill-outline" onClick={() => sendVerification(values.email, setFieldError, setFieldTouched)} disabled={verificationCountdown > 0 || sendingVerification}>{sendingVerification ? <Spinner animation="border" size="sm" /> : verificationCountdown > 0 ? `Resend (${verificationCountdown}s)` : 'Send Code'}</button></div>{errors.email && touched.email && <div className="auth-error">{errors.email}</div>}{isEmailVerified && <div className="verified-badge">✓ Email verified</div>}</div>
                    {verificationSent && !isEmailVerified && <div className="mb-3 top-label"><Form.Label>VERIFICATION CODE</Form.Label><div className="d-flex align-items-center"><Field className="form-control" style={{flex:1}} name="verificationCode" maxLength="6" value={verificationCodeInput} onChange={(e) => { setVerificationCodeInput(e.target.value); setFieldValue('verificationCode', e.target.value); }} /><button type="button" className="btn-pill-outline" onClick={() => verifyCode(values.email, setFieldError, setFieldTouched)} disabled={verifyingCode || !verificationCodeInput}>{verifyingCode ? <Spinner animation="border" size="sm" /> : 'Verify'}</button></div>{errors.verificationCode && touched.verificationCode && <div className="auth-error">{errors.verificationCode}</div>}</div>}
                    <div className="mb-3 top-label"><Form.Label>PHONE NUMBER</Form.Label><Field className="form-control" name="mobile" />{errors.mobile && touched.mobile && <div className="auth-error">{errors.mobile}</div>}</div>
                  </Form>
                )}
              </Formik>
            </Step>
            <Step id="step2" name="Address" desc="Location">
              <Formik innerRef={forms[1]} initialValues={fields} validationSchema={validationSchemas[1]} validateOnMount onSubmit={() => { }}>
                {({ errors, touched, values, setFieldValue }) => (
                  <Form>
                    <div className="mb-3 top-label"><Form.Label>ADDRESS</Form.Label><Field className="form-control" name="address" />{errors.address && touched.address && <div className="auth-error">{errors.address}</div>}</div>
                    <div className="mb-3 top-label"><Form.Label>COUNTRY</Form.Label><select className="form-control" value={values.country} onChange={(e) => { const c = Country.getAllCountries().find(x => x.name === e.target.value); setFieldValue('country', c.name); setFieldValue('country_code', c.isoCode); setFieldValue('state', ''); setFieldValue('city', ''); }}><option value="">Select Country</option>{Country.getAllCountries().map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}</select></div>
                    <div className="mb-3 top-label"><Form.Label>STATE</Form.Label><select className="form-control" value={values.state} onChange={(e) => { const s = State.getStatesOfCountry(values.country_code).find(x => x.name === e.target.value); setFieldValue('state', s.name); setFieldValue('state_code', s.isoCode); setFieldValue('city', ''); }}><option value="">Select State</option>{State.getStatesOfCountry(values.country_code).map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}</select></div>
                    <div className="mb-3 top-label"><Form.Label>CITY</Form.Label><select className="form-control" value={values.city} onChange={(e) => setFieldValue('city', e.target.value)}><option value="">Select City</option>{City.getCitiesOfState(values.country_code, values.state_code).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
                    <div className="mb-3 top-label"><Form.Label>ZIP CODE</Form.Label><Field className="form-control" name="pincode" />{errors.pincode && touched.pincode && <div className="auth-error">{errors.pincode}</div>}</div>
                  </Form>
                )}
              </Formik>
            </Step>
            <Step id="step3" name="Security" desc="Setup">
              <Formik innerRef={forms[2]} initialValues={fields} validationSchema={validationSchemas[2]} validateOnMount onSubmit={() => { }}>
                {({ errors, touched }) => (
                  <Form>
                    <div className="mb-3 top-label"><Form.Label>FSSAI NO</Form.Label><Field className="form-control" name="fssai_no" />{errors.fssai_no && touched.fssai_no && <div className="auth-error">{errors.fssai_no}</div>}</div>
                    <div className="mb-3 top-label"><Form.Label>GST NO</Form.Label><Field className="form-control" name="gst_no" />{errors.gst_no && touched.gst_no && <div className="auth-error">{errors.gst_no}</div>}</div>
                    <div className="mb-3 top-label"><Form.Label>PASSWORD</Form.Label><Field type="password" className="form-control" name="password" />{errors.password && touched.password && <div className="auth-error">{errors.password}</div>}</div>
                    <div className="mb-3 top-label"><Form.Label>CONFIRM</Form.Label><Field type="password" className="form-control" name="confirmPassword" />{errors.confirmPassword && touched.confirmPassword && <div className="auth-error">{errors.confirmPassword}</div>}</div>
                  </Form>
                )}
              </Formik>
            </Step>
          </Steps>
          <WithWizard render={({ next, previous, step, steps }) => (
            <div className={`reg-nav-btns ${bottomNavHidden ? 'invisible' : ''}`}>
              <button type="button" className={`btn-auth-outline flex-1 ${steps.indexOf(step) <= 0 ? 'd-none' : ''}`} onClick={() => onClickPrev(previous, steps, step)}>Back</button>
              <button type="button" className="btn-auth-primary flex-grow-1" onClick={() => onClickNext(next, steps, step)} disabled={loading}>{loading ? <Spinner animation="border" size="sm" /> : steps.indexOf(step) === steps.length - 1 ? 'Submit' : 'Continue'}</button>
            </div>
          )} />
        </Wizard>
      </div>
      <div className="reg-footer">Already have an account? <RouterLink to="/login">Sign in →</RouterLink></div>
      <div className="reg-powered">Powered by <strong>TheBoxSync</strong></div>
    </div>
  );

  return (
    <div className="register-wrapper">
      <style>{authStyles}</style>
      <HtmlHead title={title} description={description} />
      <div className="reg-left">
        <div className="reg-brand">THE <span>BOX</span></div>
        <h1 className="reg-hero">Start your<br /><span>restaurant journey.</span></h1>
        <p className="reg-sub">Join hundreds of restaurants managing their operations smarter with The Box platform.</p>
        <div className="reg-pills">{['3-step quick setup','Email verification','Secure & encrypted','Instant access'].map(f => <div key={f} className="reg-pill"><div className="reg-pill-dot" />{f}</div>)}</div>
      </div>
      {rightSide}
    </div>
  );
};

export default Register;