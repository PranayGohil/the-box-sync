import React, { createRef, useState, useContext, useRef } from 'react';
import { Wizard, Steps, Step, WithWizard } from 'react-albus';
import { Button, Form, Spinner } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Formik, Field } from 'formik';
import * as Yup from 'yup';
import { Country, State, City } from 'country-state-city';
import LayoutFullpage from 'layout/LayoutFullpage';
import HtmlHead from 'components/html-head/HtmlHead';
import { AuthContext } from 'contexts/AuthContext';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const Register = () => {
  const history = useHistory();
  const title = 'Register';
  const description = 'Register Page';

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
    state: '',
    city: '',
    pincode: '',
    fssai_no: '',
    gst_no: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
  });

  // Add near other useState declarations
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(0); // seconds until resend allowed
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
    // Step 1 schema
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
            console.error(err);
            return false;
          }
        }),
      mobile: Yup.string()
        .matches(/^\d{10}$/, 'Must be 10 digits')
        .required('Phone number is required'),
    }),
    // Step 2 schema
    Yup.object({
      address: Yup.string().required('Address is required'),
      country: Yup.string().required('Country is required'),
      state: Yup.string().required('State is required'),
      city: Yup.string().required('City is required'),
      pincode: Yup.string()
        .required('Zip code is required')
        .matches(pinRegex, 'Enter a valid 6-digit PIN code'),
    }),
    // Step 3 schema
    Yup.object({
      fssai_no: Yup.string()
        .required('FSSAI License Number is required')
        .matches(fssaiRegex, 'Enter a valid FSSAI number (7 to 14 digits)'),
      gst_no: Yup.string()
        .required('GST Number is required')
        .matches(gstRegex, 'Enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5)'),
      password: Yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(passwordRegex, 'Password must include uppercase, lowercase, number and symbol'),
      confirmPassword: Yup.string()
        .required('Confirm password is required')
        .oneOf([Yup.ref('password')], 'Passwords must match'),
    }),
  ];

  // send verification code (starts countdown)
  const sendVerification = async (email, setFieldError, setFieldTouched) => {
    if (!email) {
      setFieldError('email', 'Enter an email first');
      setFieldTouched('email', true, false);
      return;
    }

    setSendingVerification(true);

    try {
      // 1) CHECK IF EMAIL ALREADY EXISTS
      const checkRes = await axios.post(`${process.env.REACT_APP_API}/user/check-email`, { email });
      if (checkRes.data.exists) {
        setFieldError("email", "Email already exists");
        setFieldTouched("email", true, false);
        setSendingVerification(false);
        return; // ❌ STOP — do not send OTP
      }

      // 2) SEND OTP IF EMAIL DOES NOT EXIST
      setVerificationSent(false);
      const res = await axios.post(`${process.env.REACT_APP_API}/otp/send-verification`, { email });

      if (res.status === 200 && (res.data?.success ?? true)) {
        toast.success("Verification code sent to your email");
        setVerificationSent(true);
        setVerificationCountdown(60);

        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          setVerificationCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setFieldError("email", undefined);
      } else {
        setFieldError("email", res.data?.message || "Failed to send code");
        setFieldTouched("email", true, false);
      }
    } catch (err) {
      console.error("sendVerification error", err);
      setFieldError("email", "Failed to send verification code");
      setFieldTouched("email", true, false);
    } finally {
      setSendingVerification(false);
    }
  };


  // verify code entered by user
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
        // Clear errors
        setFieldError('verificationCode', undefined);
        setFieldError('email', undefined);
        // optionally disable resend UI
        setVerificationSent(false);
        if (countdownRef.current) clearInterval(countdownRef.current);
      } else {
        setFieldError('verificationCode', res.data?.message || 'Invalid verification code');
        setFieldTouched('verificationCode', true, false);
      }
    } catch (err) {
      console.error('verifyCode error', err);
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

      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const res = await axios.post(`${process.env.REACT_APP_API}/user/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data) {
        login(res.data.token, res.data.user);
        window.location.href = '/select-plan';
      } else {
        toast.error('Something went wrong!');
      }
    } catch (err) {
      console.error(err);
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

    if (formIndex >= forms.length) {
      return;
    }

    // Validate all fields in this form first
    const errors = await form.validateForm();

    // Mark current step's fields as touched
    const touchedFields = {};
    stepFields[formIndex].forEach((field) => {
      touchedFields[field] = true;
    });
    form.setTouched(touchedFields, false);

    // Check email verification for step 1
    if (formIndex === 0 && !isEmailVerified) {
      form.setFieldError("email", "Please verify your email");
      form.setTouched({ ...touchedFields, email: true }, false);
      return;
    }

    // Only proceed if no errors in current step
    const stepHasErrors = stepFields[formIndex].some((field) => errors[field]);

    if (!stepHasErrors && form.isValid) {
      const newFields = { ...fields, ...form.values };
      setFields(newFields);

      if (formIndex === forms.length - 1) {
        // Final step - submit
        handleSubmit(newFields);
      } else {
        goToNext();
        step.isDone = true;
      }
    }
  };


  const onClickPrev = (goToPrev, steps, step) => {
    if (steps.indexOf(step) <= 0) {
      return;
    }
    goToPrev();
  };

  const getClassName = (steps, step, index, stepItem) => {
    if (steps.indexOf(step) === index) {
      return 'step-doing';
    }
    if (steps.indexOf(step) > index || stepItem.isDone) {
      stepItem.isDone = true;
      return 'step-done';
    }
    return 'step';
  };

  const leftSide = (
    <div className="min-h-100 d-flex align-items-center">
      <div className="w-100 w-lg-75 w-xxl-50">
        {/* <div>
          <div className="mb-5">
            <h1 className="display-3 text-white">Multiple Niches</h1>
            <h1 className="display-3 text-white">Ready for Your Project</h1>
          </div>
          <p className="h6 text-white lh-1-5 mb-5">
            Dynamically target high-payoff intellectual capital for customized technologies. Objectively integrate emerging core competencies before
            process-centric communities...
          </p>
          <div className="mb-5">
            <Button size="lg" variant="outline-white" href="/">
              Learn More
            </Button>
          </div>
        </div> */}
      </div>
    </div>
  );

  const rightSide = (
    <div className="sw-lg-100 min-h-100 bg-foreground d-flex justify-content-center align-items-center shadow-deep py-5">
      <div className="sw-lg-70 px-5">
        <div className="wizard wizard-default">
          <Wizard>
            {/* Top Navigation */}
            <WithWizard
              render={({ next, previous, step, steps, go, push }) => (
                <ul className="nav nav-tabs justify-content-center mb-4">
                  {steps.map((stepItem, index) => {
                    if (!stepItem.hideTopNav) {
                      return (
                        <li key={`topNavStep_${index}`} className={`nav-item ${getClassName(steps, step, index, stepItem)}`}>
                          <Button variant="link" className="nav-link pe-none">
                            <span>{stepItem.name}</span>
                            <small>{stepItem.desc}</small>
                          </Button>
                        </li>
                      );
                    }
                    return <span key={`topNavStep_${index}`} />;
                  })}
                </ul>
              )}
            />

            <Steps>
              {/* Step 1 - Restaurant Info */}
              <Step id="step1" name="Restaurant" desc="Basic Information">
                <div>
                  <Formik innerRef={forms[0]} initialValues={fields} validationSchema={validationSchemas[0]} validateOnMount onSubmit={() => { }}>
                    {({ errors, touched, setFieldValue, values, setFieldError, setFieldTouched }) => (
                      <Form>
                        <h5 className="card-title">Restaurant Information</h5>
                        <p className="card-text text-alternate mb-4">Please provide your restaurant's basic details and contact information.</p>

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>RESTAURANT NAME</Form.Label>
                          <Field className="form-control" name="name" />
                          {errors.name && touched.name && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.name}
                            </Form.Control.Feedback>
                          )}
                        </div>

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>LOGO</Form.Label>
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            disabled={uploadingLogo}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setUploadingLogo(true);
                                setFieldValue('logo', file);
                                // Simulate processing time for better UX
                                setTimeout(() => {
                                  setPreviewLogo(URL.createObjectURL(file));
                                  setUploadingLogo(false);
                                }, 500);
                              }
                            }}
                          />
                          {errors.logo && touched.logo && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.logo}
                            </Form.Control.Feedback>
                          )}
                          {uploadingLogo && (
                            <div className="mt-2 d-flex align-items-center">
                              <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                              <small className="text-muted">Processing logo...</small>
                            </div>
                          )}
                          {previewLogo && !uploadingLogo && (
                            <div className="mt-2 d-flex align-items-center">
                              <img src={previewLogo} alt="Logo Preview" className="img-thumbnail me-2" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                              <small className="text-success">✓ Logo uploaded</small>
                            </div>
                          )}
                        </div>

                        <div className="mb-3 top-label tooltip-end-top d-flex flex-column">
                          <Form.Label>EMAIL</Form.Label>
                          <div className="d-flex align-items-center">
                            <Field className="form-control me-2" name="email" type="email" />
                            <div>
                              <Button
                                variant="outline-primary"
                                onClick={() => sendVerification(values.email, setFieldError, setFieldTouched)}
                                disabled={verificationCountdown > 0 || sendingVerification}
                                style={{ whiteSpace: 'nowrap', minWidth: '120px' }}
                              >
                                {sendingVerification ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Sending...
                                  </>
                                ) : verificationCountdown > 0 ? (
                                  `Resend (${verificationCountdown}s)`
                                ) : (
                                  'Send Code'
                                )}
                              </Button>
                            </div>
                          </div>
                          {errors.email && touched.email && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.email}
                            </Form.Control.Feedback>
                          )}
                          {/* If verified, show a small badge */}
                          {isEmailVerified && (
                            <div className="mt-2 mx-2">
                              <small className="text-success fw-bold">✓ Email verified successfully</small>
                            </div>
                          )}
                        </div>
                        {/* Show code entry when a code has been sent */}
                        {verificationSent && !isEmailVerified && (
                          <div className="mb-3 top-label tooltip-end-top">
                            <Form.Label>VERIFICATION CODE</Form.Label>
                            <div className="mt-2 d-flex align-items-center">
                              <Field
                                className="form-control me-2"
                                name="verificationCode"
                                placeholder="Enter 6-digit code"
                                maxLength="6"
                                disabled={verifyingCode}
                                value={verificationCodeInput}
                                onChange={(e) => {
                                  setVerificationCodeInput(e.target.value);
                                  setFieldValue('verificationCode', e.target.value);
                                  // Clear error when user starts typing
                                  if (errors.verificationCode) {
                                    setFieldError('verificationCode', undefined);
                                  }
                                }}
                              />
                              <Button
                                variant="primary"
                                onClick={() => verifyCode(values.email, setFieldError, setFieldTouched)}
                                disabled={verifyingCode || !verificationCodeInput}
                                style={{ minWidth: '100px' }}
                              >
                                {verifyingCode ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Verifying...
                                  </>
                                ) : (
                                  'Verify'
                                )}
                              </Button>
                            </div>
                            {errors.verificationCode && touched.verificationCode && (
                              <Form.Control.Feedback type="invalid" tooltip className="d-block">
                                {errors.verificationCode}
                              </Form.Control.Feedback>
                            )}
                          </div>
                        )}

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>PHONE NUMBER</Form.Label>
                          <Field className="form-control" name="mobile" />
                          {errors.mobile && touched.mobile && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.mobile}
                            </Form.Control.Feedback>
                          )}
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </Step>

              {/* Step 2 - Address */}
              <Step id="step2" name="Address" desc="Location Details">
                <div>
                  <Formik innerRef={forms[1]} initialValues={fields} validationSchema={validationSchemas[1]} validateOnMount onSubmit={() => { }}>
                    {({ errors, touched, values, setFieldValue }) => (
                      <Form>
                        <h5 className="card-title">Address Information</h5>
                        <p className="card-text text-alternate mb-4">Please provide your restaurant's complete address details.</p>

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>ADDRESS</Form.Label>
                          <Field className="form-control" name="address" />
                          {errors.address && touched.address && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.address}
                            </Form.Control.Feedback>
                          )}
                        </div>

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>COUNTRY</Form.Label>
                          <select
                            className="form-control"
                            value={values.country}
                            onChange={(e) => {
                              setFieldValue('country', e.target.value);
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
                          {errors.country && touched.country && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.country}
                            </Form.Control.Feedback>
                          )}
                        </div>

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>STATE</Form.Label>
                          <select
                            className="form-control"
                            value={values.state}
                            onChange={(e) => {
                              setFieldValue('state', e.target.value);
                              setFieldValue('city', '');
                            }}
                          >
                            <option value="">Select State</option>
                            {State.getStatesOfCountry(
                              Country.getAllCountries().find(c => c.name === values.country)?.isoCode
                            ).map((s) => (
                              <option key={s.isoCode} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          {errors.state && touched.state && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.state}
                            </Form.Control.Feedback>
                          )}
                        </div>

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>CITY</Form.Label>
                          <select
                            className="form-control"
                            value={values.city}
                            onChange={(e) => setFieldValue('city', e.target.value)}
                          >
                            <option value="">Select City</option>
                            {City.getCitiesOfState(
                              Country.getAllCountries().find(c => c.name === values.country)?.isoCode,
                              State.getStatesOfCountry(
                                Country.getAllCountries().find(c => c.name === values.country)?.isoCode
                              ).find(s => s.name === values.state)?.isoCode
                            ).map((city) => (
                              <option key={city.name} value={city.name}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                          {errors.city && touched.city && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.city}
                            </Form.Control.Feedback>
                          )}
                        </div>

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>ZIP CODE</Form.Label>
                          <Field className="form-control" name="pincode" />
                          {errors.pincode && touched.pincode && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.pincode}
                            </Form.Control.Feedback>
                          )}
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </Step>

              {/* Step 3 - Security */}
              <Step id="step3" name="Security" desc="Account Setup">
                <div>
                  <Formik innerRef={forms[2]} initialValues={fields} validationSchema={validationSchemas[2]} validateOnMount onSubmit={() => { }}>
                    {({ errors, touched }) => (
                      <Form>
                        <h5 className="card-title">Security & Business Details</h5>
                        <p className="card-text text-alternate mb-4">Complete your registration with business and security information.</p>

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>FSSAI LICENSE NUMBER</Form.Label>
                          <Field className="form-control" name="fssai_no" />
                          {errors.fssai_no && touched.fssai_no && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.fssai_no}
                            </Form.Control.Feedback>
                          )}
                        </div>

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>GST NUMBER</Form.Label>
                          <Field className="form-control" name="gst_no" />
                          {errors.gst_no && touched.gst_no && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.gst_no}
                            </Form.Control.Feedback>
                          )}
                        </div>

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>PASSWORD</Form.Label>
                          <Field type="password" className="form-control" name="password" />
                          {errors.password && touched.password && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.password}
                            </Form.Control.Feedback>
                          )}
                        </div>

                        <div className="mb-3 top-label tooltip-end-top">
                          <Form.Label>CONFIRM PASSWORD</Form.Label>
                          <Field type="password" className="form-control" name="confirmPassword" />
                          {errors.confirmPassword && touched.confirmPassword && (
                            <Form.Control.Feedback type="invalid" tooltip className="d-block">
                              {errors.confirmPassword}
                            </Form.Control.Feedback>
                          )}
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </Step>

              {/* Step 4 - Success (Hidden from top nav) */}
              <Step id="step4" hideTopNav>
                <div className="d-flex flex-column justify-content-center align-items-center">
                  {loading ? (
                    <div className="text-center">
                      <Spinner animation="border" variant="primary" />
                      <p>Creating your restaurant account...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h3 className="mb-2">Welcome!</h3>
                      <p>Your restaurant registration completed successfully!</p>
                      <Button variant="primary" className="btn-icon btn-icon-end" onClick={() => history.push('/')}>
                        <span>Get Started</span> <CsLineIcons icon="arrow-right" />
                      </Button>
                    </div>
                  )}
                </div>
              </Step>
            </Steps>

            {/* Navigation */}
            <WithWizard
              render={({ next, previous, step, steps }) => (
                <div className={`wizard-buttons d-flex justify-content-center ${bottomNavHidden && 'invisible'}`}>
                  <Button
                    variant="outline-primary"
                    className={`btn-icon btn-icon-start me-1 ${steps.indexOf(step) <= 0 ? 'disabled' : ''}`}
                    onClick={() => onClickPrev(previous, steps, step)}
                    disabled={sendingVerification || verifyingCode || uploadingLogo}
                  >
                    <CsLineIcons icon="chevron-left" /> <span>Back</span>
                  </Button>
                  <Button
                    variant="outline-primary"
                    className="btn-icon btn-icon-end"
                    onClick={() => onClickNext(next, steps, step)}
                    disabled={sendingVerification || verifyingCode || uploadingLogo}
                  >
                    <span>{steps.indexOf(step) === steps.length - 2 ? 'Submit' : 'Next'}</span>
                    <CsLineIcons icon="chevron-right" />
                  </Button>
                </div>
              )}
            />
          </Wizard>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <HtmlHead title={title} description={description} />
      <LayoutFullpage left={leftSide} right={rightSide} />
    </>
  );
};

export default Register;