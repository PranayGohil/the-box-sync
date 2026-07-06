import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Alert, Modal } from 'react-bootstrap';
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
  contact_phone: Yup.string()
    .matches(/^[0-9]+$/, 'Phone number must contain only digits')
    .required('Phone is required'),
  open_days: Yup.string().required('Open days are required'),
  open_time_from: Yup.string().required('Opening time is required'),
  open_time_to: Yup.string().required('Closing time is required'),
  social_links: Yup.array().of(
    Yup.object().shape({
      platform: Yup.string().required('Platform is required'),
      url: Yup.string()
        .required('URL or Phone number is required')
        .test('social-type-validation', 'Invalid format', function (value) {
          const { platform } = this.parent;
          if (!value) return true;

          if (platform === 'WhatsApp') {
            const phoneRegex = /^[0-9]{10,15}$/;
            if (!phoneRegex.test(value)) {
              return this.createError({ message: 'WhatsApp must be a 10 to 15 digit phone number' });
            }
          } else {
            const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/;
            if (!urlRegex.test(value)) {
              return this.createError({ message: `Must be a valid ${platform || 'social'} link (e.g. https://${(platform || 'social').toLowerCase()}.com/username)` });
            }
          }
          return true;
        }),
    })
  ),
  latitude: Yup.number().typeError('Latitude must be a number').nullable(),
  longitude: Yup.number().typeError('Longitude must be a number').nullable(),
});

