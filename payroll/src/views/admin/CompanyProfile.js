import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { Country, State, City } from 'country-state-city';
import Select from 'react-select';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';

const CompanyProfile = () => {
  const title = 'Company Profile & Settings';
  const description = 'Manage your company details, contact information, and compliance data.';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    state_code: '',
    country: '',
    country_code: '',
    pincode: '',
    gst_no: '',
    logo: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [password, setPassword] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/user/get`, { headers });
      if (res.data) {
        const { data } = res;
        const mappedCountry = data.country || '';
        const mappedState = data.state || '';
        const cCode = Country.getAllCountries().find(c => c.name === mappedCountry)?.isoCode || '';
        const sCode = cCode ? State.getStatesOfCountry(cCode).find(s => s.name === mappedState)?.isoCode || '' : '';

        const mappedData = {
          _id: data._id || '',
          name: data.name || '',
          email: data.email || '',
          mobile: data.mobile || '',
          address: data.address || '',
          city: data.city || '',
          state: mappedState,
          state_code: sCode,
          country: mappedCountry,
          country_code: cCode,
          pincode: data.pincode || '',
          gst_no: data.gst_no || '',
          logo: data.logo || '',
        };
        setFormData(mappedData);
        setInitialData(mappedData);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Failed to load company profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
    // eslint-disable-next-line
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error("Password is required to save changes.");
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      if (logoFile) {
        submitData.append('logo', logoFile);
      }
      submitData.append('password', password);

      const res = await axios.put(`${process.env.REACT_APP_API}/user/update`, submitData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });

      toast.success(res.data.message || 'Profile updated successfully!');
      setInitialData(formData);
      setPassword('');
      setLogoFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100 mt-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="page-title-container">
        <Row className="g-0">
          <Col className="col-auto mb-3 mb-sm-0 me-auto">
            <h1 className="mb-0 pb-0 display-4" id="title">{title}</h1>
            <p className="text-muted mt-1">{description}</p>
          </Col>
        </Row>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* General Information */}
          <Col xl="8" className="mb-5">
            <h2 className="small-title">General Information</h2>
            <Card className="mb-5">
              <Card.Body>
                <Row className="mb-3">
                  <Col lg="2" md="3" sm="4">
                    <Form.Label className="col-form-label">Company Name</Form.Label>
                  </Col>
                  <Col sm="8" md="9" lg="10">
                    <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col lg="2" md="3" sm="4">
                    <Form.Label className="col-form-label">Logo</Form.Label>
                  </Col>
                  <Col sm="8" md="9" lg="10">
                    <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                    {(logoFile || formData.logo) && (
                      <div className="mt-3">
                        <img
                          src={logoFile ? URL.createObjectURL(logoFile) : `${process.env.REACT_APP_UPLOAD_DIR}${formData.logo}`}
                          alt="Logo Preview"
                          style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }}
                          className="border p-2 rounded bg-white shadow-sm"
                        />
                      </div>
                    )}
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col lg="2" md="3" sm="4">
                    <Form.Label className="col-form-label">GST No.</Form.Label>
                  </Col>
                  <Col sm="8" md="9" lg="10">
                    <Form.Control type="text" name="gst_no" value={formData.gst_no} onChange={handleInputChange} />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <h2 className="small-title">Address Details</h2>
            <Card className="mb-5">
              <Card.Body>
                <Row className="mb-3">
                  <Col lg="2" md="3" sm="4">
                    <Form.Label className="col-form-label">Address</Form.Label>
                  </Col>
                  <Col sm="8" md="9" lg="10">
                    <Form.Control as="textarea" rows={3} name="address" value={formData.address} onChange={handleInputChange} />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col lg="2" md="3" sm="4">
                    <Form.Label className="col-form-label">Country</Form.Label>
                  </Col>
                  <Col sm="10" md="9" lg="4" className="mb-3 mb-lg-0">
                    <Select
                      classNamePrefix="react-select"
                      options={Country.getAllCountries().map(c => ({ value: c.name, label: c.name, isoCode: c.isoCode }))}
                      value={{ value: formData.country, label: formData.country || 'Select Country' }}
                      onChange={(selected) => {
                        setFormData(prev => ({
                          ...prev,
                          country: selected.value,
                          country_code: selected.isoCode,
                          state: '',
                          state_code: '',
                          city: ''
                        }));
                      }}
                    />
                  </Col>
                  <Col lg="2" md="3" sm="4" className="text-lg-end">
                    <Form.Label className="col-form-label">State</Form.Label>
                  </Col>
                  <Col sm="10" md="9" lg="4">
                    <Select
                      classNamePrefix="react-select"
                      options={State.getStatesOfCountry(formData.country_code).map(s => ({ value: s.name, label: s.name, isoCode: s.isoCode }))}
                      value={{ value: formData.state, label: formData.state || 'Select State' }}
                      onChange={(selected) => {
                        setFormData(prev => ({
                          ...prev,
                          state: selected.value,
                          state_code: selected.isoCode,
                          city: ''
                        }));
                      }}
                    />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col lg="2" md="3" sm="4">
                    <Form.Label className="col-form-label">City</Form.Label>
                  </Col>
                  <Col sm="10" md="9" lg="4" className="mb-3 mb-lg-0">
                    <Select
                      classNamePrefix="react-select"
                      options={City.getCitiesOfState(formData.country_code, formData.state_code).map(c => ({ value: c.name, label: c.name }))}
                      value={{ value: formData.city, label: formData.city || 'Select City' }}
                      onChange={(selected) => {
                        setFormData(prev => ({
                          ...prev,
                          city: selected.value
                        }));
                      }}
                    />
                  </Col>
                  <Col lg="2" md="3" sm="4" className="text-lg-end">
                    <Form.Label className="col-form-label">Pincode</Form.Label>
                  </Col>
                  <Col sm="10" md="9" lg="4">
                    <Form.Control type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <h2 className="small-title">Contact & Authentication</h2>
            <Card className="mb-5">
              <Card.Body>
                <Row className="mb-3">
                  <Col lg="2" md="3" sm="4">
                    <Form.Label className="col-form-label">Email</Form.Label>
                  </Col>
                  <Col sm="8" md="9" lg="10">
                    <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col lg="2" md="3" sm="4">
                    <Form.Label className="col-form-label">Mobile</Form.Label>
                  </Col>
                  <Col sm="8" md="9" lg="10">
                    <Form.Control type="text" name="mobile" value={formData.mobile} onChange={handleInputChange} required />
                  </Col>
                </Row>

                <div className="bg-light p-3 rounded mb-3 border">
                  <p className="text-warning mb-2 fw-bold">
                    <CsLineIcons icon="warning-hexagon" size="15" className="me-2" />
                    Security Verification
                  </p>
                  <p className="text-muted small">Please provide your current password to authorize any changes to your profile.</p>
                  <Row>
                    <Col lg="2" md="3" sm="4">
                      <Form.Label className="col-form-label">Password</Form.Label>
                    </Col>
                    <Col sm="8" md="9" lg="10">
                      <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Current Password" required />
                    </Col>
                  </Row>
                </div>

              </Card.Body>
            </Card>

            <div className="d-flex justify-content-end mb-5">
              <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : <CsLineIcons icon="save" size="18" className="me-2" />}
                Save Changes
              </Button>
            </div>
          </Col>

          {/* Quick Stats or Tips Sidebar (Optional) */}
          <Col xl="4">
            <h2 className="small-title">Account Status</h2>
            <Card className="mb-5">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                    <CsLineIcons icon="check" size="20" />
                  </div>
                  <div>
                    <div className="text-heading fw-bold">Active</div>
                    <div className="text-muted small">Your account is fully active and verified.</div>
                  </div>
                </div>
                <hr />
                <p className="text-muted small mb-0">Keeping your company profile updated ensures that all generated payroll slips and statutory reports contain accurate employer information.</p>
              </Card.Body>
            </Card>

            <h2 className="small-title">Attendance Kiosk</h2>
            <Card className="mb-5">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                    <CsLineIcons icon="link" size="20" />
                  </div>
                  <div>
                    <div className="text-heading fw-bold">Kiosk Link</div>
                    <div className="text-muted small">Use this link for the standalone attendance scanner.</div>
                  </div>
                </div>

                {formData._id ? (
                  <>
                    <a
                      href={`${process.env.REACT_APP_ATTENDANCE_URL}/${formData._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-block mb-3 p-2 bg-light text-primary fw-bold rounded border text-center text-decoration-none"
                    >
                      Open Attendance Panel <CsLineIcons icon="external-link" size="15" className="ms-1" />
                    </a>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100"
                      onClick={() => {
                        navigator.clipboard.writeText(`${process.env.REACT_APP_ATTENDANCE_URL}/${formData._id}`);
                        toast.success('Kiosk link copied to clipboard!');
                      }}
                    >
                      <CsLineIcons icon="copy" size="15" className="me-2" />
                      Copy Link
                    </Button>
                  </>
                ) : (
                  <div className="text-center p-2 bg-light text-muted fw-bold rounded border">
                    Generating...
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </>
  );
};

export default CompanyProfile;
