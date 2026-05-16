import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { Formik } from 'formik';
import * as Yup from 'yup';

const Gst = () => {
  const title = 'Tax Info';
  const description = 'Update your GST and tax information.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'settings', text: 'Settings' },
    { to: 'settings/tax', title: 'Tax Info' },
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    gst_no: '',
    cgst: 0,
    sgst: 0,
    vat: 0,
  });

  // Yup validation schema
  const validationSchema = Yup.object().shape({
    gst_no: Yup.string()
      .required('GST number is required')
      .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'GST number format is invalid (e.g., 22AAAAA0000A1Z5)')
      .length(15, 'GST number must be exactly 15 characters'),
    cgst: Yup.number()
      .required('CGST is required')
      .min(0, 'CGST cannot be negative')
      .max(100, 'CGST cannot exceed 100%')
      .test('decimal', 'CGST can have maximum 2 decimal places', (value) => {
        if (value === undefined || value === null) return true;
        return /^\d+(\.\d{1,2})?$/.test(value.toString());
      }),
    sgst: Yup.number()
      .required('SGST is required')
      .min(0, 'SGST cannot be negative')
      .max(100, 'SGST cannot exceed 100%')
      .test('decimal', 'SGST can have maximum 2 decimal places', (value) => {
        if (value === undefined || value === null) return true;
        return /^\d+(\.\d{1,2})?$/.test(value.toString());
      }),
    vat: Yup.number()
      .required('VAT is required')
      .min(0, 'VAT cannot be negative')
      .max(100, 'VAT cannot exceed 100%')
      .test('decimal', 'VAT can have maximum 2 decimal places', (value) => {
        if (value === undefined || value === null) return true;
        return /^\d+(\.\d{1,2})?$/.test(value.toString());
      }),
  });

  useEffect(() => {
    const fetchTaxInfo = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const data = res.data.user || res.data;

        setProfile({
          gst_no: data.gst_no || '',
          cgst: data.taxInfo?.cgst || 0,
          sgst: data.taxInfo?.sgst || 0,
          vat: data.taxInfo?.vat || 0,
        });
      } catch (err) {
        console.error('Failed to load tax info', err);
        setError('Failed to load tax info.');
        toast.error('Failed to load tax info.');
      } finally {
        setLoading(false);
      }
    };

    fetchTaxInfo();
  }, []);

  const handleEditSubmit = async (values, { setSubmitting }) => {
    setSaving(true);
    try {
      setError('');
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
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setProfile({
          gst_no: values.gst_no,
          cgst: parseFloat(values.cgst),
          sgst: parseFloat(values.sgst),
          vat: parseFloat(values.vat),
        });
        setEditMode(false);
        toast.success('Tax information updated successfully!');
      } else {
        const errorMessage = response.data.message || 'Update failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error('Failed to update tax info', err);
      const errorMessage = err.response?.data?.message || 'Update failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  const handleCancel = (resetForm) => {
    resetForm();
    setEditMode(false);
    setError('');
  };

  

  if (loading) {
    return (
      <div className="container-fluid py-5">
        
        <HtmlHead title={title} description={description} />
        <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
          <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
          <h5 className="fw-bold">Loading Tax Information...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      
      <HtmlHead title={title} description={description} />
      
      {/* Header Section */}
      <Row className="g-3 align-items-center mb-4">
        <Col md={7}>
          <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
          <BreadcrumbList items={breadcrumbs} />
        </Col>
      </Row>

      <Formik
        initialValues={{
          gst_no: profile.gst_no,
          cgst: profile.cgst,
          sgst: profile.sgst,
          vat: profile.vat,
        }}
        validationSchema={validationSchema}
        onSubmit={handleEditSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, resetForm }) => (
          <Form onSubmit={handleSubmit}>
            <Row className="justify-content-center">
              <Col lg={10}>
                <Card className="gst-glass-card border-0">
                  <Card.Body className="p-4 p-md-5">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div className="gst-section-header mb-0">
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                          <CsLineIcons icon="percentage" size="20" className="text-primary" />
                          Tax Configuration
                        </h5>
                      </div>
                      
                      {!editMode && (
                        <Button
                          variant="none"
                          className="gst-custom-btn-outline"
                          onClick={() => setEditMode(true)}
                        >
                          <CsLineIcons icon="edit" size="18" />
                          Edit Tax Info
                        </Button>
                      )}
                    </div>

                    <Row className="g-4">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">GST Registration Number <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="gst_no"
                            value={values.gst_no}
                            onChange={(e) => {
                              const upperValue = e.target.value.toUpperCase();
                              handleChange({ target: { name: 'gst_no', value: upperValue } });
                            }}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.gst_no && errors.gst_no}
                            className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""}
                            placeholder="22AAAAA0000A1Z5"
                            maxLength={15}
                            style={{ textTransform: 'uppercase' }}
                          />
                          <Form.Control.Feedback type="invalid">{errors.gst_no}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">CGST (%) <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="number"
                            name="cgst"
                            value={values.cgst}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.cgst && errors.cgst}
                            className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""}
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0.00"
                          />
                          <Form.Control.Feedback type="invalid">{errors.cgst}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">SGST (%) <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="number"
                            name="sgst"
                            value={values.sgst}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.sgst && errors.sgst}
                            className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""}
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0.00"
                          />
                          <Form.Control.Feedback type="invalid">{errors.sgst}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">VAT (%) <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="number"
                            name="vat"
                            value={values.vat}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.vat && errors.vat}
                            className={!editMode ? "bg-light border-0 px-3 py-2 fw-bold" : ""}
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0.00"
                          />
                          <Form.Control.Feedback type="invalid">{errors.vat}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Tax Summary Info Box */}
                    <Row className="mt-4">
                      <Col md={12}>
                        <div className="p-3 rounded-3" style={{ background: 'rgba(30, 168, 231, 0.05)', border: '1px dashed #1ea8e7' }}>
                          <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: '#1ea8e7' }}>
                            <CsLineIcons icon="info-circle" size="16" />
                            Calculation Summary
                          </h6>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">Total Cumulative Tax Rate</span>
                            <span className="fw-bold h5 mb-0" style={{ color: '#1ea8e7' }}>
                              {(parseFloat(values.cgst || 0) + parseFloat(values.sgst || 0) + parseFloat(values.vat || 0)).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {error && (
                      <Alert variant="danger" className="mt-4 gst-glass-card border-0">
                        <CsLineIcons icon="error" className="me-2" />
                        {error}
                      </Alert>
                    )}

                    {editMode && (
                      <div className="d-flex gap-3 mt-5">
                        <Button
                          variant="none"
                          className="gst-custom-btn-outline px-4"
                          onClick={() => handleCancel(resetForm)}
                          disabled={saving || isSubmitting}
                        >
                          <CsLineIcons icon="close" size="18" />
                          Cancel
                        </Button>
                        <Button 
                          variant="none"
                          className="gst-custom-btn-outline px-5" 
                          type="submit" 
                          disabled={saving || isSubmitting}
                        >
                          {saving || isSubmitting ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                              Saving Changes...
                            </>
                          ) : (
                            <>
                              <CsLineIcons icon="save" size="20" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Form>
        )}
      </Formik>

      {/* Modern Saving Overlay */}
      {saving && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
          <Card className="gst-glass-card border-0 p-5 shadow-lg text-center" style={{ maxWidth: '400px' }}>
            <Spinner animation="grow" variant="primary" className="mb-4" />
            <h4 className="fw-bold">Updating Tax Info</h4>
            <p className="text-muted mb-0">Synchronizing tax configuration across your billing systems.</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Gst;
