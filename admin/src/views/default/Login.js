import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Button, Form, Spinner } from 'react-bootstrap';
import axios from 'axios';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import LayoutFullpage from 'layout/LayoutFullpage';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import { AuthContext } from 'contexts/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const title = 'Login';
  const description = 'Login Page';

  const { login } = useContext(AuthContext);

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string().email().required('Email is required'),
    password: Yup.string().min(6, 'Must be at least 6 chars!').required('Password is required'),
  });
  const initialValues = { email: '', password: '' };

  const onSubmit = async (values) => {
    setIsLoading(true);
    setError(''); // Clear previous errors

    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/user/login`, values);

      if (res.data.success) {
        // Add small delay for better UX feedback
        setTimeout(() => {
          login(res.data.token, res.data.user);
          window.location.href = '/';
        }, 500);
      } else {
        setError(res.data.message);
        setIsLoading(false);
      }

    } catch (err) {
      console.log("Login Error:", err.response?.data?.message);
      const errorMessage = err.response?.data?.message || "Something went wrong";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit
  });

  const { handleSubmit, handleChange, values, touched, errors } = formik;

  const leftSide = (
    <div className="min-h-100 d-flex align-items-center">
      <div className="w-100 w-lg-75 w-xxl-50">
        {/* Optional content */}
      </div>
    </div>
  );

  const rightSide = (
    <div className="sw-lg-70 min-h-100 bg-foreground d-flex justify-content-center align-items-center shadow-deep py-5 full-page-content-right-border">
      <div className="sw-lg-50 px-5">
        <div className="mb-3">
          <h2 className="cta-1 mb-0 text-primary">Admin Login</h2>
        </div>
        <div className="mb-3">
          <p className="h6">Secure access to your control panel.</p>
        </div>
        <div>
          <form id="loginForm" className="tooltip-end-bottom" onSubmit={handleSubmit}>
            <div className="mb-3 filled form-group tooltip-end-top">
              <CsLineIcons icon="email" />
              <Form.Control
                type="text"
                name="email"
                placeholder="Email"
                value={values.email}
                onChange={handleChange}
                disabled={isLoading}
                className={isLoading ? 'bg-light' : ''}
              />
              {errors.email && touched.email && (
                <div className="d-block invalid-tooltip">{errors.email}</div>
              )}
            </div>

            <div className="mb-3 filled form-group tooltip-end-top position-relative">
              <CsLineIcons icon="lock-off" />
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                name="password"
                onChange={handleChange}
                value={values.password}
                placeholder="Password"
                disabled={isLoading}
                className={isLoading ? 'bg-light' : ''}
              />

              {!isLoading && (
                <>
                  {showPassword ? (
                    <div
                      className='t-2 e-3 text-end cursor-pointer position-absolute right-3'
                      onClick={() => setShowPassword(false)}
                      style={{ top: '50%', transform: 'translateY(-50%)', marginTop: '14px' }}
                    >
                      <CsLineIcons icon="eye-off" />
                    </div>
                  ) : (
                    <div
                      className='t-2 e-3 text-end cursor-pointer position-absolute right-3'
                      onClick={() => setShowPassword(true)}
                      style={{ top: '50%', transform: 'translateY(-50%)', marginTop: '14px', }}
                    >
                      <CsLineIcons icon="eye" />
                    </div>
                  )}
                </>
              )}

              {errors.password && touched.password && (
                <div className="d-block invalid-tooltip">{errors.password}</div>
              )}
            </div>

            <div className='mb-3 mx-2'>
              {error && (
                <div className="text-danger text-medium d-flex align-items-center">
                  <CsLineIcons icon="warning" className="me-1" />
                  {error}
                </div>
              )}
            </div>

            <div className='d-flex justify-content-between align-items-center'>
              <Button
                size="lg"
                type="submit"
                disabled={isLoading}
                className="position-relative"
                style={{ minWidth: '100px' }}
              >
                {isLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>

              <NavLink
                className={`t-3 e-3 ${isLoading ? 'disabled-link' : ''}`}
                to="/forgot-password" style={{ fontSize: '12px' }}
                onClick={(e) => isLoading && e.preventDefault()}
              >
                Forgot Password ?
              </NavLink>
            </div>
          </form>
        </div>
         <div className="mt-auto text-center pt-4">
          <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
            Powered by <strong>TheBoxSync</strong>
          </p>
        </div>
      </div>
    </div>
  );

  // Add CSS for disabled links
  const style = `
    .disabled-link {
      pointer-events: none;
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .spinner-container {
      display: inline-flex;
      align-items: center;
    }
    
    .login-spinner {
      margin-right: 8px;
    }
  `;

  return (
    <>
      <style>{style}</style>
      <HtmlHead title={title} description={description} />
      <LayoutFullpage left={leftSide} right={rightSide} />
    </>
  );
};

export default Login;