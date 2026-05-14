import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { Formik, useFormik } from 'formik';
import * as Yup from 'yup';

const TaxAndCharges = () => {
  const title = 'Tax & Charges';
  const description = 'Manage your GST configuration and container charges.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'settings', text: 'Settings' },
    { to: 'settings/tax', title: 'Tax & Charges' },
  ];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // GST State
  const [gstProfile, setGstProfile] = useState({
    gst_no: '',
    cgst: 0,
    sgst: 0,
    vat: 0,
  });
  const [gstEditMode, setGstEditMode] = useState(false);
  const [gstSaving, setGstSaving] = useState(false);

  // Container State
  const [containerCharges, setContainerCharges] = useState([]);
  const [containerEditMode, setContainerEditMode] = useState(false);
  const [containerSaving, setContainerSaving] = useState(false);

  // --- GST Logic ---
  const gstValidationSchema = Yup.object().shape({
    gst_no: Yup.string()
      .required('GST number is required')
      .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'GST number format is invalid')
      .length(15, 'GST number must be 15 characters'),
    cgst: Yup.number().required('CGST is required').min(0).max(100),
    sgst: Yup.number().required('SGST is required').min(0).max(100),
    vat: Yup.number().required('VAT is required').min(0).max(100),
  });

  const handleGstSubmit = async (values, { setSubmitting }) => {
    setGstSaving(true);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API}/user/update-tax`,
        {
          gst_no: values.gst_no,
          taxInfo: {
            cgst: parseFloat(values.cgst),
            sgst: parseFloat(values.sgst),
            vat: parseFloat(values.vat),
          },
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.success) {
        setGstProfile(values);
        setGstEditMode(false);
        toast.success('Tax information updated successfully!');
      }
    } catch (err) {
      toast.error('Failed to update tax info.');
    } finally {
      setGstSaving(false);
      setSubmitting(false);
    }
  };

  // --- Container Logic ---
  const containerValidationSchema = Yup.object().shape({
    containers: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('Name is required'),
        sizeValue: Yup.number().required('Size is required').min(0),
        sizeUnit: Yup.string().required('Unit is required'),
        price: Yup.number().required('Price is required').min(0),
      })
    ),
  });

  const containerFormik = useFormik({
    initialValues: { containers: [] },
    validationSchema: containerValidationSchema,
    onSubmit: async (values) => {
      setContainerSaving(true);
      try {
        const res = await axios.put(
          `${process.env.REACT_APP_API}/charge/update-container-charge`,
          {
            containerCharges: values.containers.map((c) => ({
              ...c,
              size: `${c.sizeValue} ${c.sizeUnit}`,
            })),
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (res.data.success) {
          setContainerEditMode(false);
          toast.success('Container charges updated successfully!');
        }
      } catch (err) {
        toast.error('Failed to update container charges.');
      } finally {
        setContainerSaving(false);
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, containerRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API}/user/get`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${process.env.REACT_APP_API}/charge/get-container-charges`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        const userData = userRes.data.user || userRes.data;
        setGstProfile({
          gst_no: userData.gst_no || '',
          cgst: userData.taxInfo?.cgst || 0,
          sgst: userData.taxInfo?.sgst || 0,
          vat: userData.taxInfo?.vat || 0,
        });

        if (containerRes.data.success && containerRes.data.user.containerCharges) {
          const parsed = containerRes.data.user.containerCharges.map((c) => {
            const [value, unit] = c.size.split(' ');
            return { ...c, sizeValue: value || '', sizeUnit: unit || '' };
          });
          containerFormik.setFieldValue('containers', parsed);
        }
      } catch (err) {
        setError('Failed to load settings.');
        toast.error('Error fetching data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addContainer = () => {
    containerFormik.setFieldValue('containers', [...containerFormik.values.containers, { name: '', sizeValue: '', sizeUnit: '', price: 0 }]);
  };

  const removeContainer = (index) => {
    const updated = [...containerFormik.values.containers];
    updated.splice(index, 1);
    containerFormik.setFieldValue('containers', updated);
  };

  const customStyles = `
    .glass-card {
      background: rgba(255, 255, 255, 0.8) !important;
      backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-radius: 20px !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07) !important;
      transition: transform 0.3s ease, box-shadow 0.3s ease !important;
    }
    .custom-btn-outline {
      background: transparent !important;
      border: 1px solid #1ea8e7 !important;
      color: #1ea8e7 !important;
      border-radius: 50px !important;
      padding: 0.6rem 1.5rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    .custom-btn-outline:hover {
      background: #1ea8e7 !important;
      color: #ffffff !important;
    }
    .section-header {
      border-left: 4px solid #1ea8e7;
      padding-left: 15px;
      margin-bottom: 25px;
    }
    .matrix-item {
      background: rgba(255, 255, 255, 0.4);
      border: 1px solid rgba(30, 168, 231, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
  `;

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" style={{ color: '#1ea8e7' }} />
        <h5 className="mt-3 fw-bold">Loading Tax & Charges...</h5>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      
      <Row className="g-3 align-items-center mb-4">
        <Col md={7}>
          <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
          <BreadcrumbList items={breadcrumbs} />
        </Col>
      </Row>

      <Row className="g-4">
        {/* GST SECTION */}
        <Col lg={12}>
          <Formik
            initialValues={gstProfile}
            validationSchema={gstValidationSchema}
            onSubmit={handleGstSubmit}
            enableReinitialize
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, resetForm }) => (
              <Form onSubmit={handleSubmit}>
                <Card className="glass-card border-0 mb-4">
                  <Card.Body className="p-4 p-md-5">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div className="section-header mb-0">
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                          <CsLineIcons icon="percentage" size="20" className="text-primary" />
                          Tax Configuration (GST)
                        </h5>
                      </div>
                      {!gstEditMode && (
                        <Button variant="none" className="custom-btn-outline" onClick={() => setGstEditMode(true)}>
                          <CsLineIcons icon="edit" size="18" /> Edit Tax
                        </Button>
                      )}
                    </div>

                    <Row className="g-4">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">GST Registration Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="gst_no"
                            value={values.gst_no}
                            onChange={(e) => handleChange({ target: { name: 'gst_no', value: e.target.value.toUpperCase() } })}
                            disabled={!gstEditMode || gstSaving}
                            isInvalid={touched.gst_no && errors.gst_no}
                            className={!gstEditMode ? "bg-light border-0" : ""}
                          />
                          <Form.Control.Feedback type="invalid">{errors.gst_no}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">CGST (%)</Form.Label>
                          <Form.Control type="number" name="cgst" value={values.cgst} onChange={handleChange} disabled={!gstEditMode || gstSaving} className={!gstEditMode ? "bg-light border-0" : ""} />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">SGST (%)</Form.Label>
                          <Form.Control type="number" name="sgst" value={values.sgst} onChange={handleChange} disabled={!gstEditMode || gstSaving} className={!gstEditMode ? "bg-light border-0" : ""} />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">VAT (%)</Form.Label>
                          <Form.Control type="number" name="vat" value={values.vat} onChange={handleChange} disabled={!gstEditMode || gstSaving} className={!gstEditMode ? "bg-light border-0" : ""} />
                        </Form.Group>
                      </Col>
                    </Row>

                    {gstEditMode && (
                      <div className="d-flex gap-3 mt-4">
                        <Button variant="none" className="custom-btn-outline" onClick={() => { resetForm(); setGstEditMode(false); }}>Cancel</Button>
                        <Button variant="none" className="custom-btn-outline" type="submit" disabled={gstSaving}>
                          {gstSaving ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="save" size="18" />} Save Tax
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Form>
            )}
          </Formik>
        </Col>

        {/* CONTAINER SECTION */}
        <Col lg={12}>
          <Card className="glass-card border-0">
            <Card.Body className="p-4 p-md-5">
              <Form onSubmit={containerFormik.handleSubmit}>
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="section-header mb-0">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="box" size="20" className="text-primary" />
                      Container Price Matrix
                    </h5>
                  </div>
                  {!containerEditMode && (
                    <Button variant="none" className="custom-btn-outline" onClick={() => setContainerEditMode(true)}>
                      <CsLineIcons icon="edit" size="18" /> Modify Charges
                    </Button>
                  )}
                </div>

                {containerFormik.values.containers.map((container, index) => (
                  <div key={index} className="matrix-item">
                    <Row className="g-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Container Name</Form.Label>
                          <Form.Control
                            name={`containers.${index}.name`}
                            value={container.name}
                            onChange={containerFormik.handleChange}
                            disabled={!containerEditMode || containerSaving}
                            className={!containerEditMode ? "bg-light border-0" : ""}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Volume / Size</Form.Label>
                          <Row className="g-2">
                            <Col xs={6}>
                              <Form.Control type="number" name={`containers.${index}.sizeValue`} value={container.sizeValue} onChange={containerFormik.handleChange} disabled={!containerEditMode || containerSaving} className={!containerEditMode ? "bg-light border-0" : ""} />
                            </Col>
                            <Col xs={6}>
                              <Form.Select name={`containers.${index}.sizeUnit`} value={container.sizeUnit} onChange={containerFormik.handleChange} disabled={!containerEditMode || containerSaving} className={!containerEditMode ? "bg-light border-0" : ""}>
                                <option value="">Unit</option>
                                <option value="ml">ml</option>
                                <option value="l">l</option>
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="pieces">pieces</option>
                              </Form.Select>
                            </Col>
                          </Row>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Price (₹)</Form.Label>
                          <div className="d-flex gap-2">
                            <Form.Control type="number" name={`containers.${index}.price`} value={container.price} onChange={containerFormik.handleChange} disabled={!containerEditMode || containerSaving} className={!containerEditMode ? "bg-light border-0" : ""} />
                            {containerEditMode && (
                              <Button variant="none" className="text-danger p-0" onClick={() => removeContainer(index)}><CsLineIcons icon="bin" size="18" /></Button>
                            )}
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                ))}

                {containerEditMode && (
                  <div className="mt-4">
                    <Button variant="none" className="custom-btn-outline mb-3" onClick={addContainer} disabled={containerSaving}>
                      <CsLineIcons icon="plus" size="18" /> Add Type
                    </Button>
                    <div className="d-flex gap-3">
                      <Button variant="none" className="custom-btn-outline" onClick={() => setContainerEditMode(false)}>Cancel</Button>
                      <Button variant="none" className="custom-btn-outline" type="submit" disabled={containerSaving}>
                        {containerSaving ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="save" size="18" />} Save Matrix
                      </Button>
                    </div>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TaxAndCharges;
