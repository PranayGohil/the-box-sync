import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from 'contexts/AuthContext';

const WhatsAppBillConfig = () => {
  const { activePlans, currentUser } = useContext(AuthContext);
  const canUseWhatsApp = true;

  const title = 'WhatsApp Bill Configuration';
  const description = 'Configure fields, notes, and layout for order bills shared via WhatsApp.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'settings', text: 'Settings' },
    { to: 'settings/whatsapp-bill-config', title: 'WhatsApp Bill Configuration' },
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const validationSchema = Yup.object().shape({
    showGst: Yup.boolean(),
    showFssai: Yup.boolean(),
    showCustomerDetails: Yup.boolean(),
    headerNote: Yup.string().max(150, 'Header note must be under 150 characters'),
    footerNote: Yup.string().max(150, 'Footer note must be under 150 characters'),
  });

  const formik = useFormik({
    initialValues: {
      showGst: true,
      showFssai: true,
      showCustomerDetails: true,
      headerNote: '',
      footerNote: 'Thank you for your visit!',
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        const response = await axios.put(
          `${process.env.REACT_APP_API}/user/update-whatsapp-bill-settings`,
          { whatsappBillSettings: { ...values } },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        if (response.data.success) {
          toast.success('WhatsApp bill configuration updated successfully!');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to update WhatsApp bill configuration.');
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
        if (userData?.whatsappBillSettings) {
          formik.setValues({
            showGst: userData.whatsappBillSettings.showGst ?? true,
            showFssai: userData.whatsappBillSettings.showFssai ?? true,
            showCustomerDetails: userData.whatsappBillSettings.showCustomerDetails ?? true,
            headerNote: userData.whatsappBillSettings.headerNote || '',
            footerNote: userData.whatsappBillSettings.footerNote ?? 'Thank you for your visit!',
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load WhatsApp bill configuration.');
      } finally {
        setLoading(false);
      }
    };

    if (canUseWhatsApp) {
      fetchData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseWhatsApp]);

  if (!canUseWhatsApp) {
    return (
      <div className="container-fluid qsr-page-container">
        <HtmlHead title={title} description={description} />
        <div className="qsr-page-title-container">
          <Row>
            <Col xs="12">
              <h1 className="qsr-page-title">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>
        <Card className="profile-glass-card border-0 p-4 text-center">
          <Alert variant="warning" className="mb-0">
            You need to subscribe to a plan with WhatsApp Invoice Sharing enabled to access and configure WhatsApp Bill Settings.
          </Alert>
        </Card>
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
                      <h4 className="fw-bold mb-3 text-primary">WhatsApp Bill Message Content</h4>
                      <p className="text-muted small">Choose which details are included when sending bill receipts via WhatsApp.</p>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="switch"
                          id="showCustomerDetails"
                          label="Include Customer Information"
                          checked={formik.values.showCustomerDetails}
                          onChange={(e) => formik.setFieldValue('showCustomerDetails', e.target.checked)}
                        />
                        <Form.Text className="text-muted">Include customer's name and contact number in the message body.</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="switch"
                          id="showGst"
                          label="Show GST Number on WhatsApp Invoice"
                          checked={formik.values.showGst}
                          onChange={(e) => formik.setFieldValue('showGst', e.target.checked)}
                        />
                        <Form.Text className="text-muted">Display the restaurant's GST number in the message header.</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="switch"
                          id="showFssai"
                          label="Show FSSAI Number on WhatsApp Invoice"
                          checked={formik.values.showFssai}
                          onChange={(e) => formik.setFieldValue('showFssai', e.target.checked)}
                        />
                        <Form.Text className="text-muted">Display the restaurant's FSSAI license number in the message header.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr />

                  <Row className="mb-4">
                    <Col xs="12">
                      <h4 className="fw-bold mb-3 text-primary">Custom Header & Footer Messages</h4>
                      <p className="text-muted small">Add personalized greetings or closing notes to your WhatsApp invoice messages.</p>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group>
                        <Form.Label>Header Note / Greeting Message</Form.Label>
                        <Form.Control
                          type="text"
                          name="headerNote"
                          placeholder="e.g. Here is your digital invoice from [Restaurant]!"
                          value={formik.values.headerNote}
                          onChange={formik.handleChange}
                          isInvalid={formik.touched.headerNote && formik.errors.headerNote}
                        />
                        <Form.Control.Feedback type="invalid">{formik.errors.headerNote}</Form.Control.Feedback>
                        <Form.Text className="text-muted">Shown below the restaurant title. Leave blank if not needed.</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col xs="12" md="6" className="mb-3">
                      <Form.Group>
                        <Form.Label>Footer Note / Closing Message</Form.Label>
                        <Form.Control
                          type="text"
                          name="footerNote"
                          placeholder="e.g. Thank you for your visit!"
                          value={formik.values.footerNote}
                          onChange={formik.handleChange}
                          isInvalid={formik.touched.footerNote && formik.errors.footerNote}
                        />
                        <Form.Control.Feedback type="invalid">{formik.errors.footerNote}</Form.Control.Feedback>
                        <Form.Text className="text-muted">Appears at the very bottom of the WhatsApp message. Clear text to remove.</Form.Text>
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

export default WhatsAppBillConfig;
