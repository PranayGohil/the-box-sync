import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { Formik, useFormik } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';

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

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" style={{ color: '#1ea8e7' }} />
        <h5 className="mt-3 fw-bold">Loading Tax & Charges...</h5>
      </div>
    );
  }

  return (
    <div className="container-fluid qsr-page-container">
      <HtmlHead title={title} description={description} />

      <div className="qsr-page-title-container">
        <Row className="g-3 align-items-center">
          <Col xs={12} md={7}>
            <h1 className="qsr-page-title">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      <Row className="g-4">
        {/* GST SECTION */}
        <Col lg={12}>
          <Formik initialValues={gstProfile} validationSchema={gstValidationSchema} onSubmit={handleGstSubmit} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, resetForm }) => (
              <Form onSubmit={handleSubmit}>
                <Card className="tax-and-charges-glass-card border-0 mb-4">
                  <Card.Body className="p-4 p-md-5">
                    <div className="d-flex tax-and-charges-button-group-responsive align-items-md-center justify-content-between mb-4">
                      <div className="tax-and-charges-section-header mb-0">
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                          <CsLineIcons icon="percentage" size="20" className="text-primary" />
                          Tax Configuration (GST)
                        </h5>
                      </div>
                      {!gstEditMode && (
                        <Button variant="none" className="tax-and-charges-custom-btn-outline" onClick={() => setGstEditMode(true)}>
                          <CsLineIcons icon="edit" size="18" /> Edit Tax
                        </Button>
                      )}
                    </div>

                    <Row className="g-3">
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">GST Registration Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="gst_no"
                            value={values.gst_no}
                            onChange={(e) => handleChange({ target: { name: 'gst_no', value: e.target.value.toUpperCase() } })}
                            disabled={!gstEditMode || gstSaving}
                            isInvalid={touched.gst_no && errors.gst_no}
                            className={!gstEditMode ? 'bg-light border-0' : ''}
                          />
                          <Form.Control.Feedback type="invalid">{errors.gst_no}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col xs={4} md={2}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">CGST (%)</Form.Label>
                          <Form.Control
                            type="number"
                            name="cgst"
                            value={values.cgst}
                            onChange={handleChange}
                            disabled={!gstEditMode || gstSaving}
                            className={!gstEditMode ? 'bg-light border-0' : ''}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={4} md={2}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">SGST (%)</Form.Label>
                          <Form.Control
                            type="number"
                            name="sgst"
                            value={values.sgst}
                            onChange={handleChange}
                            disabled={!gstEditMode || gstSaving}
                            className={!gstEditMode ? 'bg-light border-0' : ''}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={4} md={2}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">VAT (%)</Form.Label>
                          <Form.Control
                            type="number"
                            name="vat"
                            value={values.vat}
                            onChange={handleChange}
                            disabled={!gstEditMode || gstSaving}
                            className={!gstEditMode ? 'bg-light border-0' : ''}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {gstEditMode && (
                      <div className="d-flex tax-and-charges-button-group-responsive gap-3 mt-4">
                        <Button
                          variant="none"
                          className="tax-and-charges-custom-btn-outline"
                          onClick={() => {
                            resetForm();
                            setGstEditMode(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button variant="none" className="tax-and-charges-custom-btn-outline" type="submit" disabled={gstSaving}>
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
          <Card className="tax-and-charges-glass-card border-0">
            <Card.Body className="p-4 p-md-5">
              <Form onSubmit={containerFormik.handleSubmit}>
                <div className="d-flex tax-and-charges-button-group-responsive align-items-md-center justify-content-between mb-4">
                  <div className="tax-and-charges-section-header mb-0">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="box" size="20" className="text-primary" />
                      Container Price Matrix
                    </h5>
                  </div>
                  {!containerEditMode && (
                    <Button variant="none" className="tax-and-charges-custom-btn-outline" onClick={() => setContainerEditMode(true)}>
                      <CsLineIcons icon="edit" size="18" /> Modify Charges
                    </Button>
                  )}
                </div>

                {containerFormik.values.containers.map((container, index) => (
                  <div key={index} className="tax-and-charges-matrix-item">
                    <Row className="g-3">
                      <Col xs={12} md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Container Name</Form.Label>
                          <Form.Control
                            name={`containers.${index}.name`}
                            value={container.name}
                            onChange={containerFormik.handleChange}
                            disabled={!containerEditMode || containerSaving}
                            className={!containerEditMode ? 'bg-light border-0' : ''}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Volume / Size</Form.Label>
                          <Row className="g-2">
                            <Col xs={6}>
                              <Form.Control
                                type="number"
                                name={`containers.${index}.sizeValue`}
                                value={container.sizeValue}
                                onChange={containerFormik.handleChange}
                                disabled={!containerEditMode || containerSaving}
                                className={!containerEditMode ? 'bg-light border-0' : ''}
                              />
                            </Col>
                            <Col xs={6}>
                              {containerEditMode ? (
                                <Select
                                  classNamePrefix="react-select"
                                  options={[
                                    { value: 'ml', label: 'ml' },
                                    { value: 'l', label: 'l' },
                                    { value: 'g', label: 'g' },
                                    { value: 'kg', label: 'kg' },
                                    { value: 'pieces', label: 'pieces' },
                                  ]}
                                  value={container.sizeUnit ? { label: container.sizeUnit, value: container.sizeUnit } : null}
                                  onChange={(selected) => containerFormik.setFieldValue(`containers.${index}.sizeUnit`, selected ? selected.value : '')}
                                  placeholder="Unit"
                                  isDisabled={containerSaving}
                                  menuPortalTarget={document.body}
                                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                                />
                              ) : (
                                <Form.Control value={container.sizeUnit || 'Unit'} disabled className="bg-light border-0" />
                              )}
                            </Col>
                          </Row>
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Price (₹)</Form.Label>
                          <div className="d-flex gap-2">
                            <Form.Control
                              type="number"
                              name={`containers.${index}.price`}
                              value={container.price}
                              onChange={containerFormik.handleChange}
                              disabled={!containerEditMode || containerSaving}
                              className={!containerEditMode ? 'bg-light border-0' : ''}
                            />
                            {containerEditMode && (
                              <Button variant="none" className="text-danger p-0" onClick={() => removeContainer(index)}>
                                <CsLineIcons icon="bin" size="18" />
                              </Button>
                            )}
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                ))}

                {containerEditMode && (
                  <div className="mt-4">
                    <Button
                      variant="none"
                      className="tax-and-charges-custom-btn-outline text-center mb-3 w-100 w-md-auto"
                      onClick={addContainer}
                      disabled={containerSaving}
                    >
                      <CsLineIcons icon="plus" size="18" /> Add Type
                    </Button>
                    <div className="d-flex tax-and-charges-button-group-responsive gap-3">
                      <Button variant="none" className="tax-and-charges-custom-btn-outline" onClick={() => setContainerEditMode(false)}>
                        Cancel
                      </Button>
                      <Button variant="none" className="tax-and-charges-custom-btn-outline" type="submit" disabled={containerSaving}>
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
