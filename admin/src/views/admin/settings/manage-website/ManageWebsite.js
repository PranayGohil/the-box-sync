import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { AuthContext } from 'contexts/AuthContext';

const validationSchema = Yup.object().shape({
  restaurant_name: Yup.string().required('Restaurant name is required'),
  restaurant_address: Yup.string().required('Restaurant address is required'),
  contact_email: Yup.string().email('Invalid email').required('Email is required'),
  contact_phone: Yup.string().required('Phone is required'),
  open_days: Yup.string().required('Open days are required'),
  open_time_from: Yup.string().required('Opening time is required'),
  open_time_to: Yup.string().required('Closing time is required'),
});

const customStyles = `
    .glass-card {
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(10px) !important;
      border-radius: 1.25rem !important;
      border: 1px solid rgba(255, 255, 255, 0.4) !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07) !important;
      transition: all 0.3s ease !important;
      border: none !important;
    }
    .glass-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.12) !important;
    }
    .custom-btn-outline, .custom-btn-danger {
      background: #ffffff !important;
      border: 1px solid #1ea8e7 !important;
      color: #1ea8e7 !important;
      border-radius: 50px !important;
      padding: 0.5rem 1.2rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important;
      width: auto !important;
      height: auto !important;
    }
    .custom-btn-circle {
      width: 30px !important;
      height: 30px !important;
      padding: 0 !important;
      border-radius: 50% !important;
    }
    .custom-btn-danger {
      border-color: #cf2637 !important;
      color: #cf2637 !important;
    }
    .custom-btn-outline i, .custom-btn-outline svg, 
    .custom-btn-danger i, .custom-btn-danger svg {
      color: inherit !important;
      fill: none !important;
      stroke: currentColor !important;
      stroke-width: 2px !important;
      transition: all 0.3s ease !important;
    }
    .custom-btn-outline:hover, .custom-btn-danger:hover {
      transform: translateY(-2px);
      color: #ffffff !important;
    }
    .custom-btn-outline:hover {
      background: #1ea8e7 !important;
      box-shadow: 0 4px 12px rgba(30, 168, 231, 0.2) !important;
    }
    .custom-btn-danger:hover {
      background: #cf2637 !important;
      box-shadow: 0 4px 12px rgba(207, 38, 55, 0.2) !important;
    }
    .custom-btn-outline:hover svg, .custom-btn-danger:hover svg {
      stroke: #ffffff !important;
    }
    .custom-btn-solid {
      background: #1ea8e7 !important;
      border: 1px solid #1ea8e7 !important;
      color: #ffffff !important;
      border-radius: 50px !important;
      padding: 0.6rem 1.5rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
    }
    .custom-btn-solid:hover {
      background: #0091d5 !important;
      border-color: #0091d5 !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(30, 168, 231, 0.3) !important;
    }
    .pill-input {
      border-radius: 1rem !important;
      padding: 0.45rem 1rem !important;
      border: 1px solid #e2e8f0 !important;
      background-color: #f8fafc !important;
      font-size: 0.9rem !important;
      height: 45px !important;
      transition: all 0.2s ease !important;
    }
    .pill-input:focus {
      border-color: #1ea8e7 !important;
      box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.1) !important;
      outline: none !important;
    }
    textarea.pill-input {
      height: auto !important;
      min-height: 100px !important;
    }
    .section-title {
      font-weight: 700 !important;
      color: #1e293b !important;
      margin-bottom: 1.5rem !important;
      position: relative;
      padding-left: 12px;
    }
    .section-title::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 18px;
      background: #1ea8e7;
      border-radius: 2px;
    }
    .public-link-banner {
      background: linear-gradient(135deg, #1ea8e7 0%, #0091d5 100%) !important;
      color: white !important;
      border: none !important;
      border-radius: 1rem !important;
      padding: 1rem 1.5rem !important;
      box-shadow: 0 4px 15px rgba(30, 168, 231, 0.2) !important;
    }
    .public-link-banner a {
      color: white !important;
      text-decoration: underline !important;
      font-weight: 600 !important;
    }
    @media (max-width: 768px) {
      .button-group-responsive {
        flex-direction: column !important;
        width: 100% !important;
        gap: 12px !important;
      }
      .button-group-responsive button, .button-group-responsive a {
        width: 100% !important;
        justify-content: center !important;
        padding: 0.75rem 1rem !important;
      }
      .pill-input {
        font-size: 16px !important;
        height: 45px !important;
      }
      .page-title-container h1 {
        font-size: 1.75rem !important;
      }
      .sticky-top-mobile-fix {
        position: relative !important;
        top: 0 !important;
        margin-top: 2rem;
      }
    }
  `;

