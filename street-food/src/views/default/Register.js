import React, { createRef, useState, useContext, useRef } from 'react';
import { Wizard, Steps, Step, WithWizard } from 'react-albus';
import { Button, Form, Spinner, Modal } from 'react-bootstrap';
import { useHistory, NavLink as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { Formik, Field } from 'formik';
import * as Yup from 'yup';
import { Country, State, City } from 'country-state-city';
import HtmlHead from 'components/html-head/HtmlHead';
import { AuthContext } from 'contexts/AuthContext';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const Register = () => {
  const history = useHistory();
  const title = 'Register — The Box';
  const description = 'Create your restaurant account on The Box.';

  const { login } = useContext(AuthContext);

  const forms = [createRef(null), createRef(null), createRef(null)];
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [fields, setFields] = useState({
    name: '',
    logo: '',
    email: '',
    mobile: '',
    address: '',
    country: '',
    country_code: '',
    state: '',
    state_code: '',
    city: '',
    pincode: '',
    fssai_no: '',
    gst_no: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
  });

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(0);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const countdownRef = useRef(null);

  const pinRegex = /^[1-9][0-9]{5}$/;
  const fssaiRegex = /^[0-9]{7,14}$/;
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?]).{8,}$/;

  const validationSchemas = [
    Yup.object({
      name: Yup.string().required('Restaurant name is required'),
      logo: Yup.mixed().required('Logo is required'),
      email: Yup.string()
        .email('Invalid email')
        .required('Email is required')
        .test('email-exists', 'Email already exists', async (value) => {
          if (!value) return true;
          try {
            const res = await axios.post(`${process.env.REACT_APP_API}/user/check-email`, { email: value });
            return !res.data.exists;
          } catch (err) {
            return false;
          }
        }),
      mobile: Yup.string()
        .matches(/^\d{10}$/, 'Must be 10 digits')
        .required('Phone number is required'),
    }),
    Yup.object({
      address: Yup.string().required('Address is required'),
      country: Yup.string().required('Country is required'),
      state: Yup.string().required('State is required'),
      city: Yup.string().required('City is required'),
      pincode: Yup.string().required('Zip code is required').matches(pinRegex, 'Enter a valid 6-digit PIN code'),
    }),
    Yup.object({
      fssai_no: Yup.string().matches(fssaiRegex, { message: 'Enter a valid FSSAI number (7 to 14 digits)', excludeEmptyString: true }),
      gst_no: Yup.string().required('GST Number is required').matches(gstRegex, 'Enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5)'),
      password: Yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(passwordRegex, 'Password must include uppercase, lowercase, number and symbol'),
      confirmPassword: Yup.string()
        .required('Confirm password is required')
        .oneOf([Yup.ref('password')], 'Passwords must match'),
    }),
  ];

  const sendVerification = async (email, setFieldError, setFieldTouched) => {
    if (!email) {
      setFieldError('email', 'Enter an email first');
      setFieldTouched('email', true, false);
      return;
    }
    setSendingVerification(true);
    try {
      const checkRes = await axios.post(`${process.env.REACT_APP_API}/user/check-email`, { email });
      if (checkRes.data.exists) {
        setFieldError('email', 'Email already exists');
        setFieldTouched('email', true, false);
        setSendingVerification(false);
        return;
      }
      setVerificationSent(false);
      const res = await axios.post(`${process.env.REACT_APP_API}/otp/send-verification`, { email });
      if (res.status === 200 && (res.data?.success ?? true)) {
        toast.success('Verification code sent to your email');
        setVerificationSent(true);
        setVerificationCountdown(60);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          setVerificationCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setFieldError('email', undefined);
      } else {
        setFieldError('email', res.data?.message || 'Failed to send code');
        setFieldTouched('email', true, false);
      }
    } catch (err) {
      setFieldError('email', err.response?.data?.message || 'Failed to send verification code');
      setFieldTouched('email', true, false);
    } finally {
      setSendingVerification(false);
    }
  };

  const verifyCode = async (email, setFieldError, setFieldTouched) => {
    if (!verificationCodeInput) {
      setFieldError('verificationCode', 'Enter verification code');
      setFieldTouched('verificationCode', true, false);
      return;
    }
    setVerifyingCode(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/otp/verify-email`, { email, code: verificationCodeInput });
      if (res.status === 200 && (res.data?.verified ?? false)) {
        setIsEmailVerified(true);
        setVerifiedEmail(email);
        toast.success('Email verified');
        setFieldError('verificationCode', undefined);
        setFieldError('email', undefined);
        setVerificationSent(false);
        if (countdownRef.current) clearInterval(countdownRef.current);
      } else {
        setFieldError('verificationCode', res.data?.message || 'Invalid verification code');
        setFieldTouched('verificationCode', true, false);
      }
    } catch (err) {
      setFieldError('verificationCode', err.response?.data?.message || 'Verification failed');
      setFieldTouched('verificationCode', true, false);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSubmit = async (finalData) => {
    setBottomNavHidden(true);
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(finalData).forEach((key) => {
        formData.append(key, finalData[key]);
      });
      formData.append('is_street_food', 'true');
      const res = await axios.post(`${process.env.REACT_APP_API}/user/register`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data) {
        setShowSuccessModal(true);
      } else {
        toast.error(res.data?.message || 'Something went wrong!');
        setBottomNavHidden(false);
      }
    } catch (err) {
      setBottomNavHidden(false);
      toast.error(err.response?.data?.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  const stepFields = [
    ['name', 'logo', 'email', 'mobile'],
    ['address', 'country', 'state', 'city', 'pincode'],
    ['fssai_no', 'gst_no', 'password', 'confirmPassword'],
  ];

  const onClickNext = async (goToNext, steps, step) => {
    const formIndex = steps.indexOf(step);
    const form = forms[formIndex].current;
    if (formIndex >= forms.length) return;
    const errors = await form.validateForm();
    const touchedFields = {};
    stepFields[formIndex].forEach((field) => {
      touchedFields[field] = true;
    });
    form.setTouched(touchedFields, false);
    if (formIndex === 0 && (!isEmailVerified || form.values.email !== verifiedEmail)) {
      form.setFieldError('email', 'Please verify your email');
      form.setTouched({ ...touchedFields, email: true }, false);
      return;
    }
    const stepHasErrors = stepFields[formIndex].some((field) => errors[field]);
    if (!stepHasErrors && form.isValid) {
      const newFields = { ...fields, ...form.values };
      setFields(newFields);
      if (formIndex === forms.length - 1) {
        handleSubmit(newFields);
      } else {
        goToNext();
        step.isDone = true;
      }
    }
  };

  const onClickPrev = (goToPrev, steps, step) => {
    if (steps.indexOf(step) <= 0) return;
    goToPrev();
  };

  const getClassName = (steps, step, index, stepItem) => {
    if (steps.indexOf(step) === index) return 'register-step-doing';
    if (steps.indexOf(step) > index || stepItem.isDone) {
      stepItem.isDone = true;
      return 'register-step-done';
    }
    return 'register-step';
  };

  const rightSide = (
    <div className="login-login-right-panel">
      <div className="login-login-form-header">
        <div className="login-login-form-eyebrow">Restaurant Registration</div>
        <h2 className="login-login-form-title">Create your account</h2>
        <p className="login-login-form-subtitle">Set up your restaurant on The Box platform</p>
      </div>
      <div className="wizard wizard-default">
        <Wizard>
          <WithWizard
            render={({ step, steps }) => (
              <div className="register-reg-wizard-steps">
                {steps.map(
                  (stepItem, index) =>
                    !stepItem.hideTopNav && (
                      <div key={`topNavStep_${index}`} className={`register-reg-step-item reg-step-item ${getClassName(steps, step, index, stepItem)}`}>
                        <div className="register-reg-step-btn">
                          <span>{stepItem.name}</span>
                          <small>{stepItem.desc}</small>
                        </div>
                      </div>
                    )
                )}
              </div>
            )}
          />
          <Steps>
            <Step id="step1" name="Restaurant" desc="Basic Info">
              <Formik innerRef={forms[0]} initialValues={fields} validationSchema={validationSchemas[0]} validateOnMount onSubmit={() => { }}>
                {({ errors, touched, setFieldValue, values, setFieldError, setFieldTouched }) => (
                  <Form>
                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">RESTAURANT NAME</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="shop" size="18" />
                        </span>
                        <Field className="login-auth-input form-control" name="name" placeholder="Enter restaurant name" />
                      </div>
                      {errors.name && touched.name && (
                        <div className="login-auth-error-msg">
                          <CsLineIcons icon="warning" size="13" />
                          {errors.name}
                        </div>
                      )}
                    </div>

                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">LOGO</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="upload" size="18" />
                        </span>
                        <input
                          type="file"
                          className="login-auth-input form-control"
                          accept="image/*"
                          style={{ padding: '0.45rem 1rem 0.45rem 2.5rem' }}
                          disabled={uploadingLogo}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setUploadingLogo(true);
                              setFieldValue('logo', file);
                              setTimeout(() => {
                                setPreviewLogo(URL.createObjectURL(file));
                                setUploadingLogo(false);
                              }, 500);
                            }
                          }}
                        />
                      </div>
                      {errors.logo && touched.logo && (
                        <div className="login-auth-error-msg">
                          <CsLineIcons icon="warning" size="13" />
                          {errors.logo}
                        </div>
                      )}
                      {previewLogo && <img src={previewLogo} alt="Logo" className="img-thumbnail mt-2" style={{ maxWidth: '80px' }} />}
                    </div>

                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">EMAIL</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="email" size="18" />
                        </span>
                        <Field
                          className="login-auth-input form-control"
                          name="email"
                          type="email"
                          placeholder="you@restaurant.com"
                          onChange={(e) => {
                            const val = e.target.value;
                            setFieldValue('email', val);
                            if (val !== verifiedEmail) {
                              setIsEmailVerified(false);
                            }
                          }}
                        />
                      </div>
                      {errors.email && touched.email && (
                        <div className="login-auth-error-msg">
                          <CsLineIcons icon="warning" size="13" />
                          {errors.email}
                        </div>
                      )}
                    </div>
                    {!isEmailVerified && (
                      <button
                        type="button"
                        className="login-btn-auth-primary mb-4"
                        style={{ width: '100%', borderRadius: '50px' }}
                        onClick={() => sendVerification(values.email, setFieldError, setFieldTouched)}
                        disabled={verificationCountdown > 0 || sendingVerification}
                      >
                        {sendingVerification ? (
                          <Spinner animation="border" size="sm" />
                        ) : verificationCountdown > 0 ? (
                          `Resend (${verificationCountdown}s)`
                        ) : (
                          'Send Code'
                        )}
                      </button>
                    )}
                    {isEmailVerified && <div className="text-success mb-4" style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '-15px' }}>✓ Email verified</div>}

                    {verificationSent && !isEmailVerified && (
                      <>
                        <div className="login-auth-input-group">
                          <label className="login-auth-input-label">VERIFICATION CODE</label>
                          <div style={{ position: 'relative' }}>
                            <span className="login-auth-input-icon">
                              <CsLineIcons icon="check" size="18" />
                            </span>
                            <Field
                              className="login-auth-input form-control"
                              name="verificationCode"
                              maxLength="6"
                              placeholder="123456"
                              value={verificationCodeInput}
                              onChange={(e) => {
                                setVerificationCodeInput(e.target.value);
                                setFieldValue('verificationCode', e.target.value);
                              }}
                            />
                          </div>
                          {errors.verificationCode && touched.verificationCode && (
                            <div className="login-auth-error-msg">
                              <CsLineIcons icon="warning" size="13" />
                              {errors.verificationCode}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="login-btn-auth-primary mb-4"
                          style={{ width: '100%', borderRadius: '50px' }}
                          onClick={() => verifyCode(values.email, setFieldError, setFieldTouched)}
                          disabled={verifyingCode || !verificationCodeInput}
                        >
                          {verifyingCode ? <Spinner animation="border" size="sm" /> : 'Verify'}
                        </button>
                      </>
                    )}

                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">PHONE NUMBER</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="phone" size="18" />
                        </span>
                        <Field className="login-auth-input form-control" name="mobile" placeholder="10-digit number" />
                      </div>
                      {errors.mobile && touched.mobile && (
                        <div className="login-auth-error-msg">
                          <CsLineIcons icon="warning" size="13" />
                          {errors.mobile}
                        </div>
                      )}
                    </div>
                  </Form>
                )}
              </Formik>
            </Step>
            <Step id="step2" name="Address" desc="Location">
              <Formik innerRef={forms[1]} initialValues={fields} validationSchema={validationSchemas[1]} validateOnMount onSubmit={() => { }}>
                {({ errors, touched, values, setFieldValue }) => (
                  <Form>
                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">ADDRESS</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="pin" size="18" />
                        </span>
                        <Field className="login-auth-input form-control" name="address" placeholder="Street address" />
                      </div>
                      {errors.address && touched.address && (
                        <div className="login-auth-error-msg">
                          <CsLineIcons icon="warning" size="13" />
                          {errors.address}
                        </div>
                      )}
                    </div>

                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">COUNTRY</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="web" size="18" />
                        </span>
                        <select
                          className="login-auth-input form-control"
                          value={values.country}
                          onChange={(e) => {
                            const c = Country.getAllCountries().find((x) => x.name === e.target.value);
                            setFieldValue('country', c.name);
                            setFieldValue('country_code', c.isoCode);
                            setFieldValue('state', '');
                            setFieldValue('city', '');
                          }}
                        >
                          <option value="">Select Country</option>
                          {Country.getAllCountries().map((c) => (
                            <option key={c.isoCode} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">STATE</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="compass" size="18" />
                        </span>
                        <select
                          className="login-auth-input form-control"
                          value={values.state}
                          onChange={(e) => {
                            const s = State.getStatesOfCountry(values.country_code).find((x) => x.name === e.target.value);
                            setFieldValue('state', s.name);
                            setFieldValue('state_code', s.isoCode);
                            setFieldValue('city', '');
                          }}
                        >
                          <option value="">Select State</option>
                          {State.getStatesOfCountry(values.country_code).map((s) => (
                            <option key={s.isoCode} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">CITY</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="building" size="18" />
                        </span>
                        <select className="login-auth-input form-control" value={values.city} onChange={(e) => setFieldValue('city', e.target.value)}>
                          <option value="">Select City</option>
                          {City.getCitiesOfState(values.country_code, values.state_code).map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">ZIP CODE</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="pin" size="18" />
                        </span>
                        <Field className="login-auth-input form-control" name="pincode" placeholder="Enter zip code" />
                      </div>
                      {errors.pincode && touched.pincode && (
                        <div className="login-auth-error-msg">
                          <CsLineIcons icon="warning" size="13" />
                          {errors.pincode}
                        </div>
                      )}
                    </div>
                  </Form>
                )}
              </Formik>
            </Step>
            <Step id="step3" name="Security" desc="Setup">
              <Formik innerRef={forms[2]} initialValues={fields} validationSchema={validationSchemas[2]} validateOnMount onSubmit={() => { }}>
                {({ errors, touched }) => (
                  <Form>
                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">FSSAI NO</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="shield" size="18" />
                        </span>
                        <Field className="login-auth-input form-control" name="fssai_no" placeholder="Enter FSSAI number" />
                      </div>
                      {errors.fssai_no && touched.fssai_no && (
                        <div className="login-auth-error-msg">
                          <CsLineIcons icon="warning" size="13" />
                          {errors.fssai_no}
                        </div>
                      )}
                    </div>

                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">GST NO</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="file-text" size="18" />
                        </span>
                        <Field className="login-auth-input form-control" name="gst_no" placeholder="Enter GST number" />
                      </div>
                      {errors.gst_no && touched.gst_no && (
                        <div className="login-auth-error-msg">
                          <CsLineIcons icon="warning" size="13" />
                          {errors.gst_no}
                        </div>
                      )}
                    </div>

                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">PASSWORD</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="lock-off" size="18" />
                        </span>
                        <Field type={showPassword ? 'text' : 'password'} className="login-auth-input form-control" name="password" placeholder="••••••••" />
                        <span
                          className="position-absolute"
                          style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, cursor: 'pointer' }}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <CsLineIcons icon={showPassword ? 'eye-off' : 'eye'} size="15" />
                        </span>
                      </div>
                      {errors.password && touched.password && (
                        <div className="login-auth-error-msg">
                          <CsLineIcons icon="warning" size="13" />
                          {errors.password}
                        </div>
                      )}
                    </div>

                    <div className="login-auth-input-group">
                      <label className="login-auth-input-label">CONFIRM</label>
                      <div style={{ position: 'relative' }}>
                        <span className="login-auth-input-icon">
                          <CsLineIcons icon="lock-off" size="18" />
                        </span>
                        <Field type={showConfirmPassword ? 'text' : 'password'} className="login-auth-input form-control" name="confirmPassword" placeholder="••••••••" />
                        <span
                          className="position-absolute"
                          style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, cursor: 'pointer' }}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <CsLineIcons icon={showConfirmPassword ? 'eye-off' : 'eye'} size="15" />
                        </span>
                      </div>
                      {errors.confirmPassword && touched.confirmPassword && (
                        <div className="login-auth-error-msg">
                          <CsLineIcons icon="warning" size="13" />
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </Form>
                )}
              </Formik>
            </Step>
          </Steps>
          <WithWizard
            render={({ next, previous, step, steps }) => (
              <div className={`d-flex gap-3 w-100 mt-4 ${bottomNavHidden ? 'invisible' : ''}`}>
                <button
                  type="button"
                  className={`login-btn-auth-primary flex-grow-1 ${steps.indexOf(step) <= 0 ? 'invisible' : ''}`}
                  style={{ borderRadius: '50px' }}
                  onClick={() => onClickPrev(previous, steps, step)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="login-btn-auth-primary flex-grow-1"
                  style={{ borderRadius: '50px' }}
                  onClick={() => onClickNext(next, steps, step)}
                  disabled={loading}
                >
                  {loading ? <Spinner animation="border" size="sm" /> : steps.indexOf(step) === steps.length - 1 ? 'Submit' : 'Continue'}
                </button>
              </div>
            )}
          />
        </Wizard>
      </div>
      <div className="login-auth-footer-link">
        Already have an account? <RouterLink to="/login">Sign in →</RouterLink>
      </div>
      <div className="login-auth-powered">
        Powered by <strong>TheBoxSync</strong>
      </div>
    </div>
  );

  return (
    <div className="login-login-page-wrapper">
      <HtmlHead title={title} description={description} />
      <div className="login-login-left-panel">
        <div className="login-login-brand-logo">
          THE <span>BOX</span>
        </div>
        <h1 className="login-login-hero-title">
          Start your
          <br />
          <span>restaurant journey.</span>
        </h1>
        <p className="login-login-hero-sub">Join hundreds of restaurants managing their operations smarter with The Box platform.</p>
        <div className="login-login-feature-pills">
          {['3-step quick setup', 'Email verification', 'Secure & encrypted', 'Instant access'].map((f) => (
            <div key={f} className="login-login-feature-pill">
              <div className="login-login-feature-pill-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>
      {rightSide}

      <Modal show={showSuccessModal} onHide={() => { }} centered backdrop="static">
        <Modal.Body className="text-center p-5">
          <div className="mb-4 text-success d-flex justify-content-center">
            <CsLineIcons icon="check-circle" size="50" style={{ color: '#10b981' }} />
          </div>
          <h3 className="fw-bold mb-2">Registration Successful</h3>
          <p className="text-muted mb-4">
            Your account will be activated soon. You can log in once it has been approved by the admin.
          </p>
          <Button
            variant="primary"
            className="w-100 rounded-pill py-2.5 fw-bold"
            onClick={() => {
              window.location.href = '/login';
            }}
          >
            Go to Login
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Register;
