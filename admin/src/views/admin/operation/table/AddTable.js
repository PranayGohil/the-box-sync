import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Form, Card, Col, Row, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import CreatableSelect from 'react-select/creatable';

const AddTable = () => {
  const history = useHistory();
  const location = useLocation();

  const title = 'Add Table';
  const description = 'Add restaurant tables with validations.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/add-table', title: 'Add Table' },
  ];

  const [fetchError, setFetchError] = useState('');
  const [tableErrors, setTableErrors] = useState({});
  const [diningAreas, setDiningAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingTable, setCheckingTable] = useState({});
  const diningAreasOptions = diningAreas.map((cat) => ({
    label: cat,
    value: cat,
  }));

  const queryParams = new URLSearchParams(location.search);
  const queryArea = queryParams.get('area') || '';
  const isFromManageTable = location.state?.fromManageTable || false || !!queryArea;
  const prefilledArea = isFromManageTable ? location.state?.area || queryArea : '';

  useEffect(() => {
    const fetchDiningAreas = async () => {
      try {
        setLoadingAreas(true);
        const res = await axios.get(`${process.env.REACT_APP_API}/table/get/dining-areas`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.data.success) {
          setDiningAreas(res.data.data);
        } else {
          setFetchError(res.data.message);
          toast.error('Failed to fetch dining areas');
        }
      } catch (err) {
        console.error('Error fetching dining areas:', err);
        setFetchError('An error occurred while fetching dining areas.');
        toast.error('Failed to load dining areas');
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchDiningAreas();
  }, []);

  const validationSchema = Yup.object({
    area: Yup.string().required('Dining Type is required'),
    tables: Yup.array().of(
      Yup.object().shape({
        tableNo: Yup.string().required('Table Number is required'),
        maxPerson: Yup.string()
          .required('Max Person is required')
          .matches(/[0-9]$/, 'Invalid Max Person'),
      })
    ),
  });

  const formik = useFormik({
    initialValues: {
      area: prefilledArea,
      tables: [{ tableNo: '', maxPerson: '' }],
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setFetchError('');

      const checkTableExists = async (area, tableNo, index) => {
        if (!area || !tableNo) return false;

        const trimmedNo = tableNo.trim();
        const duplicateIndex = values.tables.findIndex((t, i) => t.tableNo.trim() === trimmedNo && i !== index);

        if (duplicateIndex !== -1) {
          setTableErrors((prev) => ({
            ...prev,
            [index]: 'Duplicate table number used in the form.',
          }));
          return true;
        }

        setTableErrors((prev) => {
          const updated = { ...prev };
          delete updated[index];
          return updated;
        });

        setCheckingTable((prev) => ({ ...prev, [index]: true }));

        try {
          const response = await axios.get(`${process.env.REACT_APP_API}/table/check-table`, {
            params: { area, table_no: tableNo },
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });

          if (response.data.exists) {
            setTableErrors((prev) => ({
              ...prev,
              [index]: `Table number ${tableNo} already exists in ${area}.`,
            }));
            return true;
          }
        } catch (err) {
          console.error('Check table error:', err);
        } finally {
          setCheckingTable((prev) => ({ ...prev, [index]: false }));
        }
        return false;
      };

      const finalChecks = await Promise.all(values.tables.map((t, i) => checkTableExists(values.area, t.tableNo, i)));

      if (finalChecks.some((c) => c === true)) {
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await axios.post(`${process.env.REACT_APP_API}/table/add`, values, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (response.data.success) {
          toast.success(response.data.message);
          history.push('/operations/manage-table');
        } else {
          toast.error(response.data.message);
        }
      } catch (err) {
        console.error('Submit table error:', err);
        toast.error('Failed to add tables');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const addMoreTable = () => {
    formik.setFieldValue('tables', [...formik.values.tables, { tableNo: '', maxPerson: '' }]);
  };

  const removeTable = (index) => {
    const updatedTables = formik.values.tables.filter((_, i) => i !== index);
    formik.setFieldValue('tables', updatedTables);
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '12px',
      padding: '2px',
      border:
        (formik.touched.area && formik.errors.area) || (isSubmitting && !formik.values.area)
          ? '1px solid #ef4444'
          : state.isFocused
          ? '1px solid #1ea8e7'
          : '1px solid #e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(30, 168, 231, 0.1)' : 'none',
      backgroundColor: '#fff',
      '&:hover': { border: '1px solid #1ea8e7' },
    }),
  };

  return (
    <div className="container-fluid qsr-page-container">
      <HtmlHead title={title} description={description} />
      <div className="qsr-page-title-container text-start">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto text-start">
            <h1 className="qsr-page-title">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      <section className="scroll-section">
        <Card className="add-table-glass-card mb-4 border-0">
          <Card.Body className="p-4">
            {loadingAreas ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <p className="text-muted">Loading areas...</p>
              </div>
            ) : (
              <Form onSubmit={formik.handleSubmit}>
                <Row className="g-3 mb-4">
                  <Col md="6">
                    <Form.Label className="fw-bold text-muted small text-uppercase ls-1">Dining Type</Form.Label>
                    <div className="position-relative">
                      <CreatableSelect
                        isClearable
                        isDisabled={isSubmitting || loadingAreas || isFromManageTable}
                        options={diningAreasOptions}
                        value={formik.values.area ? { label: formik.values.area, value: formik.values.area } : null}
                        onChange={(selected) => {
                          const val = selected ? selected.value : '';
                          formik.setFieldValue('area', val);
                          formik.setFieldTouched('area', !val);
                        }}
                        onBlur={() => formik.setFieldTouched('area', true)}
                        placeholder="Select or create dining area"
                        classNamePrefix="react-select"
                        styles={selectStyles}
                      />
                      {formik.touched.area && formik.errors.area && <div className="text-danger mt-1 small">{formik.errors.area}</div>}
                    </div>
                  </Col>
                </Row>

                <div className="mt-5 pt-4 border-top">
                  <h5 className="fw-bold text-dark mb-4">Table Configuration</h5>
                  <div className="d-flex flex-column gap-3">
                    {formik.values.tables.map((table, index) => (
                      <div key={index} className="p-3 p-md-4 rounded-xl border-0 shadow-sm" style={{ background: '#f8fafc', borderRadius: '1.25rem' }}>
                        <Row className="g-2 g-md-3 align-items-end">
                          <Col xs={12} md={5}>
                            <Form.Label className="fw-bold small text-muted mb-1">Table No.</Form.Label>
                            <div className="position-relative">
                              <Form.Control
                                type="text"
                                name={`tables.${index}.tableNo`}
                                value={table.tableNo}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                disabled={isSubmitting}
                                placeholder="e.g. T-10"
                                className="add-table-pill-input bg-white"
                                isInvalid={formik.touched.tables?.[index]?.tableNo && (!!formik.errors.tables?.[index]?.tableNo || !!tableErrors[index])}
                              />
                              {checkingTable[index] && (
                                <div className="position-absolute" style={{ right: '35px', top: '50%', transform: 'translateY(-50%)' }}>
                                  <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem', color: '#1ea8e7' }} />
                                </div>
                              )}
                              <Form.Control.Feedback type="invalid" className="small mt-1">
                                {formik.errors.tables?.[index]?.tableNo || tableErrors[index]}
                              </Form.Control.Feedback>
                            </div>
                          </Col>

                          <Col xs={9} md={5}>
                            <Form.Label className="fw-bold small text-muted mb-1">Max Capacity</Form.Label>
                            <div className="position-relative">
                              <Form.Control
                                type="number"
                                name={`tables.${index}.maxPerson`}
                                value={table.maxPerson}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                disabled={isSubmitting}
                                placeholder="0"
                                className="add-table-pill-input bg-white"
                                isInvalid={formik.touched.tables?.[index]?.maxPerson && !!formik.errors.tables?.[index]?.maxPerson}
                              />
                              <Form.Control.Feedback type="invalid" className="small mt-1">
                                {formik.errors.tables?.[index]?.maxPerson}
                              </Form.Control.Feedback>
                            </div>
                          </Col>

                          <Col xs={3} md={2} className="d-flex justify-content-end pb-1">
                            <Button
                              variant="outline-danger"
                              className="add-table-delete-btn-table"
                              onClick={() => removeTable(index)}
                              disabled={isSubmitting || formik.values.tables.length === 1}
                            >
                              <CsLineIcons icon="bin" size="18" />
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>

                  {fetchError && (
                    <Alert variant="danger" className="mt-4 border-0 rounded-lg shadow-sm">
                      <CsLineIcons icon="error" className="me-2" />
                      {fetchError}
                    </Alert>
                  )}

                  <div className="mt-5 d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-3">
                    <Button
                      onClick={addMoreTable}
                      disabled={isSubmitting}
                      className="px-4 py-2 add-table-custom-btn-outline d-flex align-items-center justify-content-center gap-2"
                    >
                      <CsLineIcons icon="plus" size="18" stroke="currentColor" />
                      Add More Table
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 add-table-custom-btn-outline d-flex align-items-center justify-content-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CsLineIcons icon="save" size="18" stroke="currentColor" />
                          Save Tables
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Form>
            )}
          </Card.Body>
        </Card>
      </section>
    </div>
  );
};

export default AddTable;
