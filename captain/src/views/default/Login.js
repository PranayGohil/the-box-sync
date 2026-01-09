import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Button, Form } from 'react-bootstrap';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import LayoutFullpage from 'layout/LayoutFullpage';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import axios from 'axios';
import { AuthContext } from 'contexts/AuthContext';

const Login = () => {
  const title = 'Login';
  const description = 'Login Page';

  const { login } = useContext(AuthContext);
  const [wrongMsg, setWrongMsg] = useState('');

  // ✅ Validation Schema
  const validationSchema = Yup.object().shape({
    restaurant_code: Yup.string().required('Restaurant Code is required'),
    username: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required'),
  });

  // ✅ Initial form values
  const initialValues = { restaurant_code: '', username: '', password: '' };

  // ✅ Submit handler
  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/panel-user/login/Captain Panel`, values);
      if (res.data.message === 'Logged In') {
        login(res.data.token, res.data.user);
        window.location.href = '/dashboard';
      } else {
        setWrongMsg(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setWrongMsg('Login failed. Please try again.');
    }
    setSubmitting(false);
  };

  // ✅ Formik integration
  const formik = useFormik({ initialValues, validationSchema, onSubmit });
  const { handleSubmit, handleChange, values, touched, errors, isSubmitting } = formik;

  // Left Side Content (unchanged)
  const leftSide = (
    <div className="min-h-100 d-flex align-items-center">
      <div className="w-100 w-lg-75 w-xxl-50">
        {/* <div>
          <div className="mb-5">
            <h1 className="display-3 text-white">Multiple Niches</h1>
            <h1 className="display-3 text-white">Ready for Your Project</h1>
          </div>
          <p className="h6 text-white lh-1-5 mb-5">
            Dynamically target high-payoff intellectual capital for customized
            technologies. Objectively integrate emerging core competencies
            before process-centric communities...
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

  // Right Side (integrated with login fields)
  const rightSide = (
    <div className="sw-lg-70 min-h-100 bg-foreground d-flex justify-content-center align-items-center shadow-deep py-5 full-page-content-right-border">
      <div className="sw-lg-50 px-5">
        <div className="sh-11">
          <div className="logo-default" />
        </div>
        <div className="mb-5">
          <h2 className="cta-1 mb-0 text-primary">Captain, Login!</h2>
        </div>

        {/* ✅ Login Form */}
        <form id="loginForm" className="tooltip-end-bottom" onSubmit={handleSubmit}>
          {/* Restaurant Code */}
          <div className="mb-3 filled form-group tooltip-end-top">
            <CsLineIcons icon="building" />
            <Form.Control type="text" name="restaurant_code" placeholder="Restaurant Code" value={values.restaurant_code} onChange={handleChange} />
            {errors.restaurant_code && touched.restaurant_code && <div className="d-block invalid-tooltip">{errors.restaurant_code}</div>}
          </div>

          {/* Username */}
          <div className="mb-3 filled form-group tooltip-end-top">
            <CsLineIcons icon="user" />
            <Form.Control type="text" name="username" placeholder="Username" value={values.username} onChange={handleChange} />
            {errors.username && touched.username && <div className="d-block invalid-tooltip">{errors.username}</div>}
          </div>

          {/* Password */}
          <div className="mb-3 filled form-group tooltip-end-top">
            <CsLineIcons icon="lock-off" />
            <Form.Control type="password" name="password" placeholder="Password" value={values.password} onChange={handleChange} />
            {errors.password && touched.password && <div className="d-block invalid-tooltip">{errors.password}</div>}
          </div>

          {/* Submit */}
          <Button size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>

          {/* Wrong Message */}
          {wrongMsg && (
            <div className="text-danger mt-3">
              <b>{wrongMsg}</b>
            </div>
          )}
        </form>
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

export default Login;
