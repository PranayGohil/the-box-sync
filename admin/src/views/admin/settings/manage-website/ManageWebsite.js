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
              return this.createError({
                message: `Must be a valid ${platform || 'social'} link (e.g. https://${(platform || 'social').toLowerCase()}.com/username)`,
              });
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
  const [fileInputKey, setFileInputKey] = useState(0);
  const [hasReservationPlan, setHasReservationPlan] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);

  // States for Map Picker
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [tempLat, setTempLat] = useState('');
  const [tempLng, setTempLng] = useState('');
  const mapInstance = React.useRef(null);
  const markerInstance = React.useRef(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const { currentUser } = React.useContext(AuthContext);
  const restaurant_code = currentUser?.restaurant_code;
  const publicLink = restaurant_code ? `${process.env.REACT_APP_WEBSITE_URL}/${restaurant_code}` : '';

  const [settingsData, setSettingsData] = useState(null);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: settingsData || {
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
      contact_title: '',
      contact_subtitle: '',
      map_location: '',
      place_id: '',
      formatted_address: '',
      latitude: '',
      longitude: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      locality: '',
      sublocality: '',
      delivery: {
        enabled: false,
        max_distance: '',
        minimum_order: '',
        free_radius: '',
        charge_type: 'free',
        fixed_charge: '',
        slabs: [],
      },
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
        // Reset Formik with the new saved values
        formik.resetForm({
          values: {
            ...values,
            logo: uploadedLogo,
            hero_image: uploadedHeroImg,
            about_image: uploadedAboutImg,
            legacy_image: uploadedLegacyImg,
          },
        });

        // Reset local file states
        setLogoFile(null);
        setHeroImageFile(null);
        setAboutImageFile(null);
        setLegacyImageFile(null);

        // Increment key to reset file input elements
        setFileInputKey((prev) => prev + 1);

        setSettingsData(values);
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
          const defaultInitial = {
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
            contact_title: '',
            contact_subtitle: '',
            map_location: '',
            place_id: '',
            formatted_address: '',
            latitude: '',
            longitude: '',
            city: '',
            state: '',
            country: '',
            postal_code: '',
            locality: '',
            sublocality: '',
            delivery: {
              enabled: false,
              max_distance: '',
              minimum_order: '',
              free_radius: '',
              charge_type: 'free',
              fixed_charge: '',
              slabs: [],
            },
            logo: '',
            testimonials: [],
            social_links: [],
            show_reservation: true,
          };

          const parsedData = { ...defaultInitial };
          Object.keys(defaultInitial).forEach((key) => {
            if (key in settingsRes.data) {
              const arrayFields = ['featured_dish_ids', 'opening_hours', 'testimonials', 'social_links', 'legacy_bullets'];
              if (arrayFields.includes(key)) {
                try {
                  const val = typeof settingsRes.data[key] === 'string' ? JSON.parse(settingsRes.data[key]) : settingsRes.data[key];
                  parsedData[key] = Array.isArray(val) ? val : [];
                } catch (e) {
                  parsedData[key] = [];
                }
              } else if (key === 'show_reservation') {
                parsedData[key] = settingsRes.data[key] !== undefined ? settingsRes.data[key] : true;
              } else if (key === 'delivery') {
                const deliveryObj = settingsRes.data[key] || {};
                parsedData[key] = {
                  enabled: !!deliveryObj.enabled,
                  max_distance: deliveryObj.max_distance !== undefined && deliveryObj.max_distance !== null ? deliveryObj.max_distance : '',
                  minimum_order: deliveryObj.minimum_order !== undefined && deliveryObj.minimum_order !== null ? deliveryObj.minimum_order : '',
                  free_radius: deliveryObj.free_radius !== undefined && deliveryObj.free_radius !== null ? deliveryObj.free_radius : '',
                  charge_type: deliveryObj.charge_type || 'free',
                  fixed_charge: deliveryObj.fixed_charge !== undefined && deliveryObj.fixed_charge !== null ? deliveryObj.fixed_charge : '',
                  slabs: Array.isArray(deliveryObj.slabs) ? deliveryObj.slabs : [],
                };
              } else {
                parsedData[key] = settingsRes.data[key] || '';
              }
            }
          });
          setSettingsData(parsedData);

          if (settingsRes.data.logo) {
            setLogoPreview(`${process.env.REACT_APP_UPLOAD_DIR}/${settingsRes.data.logo}`);
          }
        }

        const dishesRes = await axios.get(`${process.env.REACT_APP_API}/website/dishes`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAllDishes(dishesRes.data);

        try {
          const feedbackRes = await axios.get(`${process.env.REACT_APP_API}/feedback/get?limit=100`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          setFeedbacks(feedbackRes.data?.feedbacks || []);
        } catch (fErr) {
          console.error('Failed to load feedbacks:', fErr);
        }
      } catch (err) {
        console.log(err);
        toast.error('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load Google Maps API Script
  useEffect(() => {
    const scriptId = 'google-maps-script-admin';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${
        process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
      }&libraries=places,geometry&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Google Maps picker modal initialization
  useEffect(() => {
    if (!showMapModal || !window.google) return () => {};

    const defaultLat = Number(tempLat) || 23.0225;
    const defaultLng = Number(tempLng) || 72.5714;
    const mapDiv = document.getElementById('admin-map-container');
    if (!mapDiv) return () => {};

    const map = new window.google.maps.Map(mapDiv, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const marker = new window.google.maps.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map,
      draggable: true,
    });

    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (position) {
        setTempLat(position.lat());
        setTempLng(position.lng());
      }
    });

    map.addListener('click', (e) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        setTempLat(e.latLng.lat());
        setTempLng(e.latLng.lng());
      }
    });

    const input = document.getElementById('admin-map-search-input');
    if (input) {
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['geocode', 'establishment'],
      });
      autocomplete.bindTo('bounds', map);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          toast.error('No details available for input location.');
          return;
        }

        map.setCenter(place.geometry.location);
        map.setZoom(16);
        marker.setPosition(place.geometry.location);
        setTempLat(place.geometry.location.lat());
        setTempLng(place.geometry.location.lng());

        if (place.formatted_address) {
          setMapSearchQuery(place.formatted_address);
        }
      });
    }

    mapInstance.current = map;
    markerInstance.current = marker;

    return () => {
      mapInstance.current = null;
      markerInstance.current = null;
    };
  }, [showMapModal]);

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

  const addOpeningSlot = () => setFieldValue('opening_hours', [...values.opening_hours, { day: 'Monday - Friday', from: '', to: '' }]);
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
    <div className="container-fluid qsr-page-container">
      <HtmlHead title={title} description={description} />
      <div className="qsr-page-title-container">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto">
            <h1 className="qsr-page-title">{title}</h1>
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
          <Col lg={6}>
            {/* General Settings */}
            <Card className="manage-website-glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <h5 className="manage-website-section-title">General Information</h5>
                <Row className="g-3">
                  <Col xs={12}>
                    <Form.Group className="d-flex flex-column align-items-center mb-3">
                      <Form.Label className="small fw-bold text-muted text-center w-100 mb-3">Logo Image</Form.Label>
                      <div
                        className={`border border-3 border-light overflow-hidden shadow-sm bg-light d-flex align-items-center justify-content-center mb-3 ${
                          isWideLogo ? 'rounded-3' : 'rounded-circle'
                        }`}
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
                        key={`${fileInputKey}-logo`}
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
                        style={{
                          borderRadius: '50px',
                          borderColor: '#1ea8e7',
                          color: '#1ea8e7',
                          fontWeight: '700',
                          cursor: 'pointer',
                          maxWidth: 'fit-content',
                        }}
                        disabled={saving || uploadingLogo}
                      >
                        {uploadingLogo ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="upload" size="18" className="me-2" />}
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                    </Form.Group>
                  </Col>
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
                      <div
                        className="d-flex align-items-center justify-content-between p-3 rounded-3"
                        style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}
                      >
                        <div>
                          <span
                            className="small fw-bold text-muted d-block mb-1"
                            style={{ letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '11px' }}
                          >
                            Feature Settings
                          </span>
                          <div className="fw-bold text-dark" style={{ fontSize: '15px' }}>
                            Table Reservation Functionality
                          </div>
                          <div className="text-muted mt-1" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                            Display the table booking page and reservation widgets on your public website.
                          </div>
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
                </Row>
              </Card.Body>
            </Card>

            {/* Address & Map Location */}
            <Card className="manage-website-glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <h5 className="manage-website-section-title mb-0">Address & Map Location</h5>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="manage-menu-custom-btn-outline px-3 py-1.5"
                      style={{ fontSize: '11px', borderRadius: '50px' }}
                      onClick={() => {
                        if (values.latitude && values.longitude) {
                          setTempLat(values.latitude);
                          setTempLng(values.longitude);
                          setShowMapModal(true);
                        } else if (navigator.geolocation) {
                          setDetectingLocation(true);
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              setTempLat(pos.coords.latitude);
                              setTempLng(pos.coords.longitude);
                              setDetectingLocation(false);
                              setShowMapModal(true);
                            },
                            (err) => {
                              setDetectingLocation(false);
                              if (err.code === 1) {
                                // PERMISSION_DENIED
                                const manual = window.confirm(
                                  'Location access is blocked or disabled in your browser settings.\n\n' +
                                    'To auto-detect:\n' +
                                    '1. Click the settings/lock icon in your address bar.\n' +
                                    "2. Set Location permissions to 'Allow'.\n" +
                                    '3. Reload the page.\n\n' +
                                    'Would you like to manually choose your address on the map instead?'
                                );
                                if (manual) {
                                  setTempLat(23.0225);
                                  setTempLng(72.5714);
                                  setShowMapModal(true);
                                }
                              } else {
                                toast.error('Unable to fetch location automatically.');
                                setTempLat(23.0225);
                                setTempLng(72.5714);
                                setShowMapModal(true);
                              }
                            },
                            { enableHighAccuracy: true, timeout: 6000 }
                          );
                        } else {
                          setTempLat(23.0225);
                          setTempLng(72.5714);
                          setShowMapModal(true);
                        }
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

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted">Restaurant Address (Show on Website / Custom Text)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    className="manage-website-pill-input"
                    name="restaurant_address"
                    value={values.restaurant_address}
                    onChange={handleChange}
                    isInvalid={touched.restaurant_address && errors.restaurant_address}
                    placeholder="e.g. 123 Main St, London (Type custom friendly text, or pick on map to resolve automatically)"
                  />
                  <Form.Control.Feedback type="invalid">{errors.restaurant_address}</Form.Control.Feedback>
                </Form.Group>

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

            {/* Delivery Settings */}
            <Card className="manage-website-glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <h5 className="manage-website-section-title mb-4">Delivery Configurations</h5>

                <Form.Group className="mb-3 d-flex align-items-center justify-content-between">
                  <div>
                    <Form.Label className="small fw-bold text-muted mb-0">Enable Delivery Services</Form.Label>
                    <div className="text-muted small">Allow customers to place delivery orders from the website</div>
                  </div>
                  <Form.Check
                    type="switch"
                    id="delivery-enabled-switch"
                    name="delivery.enabled"
                    checked={values.delivery?.enabled}
                    onChange={(e) => setFieldValue('delivery.enabled', e.target.checked)}
                  />
                </Form.Group>

                {values.delivery?.enabled && (
                  <>
                    <Row className="g-3 mb-3">
                      <Col xs="6">
                        <Form.Group>
                          <Form.Label className="small fw-bold text-muted">Max Delivery Distance (km)</Form.Label>
                          <Form.Control
                            type="number"
                            className="manage-website-pill-input"
                            name="delivery.max_distance"
                            value={values.delivery?.max_distance}
                            onChange={handleChange}
                            placeholder="e.g. 10"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs="6">
                        <Form.Group>
                          <Form.Label className="small fw-bold text-muted">Min Order for Delivery (₹)</Form.Label>
                          <Form.Control
                            type="number"
                            className="manage-website-pill-input"
                            name="delivery.minimum_order"
                            value={values.delivery?.minimum_order}
                            onChange={handleChange}
                            placeholder="e.g. 200"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col xs="6">
                        <Form.Group>
                          <Form.Label className="small fw-bold text-muted">Free Delivery Radius (km)</Form.Label>
                          <Form.Control
                            type="number"
                            className="manage-website-pill-input"
                            name="delivery.free_radius"
                            value={values.delivery?.free_radius}
                            onChange={handleChange}
                            placeholder="e.g. 3"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs="6">
                        <Form.Group>
                          <Form.Label className="small fw-bold text-muted">Delivery Charge Type</Form.Label>
                          <Form.Select
                            className="manage-website-pill-input"
                            name="delivery.charge_type"
                            value={values.delivery?.charge_type}
                            onChange={handleChange}
                          >
                            <option value="free">Free Delivery</option>
                            <option value="fixed">Fixed Delivery Charge</option>
                            <option value="distance_based">Distance Based Slabs</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    {values.delivery?.charge_type === 'fixed' && (
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Fixed Delivery Charge (₹)</Form.Label>
                        <Form.Control
                          type="number"
                          className="manage-website-pill-input"
                          name="delivery.fixed_charge"
                          value={values.delivery?.fixed_charge}
                          onChange={handleChange}
                          placeholder="e.g. 40"
                        />
                      </Form.Group>
                    )}

                    {values.delivery?.charge_type === 'distance_based' && (
                      <div className="mt-4 border-top pt-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="small fw-bold text-primary mb-0">Distance Slabs Config</h6>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            style={{ borderRadius: '50px', fontSize: '11px' }}
                            onClick={() => {
                              const currentSlabs = values.delivery?.slabs || [];
                              const lastSlab = currentSlabs[currentSlabs.length - 1];
                              const nextFrom = lastSlab ? lastSlab.to_km : 0;
                              setFieldValue('delivery.slabs', [...currentSlabs, { from_km: nextFrom, to_km: nextFrom + 3, charge: 30 }]);
                            }}
                          >
                            + Add Slab
                          </Button>
                        </div>

                        {!values.delivery?.slabs || values.delivery.slabs.length === 0 ? (
                          <div className="text-muted small text-center py-2">
                            No slabs configured. Order road distance checks will fail. Add at least one slab.
                          </div>
                        ) : (
                          <div className="table-responsive text-dark">
                            <table className="table table-borderless table-sm text-dark align-middle">
                              <thead>
                                <tr className="small text-muted">
                                  <th>From (km)</th>
                                  <th>To (km)</th>
                                  <th>Charge (₹)</th>
                                  <th className="text-end">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {values.delivery.slabs.map((slab, idx) => (
                                  <tr key={idx}>
                                    <td>
                                      <Form.Control
                                        type="number"
                                        className="form-control-sm text-dark"
                                        value={slab.from_km}
                                        onChange={(e) => {
                                          const newSlabs = [...values.delivery.slabs];
                                          newSlabs[idx].from_km = Number(e.target.value);
                                          setFieldValue('delivery.slabs', newSlabs);
                                        }}
                                        disabled={idx > 0}
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        type="number"
                                        className="form-control-sm text-dark"
                                        value={slab.to_km}
                                        onChange={(e) => {
                                          const newSlabs = [...values.delivery.slabs];
                                          newSlabs[idx].to_km = Number(e.target.value);
                                          if (newSlabs[idx + 1]) {
                                            newSlabs[idx + 1].from_km = Number(e.target.value);
                                          }
                                          setFieldValue('delivery.slabs', newSlabs);
                                        }}
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        type="number"
                                        className="form-control-sm text-dark"
                                        value={slab.charge}
                                        onChange={(e) => {
                                          const newSlabs = [...values.delivery.slabs];
                                          newSlabs[idx].charge = Number(e.target.value);
                                          setFieldValue('delivery.slabs', newSlabs);
                                        }}
                                      />
                                    </td>
                                    <td className="text-end">
                                      <Button
                                        variant="link"
                                        className="text-danger p-0 border-0"
                                        onClick={() => {
                                          const newSlabs = values.delivery.slabs.filter((_, sIdx) => sIdx !== idx);
                                          newSlabs.forEach((s, sIdx) => {
                                            s.from_km = sIdx === 0 ? 0 : newSlabs[sIdx - 1].to_km;
                                          });
                                          setFieldValue('delivery.slabs', newSlabs);
                                        }}
                                      >
                                        <CsLineIcons icon="bin" size="14" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
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
                          {platformTouched && platformError && <div className="text-danger mt-1 small ms-2">{platformError}</div>}
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
                          {urlTouched && urlError && <div className="text-danger mt-1 small ms-2">{urlError}</div>}
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

            {/* Contact Page Customization */}
            <Card className="manage-website-glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <h5 className="manage-website-section-title">Contact Page Customization</h5>
                <Row className="g-3">
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">Contact Page Subtitle</Form.Label>
                      <Form.Control
                        className="manage-website-pill-input"
                        name="contact_subtitle"
                        value={values.contact_subtitle}
                        onChange={handleChange}
                        placeholder="Get in Touch"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">Contact Page Title</Form.Label>
                      <Form.Control
                        className="manage-website-pill-input"
                        name="contact_title"
                        value={values.contact_title}
                        onChange={handleChange}
                        placeholder="We'd Love to Hear From You"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Contact Page Description</Form.Label>
                  <Form.Control
                    className="manage-website-pill-input"
                    name="contact_details"
                    as="textarea"
                    rows={3}
                    value={values.contact_details}
                    onChange={handleChange}
                    placeholder="Whether you're booking a table, asking about our menu, or just want to say hello..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6}>
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
                      <CsLineIcons icon="bin" size="12" />
                    </Button>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">Select Day(s)</Form.Label>
                      <Form.Select
                        className="manage-website-pill-input"
                        value={h.day || h.dayRange || ''}
                        onChange={(e) => {
                          const newHours = [...values.opening_hours];
                          newHours[index] = {
                            ...newHours[index],
                            day: e.target.value,
                            dayRange: e.target.value,
                          };
                          setFieldValue('opening_hours', newHours);
                        }}
                      >
                        <option value="Monday - Friday">Monday - Friday</option>
                        <option value="Monday - Saturday">Monday - Saturday</option>
                        <option value="Monday - Sunday">Monday - Sunday</option>
                        <option value="Saturday - Sunday">Saturday - Sunday</option>
                        <option value="Sunday">Sunday</option>
                        <option value="Everyday">Everyday</option>
                      </Form.Select>
                    </Form.Group>
                    <Row className="g-2">
                      <Col xs={6}>
                        <Form.Control
                          type="time"
                          className="manage-website-pill-input"
                          value={h.from}
                          onChange={(e) => {
                            const newHours = [...values.opening_hours];
                            newHours[index] = {
                              ...newHours[index],
                              from: e.target.value,
                            };
                            setFieldValue('opening_hours', newHours);
                          }}
                        />
                      </Col>
                      <Col xs={6}>
                        <Form.Control
                          type="time"
                          className="manage-website-pill-input"
                          value={h.to}
                          onChange={(e) => {
                            const newHours = [...values.opening_hours];
                            newHours[index] = {
                              ...newHours[index],
                              to: e.target.value,
                            };
                            setFieldValue('opening_hours', newHours);
                          }}
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
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
                  <Form.Control
                    key={`${fileInputKey}-hero`}
                    className="manage-website-pill-input"
                    type="file"
                    onChange={(e) => setHeroImageFile(e.target.files[0])}
                  />
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
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">Section Tag Label</Form.Label>
                      <Form.Control
                        className="manage-website-pill-input"
                        name="legacy_title"
                        value={values.legacy_title}
                        onChange={handleChange}
                        placeholder="Our Legacy"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">Section Heading Title</Form.Label>
                      <Form.Control
                        className="manage-website-pill-input"
                        name="about_title"
                        value={values.about_title}
                        onChange={handleChange}
                        placeholder="e.g. Crafting Culinary Magic"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="g-3">
                  <Col xs={12} md={6}>
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
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">Layout Style</Form.Label>
                      <Form.Select className="manage-website-pill-input" name="legacy_layout" value={values.legacy_layout} onChange={handleChange}>
                        <option value="image-right">Text Left, Image Right</option>
                        <option value="image-left">Image Left, Text Right</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
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
                  <Form.Control
                    key={`${fileInputKey}-legacy`}
                    className="manage-website-pill-input"
                    type="file"
                    onChange={(e) => setLegacyImageFile(e.target.files[0])}
                  />
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
                        <Button variant="none" className="text-danger p-0 border-0 bg-transparent" onClick={() => removeLegacyBullet(index)}>
                          <CsLineIcons icon="bin" size="15" />
                        </Button>
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
              </Card.Body>
            </Card>

            {/* Customer Feedbacks & Testimonials Selection */}
            <Card className="manage-website-glass-card mb-4 border-0">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="manage-website-section-title mb-0">Customer Feedbacks & Testimonials</h5>
                </div>

                {feedbacks.length === 0 ? (
                  <div className="text-muted text-center py-4 small">No feedbacks received yet.</div>
                ) : (
                  <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '10px' }}>
                    {feedbacks.map((f) => {
                      const isSelected = values.testimonials.some((t) => t.name === f.customer_name && t.text === f.feedback);

                      return (
                        <div key={f._id} className="p-3 mb-3 rounded border bg-light position-relative">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="fw-bold text-dark small">{f.customer_name}</div>
                              {f.date && (
                                <div className="text-muted" style={{ fontSize: '10px' }}>
                                  {new Date(f.date).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="d-flex align-items-center">
                              {[...Array(5)].map((_, i) => (
                                <CsLineIcons
                                  key={i}
                                  icon="star"
                                  size="13"
                                  className={i < Number(f.rating) ? 'text-warning me-0.5' : 'text-muted me-0.5 opacity-30'}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-secondary small mb-3 fst-italic">"{f.feedback}"</p>

                          <Form.Check
                            type="checkbox"
                            id={`feedback-select-${f._id}`}
                            label={<span className="text-dark small fw-medium">Show on Website Homepage</span>}
                            checked={isSelected}
                            onChange={() => {
                              const newTestimonials = [...values.testimonials];
                              if (isSelected) {
                                const filtered = newTestimonials.filter((t) => !(t.name === f.customer_name && t.text === f.feedback));
                                setFieldValue('testimonials', filtered);
                              } else {
                                newTestimonials.push({
                                  name: f.customer_name,
                                  text: f.feedback,
                                  rating: f.rating,
                                  role: 'Happy Customer',
                                });
                                setFieldValue('testimonials', newTestimonials);
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Google Map Picker Modal for Admin */}
      <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg" centered className="admin-map-picker-modal">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Select Restaurant Pin Location</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Search Address Bar */}
          <Form onSubmit={(e) => e.preventDefault()} className="d-flex gap-2 mb-3">
            <Form.Control
              type="text"
              id="admin-map-search-input"
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              placeholder="Search area, landmark, street, city..."
              style={{ borderRadius: '50px' }}
            />
          </Form>

          {/* Map Container */}
          <div id="admin-map-container" className="rounded border" style={{ height: '350px', background: '#f5f5f5' }} />
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
              disabled={locatingUser}
              onClick={() => {
                if (navigator.geolocation) {
                  setLocatingUser(true);
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords;
                      setTempLat(latitude);
                      setTempLng(longitude);
                      if (mapInstance.current && window.google) {
                        const latlng = new window.google.maps.LatLng(latitude, longitude);
                        mapInstance.current.setCenter(latlng);
                        mapInstance.current.setZoom(16);
                        if (markerInstance.current) {
                          markerInstance.current.setPosition(latlng);
                        }
                      }
                      setLocatingUser(false);
                    },
                    (err) => {
                      setLocatingUser(false);
                      if (err.code === 1) {
                        // PERMISSION_DENIED
                        alert(
                          'Location access is blocked or disabled in your browser settings.\n\n' +
                            'To enable:\n' +
                            '1. Click the settings/lock icon next to the URL in your address bar.\n' +
                            "2. Set Location permissions to 'Allow'.\n" +
                            '3. Refresh the page.\n\n' +
                            "Alternatively, you can manually drag the pin marker on the map to select your restaurant's location."
                        );
                      } else {
                        toast.error('Unable to fetch your location automatically.');
                      }
                    }
                  );
                } else {
                  toast.error('Geolocation is not supported by your browser.');
                }
              }}
            >
              {locatingUser ? (
                <>
                  <span className="spinner-border spinner-border-sm text-primary me-2" role="status" style={{ width: '12px', height: '12px' }} />
                  Locating...
                </>
              ) : (
                'Locate Me'
              )}
            </Button>
            <Button
              variant="primary"
              style={{ borderRadius: '50px' }}
              onClick={() => {
                if (tempLat && tempLng && window.google) {
                  const geocoder = new window.google.maps.Geocoder();
                  geocoder.geocode({ location: { lat: Number(tempLat), lng: Number(tempLng) } }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                      const result = results[0];
                      const components = result.address_components;

                      const extract = (types) => {
                        const found = components.find((c) => types.some((t) => c.types.includes(t)));
                        return found ? found.long_name : '';
                      };

                      const { place_id, formatted_address } = result;
                      const city = extract(['locality', 'administrative_area_level_2']);
                      const state = extract(['administrative_area_level_1']);
                      const country = extract(['country']);
                      const postal_code = extract(['postal_code']);
                      const locality = extract(['sublocality_level_1', 'neighborhood']);
                      const sublocality = extract(['sublocality_level_2', 'sublocality']);

                      // Update Formik fields
                      const generatedEmbed = `https://maps.google.com/maps?q=${Number(tempLat)},${Number(tempLng)}&z=15&output=embed`;
                      setFieldValue('map_location', generatedEmbed);
                      setFieldValue('place_id', place_id);
                      setFieldValue('formatted_address', formatted_address);
                      setFieldValue('restaurant_address', formatted_address);
                      setFieldValue('latitude', Number(tempLat));
                      setFieldValue('longitude', Number(tempLng));
                      setFieldValue('city', city);
                      setFieldValue('state', state);
                      setFieldValue('country', country);
                      setFieldValue('postal_code', postal_code);
                      setFieldValue('locality', locality);
                      setFieldValue('sublocality', sublocality);

                      toast.success('Restaurant location details resolved!');
                      setShowMapModal(false);
                    } else {
                      toast.error(`Failed to geocode coordinates: ${status}`);
                    }
                  });
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

      {detectingLocation && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center px-3"
          style={{
            zIndex: 3000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-white fw-bold mb-1">Detecting Location</h5>
          <p className="small text-muted">Please allow location permissions if prompted by your browser.</p>
        </div>
      )}
      <style>{`
          .pac-container {
            z-index: 10000 !important;
          }
          .floating-save-bar {
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
            border: 1px solid rgba(0, 0, 0, 0.05);
            background: #ffffff;
            color: #495057;
          }
          .html-dark .floating-save-bar {
            background: #232323 !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            color: #f8f9fa;
          }
          .floating-save-text {
            font-size: 14px;
            font-weight: 500;
          }
          .btn-discard-pill {
            background-color: #e9ecef;
            color: #495057;
            border: none;
            border-radius: 50px;
            padding: 8px 24px;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s;
          }
          .btn-discard-pill:hover {
            background-color: #dee2e6;
            color: #212529;
          }
          .html-dark .btn-discard-pill {
            background-color: rgba(255, 255, 255, 0.08);
            color: #f8f9fa;
          }
          .html-dark .btn-discard-pill:hover {
            background-color: rgba(255, 255, 255, 0.15);
            color: #ffffff;
          }
          .btn-save-pill {
            background-color: #1ea8e7;
            color: #fff;
            border: none;
            border-radius: 50px;
            padding: 8px 24px;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s;
          }
          .btn-save-pill:hover {
            background-color: #158fc7;
            transform: translateY(-1px);
          }
        `}</style>

      {(formik.dirty || logoFile || heroImageFile || legacyImageFile) && (
        <div
          className="position-fixed start-50 translate-middle-x floating-save-bar d-flex align-items-center justify-content-between px-4 py-2.5 animate-fade-in"
          style={{
            zIndex: 1050,
            bottom: '2rem',
            width: '90%',
            maxWidth: '600px',
            borderRadius: '50px',
            padding: '15px',
          }}
        >
          <div className="floating-save-text ps-1">You have unsaved changes</div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn-discard-pill"
              onClick={() => {
                formik.resetForm();
                setLogoFile(null);
                setHeroImageFile(null);
                setAboutImageFile(null);
                setLegacyImageFile(null);

                // Reset logo preview back to initial settings value
                const originalLogo = formik.initialValues.logo;
                if (originalLogo) {
                  setLogoPreview(`${process.env.REACT_APP_UPLOAD_DIR}/${originalLogo}`);
                } else {
                  setLogoPreview(null);
                }
                // Increment key to reset file inputs
                setFileInputKey((prev) => prev + 1);
              }}
              disabled={saving}
            >
              Discard
            </button>
            <button type="button" className="btn-save-pill d-inline-flex align-items-center" onClick={() => formik.handleSubmit()} disabled={saving}>
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" style={{ width: '12px', height: '12px' }} />
                  Saving...
                </>
              ) : (
                <>
                  <CsLineIcons icon="save" size="14" className="me-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageWebsite;