const ManageWebsite = () => {
  const history = useHistory();
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
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isWideLogo, setIsWideLogo] = useState(false);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [aboutImageFile, setAboutImageFile] = useState(null);
  const [legacyImageFile, setLegacyImageFile] = useState(null);
  const [hasReservationPlan, setHasReservationPlan] = useState(false);

  // States for Map Picker
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [tempLat, setTempLat] = useState('');
  const [tempLng, setTempLng] = useState('');
  const mapInstance = React.useRef(null);

  const { currentUser } = React.useContext(AuthContext);
  const restaurant_code = currentUser?.restaurant_code;
  const publicLink = restaurant_code ? `${process.env.REACT_APP_WEBSITE_URL}/${restaurant_code}` : '';

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
      legacy_layout: 'image-right',
      legacy_bullets: [],
      contact_details: '',
      map_location: '',
      latitude: '',
      longitude: '',
      logo: '',
      testimonials: [],
      social_links: [],
      show_reservation: true,
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
          legacy_bullets: JSON.stringify(values.legacy_bullets),
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
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (settingsRes.data) {
          setHasReservationPlan(!!settingsRes.data.has_reservation_plan);
          Object.keys(settingsRes.data).forEach((key) => {
            if (key in formik.initialValues) {
              const arrayFields = ['featured_dish_ids', 'opening_hours', 'testimonials', 'social_links', 'legacy_bullets'];
              if (arrayFields.includes(key)) {
                try {
                  const val = typeof settingsRes.data[key] === 'string' ? JSON.parse(settingsRes.data[key]) : settingsRes.data[key];
                  setFieldValue(key, Array.isArray(val) ? val : []);
                } catch (e) {
                  setFieldValue(key, []);
                }
              } else if (key === 'show_reservation') {
                setFieldValue(key, settingsRes.data[key] !== undefined ? settingsRes.data[key] : true);
              } else {
                setFieldValue(key, settingsRes.data[key] || '');
              }
            }
          });
          if (settingsRes.data.logo) {
            setLogoPreview(`${process.env.REACT_APP_UPLOAD_DIR}/${settingsRes.data.logo}`);
          }
        }

        const dishesRes = await axios.get(`${process.env.REACT_APP_API}/website/dishes`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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

  // Leaflet map loader for Admin
  useEffect(() => {
    if (!showMapModal) return;

    // Load Leaflet css
    let leafletCss = document.getElementById('leaflet-css-admin');
    if (!leafletCss) {
      leafletCss = document.createElement('link');
      leafletCss.id = 'leaflet-css-admin';
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCss);
    }

    // Load Leaflet js
    let leafletJs = document.getElementById('leaflet-js-admin');
    if (!leafletJs) {
      leafletJs = document.createElement('script');
      leafletJs.id = 'leaflet-js-admin';
      leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.head.appendChild(leafletJs);
    }

    let activeMarker = null;

    const initMap = () => {
      if (!window.L || !document.getElementById('admin-map-container')) return;
      
      const defaultLat = tempLat || 23.0225;
      const defaultLng = tempLng || 72.5714;
      
      const map = window.L.map('admin-map-container').setView([defaultLat, defaultLng], 14);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Create marker
      if (tempLat && tempLng) {
        activeMarker = window.L.marker([tempLat, tempLng]).addTo(map);
      }

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (activeMarker) {
          activeMarker.setLatLng(e.latlng);
        } else {
          activeMarker = window.L.marker(e.latlng).addTo(map);
        }
        setTempLat(lat);
        setTempLng(lng);
      });

      mapInstance.current = map;
    };

    if (window.L) {
      setTimeout(initMap, 150);
    } else {
      leafletJs.onload = () => setTimeout(initMap, 150);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [showMapModal]);

  const handleSearchAdminLocation = async (e) => {
    if (e) e.preventDefault();
    if (!mapSearchQuery.trim() || !mapInstance.current) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const numLat = Number(lat);
        const numLon = Number(lon);
        mapInstance.current.setView([numLat, numLon], 15);
        setTempLat(numLat);
        setTempLng(numLon);
        
        if (window.L) {
          mapInstance.current.fireEvent('click', { latlng: window.L.latLng(numLat, numLon) });
        }
        toast.success('Location found on map!');
      } else {
        toast.error('Location not found.');
      }
    } catch (err) {
      toast.error('Search failed.');
    }
  };

  const handleDishSelect = (id) => {
    const ids = values.featured_dish_ids.includes(id) ? values.featured_dish_ids.filter((d) => d !== id) : [...values.featured_dish_ids, id];
    setFieldValue('featured_dish_ids', ids);
  };

  const convertToWebPAndResize = (file, maxSizeBytes = 500 * 1024) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            const maxDimension = 1920;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            let quality = 0.9;
            const attemptCompression = (q) => {
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    resolve(file);
                    return;
                  }
                  if (blob.size <= maxSizeBytes || q <= 0.1) {
                    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    const newFileName = `${originalName}.webp`;
                    const compressedFile = new File([blob], newFileName, {
                      type: 'image/webp',
                      lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                  } else {
                    attemptCompression(q - 0.1);
                  }
                },
                'image/webp',
                q
              );
            };

            attemptCompression(quality);
          } catch (e) {
            console.error('Error during canvas processing:', e);
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleLogoChange = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    let processedFile = file;
    try {
      processedFile = await convertToWebPAndResize(file);
    } catch (err) {
      console.error('Failed to process logo image:', err);
    }
    setLogoFile(processedFile);
    setLogoPreview(URL.createObjectURL(processedFile));
    setUploadingLogo(false);
  };

  const addOpeningSlot = () => setFieldValue('opening_hours', [...values.opening_hours, { day: '', from: '', to: '' }]);
  const removeOpeningSlot = (index) =>
    setFieldValue(
      'opening_hours',
      values.opening_hours.filter((_, i) => i !== index)
    );

  const addSocial = () => setFieldValue('social_links', [...values.social_links, { platform: '', url: '', logo: '' }]);
  const removeSocial = (index) =>
    setFieldValue(
      'social_links',
      values.social_links.filter((_, i) => i !== index)
    );

  const addLegacyBullet = () => setFieldValue('legacy_bullets', [...values.legacy_bullets, { icon: 'Heart', label: '' }]);
  const removeLegacyBullet = (index) =>
    setFieldValue(
      'legacy_bullets',
      values.legacy_bullets.filter((_, i) => i !== index)
    );

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
      <HtmlHead title={title} description={description} />
      <div className="container-fluid ps-lg-4 pe-lg-5">
        <div className="page-title-container mb-4 mt-0 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
                {title}
              </h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="auto" className="d-none d-lg-block">
              <Button
                onClick={() => history.goBack()}
                className="manage-menu-custom-btn-outline shadow-sm px-4 py-2 d-flex align-items-center border-2"
                style={{ borderRadius: '50px', borderColor: '#1ea8e7', color: '#1ea8e7', fontWeight: '700' }}
              >
                <CsLineIcons icon="arrow-left" size="18" className="me-2" /> Back
              </Button>
            </Col>
          </Row>

          <div className="mt-2 d-lg-none d-flex justify-content-start">
            <Button
              onClick={() => history.goBack()}
              className="manage-menu-custom-btn-outline shadow-sm px-4 py-2 d-flex align-items-center border-2"
              style={{ borderRadius: '50px', borderColor: '#1ea8e7', color: '#1ea8e7', fontWeight: '700' }}
            >
              <CsLineIcons icon="arrow-left" size="16" className="me-2" /> <span className="small">Back</span>
            </Button>
          </div>
        </div>

        {restaurant_code && (
          <Alert className="manage-website-public-link-banner mb-4 d-flex flex-column flex-md-row align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <CsLineIcons icon="link" size="20" stroke="white" />
              <strong className="me-1">Public Website Link:</strong>
            </div>
            <div className="text-truncate">
              <a href={publicLink} target="_blank" rel="noopener noreferrer">
                {publicLink}
              </a>
            </div>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="g-4">
            <Col lg={8}>
              {/* General Settings */}
              <Card className="manage-website-glass-card mb-4 border-0">
                <Card.Body className="p-4">
                  <h5 className="manage-website-section-title">General Information</h5>
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted">Restaurant Name</Form.Label>
                        <Form.Control
                          className="manage-website-pill-input"
                          name="restaurant_name"
                          value={values.restaurant_name}
                          onChange={handleChange}
                          isInvalid={touched.restaurant_name && errors.restaurant_name}
                        />
                        <Form.Control.Feedback type="invalid">{errors.restaurant_name}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted">Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          className="manage-website-pill-input"
                          name="restaurant_address"
                          value={values.restaurant_address}
                          onChange={handleChange}
                          isInvalid={touched.restaurant_address && errors.restaurant_address}
                        />
                        <Form.Control.Feedback type="invalid">{errors.restaurant_address}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted">Email</Form.Label>
                        <Form.Control
                          className="manage-website-pill-input"
                          name="contact_email"
                          value={values.contact_email}
                          onChange={handleChange}
                          isInvalid={touched.contact_email && errors.contact_email}
                        />
                        <Form.Control.Feedback type="invalid">{errors.contact_email}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted">Phone</Form.Label>
                        <Form.Control
                          className="manage-website-pill-input"
                          name="contact_phone"
                          value={values.contact_phone}
                          onChange={handleChange}
                          isInvalid={touched.contact_phone && errors.contact_phone}
                        />
                        <Form.Control.Feedback type="invalid">{errors.contact_phone}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    {hasReservationPlan && (
                      <Col xs={12} className="mb-4">
                        <div className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                          <div>
                            <span className="small fw-bold text-muted d-block mb-1" style={{ letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '11px' }}>Feature Settings</span>
                            <div className="fw-bold text-dark" style={{ fontSize: '15px' }}>Table Reservation Functionality</div>
                            <div className="text-muted mt-1" style={{ fontSize: '12px', lineHeight: '1.4' }}>Display the table booking page and reservation widgets on your public website.</div>
                          </div>
                          <div style={{ paddingLeft: '15px' }}>
                            <Form.Check
                              type="switch"
                              id="show_reservation"
                              name="show_reservation"
                              label=""
                              checked={values.show_reservation}
                              onChange={(e) => setFieldValue('show_reservation', e.target.checked)}
                              style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                      </Col>
                    )}
                    <Col xs={12}>
                      <Form.Group className="d-flex flex-column align-items-center mb-3">
                        <Form.Label className="small fw-bold text-muted text-center w-100 mb-3">Logo Image</Form.Label>
                        <div
                          className={`border border-3 border-light overflow-hidden shadow-sm bg-light d-flex align-items-center justify-content-center mb-3 ${isWideLogo ? 'rounded-3' : 'rounded-circle'}`}
                          style={isWideLogo ? { width: '200px', height: '100px' } : { width: '120px', height: '120px' }}
                        >
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Logo"
                              style={isWideLogo ? { width: '100%', height: '100%', objectFit: 'contain' } : { width: '100%', height: '100%', objectFit: 'cover' }}
                              onLoad={(e) => {
                                const { naturalWidth, naturalHeight } = e.target;
                                setIsWideLogo(naturalWidth >= naturalHeight * 1.8);
                              }}
                            />
                          ) : (
                            <CsLineIcons icon="image" size="48" className="text-muted opacity-20" />
                          )}
                        </div>
                        <Form.Control
                          type="file"
                          id="logo-upload"
                          className="d-none"
                          accept="image/*"
                          onChange={(e) => handleLogoChange(e.target.files[0])}
                        />
                        <Button
                          as="label"
                          htmlFor="logo-upload"
                          className="manage-website-custom-btn-outline px-4 py-2 border-2 d-inline-flex align-items-center"
                          style={{ borderRadius: '50px', borderColor: '#1ea8e7', color: '#1ea8e7', fontWeight: '700', cursor: 'pointer', maxWidth: 'fit-content' }}
                          disabled={saving || uploadingLogo}
                        >
                          {uploadingLogo ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" className="me-2" />}
                          {logoPreview ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Hero Section */}
              <Card className="manage-website-glass-card mb-4 border-0">
                <Card.Body className="p-4">
                  <h5 className="manage-website-section-title">Hero Section (Home Page Top)</h5>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Hero Main Title</Form.Label>
                    <Form.Control
                      className="manage-website-pill-input"
                      name="hero_title"
                      value={values.hero_title}
                      onChange={handleChange}
                      placeholder="Welcome to..."
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Hero Subtitle</Form.Label>
                    <Form.Control
                      className="manage-website-pill-input"
                      name="hero_subtitle"
                      value={values.hero_subtitle}
                      onChange={handleChange}
                      placeholder="Delicious. Authentic. Fresh."
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Hero Description</Form.Label>
                    <Form.Control
                      className="manage-website-pill-input"
                      name="hero_details"
                      as="textarea"
                      rows={2}
                      value={values.hero_details}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">Hero Background Image</Form.Label>
                    <Form.Control className="manage-website-pill-input" type="file" onChange={(e) => setHeroImageFile(e.target.files[0])} />
                    {values.hero_image && <div className="mt-1 small text-muted">Current: {values.hero_image}</div>}
                    <div className="text-muted small mt-1">Leave empty to use the default professional 3D restaurant scene.</div>
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Our Legacy Section */}
              <Card className="manage-website-glass-card mb-4 border-0">
                <Card.Body className="p-4">
                  <h5 className="manage-website-section-title">Our Legacy (History Section)</h5>
                  <Row className="g-3">
                    <Col xs={12} md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Legacy Section Title</Form.Label>
                        <Form.Control
                          className="manage-website-pill-input"
                          name="legacy_title"
                          value={values.legacy_title}
                          onChange={handleChange}
                          placeholder="Our Legacy"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Years of Legacy</Form.Label>
                        <Form.Control
                          className="manage-website-pill-input"
                          name="legacy_years"
                          value={values.legacy_years}
                          onChange={handleChange}
                          placeholder="e.g. 15+"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Layout Style</Form.Label>
                    <Form.Select
                      className="manage-website-pill-input"
                      name="legacy_layout"
                      value={values.legacy_layout}
                      onChange={handleChange}
                    >
                      <option value="image-right">Text Left, Image Right</option>
                      <option value="image-left">Image Left, Text Right</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Legacy Description</Form.Label>
                    <Form.Control
                      className="manage-website-pill-input"
                      name="legacy_details"
                      as="textarea"
                      rows={4}
                      value={values.legacy_details}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Legacy Section Image</Form.Label>
                    <Form.Control className="manage-website-pill-input" type="file" onChange={(e) => setLegacyImageFile(e.target.files[0])} />
                    {values.legacy_image && <div className="mt-1 small text-muted">Current: {values.legacy_image}</div>}
                  </Form.Group>
                  
                  <div className="d-flex justify-content-between align-items-center mb-2 mt-4">
                    <Form.Label className="small fw-bold text-muted mb-0">Feature Bullets</Form.Label>
                    <Button variant="link" className="text-primary p-0 text-decoration-none fw-bold small" onClick={addLegacyBullet}>
                      + Add Bullet
                    </Button>
                  </div>
                  {values.legacy_bullets.map((b, index) => (
                    <div key={index} className="p-3 mb-2 rounded bg-light border position-relative">
                      <Row className="g-2 align-items-center">
                        <Col xs={12} md={4}>
                          <Form.Select
                            className="manage-website-pill-input"
                            value={b.icon}
                            onChange={(e) => {
                              const newBullets = [...values.legacy_bullets];
                              newBullets[index].icon = e.target.value;
                              setFieldValue('legacy_bullets', newBullets);
                            }}
                          >
                            <option value="Heart">Heart</option>
                            <option value="Award">Award</option>
                            <option value="Leaf">Leaf (Fresh)</option>
                            <option value="Users">Users (Community)</option>
                            <option value="Star">Star</option>
                            <option value="Check">Checkmark</option>
                          </Form.Select>
                        </Col>
                        <Col xs={12} md={7}>
                          <Form.Control
                            className="manage-website-pill-input"
                            placeholder="Bullet Text (e.g. Made with Passion)"
                            value={b.label}
                            onChange={(e) => {
                              const newBullets = [...values.legacy_bullets];
                              newBullets[index].label = e.target.value;
                              setFieldValue('legacy_bullets', newBullets);
                            }}
                          />
                        </Col>
                        <Col xs={12} md={1} className="text-end">
                          <Button
                            variant="none"
                            className="text-danger p-0 border-0 bg-transparent"
                            onClick={() => removeLegacyBullet(index)}
                          >
                            <CsLineIcons icon="bin" size="15" />
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </Card.Body>
              </Card>

              {/* Map Location */}
              <Card className="manage-website-glass-card mb-4 border-0">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <h5 className="manage-website-section-title mb-0">Map Location</h5>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="manage-menu-custom-btn-outline px-3 py-1.5"
                        style={{ fontSize: '11px', borderRadius: '50px' }}
                        onClick={() => {
                          setTempLat(values.latitude || 23.0225);
                          setTempLng(values.longitude || 72.5714);
                          setShowMapModal(true);
                        }}
                      >
                        <CsLineIcons icon="pin" size="12" className="me-1" /> Choose on Map
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="manage-menu-custom-btn-outline px-3 py-1.5"
                        style={{ fontSize: '11px', borderRadius: '50px' }}
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setFieldValue('latitude', position.coords.latitude);
                                setFieldValue('longitude', position.coords.longitude);
                                toast.success('Coordinates detected successfully!');
                              },
                              (error) => {
                                toast.error('Permission denied or location unavailable.');
                              }
                            );
                          } else {
                            toast.error('Geolocation is not supported by your browser.');
                          }
                        }}
                      >
                        <CsLineIcons icon="location" size="12" className="me-1" /> Detect Location
                      </Button>
                    </div>
                  </div>
                  
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Google Maps Embed Link / URL</Form.Label>
                    <Form.Control
                      className="manage-website-pill-input"
                      name="map_location"
                      as="textarea"
                      rows={2}
                      value={values.map_location}
                      onChange={handleChange}
                      placeholder="Paste the <iframe src='...'> or just the map link here"
                    />
                  </Form.Group>

                  <Row className="g-3">
                    <Col xs="6">
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted">Latitude</Form.Label>
                        <Form.Control
                          type="text"
                          className="manage-website-pill-input"
                          name="latitude"
                          value={values.latitude}
                          onChange={handleChange}
                          isInvalid={touched.latitude && !!errors.latitude}
                          placeholder="e.g. 23.0225"
                        />
                        <Form.Control.Feedback type="invalid">{errors.latitude}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs="6">
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted">Longitude</Form.Label>
                        <Form.Control
                          type="text"
                          className="manage-website-pill-input"
                          name="longitude"
                          value={values.longitude}
                          onChange={handleChange}
                          isInvalid={touched.longitude && !!errors.longitude}
                          placeholder="e.g. 72.5714"
                        />
                        <Form.Control.Feedback type="invalid">{errors.longitude}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Social Links */}
              <Card className="manage-website-glass-card mb-4 border-0">
                <Card.Body className="p-4">
                  <div className="d-flex manage-website-button-group-responsive justify-content-between align-items-md-center mb-4">
                    <h5 className="manage-website-section-title mb-0">Social Media Accounts</h5>
                    <Button className="manage-website-custom-btn-outline" onClick={addSocial}>
                      <CsLineIcons icon="plus" size="15" className="me-2" /> Add Account
                    </Button>
                  </div>
                  {values.social_links.map((s, index) => {
                    const platformError = errors.social_links?.[index]?.platform;
                    const platformTouched = touched.social_links?.[index]?.platform;
                    const urlError = errors.social_links?.[index]?.url;
                    const urlTouched = touched.social_links?.[index]?.url;

                    return (
                      <div key={index} className="p-3 mb-3 rounded-xl border bg-light position-relative">
                        <Row className="g-3 align-items-center">
                          <Col xs={12} md={4}>
                            <Form.Select
                              className="manage-website-pill-input"
                              value={s.platform}
                              onChange={(e) => {
                                const newSocials = [...values.social_links];
                                newSocials[index].platform = e.target.value;
                                setFieldValue('social_links', newSocials);
                              }}
                              isInvalid={platformTouched && platformError}
                            >
                              <option value="">Select Platform</option>
                              <option value="WhatsApp">WhatsApp</option>
                              <option value="Facebook">Facebook</option>
                              <option value="Instagram">Instagram</option>
                              <option value="Twitter">Twitter (X)</option>
                              <option value="Youtube">Youtube</option>
                            </Form.Select>
                            {platformTouched && platformError && (
                              <div className="text-danger mt-1 small ms-2">{platformError}</div>
                            )}
                          </Col>
                          <Col xs={12} md={6}>
                            <Form.Control
                              className="manage-website-pill-input"
                              placeholder="Profile URL / Phone Number"
                              value={s.url}
                              onChange={(e) => {
                                const newSocials = [...values.social_links];
                                newSocials[index].url = e.target.value;
                                setFieldValue('social_links', newSocials);
                              }}
                              isInvalid={urlTouched && urlError}
                            />
                            {urlTouched && urlError && (
                              <div className="text-danger mt-1 small ms-2">{urlError}</div>
                            )}
                          </Col>
                          <Col xs={12} md={2} className="text-md-end">
                            <Button
                              variant="none"
                              className="manage-website-custom-btn-danger manage-website-custom-btn-circle ms-md-auto w-100 w-md-auto"
                              onClick={() => removeSocial(index)}
                            >
                              <CsLineIcons icon="bin" size="15" />
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    );
                  })}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              {/* Opening Hours */}
              <Card className="manage-website-glass-card mb-4 border-0">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="manage-website-section-title mb-0">Opening Times</h5>
                    <Button variant="link" className="text-primary p-0 text-decoration-none fw-bold small" onClick={addOpeningSlot}>
                      Add Slot
                    </Button>
                  </div>
                  {values.opening_hours.map((h, index) => (
                    <div key={index} className="mb-4 pb-4 border-bottom position-relative">
                      <Button
                        variant="none"
                        className="manage-website-custom-btn-danger manage-website-custom-btn-circle position-absolute"
                        style={{ top: '-10px', right: '-10px' }}
                        onClick={() => removeOpeningSlot(index)}
                      >
                        <CsLineIcons icon="close" size="10" />
                      </Button>
                      <Form.Select
                        className="manage-website-pill-input mb-3"
                        value={h.day}
                        onChange={(e) => {
                          const newHours = [...values.opening_hours];
                          newHours[index].day = e.target.value;
                          setFieldValue('opening_hours', newHours);
                        }}
                      >
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
                          <Form.Control
                            className="manage-website-pill-input"
                            type="time"
                            value={h.from}
                            onChange={(e) => {
                              const newHours = [...values.opening_hours];
                              newHours[index].from = e.target.value;
                              setFieldValue('opening_hours', newHours);
                            }}
                          />
                        </Col>
                        <Col xs={6}>
                          <Form.Control
                            className="manage-website-pill-input"
                            type="time"
                            value={h.to}
                            onChange={(e) => {
                              const newHours = [...values.opening_hours];
                              newHours[index].to = e.target.value;
                              setFieldValue('opening_hours', newHours);
                            }}
                          />
                        </Col>
                      </Row>
                    </div>
                  ))}
                </Card.Body>
              </Card>

              {/* Featured Menu Items */}
              <Card className="manage-website-glass-card mb-4 border-0">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="manage-website-section-title mb-0">Today's Highlights</h5>
                  </div>
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
                  <Button
                    className="manage-website-custom-btn-outline border-2 w-100 mt-3 d-flex d-md-none align-items-center justify-content-center py-2"
                    type="submit"
                    disabled={saving}
                    style={{ borderRadius: '50px', borderColor: '#1ea8e7', color: '#1ea8e7' }}
                  >
                    {saving ? <Spinner size="sm" className="me-2" /> : <CsLineIcons icon="save" size="15" className="me-2" />}
                    Save All Changes
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>

        {/* Leaflet Map Picker Modal for Admin */}
        <Modal 
          show={showMapModal} 
          onHide={() => setShowMapModal(false)}
          size="lg"
          centered
          className="admin-map-picker-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Select Restaurant Pin Location</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Search Address Bar */}
            <Form onSubmit={handleSearchAdminLocation} className="d-flex gap-2 mb-3">
              <Form.Control 
                type="text" 
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                placeholder="Search area, landmark, street, city..."
                style={{ borderRadius: '50px' }}
              />
              <Button type="submit" variant="primary" style={{ borderRadius: '50px', whiteSpace: 'nowrap' }}>
                Search
              </Button>
            </Form>

            {/* Map Container */}
            <div 
              id="admin-map-container" 
              className="rounded border" 
              style={{ height: '350px', background: '#f5f5f5' }}
            />
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between align-items-center">
            <div>
              {tempLat && tempLng ? (
                <span className="small text-muted font-monospace">
                  Coords: {Number(tempLat).toFixed(5)}, {Number(tempLng).toFixed(5)}
                </span>
              ) : (
                <span className="small text-muted italic">Click on map to place pin marker</span>
              )}
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                style={{ borderRadius: '50px' }}
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const { latitude, longitude } = pos.coords;
                        setTempLat(latitude);
                        setTempLng(longitude);
                        if (mapInstance.current) {
                          mapInstance.current.setView([latitude, longitude], 15);
                          if (window.L) {
                            mapInstance.current.fireEvent('click', { latlng: window.L.latLng(latitude, longitude) });
                          }
                        }
                      },
                      (err) => toast.error('Error fetching current location')
                    );
                  } else {
                    toast.error('Geolocation is not supported by your browser.');
                  }
                }}
              >
                Locate Me
              </Button>
              <Button 
                variant="primary" 
                style={{ borderRadius: '50px' }}
                onClick={() => {
                  if (tempLat && tempLng) {
                    setFieldValue('latitude', tempLat);
                    setFieldValue('longitude', tempLng);
                    setShowMapModal(false);
                    // Autofill address via reverse geocode if desired
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempLat}&lon=${tempLng}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data && data.display_name) {
                          setFieldValue('restaurant_address', data.display_name);
                          toast.success('Address auto-filled from map pin!');
                        }
                      })
                      .catch(e => console.error(e));
                  } else {
                    toast.error('Please click on map to place a pin marker.');
                  }
                }}
              >
                Confirm Location
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default ManageWebsite;
