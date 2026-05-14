import React, { useEffect, useState } from 'react';
import { Button, Form, Card, Col, Row, Alert, Spinner } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const Container = () => {
  const title = 'Edit Container Charges';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'settings', text: 'Settings' },
    { to: 'settings/container-charges', title: 'Container Charges' },
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const validationSchema = Yup.object().shape({
    containers: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('Name is required'),
        sizeValue: Yup.number().required('Size is required').min(0, 'Must be positive'),
        sizeUnit: Yup.string().required('Unit is required'),
        price: Yup.number().required('Price is required').min(0, 'Price must be non-negative'),
      })
    ),
  });

  const formik = useFormik({
    initialValues: {
      containers: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        const res = await axios.put(
          `${process.env.REACT_APP_API}/charge/update-container-charge`,
          {
            containerCharges: values.containers.map((c) => ({
              ...c,
              size: `${c.sizeValue} ${c.sizeUnit}`,
            })),
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        if (res.data.success) {
          setSuccessMessage('Container charges updated successfully.');
          setServerError('');
          setIsEditing(false);
          toast.success('Container charges updated successfully!');
        } else {
          setServerError('Update failed.');
          toast.error('Update failed.');
        }
      } catch (err) {
        console.error(err);
        setServerError('Server error occurred.');
        toast.error('Server error occurred.');
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API}/charge/get-container-charges`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.data.success && res.data.user.containerCharges) {
          const parsedContainers = res.data.user.containerCharges.map((c) => {
            const [value, unit] = c.size.split(' ');
            return {
              ...c,
              sizeValue: value || '',
              sizeUnit: unit || '',
            };
          });
          formik.setFieldValue('containers', parsedContainers);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        toast.error('Failed to fetch container charges.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addContainer = () => {
    formik.setFieldValue('containers', [...formik.values.containers, { name: '', sizeValue: '', sizeUnit: '', price: 0 }]);
  };

  const removeContainer = (index) => {
    const updated = [...formik.values.containers];
    updated.splice(index, 1);
    formik.setFieldValue('containers', updated);
  };

  const customStyles = `
    .glass-card {
      background: rgba(255, 255, 255, 0.8) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-radius: 20px !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07) !important;
      transition: transform 0.3s ease, box-shadow 0.3s ease !important;
    }
    .glass-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.12) !important;
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
      justify-content: center !important;
      gap: 8px !important;
    }
    .custom-btn-outline:hover {
      background: #1ea8e7 !important;
      color: #ffffff !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(30, 168, 231, 0.3) !important;
    }
    .custom-btn-outline:hover i, .custom-btn-outline:hover svg {
      color: #ffffff !important;
    }
    .custom-btn-danger {
      background: transparent !important;
      border: 1px solid #cf2637 !important;
      color: #cf2637 !important;
      border-radius: 50px !important;
      width: 36px !important;
      height: 36px !important;
      padding: 0 !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .custom-btn-danger i, .custom-btn-danger svg {
      color: #cf2637 !important;
      transition: color 0.3s ease !important;
    }
    .custom-btn-danger:hover {
      background: #cf2637 !important;
      color: #ffffff !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(207, 38, 55, 0.3) !important;
    }
    .custom-btn-danger:hover i, .custom-btn-danger:hover svg {
      color: #ffffff !important;
    }
    .custom-btn-solid {
      background: #1ea8e7 !important;
      border: 1px solid #1ea8e7 !important;
      color: #ffffff !important;
      border-radius: 50px !important;
      padding: 0.6rem 1.5rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
    }
    .custom-btn-solid:hover {
      background: #0091d5 !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(30, 168, 231, 0.3) !important;
    }
    .section-header {
      border-left: 4px solid #1ea8e7;
      padding-left: 15px;
      margin-bottom: 25px;
    }
  `;

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <style>{customStyles}</style>
        <HtmlHead title={title} />
        <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
          <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
          <h5 className="fw-bold">Loading Charge Details...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} />
      
      {/* Header Section */}
      <Row className="g-3 align-items-center mb-4">
        <Col md={7}>
          <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
          <BreadcrumbList items={breadcrumbs} />
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col lg={11}>
          <Card className="glass-card border-0">
            <Card.Body className="p-4 p-md-5">
              <Form onSubmit={formik.handleSubmit}>
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="section-header mb-0">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="box" size="20" className="text-primary" />
                      Container Price Matrix
                    </h5>
                  </div>
                  
                  {!isEditing && (
                    <Button
                      variant="none"
                      className="custom-btn-outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <CsLineIcons icon="edit" size="18" />
                      Modify Charges
                    </Button>
                  )}
                </div>

                {formik.values.containers.map((container, index) => (
                  <div key={index} className="p-3 mb-4 rounded-3" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(30,168,231,0.1)' }}>
                    <Row className="g-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Container Name</Form.Label>
                          <Form.Control
                            type="text"
                            name={`containers.${index}.name`}
                            value={container.name}
                            onChange={formik.handleChange}
                            isInvalid={!!formik.errors.containers?.[index]?.name}
                            disabled={!isEditing || saving}
                            className={!isEditing ? "bg-light border-0 px-3 py-2 fw-bold" : ""}
                            placeholder="e.g. Large Bowl"
                          />
                          <Form.Control.Feedback type="invalid">{formik.errors.containers?.[index]?.name}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold opacity-75">Volume / Size</Form.Label>
                          <Row className="g-2">
                            <Col xs={6}>
                              <Form.Control
                                type="number"
                                name={`containers.${index}.sizeValue`}
                                value={container.sizeValue}
                                onChange={formik.handleChange}
                                isInvalid={!!formik.errors.containers?.[index]?.sizeValue}
                                disabled={!isEditing || saving}
                                className={!isEditing ? "bg-light border-0 px-3 py-2 fw-bold" : ""}
                                placeholder="Qty"
                              />
                            </Col>
                            <Col xs={6}>
                              <Form.Select
                                name={`containers.${index}.sizeUnit`}
                                value={container.sizeUnit}
                                onChange={formik.handleChange}
                                isInvalid={!!formik.errors.containers?.[index]?.sizeUnit}
                                disabled={!isEditing || saving}
                                className={!isEditing ? "bg-light border-0 px-3 py-2 fw-bold appearance-none" : ""}
                              >
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
                          <div className="d-flex align-items-center gap-2">
                            <Form.Control
                              type="number"
                              name={`containers.${index}.price`}
                              value={container.price}
                              onChange={formik.handleChange}
                              isInvalid={!!formik.errors.containers?.[index]?.price}
                              disabled={!isEditing || saving}
                              className={!isEditing ? "bg-light border-0 px-3 py-2 fw-bold" : ""}
                            />
                            {isEditing && (
                              <Button variant="none" className="custom-btn-danger d-flex align-items-center flex-shrink-0" onClick={() => removeContainer(index)} disabled={saving}>
                                <CsLineIcons icon="bin" size="14" />
                              </Button>
                            )}
                          </div>
                          <Form.Control.Feedback type="invalid">{formik.errors.containers?.[index]?.price}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                ))}

                {isEditing && (
                  <div className="mt-4">
                    <Button variant="none" className="custom-btn-outline mb-4" onClick={addContainer} disabled={saving}>
                      <CsLineIcons icon="plus" size="18" />
                      Add New Container Type
                    </Button>
                    
                    <div className="d-flex gap-3">
                      <Button
                        variant="none"
                        className="custom-btn-outline px-4"
                        onClick={() => {
                          setIsEditing(false);
                          setServerError('');
                          setSuccessMessage('');
                        }}
                        disabled={saving}
                      >
                        <CsLineIcons icon="close" size="18" />
                        Cancel
                      </Button>
                      <Button 
                        variant="none"
                        className="custom-btn-outline px-5" 
                        type="submit" 
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Saving Charges...
                          </>
                        ) : (
                          <>
                            <CsLineIcons icon="save" size="20" />
                            Save Matrix
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {serverError && (
                  <Alert variant="danger" className="mt-4 glass-card border-0">
                    <CsLineIcons icon="error" className="me-2" />
                    {serverError}
                  </Alert>
                )}
                {successMessage && (
                  <Alert variant="success" className="mt-4 glass-card border-0">
                    <CsLineIcons icon="check" className="me-2" />
                    {successMessage}
                  </Alert>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modern Saving Overlay */}
      {saving && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
          <Card className="glass-card border-0 p-5 shadow-lg text-center" style={{ maxWidth: '400px' }}>
            <Spinner animation="grow" variant="primary" className="mb-4" />
            <h4 className="fw-bold">Updating Charges</h4>
            <p className="text-muted mb-0">Synchronizing packaging costs across all order types.</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Container;
