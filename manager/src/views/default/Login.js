import React, { useState, useContext, useEffect } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import axios from 'axios';
import { AuthContext } from 'contexts/AuthContext';

const Login = () => {
  const title = 'Manager Login';
  const description = 'Secure access to your control panel';

  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [wrongMsg, setWrongMsg] = useState('');

  // Add full height classes to root
  useEffect(() => {
    document.body.classList.add('h-100');
    const root = document.getElementById('root');
    if (root) root.classList.add('h-100');
    return () => {
      document.body.classList.remove('h-100');
      if (root) root.classList.remove('h-100');
    };
  }, []);

  const validationSchema = Yup.object().shape({
    restaurant_code: Yup.string().required('Restaurant Code is required'),
    username: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required'),
  });

  const initialValues = { restaurant_code: '', username: '', password: '' };

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/panel-user/login/Manager`, values);
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

  const formik = useFormik({ initialValues, validationSchema, onSubmit });
  const { handleSubmit, handleChange, values, touched, errors, isSubmitting } = formik;

  return (
    <>
      <HtmlHead title={title} description={description} />
      


      <div className="container-fluid p-0 h-100 position-relative" style={{ zIndex: 1 }}>
        <div className="row g-0 h-100 justify-content-center align-items-center">
          <div className="col-11 col-sm-8 col-md-6 col-lg-5 col-xl-4 col-xxl-3">
            
            {/* Clean Neumorphic / Light Glass Card */}
            <div 
              className="p-4 p-sm-5"
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                border: '1px solid rgba(35, 179, 244, 0.1)',
                boxShadow: '0 25px 50px rgba(35, 179, 244, 0.1)',
                animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div className="text-center mb-5 position-relative" style={{ zIndex: 2 }}>
                <div 
                  className="mb-4 d-inline-flex justify-content-center align-items-center"
                  style={{
                    width: '72px', height: '72px',
                    borderRadius: '22px',
                    background: 'rgba(35, 179, 244, 0.1)',
                    boxShadow: '0 10px 30px rgba(35,179,244,0.15)',
                    border: '1px solid rgba(35,179,244,0.2)',
                    transform: 'translateY(0)',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <CsLineIcons icon="shield" size="34" stroke="#23b3f4" />
                </div>
                <h2 className="mb-2 fw-bolder" style={{ color: '#1a1a1a', letterSpacing: '-0.5px', fontSize: '1.75rem' }}>Manager Portal</h2>
                <p className="mb-0 fw-semibold" style={{ color: '#6c757d' }}>Access your restaurant dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="position-relative" style={{ zIndex: 2 }}>
                
                {/* Clean Light Inputs */}
                <div className="mb-4 position-relative">
                  <div className="position-absolute d-flex align-items-center justify-content-center" style={{ width: '56px', height: '100%', top: 0, left: 0 }}>
                    <CsLineIcons icon="building" stroke="#23b3f4" size="18" />
                  </div>
                  <Form.Control 
                    type="text" 
                    name="restaurant_code" 
                    placeholder="Restaurant Code" 
                    value={values.restaurant_code} 
                    onChange={handleChange}
                    className="clean-input"
                  />
                  {errors.restaurant_code && touched.restaurant_code && <div className="text-danger mt-2 px-2 small fw-bold">{errors.restaurant_code}</div>}
                </div>

                <div className="mb-4 position-relative">
                  <div className="position-absolute d-flex align-items-center justify-content-center" style={{ width: '56px', height: '100%', top: 0, left: 0 }}>
                    <CsLineIcons icon="user" stroke="#23b3f4" size="18" />
                  </div>
                  <Form.Control 
                    type="text" 
                    name="username" 
                    placeholder="Username" 
                    value={values.username} 
                    onChange={handleChange}
                    className="clean-input"
                  />
                  {errors.username && touched.username && <div className="text-danger mt-2 px-2 small fw-bold">{errors.username}</div>}
                </div>

                <div className="mb-4 position-relative">
                  <div className="position-absolute d-flex align-items-center justify-content-center" style={{ width: '56px', height: '100%', top: 0, left: 0 }}>
                    <CsLineIcons icon="lock-off" stroke="#23b3f4" size="18" />
                  </div>
                  <Form.Control 
                    type={showPassword ? 'text' : 'password'} 
                    name="password" 
                    placeholder="Password" 
                    value={values.password} 
                    onChange={handleChange}
                    className="clean-input pe-5"
                  />
                  <div 
                    className="position-absolute cursor-pointer d-flex align-items-center justify-content-center"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ width: '56px', height: '100%', top: 0, right: 0, opacity: 0.7, transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.7; }}
                  >
                    <CsLineIcons icon={showPassword ? "eye-off" : "eye"} stroke="#23b3f4" size="18" />
                  </div>
                  {errors.password && touched.password && <div className="text-danger mt-2 px-2 small fw-bold">{errors.password}</div>}
                </div>

                {wrongMsg && (
                  <div className="text-danger text-center mb-4 fw-bold p-3" style={{ background: 'rgba(255, 60, 60, 0.1)', color: '#d32f2f', borderRadius: '12px', border: '1px solid rgba(255, 60, 60, 0.2)' }}>
                    {wrongMsg}
                  </div>
                )}

                <Button 
                  size="lg" 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-100 border-0 fw-bold d-flex align-items-center justify-content-center mt-2"
                  style={{
                    background: 'linear-gradient(135deg, #4dc4f6 0%, #23b3f4 100%)',
                    color: '#ffffff',
                    borderRadius: '16px',
                    height: '56px',
                    fontSize: '1.1rem',
                    boxShadow: '0 10px 20px rgba(35, 179, 244, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                  onMouseEnter={(e) => {
                    if(!isSubmitting) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 15px 30px rgba(35, 179, 244, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if(!isSubmitting) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 20px rgba(35, 179, 244, 0.3)';
                    }
                  }}
                >
                  {isSubmitting ? (
                    <Spinner animation="border" size="sm" variant="light" />
                  ) : (
                    'Sign In to Dashboard'
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center position-relative" style={{ zIndex: 2 }}>
                <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '13px' }}>
                  Powered by <strong style={{ color: '#1a1a1a' }}>TheBoxSync</strong>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>


    </>
  );
};

export default Login;
