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
      fssai_no: Yup.string().required('FSSAI License Number is required').matches(fssaiRegex, 'Enter a valid FSSAI number (7 to 14 digits)'),
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
      setFieldError('email', 'Failed to send verification code');
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
      setFieldError('verificationCode', 'Verification failed');
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
      const res = await axios.post(`${process.env.REACT_APP_API}/user/register`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data) {
        login(res.data.token, res.data.user);
        window.location.href = '/select-plan';
      } else {
        toast.error('Something went wrong!');
      }
    } catch (err) {
      setBottomNavHidden(false);
      toast.error('Something went wrong!');
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
    if (formIndex === 0 && !isEmailVerified) {
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
    if (steps.indexOf(step) === index) return 'step-doing';
    if (steps.indexOf(step) > index || stepItem.isDone) {
      stepItem.isDone = true;
      return 'step-done';
    }
    return 'step';
  };

  const rightSide = (
    <div className="register-reg-right">
      <div className="register-reg-eyebrow">Restaurant Registration</div>
      <h2 className="register-reg-title">Create your account</h2>
      <p className="register-reg-subtitle">Set up your restaurant on The Box platform</p>
      <div className="wizard wizard-default">
        <Wizard>
          <WithWizard
            render={({ step, steps }) => (
              <div className="register-reg-wizard-steps">
                {steps.map(
                  (stepItem, index) =>
                    !stepItem.hideTopNav && (
                      <div key={`topNavStep_${index}`} className={`register-reg-step-item ${getClassName(steps, step, index, stepItem)}`}>
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
              <Formik innerRef={forms[0]} initialValues={fields} validationSchema={validationSchemas[0]} validateOnMount onSubmit={() => {}}>
                {({ errors, touched, setFieldValue, values, setFieldError, setFieldTouched }) => (
                  <Form>
                    <div className="mb-3 register-top-label">
                      <Form.Label>RESTAURANT NAME</Form.Label>
                      <Field className="register-form-control" name="name" />
                      {errors.name && touched.name && <div className="auth-error">{errors.name}</div>}
                    </div>
                    <div className="mb-3 register-top-label">
                      <Form.Label>LOGO</Form.Label>
                      <input
                        type="file"
                        className="register-form-control"
                        accept="image/*"
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
                      {errors.logo && touched.logo && <div className="auth-error">{errors.logo}</div>}
                      {previewLogo && <img src={previewLogo} alt="Logo" className="img-thumbnail mt-2" style={{ maxWidth: '80px' }} />}
                    </div>
                    <div className="mb-3 register-top-label">
                      <Form.Label>EMAIL</Form.Label>
                      <div className="d-flex align-items-center">
                        <Field className="register-form-control" style={{ flex: 1 }} name="email" type="email" />
                        <button
                          type="button"
                          className="register-btn-pill-outline"
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
                      </div>
                      {errors.email && touched.email && <div className="auth-error">{errors.email}</div>}
                      {isEmailVerified && <div className="verified-badge">✓ Email verified</div>}
                    </div>
                    {verificationSent && !isEmailVerified && (
                      <div className="mb-3 register-top-label">
                        <Form.Label>VERIFICATION CODE</Form.Label>
                        <div className="d-flex align-items-center">
                          <Field
                            className="register-form-control"
                            style={{ flex: 1 }}
                            name="verificationCode"
                            maxLength="6"
                            value={verificationCodeInput}
                            onChange={(e) => {
                              setVerificationCodeInput(e.target.value);
                              setFieldValue('verificationCode', e.target.value);
                            }}
                          />
                          <button
                            type="button"
                            className="register-btn-pill-outline"
                            onClick={() => verifyCode(values.email, setFieldError, setFieldTouched)}
                            disabled={verifyingCode || !verificationCodeInput}
                          >
                            {verifyingCode ? <Spinner animation="border" size="sm" /> : 'Verify'}
                          </button>
                        </div>
                        {errors.verificationCode && touched.verificationCode && <div className="auth-error">{errors.verificationCode}</div>}
                      </div>
                    )}
                    <div className="mb-3 register-top-label">
                      <Form.Label>PHONE NUMBER</Form.Label>
                      <Field className="register-form-control" name="mobile" />
                      {errors.mobile && touched.mobile && <div className="auth-error">{errors.mobile}</div>}
                    </div>
                  </Form>
                )}
              </Formik>
            </Step>
            <Step id="step2" name="Address" desc="Location">
              <Formik innerRef={forms[1]} initialValues={fields} validationSchema={validationSchemas[1]} validateOnMount onSubmit={() => {}}>
                {({ errors, touched, values, setFieldValue }) => (
                  <Form>
                    <div className="mb-3 register-top-label">
                      <Form.Label>ADDRESS</Form.Label>
                      <Field className="register-form-control" name="address" />
                      {errors.address && touched.address && <div className="auth-error">{errors.address}</div>}
                    </div>
                    <div className="mb-3 register-top-label">
                      <Form.Label>COUNTRY</Form.Label>
                      <select
                        className="register-form-control"
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
                    <div className="mb-3 register-top-label">
                      <Form.Label>STATE</Form.Label>
                      <select
                        className="register-form-control"
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
                    <div className="mb-3 register-top-label">
                      <Form.Label>CITY</Form.Label>
                      <select className="register-form-control" value={values.city} onChange={(e) => setFieldValue('city', e.target.value)}>
                        <option value="">Select City</option>
                        {City.getCitiesOfState(values.country_code, values.state_code).map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3 register-top-label">
                      <Form.Label>ZIP CODE</Form.Label>
                      <Field className="register-form-control" name="pincode" />
                      {errors.pincode && touched.pincode && <div className="auth-error">{errors.pincode}</div>}
                    </div>
                  </Form>
                )}
              </Formik>
            </Step>
            <Step id="step3" name="Security" desc="Setup">
              <Formik innerRef={forms[2]} initialValues={fields} validationSchema={validationSchemas[2]} validateOnMount onSubmit={() => {}}>
                {({ errors, touched }) => (
                  <Form>
                    <div className="mb-3 register-top-label">
                      <Form.Label>FSSAI NO</Form.Label>
                      <Field className="register-form-control" name="fssai_no" />
                      {errors.fssai_no && touched.fssai_no && <div className="auth-error">{errors.fssai_no}</div>}
                    </div>
                    <div className="mb-3 register-top-label">
                      <Form.Label>GST NO</Form.Label>
                      <Field className="register-form-control" name="gst_no" />
                      {errors.gst_no && touched.gst_no && <div className="auth-error">{errors.gst_no}</div>}
                    </div>
                    <div className="mb-3 register-top-label">
                      <Form.Label>PASSWORD</Form.Label>
                      <Field type="password" className="register-form-control" name="password" />
                      {errors.password && touched.password && <div className="auth-error">{errors.password}</div>}
                    </div>
                    <div className="mb-3 register-top-label">
                      <Form.Label>CONFIRM</Form.Label>
                      <Field type="password" className="register-form-control" name="confirmPassword" />
                      {errors.confirmPassword && touched.confirmPassword && <div className="auth-error">{errors.confirmPassword}</div>}
                    </div>
                  </Form>
                )}
              </Formik>
            </Step>
          </Steps>
          <WithWizard
            render={({ next, previous, step, steps }) => (
              <div className={`register-reg-nav-btns ${bottomNavHidden ? 'invisible' : ''}`}>
                <button
                  type="button"
                  className={`register-btn-auth-outline flex-1 ${steps.indexOf(step) <= 0 ? 'd-none' : ''}`}
                  onClick={() => onClickPrev(previous, steps, step)}
                >
                  Back
                </button>
                <button type="button" className="register-btn-auth-primary flex-grow-1" onClick={() => onClickNext(next, steps, step)} disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : steps.indexOf(step) === steps.length - 1 ? 'Submit' : 'Continue'}
                </button>
              </div>
            )}
          />
        </Wizard>
      </div>
      <div className="register-reg-footer">
        Already have an account? <RouterLink to="/login">Sign in →</RouterLink>
      </div>
      <div className="register-reg-powered">
        Powered by <strong>TheBoxSync</strong>
      </div>
    </div>
  );

  return (
    <div className="register-register-wrapper">
      <HtmlHead title={title} description={description} />
      <div className="register-reg-left">
        <div className="register-reg-brand">
          THE <span>BOX</span>
        </div>
        <h1 className="register-reg-hero">
          Start your
          <br />
          <span>restaurant journey.</span>
        </h1>
        <p className="register-reg-sub">Join hundreds of restaurants managing their operations smarter with The Box platform.</p>
        <div className="register-reg-pills">
          {['3-step quick setup', 'Email verification', 'Secure & encrypted', 'Instant access'].map((f) => (
            <div key={f} className="register-reg-pill">
              <div className="register-register-reg-pill-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>
      {rightSide}
    </div>
  );
};

export default Register;
