import React, { createRef, useState, useContext } from 'react';
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
    gst_no: '',
    password: '',
    confirmPassword: '',
  });

  const validationSchemas = [
    // Step 1 schema
    Yup.object({
      name: Yup.string().required('Restaurant name is required'),
      logo: Yup.mixed().required('Logo is required'),
      email: Yup.string()
        .email('Invalid email')
        .required('Email is required')
        .test('email-exists', 'Email already exists', async (value) => {
          if (!value) return true; // skip if empty
          try {
            const res = await axios.post(`${process.env.REACT_APP_API}/user/check-email`, { email: value });
            return res.data.message !== 'User Already Exists';
          } catch (err) {
            console.error(err);
            // fail validation if API call errors
            return false;
          }
        }),
      mobile: Yup.string()
        .matches(/^\d{10}$/, 'Must be 10 digits')
        .required('Phone number is required'),
    }),
    // Step 2 schema ...
    Yup.object({
      address: Yup.string().required('Address is required'),
      country: Yup.string().required('Country is required'),
      state: Yup.string().required('State is required'),
      city: Yup.string().required('City is required'),
      pincode: Yup.string().required('Zip code is required'),
    }),
    // Step 3 schema ...
    Yup.object({
      gst_no: Yup.string().required('GST Number is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Confirm password is required'),
    }),
  ];

  const handleSubmit = async (finalData) => {
    setBottomNavHidden(true);
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(finalData).forEach((key) => {
        formData.append(key, finalData[key]);
      });

      for (const pair of formData.entries()) { // eslint-disable-next-line
        console.log(pair[0], pair[1]);
      }
      
      const res = await axios.post(`${process.env.REACT_APP_API}/user/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if(res.data){
        login(res.data.token, res.data.user);
        history.push('/');
      } else {
        alert('Something went wrong!');
      }
    } catch (err) {
      console.error(err);
      setBottomNavHidden(false);
    } finally {
      setLoading(false);
    }
  };

  const stepFields = [
    ['name', 'logo', 'email', 'mobile'], // Step 1
    ['address', 'country', 'state', 'city', 'pincode'], // Step 2
    ['gst_no', 'password', 'confirmPassword'], // Step 3
  ];

  const onClickNext = async (goToNext, steps, step) => {
    const formIndex = steps.indexOf(step);
    const form = forms[formIndex].current;

    // 1️⃣ Validate all fields in this form
    const errors = await form.validateForm();

    // 2️⃣ Mark current step's fields as touched
    const touchedFields = {};
    stepFields[formIndex].forEach((field) => {
      touchedFields[field] = true;
    });
    form.setTouched(touchedFields);

    // 3️⃣ Only proceed if no errors in current step
    const stepHasErrors = stepFields[formIndex].some((field) => errors[field]);
    if (!stepHasErrors) {
      setFields((prev) => ({ ...prev, ...form.values }));

      const mergedValues = { ...fields, ...form.values };
      setFields(mergedValues);

      if (formIndex === forms.length - 1) {
        handleSubmit(mergedValues);
      } else {
        goToNext();
      }
    }
  };

  const leftSide = (
    <div className="min-h-100 d-flex align-items-center">
      <div className="w-100 w-lg-75 w-xxl-50">
        <div>
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
        </div>
      </div>
    </div>
  );

  const rightSide = (
    <div className="sw-lg-100 min-h-100 bg-foreground d-flex justify-content-center align-items-center shadow-deep py-5">
      <div className="sw-lg-70 px-5">
        <Wizard>
          <Steps>
            {/* Step 1 */}
            <Step id="step1" name="Restaurant Info">
              <Formik innerRef={forms[0]} initialValues={fields} validationSchema={validationSchemas[0]} onSubmit={() => {}}>
                {({ errors, touched, setFieldValue }) => (
                  <Form>
                    <Form.Group>
                      <Form.Label>Restaurant Name</Form.Label>
                      <Field className="form-control" name="name" />
                      {errors.name && touched.name && <div className="text-danger">{errors.name}</div>}
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Logo</Form.Label>
                      <input
                        type="file"
                        className="form-control"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          setFieldValue('logo', file);
                          setPreviewLogo(URL.createObjectURL(file));
                        }}
                      />

                      {errors.logo && touched.logo && <div className="text-danger">{errors.logo}</div>}
                      {previewLogo && (
                        <div className="mt-2">
                          <img src={previewLogo} alt="Photo Preview" className="img-thumbnail" style={{ maxWidth: '150px', maxHeight: '150px' }} />
                        </div>
                      )}
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Email</Form.Label>
                      <Field className="form-control" name="email" />
                      {errors.email && touched.email && <div className="text-danger">{errors.email}</div>}
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Phone Number</Form.Label>
                      <Field className="form-control" name="mobile" />
                      {errors.mobile && touched.mobile && <div className="text-danger">{errors.mobile}</div>}
                    </Form.Group>
                  </Form>
                )}
              </Formik>
            </Step>

            {/* Step 2 */}
            <Step id="step2" name="Address">
              <Formik innerRef={forms[1]} initialValues={fields} validationSchema={validationSchemas[1]} onSubmit={() => {}}>
                {({ errors, touched, values, setFieldValue }) => (
                  <Form>
                    <Form.Group>
                      <Form.Label>Address</Form.Label>
                      <Field className="form-control" name="address" />
                      {errors.address && touched.address && <div className="text-danger">{errors.address}</div>}
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Country</Form.Label>
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
                          <option key={c.isoCode} value={c.isoCode}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {errors.country && touched.country && <div className="text-danger">{errors.country}</div>}
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>State</Form.Label>
                      <select
                        className="form-control"
                        value={values.state}
                        onChange={(e) => {
                          setFieldValue('state', e.target.value);
                          setFieldValue('city', '');
                        }}
                      >
                        <option value="">Select State</option>
                        {State.getStatesOfCountry(values.country).map((s) => (
                          <option key={s.isoCode} value={s.isoCode}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      {errors.state && touched.state && <div className="text-danger">{errors.state}</div>}
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>City</Form.Label>
                      <select className="form-control" value={values.city} onChange={(e) => setFieldValue('city', e.target.value)}>
                        <option value="">Select City</option>
                        {City.getCitiesOfState(values.country, values.state).map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      {errors.city && touched.city && <div className="text-danger">{errors.city}</div>}
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Zip Code</Form.Label>
                      <Field className="form-control" name="pincode" />
                      {errors.pincode && touched.pincode && <div className="text-danger">{errors.pincode}</div>}
                    </Form.Group>
                  </Form>
                )}
              </Formik>
            </Step>

            {/* Step 3 */}
            <Step id="step3" name="Security">
              <Formik innerRef={forms[2]} initialValues={fields} validationSchema={validationSchemas[2]} onSubmit={() => {}}>
                {({ errors, touched }) => (
                  <Form>
                    <Form.Group>
                      <Form.Label>GST Number</Form.Label>
                      <Field className="form-control" name="gst_no" />
                      {errors.gst_no && touched.gst_no && <div className="text-danger">{errors.gst_no}</div>}
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Password</Form.Label>
                      <Field type="password" className="form-control" name="password" />
                      {errors.password && touched.password && <div className="text-danger">{errors.password}</div>}
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Confirm Password</Form.Label>
                      <Field type="password" className="form-control" name="confirmPassword" />
                      {errors.confirmPassword && touched.confirmPassword && <div className="text-danger">{errors.confirmPassword}</div>}
                    </Form.Group>
                  </Form>
                )}
              </Formik>
            </Step>
          </Steps>

          {/* Navigation */}
          <WithWizard
            render={({ next, previous, step, steps }) => (
              <div className={`wizard-buttons d-flex justify-content-center ${bottomNavHidden && 'invisible'}`}>
                <Button variant="outline-primary" onClick={() => previous()} disabled={steps.indexOf(step) <= 0} className="me-1">
                  Back
                </Button>
                <Button variant="outline-primary" onClick={() => onClickNext(next, steps, step)} disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : steps.indexOf(step) === steps.length - 1 ? 'Submit' : 'Next'}
                </Button>
              </div>
            )}
          />
        </Wizard>
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
