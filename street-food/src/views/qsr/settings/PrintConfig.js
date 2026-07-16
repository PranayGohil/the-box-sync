import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const PrintConfig = () => {
  const title = 'Print Configuration';
  const description = 'Manage thermal receipt dimensions, logo visibility, tax lines, and footer notes.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'settings', text: 'Settings' },
    { to: 'settings/print-config', title: 'Print Configuration' },
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const validationSchema = Yup.object().shape({
    showLogo: Yup.boolean(),
    showGst: Yup.boolean(),
    showFssai: Yup.boolean(),
    showCustomerDetails: Yup.boolean(),
    headerNote: Yup.string().max(100, 'Header note must be under 100 characters'),
    footerNote: Yup.string().max(100, 'Footer note must be under 100 characters'),
    paperWidth: Yup.string().required('Paper width is required'),
  });

  const formik = useFormik({
    initialValues: {
      showLogo: true,
      showGst: true,
      showFssai: true,
      showCustomerDetails: true,
      headerNote: '',
      footerNote: 'Thanks, Visit Again',
      paperWidth: '58mm',
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        const response = await axios.put(
          `${process.env.REACT_APP_API}/user/update-print-settings`,
          { printSettings: { ...values } },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        if (response.data.success) {
          toast.success('Print configuration updated successfully!');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to update print configuration.');
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userRes = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        const userData = userRes.data.user || userRes.data;
        if (userData?.printSettings) {
          formik.setValues({
            showLogo: userData.printSettings.showLogo ?? true,
            showGst: userData.printSettings.showGst ?? true,
            showFssai: userData.printSettings.showFssai ?? true,
            showCustomerDetails: userData.printSettings.showCustomerDetails ?? true,
            headerNote: userData.printSettings.headerNote || '',
            footerNote: userData.printSettings.footerNote || 'Thanks, Visit Again',
            paperWidth: userData.printSettings.paperWidth || '58mm',
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load print configuration.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container-fluid qsr-page-container">
      <HtmlHead title={title} description={description} />

      <div className="qsr-page-title-container">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto">
            <h1 className="qsr-page-title">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      <Row>
        <Col xs="12" className="mb-5">
          <Card className="profile-glass-card border-0">
            <Card.Body className="p-4 p-md-5">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <Form onSubmit={formik.handleSubmit}>
                  <Row className="mb-4">
                    <Col xs="12">
                      <h4 className="fw-bold mb-3 text-primary">Visual Layout Controls</h4>
                      <p className="text-muted small">Configure which elements are included on the printed slip.</p>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="switch"
                          id="showLogo"
                          label="Print Restaurant Logo"
                          checked={formik.values.showLogo}
                          onChange={(e) => formik.setFieldValue('showLogo', e.target.checked)}
                        />
                        <Form.Text className="text-muted">Toggle displaying the restaurant logo image at the top of customer receipts.</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="switch"
                          id="showCustomerDetails"
                          label="Print Customer Information"
                          checked={formik.values.showCustomerDetails}
                          onChange={(e) => formik.setFieldValue('showCustomerDetails', e.target.checked)}
                        />
                        <Form.Text className="text-muted">Include the customer's name and details on KOT and customer receipts.</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="switch"
                          id="showGst"
                          label="Show GST Number on Receipt"
                          checked={formik.values.showGst}
                          onChange={(e) => formik.setFieldValue('showGst', e.target.checked)}
                        />
                        <Form.Text className="text-muted">Display the restaurant's GST number in the receipt header (only shown if GST number is set in your profile).</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="switch"
                          id="showFssai"
                          label="Show FSSAI Number on Receipt"
                          checked={formik.values.showFssai}
                          onChange={(e) => formik.setFieldValue('showFssai', e.target.checked)}
                        />
                        <Form.Text className="text-muted">Display the restaurant's FSSAI license number in the receipt header (only shown if FSSAI number is set in your profile).</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr />

                  <Row className="mb-4">
                    <Col xs="12">
                      <h4 className="fw-bold mb-3 text-primary">Dimensions & Page Setup</h4>
                      <p className="text-muted small">Adjust printer sheet widths and margins.</p>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group>
                        <Form.Label>Print Paper Width</Form.Label>
                        <Form.Control as="select" name="paperWidth" value={formik.values.paperWidth} onChange={formik.handleChange}>
                          <option value="58mm">58mm (Standard 2-inch Printer)</option>
                          <option value="80mm">80mm (Wide 3-inch Printer)</option>
                        </Form.Control>
                        <Form.Text className="text-muted">Specifies the layout constraints to ensure text lines do not overflow.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr />

                  <Row className="mb-4">
                    <Col xs="12">
                      <h4 className="fw-bold mb-3 text-primary">Receipt Notes & Messages</h4>
                      <p className="text-muted small">Add custom text to the top and bottom of the slips.</p>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group>
                        <Form.Label>Header Note (Printed under Header)</Form.Label>
                        <Form.Control
                          type="text"
                          name="headerNote"
                          placeholder="e.g., Welcome to our diner! / WiFi: boxsync123"
                          value={formik.values.headerNote}
                          onChange={formik.handleChange}
                          isInvalid={formik.touched.headerNote && formik.errors.headerNote}
                        />
                        <Form.Control.Feedback type="invalid">{formik.errors.headerNote}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group>
                        <Form.Label>Footer Note (Printed above Spacing)</Form.Label>
                        <Form.Control
                          type="text"
                          name="footerNote"
                          placeholder="e.g., Thanks, Visit Again"
                          value={formik.values.footerNote}
                          onChange={formik.handleChange}
                          isInvalid={formik.touched.footerNote && formik.errors.footerNote}
                        />
                        <Form.Control.Feedback type="invalid">{formik.errors.footerNote}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex profile-button-group-responsive justify-content-end mt-4">
                    <Button type="submit" variant="none" className="profile-custom-btn-outline px-4 w-100 w-md-auto" disabled={saving}>
                      {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Configuration'
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PrintConfig;
