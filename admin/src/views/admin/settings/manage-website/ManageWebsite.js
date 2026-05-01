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
  const [aboutImageFile, setAboutImageFile] = useState(null);
  
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
      hero_details: '',
      about_title: '',
      about_details: '',
      about_image: '',
      legacy_years: '',
      contact_details: '',
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

        let uploadedAboutImg = values.about_image;
        if (aboutImageFile) {
          const formData = new FormData();
          formData.append('logo', aboutImageFile); // Using the same upload logo endpoint for simplicity if it handles menu images
          const uploadRes = await axios.post(`${process.env.REACT_APP_API}/upload/uploadlogo`, formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
          });
          if (uploadRes.data?.logo) uploadedAboutImg = uploadRes.data.logo;
        }

        const payload = { 
          ...values, 
          logo: uploadedLogo,
          about_image: uploadedAboutImg,
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
        toast.error('Update failed.');
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
              if (['featured_dish_ids', 'opening_hours', 'testimonials', 'social_links'].includes(key) && settingsRes.data[key]) {
                try {
                  const val = typeof settingsRes.data[key] === 'string' ? JSON.parse(settingsRes.data[key]) : settingsRes.data[key];
                  setFieldValue(key, val || []);
                } catch {
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

  const addTestimonial = () => setFieldValue('testimonials', [...values.testimonials, { name: '', text: '', role: '', rating: 5 }]);
  const removeTestimonial = (index) => setFieldValue('testimonials', values.testimonials.filter((_, i) => i !== index));

  const addSocial = () => setFieldValue('social_links', [...values.social_links, { platform: '', url: '', logo: '' }]);
  const removeSocial = (index) => setFieldValue('social_links', values.social_links.filter((_, i) => i !== index));

  const handleSocialLogoUpload = async (index, file) => {
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const uploadRes = await axios.post(`${process.env.REACT_APP_API}/upload/uploadlogo`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
      });
      if (uploadRes.data?.logo) {
        const newSocials = [...values.social_links];
        newSocials[index].logo = uploadRes.data.logo;
        setFieldValue('social_links', newSocials);
      }
    } catch (err) {
      toast.error('Logo upload failed');
    }
  };

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
      <div className="page-title-container">
        <h1 className="mb-0 pb-0 display-4">{title}</h1>
        <BreadcrumbList items={breadcrumbs} />
      </div>

      {restaurant_code && (
        <Alert variant="info" className="mb-4">
          <strong>Public Link: </strong>
          <a href={publicLink} target="_blank" rel="noopener noreferrer">{publicLink}</a>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            {/* General Settings */}
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">General Information</h5>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Restaurant Name</Form.Label>
                      <Form.Control name="restaurant_name" value={values.restaurant_name} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Address</Form.Label>
                      <Form.Control name="restaurant_address" value={values.restaurant_address} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Email</Form.Label>
                      <Form.Control name="contact_email" value={values.contact_email} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Phone</Form.Label>
                      <Form.Control name="contact_phone" value={values.contact_phone} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Logo Image</Form.Label>
                      <Form.Control type="file" onChange={(e) => setLogoFile(e.target.files[0])} />
                      {values.logo && <div className="mt-1 small text-muted">Current: {values.logo}</div>}
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Hero Section */}
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">Hero Section (Home Page Top)</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Main Title</Form.Label>
                  <Form.Control name="hero_title" value={values.hero_title} onChange={handleChange} placeholder="Welcome to..." />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Subtext / Details</Form.Label>
                  <Form.Control name="hero_details" as="textarea" rows={2} value={values.hero_details} onChange={handleChange} />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Our Legacy (About) Section */}
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">Our Legacy (About Us)</h5>
                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Section Title</Form.Label>
                      <Form.Control name="about_title" value={values.about_title} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Years of Legacy (Number)</Form.Label>
                      <Form.Control name="legacy_years" value={values.legacy_years} onChange={handleChange} placeholder="e.g. 15+" />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Detailed Story</Form.Label>
                  <Form.Control name="about_details" as="textarea" rows={4} value={values.about_details} onChange={handleChange} />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Legacy Image</Form.Label>
                  <Form.Control type="file" onChange={(e) => setAboutImageFile(e.target.files[0])} />
                  {values.about_image && <div className="mt-1 small text-muted">Current: {values.about_image}</div>}
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Testimonials */}
            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Testimonials (Voices of Delight)</h5>
                  <Button variant="outline-primary" size="sm" onClick={addTestimonial}>Add Review</Button>
                </div>
                {values.testimonials.map((t, index) => (
                  <div key={index} className="border rounded p-3 mb-3 position-relative">
                    <Button variant="link" className="position-absolute top-0 end-0 text-danger" onClick={() => removeTestimonial(index)}>
                      <CsLineIcons icon="bin" size="15" />
                    </Button>
                    <Row className="g-2">
                      <Col md={6}>
                        <Form.Control placeholder="Customer Name" value={t.name} onChange={(e) => {
                          const newTest = [...values.testimonials];
                          newTest[index].name = e.target.value;
                          setFieldValue('testimonials', newTest);
                        }} />
                      </Col>
                      <Col md={6}>
                        <Form.Control placeholder="Role (e.g. Food Critic)" value={t.role} onChange={(e) => {
                          const newTest = [...values.testimonials];
                          newTest[index].role = e.target.value;
                          setFieldValue('testimonials', newTest);
                        }} />
                      </Col>
                      <Col md={12}>
                        <Form.Control as="textarea" rows={2} placeholder="Review Text" value={t.text} onChange={(e) => {
                          const newTest = [...values.testimonials];
                          newTest[index].text = e.target.value;
                          setFieldValue('testimonials', newTest);
                        }} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small">Rating (1-5)</Form.Label>
                        <Form.Control type="number" min="1" max="5" value={t.rating} onChange={(e) => {
                          const newTest = [...values.testimonials];
                          newTest[index].rating = e.target.value;
                          setFieldValue('testimonials', newTest);
                        }} />
                      </Col>
                    </Row>
                  </div>
                ))}
              </Card.Body>
            </Card>

            {/* Social Links */}
            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Social Media Accounts</h5>
                  <Button variant="outline-primary" size="sm" onClick={addSocial}>Add Account</Button>
                </div>
                {values.social_links.map((s, index) => (
                  <div key={index} className="border rounded p-3 mb-3">
                    <Row className="g-2 align-items-center">
                      <Col md={3}>
                        <Form.Select value={s.platform} onChange={(e) => {
                          const newSocials = [...values.social_links];
                          newSocials[index].platform = e.target.value;
                          setFieldValue('social_links', newSocials);
                        }}>
                          <option value="">Platform</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Twitter">Twitter (X)</option>
                          <option value="Youtube">Youtube</option>
                        </Form.Select>
                      </Col>
                      <Col md={4}>
                        <Form.Control placeholder="Profile URL" value={s.url} onChange={(e) => {
                          const newSocials = [...values.social_links];
                          newSocials[index].url = e.target.value;
                          setFieldValue('social_links', newSocials);
                        }} />
                      </Col>
                      <Col md={3}>
                        <Form.Control type="file" size="sm" onChange={(e) => handleSocialLogoUpload(index, e.target.files[0])} />
                      </Col>
                      <Col md={2}>
                        <Button variant="outline-danger" size="sm" className="w-100" onClick={() => removeSocial(index)}>Remove</Button>
                      </Col>
                    </Row>
                    {s.logo && <div className="mt-1 x-small text-muted">Logo: {s.logo}</div>}
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Opening Hours */}
            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Opening Times</h5>
                  <Button variant="link" size="sm" className="p-0" onClick={addOpeningSlot}>Add Slot</Button>
                </div>
                {values.opening_hours.map((h, index) => (
                  <div key={index} className="mb-3 pb-3 border-bottom position-relative">
                    <Button variant="link" className="position-absolute top-0 end-0 text-danger p-0" onClick={() => removeOpeningSlot(index)}>
                      <CsLineIcons icon="close" size="12" />
                    </Button>
                    <Form.Control size="sm" className="mb-2" placeholder="Days (e.g. Mon-Fri)" value={h.day} onChange={(e) => {
                      const newHours = [...values.opening_hours];
                      newHours[index].day = e.target.value;
                      setFieldValue('opening_hours', newHours);
                    }} />
                    <Row className="g-2">
                      <Col>
                        <Form.Control size="sm" type="time" value={h.from} onChange={(e) => {
                          const newHours = [...values.opening_hours];
                          newHours[index].from = e.target.value;
                          setFieldValue('opening_hours', newHours);
                        }} />
                      </Col>
                      <Col>
                        <Form.Control size="sm" type="time" value={h.to} onChange={(e) => {
                          const newHours = [...values.opening_hours];
                          newHours[index].to = e.target.value;
                          setFieldValue('opening_hours', newHours);
                        }} />
                      </Col>
                    </Row>
                  </div>
                ))}
                {values.opening_hours.length === 0 && (
                  <div className="text-muted small mb-3">Using legacy single-slot time: {values.open_days} ({values.open_time_from} - {values.open_time_to})</div>
                )}
              </Card.Body>
            </Card>

            {/* Featured Menu Items */}
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">Featured on Home Page</h5>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {allDishes.map((menu) => (
                    <div key={menu.category} className="mb-3">
                      <div className="fw-bold small text-primary text-uppercase">{menu.category}</div>
                      {menu.dishes.map((dish) => (
                        <Form.Check
                          key={dish._id}
                          type="checkbox"
                          id={`dish-${dish._id}`}
                          label={<span className="small">{dish.dish_name}</span>}
                          checked={values.featured_dish_ids.includes(dish._id)}
                          onChange={() => handleDishSelect(dish._id)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <div className="d-grid gap-2">
              <Button variant="primary" size="lg" type="submit" disabled={saving}>
                {saving ? <Spinner size="sm" className="me-2" /> : <CsLineIcons icon="save" className="me-2" />}
                Save Changes
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </>
  );
};

export default ManageWebsite;