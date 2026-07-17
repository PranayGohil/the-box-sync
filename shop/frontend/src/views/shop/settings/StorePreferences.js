import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const StorePreferences = () => {
  const title = 'Store Preferences';
  const description = 'Manage dietary options visibility and other core store behaviors.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'settings', text: 'Settings' },
    { to: 'settings/preferences', title: 'Store Preferences' },
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const validationSchema = Yup.object().shape({
    item_type_setting: Yup.string().oneOf(['hidden', 'optional', 'mandatory'], 'Invalid option').required('Required'),
  });

  const formik = useFormik({
    initialValues: {
      item_type_setting: 'optional',
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        const response = await axios.put(
          `${process.env.REACT_APP_API}/user/update-store-preferences`,
          values,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        if (response.data.success) {
          toast.success('Store preferences updated successfully!');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to update store preferences.');
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
        if (userData?.item_type_setting) {
          formik.setValues({
            item_type_setting: userData.item_type_setting,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load store preferences.');
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

      <div className="settings-content-card-wrapper p-4">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <Form onSubmit={formik.handleSubmit}>
            <h5 className="mb-4">Dietary Preference Setting</h5>
            <p className="text-muted small mb-4">
              Configure how the Veg/Non-Veg/Egg option behaves in your item catalog.
            </p>

            <Row className="mb-4">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small">Catalog Dietary Option Behavior</Form.Label>
                  <Form.Check
                    type="radio"
                    id="setting-hidden"
                    name="item_type_setting"
                    label={
                      <div>
                        <strong>Hidden</strong>
                        <div className="text-muted small">Veg/Non-Veg options will be completely hidden from the catalog (Best for electronics, hardware, clothing shops).</div>
                      </div>
                    }
                    value="hidden"
                    checked={formik.values.item_type_setting === 'hidden'}
                    onChange={formik.handleChange}
                    className="mb-3"
                  />
                  <Form.Check
                    type="radio"
                    id="setting-optional"
                    name="item_type_setting"
                    label={
                      <div>
                        <strong>Optional (Mixed Mode)</strong>
                        <div className="text-muted small">You will be asked if a Category contains food items when creating it. Veg/Non-Veg options are shown only for Food categories (Best for general stores, grocery shops).</div>
                      </div>
                    }
                    value="optional"
                    checked={formik.values.item_type_setting === 'optional'}
                    onChange={formik.handleChange}
                    className="mb-3"
                  />
                  <Form.Check
                    type="radio"
                    id="setting-mandatory"
                    name="item_type_setting"
                    label={
                      <div>
                        <strong>Mandatory</strong>
                        <div className="text-muted small">Veg/Non-Veg option is always visible and required for every item (Best for bakeries, sweet shops, meat shops).</div>
                      </div>
                    }
                    value="mandatory"
                    checked={formik.values.item_type_setting === 'mandatory'}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.item_type_setting && formik.errors.item_type_setting && (
                    <div className="text-danger small mt-1">{formik.errors.item_type_setting}</div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-5">
              <Button
                variant="primary"
                type="submit"
                disabled={saving}
                className="btn-icon btn-icon-start px-4"
                style={{ borderRadius: '12px' }}
              >
                {saving ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2" /> Save Preferences
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

export default StorePreferences;