const ManageWebsite = () => {
  const title = 'Manage Website';
  const description = 'Update restaurant details, story, testimonials and social links.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'admin', text: 'Admin' },
    { to: 'admin/manage-website', title: 'Manage Website' },
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allDishes, setAllDishes] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [aboutImageFile, setAboutImageFile] = useState(null);
  const [legacyImageFile, setLegacyImageFile] = useState(null);

  const { currentUser } = React.useContext(AuthContext);
  const restaurant_code = currentUser?.restaurant_code;
  const publicLink = restaurant_code ? `http://localhost:5173/${restaurant_code}` : '';

  const formik = useFormik({
    initialValues: {
      restaurant_name: '',
      restaurant_address: '',
      contact_email: '',
      contact_phone: '',
      open_days: 'Monday-Saturday',
      open_time_from: '11:00',
      open_time_to: '23:00',
      opening_hours: [],
      featured_dish_ids: [],
      hero_title: '',
      hero_subtitle: '',
      hero_details: '',
      hero_image: '',
      about_title: '',
      about_details: '',
      about_image: '',
      legacy_title: '',
      legacy_details: '',
      legacy_image: '',
      legacy_years: '',
      contact_details: '',
      map_location: '',
      logo: '',
      testimonials: [],
      social_links: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        let uploadedLogo = values.logo;
        if (logoFile) {
          const formData = new FormData();
          formData.append('logo', logoFile);
          const uploadRes = await axios.post(`${process.env.REACT_APP_API}/upload/uploadlogo`, formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
          });
          if (uploadRes.data?.logo) uploadedLogo = uploadRes.data.logo;
        }

        let uploadedHeroImg = values.hero_image;
        if (heroImageFile) {
          const formData = new FormData();
          formData.append('logo', heroImageFile);
          const uploadRes = await axios.post(`${process.env.REACT_APP_API}/upload/uploadlogo`, formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
          });
          if (uploadRes.data?.logo) uploadedHeroImg = uploadRes.data.logo;
        }

        let uploadedAboutImg = values.about_image;
        if (aboutImageFile) {
          const formData = new FormData();
          formData.append('logo', aboutImageFile);
          const uploadRes = await axios.post(`${process.env.REACT_APP_API}/upload/uploadlogo`, formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
          });
          if (uploadRes.data?.logo) uploadedAboutImg = uploadRes.data.logo;
        }

        let uploadedLegacyImg = values.legacy_image;
        if (legacyImageFile) {
          const formData = new FormData();
          formData.append('logo', legacyImageFile);
          const uploadRes = await axios.post(`${process.env.REACT_APP_API}/upload/uploadlogo`, formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
          });
          if (uploadRes.data?.logo) uploadedLegacyImg = uploadRes.data.logo;
        }

        const payload = {
          ...values,
          logo: uploadedLogo,
          hero_image: uploadedHeroImg,
          about_image: uploadedAboutImg,
          legacy_image: uploadedLegacyImg,
          featured_dish_ids: JSON.stringify(values.featured_dish_ids),
          opening_hours: JSON.stringify(values.opening_hours),
          testimonials: JSON.stringify(values.testimonials),
          social_links: JSON.stringify(values.social_links),
        };

        await axios.post(`${process.env.REACT_APP_API}/website/settings`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        toast.success('Website settings updated successfully.');
      } catch (err) {
        console.error('Failed to update:', err);
        const errMsg = err.response?.data?.details || err.response?.data?.error || 'Update failed.';
        toast.error(errMsg);
      } finally {
        setSaving(false);
      }
    },
  });

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const settingsRes = await axios.get(`${process.env.REACT_APP_API}/website/settings`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (settingsRes.data) {
          Object.keys(settingsRes.data).forEach((key) => {
            if (key in formik.initialValues) {
              const arrayFields = ['featured_dish_ids', 'opening_hours', 'testimonials', 'social_links'];
              if (arrayFields.includes(key)) {
                try {
                  const val = typeof settingsRes.data[key] === 'string' 
                    ? JSON.parse(settingsRes.data[key]) 
                    : settingsRes.data[key];
                  setFieldValue(key, Array.isArray(val) ? val : []);
                } catch (e) {
                  setFieldValue(key, []);
                }
              } else {
                setFieldValue(key, settingsRes.data[key] || '');
              }
            }
          });
        }

        const dishesRes = await axios.get(`${process.env.REACT_APP_API}/website/dishes`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAllDishes(dishesRes.data);
      } catch (err) {
        console.log(err);
        toast.error('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDishSelect = (id) => {
    const ids = values.featured_dish_ids.includes(id)
      ? values.featured_dish_ids.filter((d) => d !== id)
      : [...values.featured_dish_ids, id];
    setFieldValue('featured_dish_ids', ids);
  };

  const addOpeningSlot = () => setFieldValue('opening_hours', [...values.opening_hours, { day: '', from: '', to: '' }]);
  const removeOpeningSlot = (index) => setFieldValue('opening_hours', values.opening_hours.filter((_, i) => i !== index));

  const addSocial = () => setFieldValue('social_links', [...values.social_links, { platform: '', url: '', logo: '' }]);
  const removeSocial = (index) => setFieldValue('social_links', values.social_links.filter((_, i) => i !== index));

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <h5>Loading Settings...</h5>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      <div className="page-title-container mb-4">
        <Row className="g-3 align-items-center">
          <Col xs={12} md={7}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      {restaurant_code && (
        <Alert className="public-link-banner mb-4 d-flex flex-column flex-md-row align-items-md-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <CsLineIcons icon="link" size="20" stroke="white" />
            <strong className="me-1">Public Website Link:</strong>
          </div>
          <div className="text-truncate">
            <a href={publicLink} target="_blank" rel="noopener noreferrer">{publicLink}</a>
          </div>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">
          <Col lg={8}>
            {/* General Settings */}
            <Card className="glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <h5 className="section-title">General Information</h5>
                <Row className="g-3">
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Restaurant Name</Form.Label>
                      <Form.Control className="pill-input" name="restaurant_name" value={values.restaurant_name} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Address</Form.Label>
                      <Form.Control className="pill-input" name="restaurant_address" value={values.restaurant_address} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Email</Form.Label>
                      <Form.Control className="pill-input" name="contact_email" value={values.contact_email} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Phone</Form.Label>
                      <Form.Control className="pill-input" name="contact_phone" value={values.contact_phone} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Logo Image</Form.Label>
                      <Form.Control className="pill-input" type="file" onChange={(e) => setLogoFile(e.target.files[0])} />
                      {values.logo && <div className="mt-1 small text-muted">Current: {values.logo}</div>}
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Hero Section */}
            <Card className="glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <h5 className="section-title">Hero Section (Home Page Top)</h5>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Hero Main Title</Form.Label>
                  <Form.Control className="pill-input" name="hero_title" value={values.hero_title} onChange={handleChange} placeholder="Welcome to..." />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Hero Subtitle</Form.Label>
                  <Form.Control className="pill-input" name="hero_subtitle" value={values.hero_subtitle} onChange={handleChange} placeholder="Delicious. Authentic. Fresh." />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Hero Description</Form.Label>
                  <Form.Control className="pill-input" name="hero_details" as="textarea" rows={2} value={values.hero_details} onChange={handleChange} />
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">Hero Background Image</Form.Label>
                  <Form.Control className="pill-input" type="file" onChange={(e) => setHeroImageFile(e.target.files[0])} />
                  {values.hero_image && <div className="mt-1 small text-muted">Current: {values.hero_image}</div>}
                  <div className="text-muted small mt-1">Leave empty to use the default professional 3D restaurant scene.</div>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Our Legacy Section */}
            <Card className="glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <h5 className="section-title">Our Legacy (History Section)</h5>
                <Row className="g-3">
                  <Col xs={12} md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">Legacy Section Title</Form.Label>
                      <Form.Control className="pill-input" name="legacy_title" value={values.legacy_title} onChange={handleChange} placeholder="Our Legacy" />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">Years of Legacy</Form.Label>
                      <Form.Control className="pill-input" name="legacy_years" value={values.legacy_years} onChange={handleChange} placeholder="e.g. 15+" />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Legacy Description</Form.Label>
                  <Form.Control className="pill-input" name="legacy_details" as="textarea" rows={4} value={values.legacy_details} onChange={handleChange} />
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">Legacy Section Image</Form.Label>
                  <Form.Control className="pill-input" type="file" onChange={(e) => setLegacyImageFile(e.target.files[0])} />
                  {values.legacy_image && <div className="mt-1 small text-muted">Current: {values.legacy_image}</div>}
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Map Location */}
            <Card className="glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <h5 className="section-title">Map Location</h5>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Google Maps Embed Link / URL</Form.Label>
                  <Form.Control
                    className="pill-input"
                    name="map_location"
                    as="textarea"
                    rows={2}
                    value={values.map_location}
                    onChange={handleChange}
                    placeholder="Paste the <iframe src='...'> or just the map link here"
                  />
                  <div className="text-muted small mt-1">
                    To get this: Go to Google Maps → Search your restaurant → Share → Embed a map → Copy the 'src' link inside the iframe.
                  </div>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Social Links */}
            <Card className="glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <div className="d-flex button-group-responsive justify-content-between align-items-md-center mb-4">
                  <h5 className="section-title mb-0">Social Media Accounts</h5>
                  <Button 
                    className="custom-btn-outline" 
                    onClick={addSocial}
                  >
                    <CsLineIcons icon="plus" size="15" className="me-2" /> Add Account
                  </Button>
                </div>
                {values.social_links.map((s, index) => (
                  <div key={index} className="p-3 mb-3 rounded-xl border bg-light position-relative">
                    <Row className="g-3 align-items-center">
                      <Col xs={12} md={4}>
                        <Form.Select className="pill-input" value={s.platform} onChange={(e) => {
                          const newSocials = [...values.social_links];
                          newSocials[index].platform = e.target.value;
                          setFieldValue('social_links', newSocials);
                        }}>
                          <option value="">Select Platform</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Twitter">Twitter (X)</option>
                          <option value="Youtube">Youtube</option>
                        </Form.Select>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Control className="pill-input" placeholder="Profile URL / Phone Number" value={s.url} onChange={(e) => {
                          const newSocials = [...values.social_links];
                          newSocials[index].url = e.target.value;
                          setFieldValue('social_links', newSocials);
                        }} />
                      </Col>
                      <Col xs={12} md={2} className="text-md-end">
                        <Button 
                          variant="none" 
                          className="custom-btn-danger custom-btn-circle ms-md-auto w-100 w-md-auto" 
                          onClick={() => removeSocial(index)}
                        >
                          <CsLineIcons icon="bin" size="15" />
                        </Button>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Opening Hours */}
            <Card className="glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="section-title mb-0">Opening Times</h5>
                  <Button 
                    variant="link" 
                    className="text-primary p-0 text-decoration-none fw-bold small" 
                    onClick={addOpeningSlot}
                  >
                    Add Slot
                  </Button>
                </div>
                {values.opening_hours.map((h, index) => (
                  <div key={index} className="mb-4 pb-4 border-bottom position-relative">
                    <Button 
                      variant="none" 
                      className="custom-btn-danger custom-btn-circle position-absolute" 
                      style={{ top: '-10px', right: '-10px' }} 
                      onClick={() => removeOpeningSlot(index)}
                    >
                      <CsLineIcons icon="close" size="10" />
                    </Button>
                    <Form.Select className="pill-input mb-3" value={h.day} onChange={(e) => {
                      const newHours = [...values.opening_hours];
                      newHours[index].day = e.target.value;
                      setFieldValue('opening_hours', newHours);
                    }}>
                      <option value="">Select Day(s)</option>
                      <option value="Monday - Friday">Monday - Friday</option>
                      <option value="Monday - Saturday">Monday - Saturday</option>
                      <option value="Everyday">Everyday</option>
                      <option value="Weekend">Weekend</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </Form.Select>
                    <Row className="g-2">
                      <Col xs={6}>
                        <Form.Control className="pill-input" type="time" value={h.from} onChange={(e) => {
                          const newHours = [...values.opening_hours];
                          newHours[index].from = e.target.value;
                          setFieldValue('opening_hours', newHours);
                        }} />
                      </Col>
                      <Col xs={6}>
                        <Form.Control className="pill-input" type="time" value={h.to} onChange={(e) => {
                          const newHours = [...values.opening_hours];
                          newHours[index].to = e.target.value;
                          setFieldValue('opening_hours', newHours);
                        }} />
                      </Col>
                    </Row>
                  </div>
                ))}
              </Card.Body>
            </Card>

            {/* Featured Menu Items */}
            <Card className="glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <h5 className="section-title">Featured on Home Page</h5>
                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                  {allDishes.map((menu) => (
                    <div key={menu.category} className="mb-4">
                      <div className="fw-bold small text-primary text-uppercase mb-2 ls-1">{menu.category}</div>
                      {menu.dishes.map((dish) => (
                        <div key={dish._id} className="mb-2">
                          <Form.Check
                            type="checkbox"
                            id={`dish-${dish._id}`}
                            label={<span className="text-dark small fw-medium">{dish.dish_name}</span>}
                            checked={values.featured_dish_ids.includes(dish._id)}
                            onChange={() => handleDishSelect(dish._id)}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <div className="sticky-top sticky-top-mobile-fix" style={{ top: '100px' }}>
              <Button className="custom-btn-outline w-100" type="submit" disabled={saving}>
                {saving ? <Spinner size="sm" className="me-2" /> : <CsLineIcons icon="save" size="15" className="me-2" />}
                Save All Changes
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </>
  );
};

export default ManageWebsite;