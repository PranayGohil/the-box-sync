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
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Loading Tax Information...</h5>
              <p className="text-muted">Please wait while we fetch your tax details</p>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <section className="scroll-section" id="title">
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
          </section>

          <section className="scroll-section" id="taxForm">
            <Card body className="mb-5">
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
                    <Row className="mb-3">
                      <Col md="6" className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            GST Number <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="gst_no"
                            value={values.gst_no}
                            onChange={(e) => {
                              // Convert to uppercase automatically
                              const upperValue = e.target.value.toUpperCase();
                              handleChange({
                                target: {
                                  name: 'gst_no',
                                  value: upperValue,
                                },
                              });
                            }}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.gst_no && errors.gst_no}
                            isValid={touched.gst_no && !errors.gst_no && editMode}
                            placeholder="22AAAAA0000A1Z5"
                            maxLength={15}
                            style={{ textTransform: 'uppercase' }}
                          />
                          <Form.Control.Feedback type="invalid">{errors.gst_no}</Form.Control.Feedback>
                          <Form.Text className="text-muted">Format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric</Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md="4" className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            CGST (%) <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="number"
                            name="cgst"
                            value={values.cgst}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.cgst && errors.cgst}
                            isValid={touched.cgst && !errors.cgst && editMode}
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0.00"
                          />
                          <Form.Control.Feedback type="invalid">{errors.cgst}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md="4" className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            SGST (%) <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="number"
                            name="sgst"
                            value={values.sgst}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.sgst && errors.sgst}
                            isValid={touched.sgst && !errors.sgst && editMode}
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0.00"
                          />
                          <Form.Control.Feedback type="invalid">{errors.sgst}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md="4" className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            VAT (%) <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="number"
                            name="vat"
                            value={values.vat}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!editMode || saving}
                            isInvalid={touched.vat && errors.vat}
                            isValid={touched.vat && !errors.vat && editMode}
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
                    {editMode && (
                      <Row className="mb-3">
                        <Col md="12">
                          <Alert variant="info" className="mb-0">
                            <CsLineIcons icon="info-circle" className="me-2" />
                            <strong>Tax Summary:</strong> Total Tax ={' '}
                            {(parseFloat(values.cgst || 0) + parseFloat(values.sgst || 0) + parseFloat(values.vat || 0)).toFixed(2)}%
                          </Alert>
                        </Col>
                      </Row>
                    )}

                    {error && (
                      <Alert variant="danger" className="mb-3">
                        <CsLineIcons icon="error" className="me-2" />
                        {error}
                      </Alert>
                    )}

                    <div className="mt-4">
                      {editMode ? (
                        <>
                          <Button
                            variant="secondary"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCancel(resetForm);
                            }}
                            disabled={saving || isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button variant="primary" type="submit" className="ms-2" disabled={saving || isSubmitting} style={{ minWidth: '100px' }}>
                            {saving || isSubmitting ? (
                              <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CsLineIcons icon="save" className="me-2" />
                                Submit
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline-primary"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditMode(true);
                          }}
                        >
                          <CsLineIcons icon="edit" className="me-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </Form>
                )}
              </Formik>

              {/* Saving overlay */}
              {saving && (
                <div
                  className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 9999,
                    backdropFilter: 'blur(2px)',
                  }}
                >
                  <Card className="shadow-lg border-0" style={{ minWidth: '200px' }}>
                    <Card.Body className="text-center p-4">
                      <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
                      <h5 className="mb-0">Updating Tax Information...</h5>
                      <small className="text-muted">Please wait a moment</small>
                    </Card.Body>
                  </Card>
                </div>
              )}
            </Card>
          </section>
        </Col>
      </Row>
    </>
  );
};

export default Gst;
