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
  const diningAreasOptions = diningAreas.map(cat => ({
    label: cat,
    value: cat,
  }));

  const isFromManageTable = location.state?.fromManageTable || false;
  const prefilledArea = isFromManageTable ? location.state?.area || '' : '';

  useEffect(() => {
    const fetchDiningAreas = async () => {
      try {
        setLoadingAreas(true);
        const res = await axios.get(
          `${process.env.REACT_APP_API}/table/get/dining-areas`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
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
        const duplicateIndex = values.tables.findIndex(
          (t, i) => t.tableNo.trim() === trimmedNo && i !== index
        );

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

        setCheckingTable(prev => ({ ...prev, [index]: true }));

        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API}/table/check-table`,
            {
              params: { area, table_no: tableNo },
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            }
          );

          if (response.data.exists) {
            setTableErrors((prev) => ({
              ...prev,
              [index]: 'Table number already exists in this area.',
            }));
            return true;
          }

          setTableErrors((prev) => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
          });

          return false;
        } catch (err) {
          console.error('Error checking table existence:', err);
          toast.error('Failed to check table existence');
          return true;
        } finally {
          setCheckingTable(prev => ({ ...prev, [index]: false }));
        }
      };

      const results = await Promise.all(
        values.tables.map((table, index) =>
          checkTableExists(values.area, table.tableNo, index)
        )
      );

      const hasErrors = results.includes(true);
      if (hasErrors) {
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API}/table/add`,
          values,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        toast.success('Tables added successfully!');
        history.push('/operations/manage-table');
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to add tables');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const addMoreTable = () => {
    formik.setFieldValue('tables', [...formik.values.tables, { tableNo: '', maxPerson: '' }]);
  };

  const removeTable = (index) => {
    const updated = [...formik.values.tables];
    updated.splice(index, 1);
    formik.setFieldValue('tables', updated);

    setTableErrors((prev) => {
      const updatedErrors = { ...prev };
      delete updatedErrors[index];
      return updatedErrors;
    });
  };

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

          <section className="scroll-section" id="formRow">
            <Card body className="mb-5">
              {loadingAreas ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" className="mb-3" />
                  <p>Loading dining areas...</p>
                </div>
              ) : (
                <Form onSubmit={formik.handleSubmit}>
                  <Row className="g-3">
                    <Col md="6">
                      <Form.Label>Dining Type</Form.Label>

                      <CreatableSelect
                        isClearable
                        isDisabled={isSubmitting || loadingAreas || isFromManageTable}
                        options={diningAreasOptions}
                        value={
                          formik.values.area
                            ? { label: formik.values.area, value: formik.values.area }
                            : null
                        }
                        onChange={(selected) => {
                          formik.setFieldValue('area', selected ? selected.value : '');
                        }}
                        onBlur={() => formik.setFieldTouched('area', true)}
                        placeholder="Select or create dining area"
                        classNamePrefix="react-select"
                      />

                      {formik.touched.area && formik.errors.area && (
                        <div className="text-danger mt-1">{formik.errors.area}</div>
                      )}
                    </Col>
                  </Row>

                  <hr />

                  {formik.values.tables.map((table, index) => (
                    <Row className="align-items-center mb-3" key={index}>
                      <Col md="4">
                        <Form.Label>Table No.</Form.Label>
                        <Form.Control
                          type="text"
                          name={`tables.${index}.tableNo`}
                          value={table.tableNo}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          disabled={isSubmitting}
                          isInvalid={
                            formik.touched.tables?.[index]?.tableNo &&
                            (!!formik.errors.tables?.[index]?.tableNo || !!tableErrors[index])
                          }
                        />
                        {checkingTable[index] && (
                          <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                            <Spinner animation="border" size="sm" />
                          </div>
                        )}
                        <Form.Control.Feedback type="invalid">
                          {formik.errors.tables?.[index]?.tableNo || tableErrors[index]}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md="4">
                        <Form.Label>Max Person</Form.Label>
                        <Form.Control
                          type="number"
                          name={`tables.${index}.maxPerson`}
                          value={table.maxPerson}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          disabled={isSubmitting}
                          isInvalid={
                            formik.touched.tables?.[index]?.maxPerson &&
                            !!formik.errors.tables?.[index]?.maxPerson
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formik.errors.tables?.[index]?.maxPerson}
                        </Form.Control.Feedback>
                      </Col>
                      <Col md="4" className="mt-4">
                        <Button
                          variant="outline-danger"
                          onClick={() => removeTable(index)}
                          disabled={isSubmitting || formik.values.tables.length === 1}
                        >
                          <CsLineIcons icon="bin" className="me-1" />
                          Delete
                        </Button>
                      </Col>
                    </Row>
                  ))}

                  {fetchError && (
                    <Alert variant="danger" className="mt-3">
                      <CsLineIcons icon="error" className="me-2" />
                      {fetchError}
                    </Alert>
                  )}

                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      onClick={addMoreTable}
                      className="me-2"
                      disabled={isSubmitting}
                    >
                      <CsLineIcons icon="plus" className="me-1" />
                      Add 
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      style={{ minWidth: '100px' }}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Submitting...
                        </>
                      ) : (
                        <div className='d-flex align-items-center'>
                          <CsLineIcons icon="save" className="me-1" />
                          Submit
                        </div>
                      )}
                    </Button>
                  </div>
                </Form>
              )}

              {/* Full page loader overlay */}
              {/* {isSubmitting && (
                <div
                  className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 9999,
                    backdropFilter: 'blur(2px)'
                  }}
                >
                  <Card className="shadow-lg border-0" style={{ minWidth: '200px' }}>
                    <Card.Body className="text-center p-4">
                      <Spinner
                        animation="border"
                        variant="primary"
                        className="mb-3"
                        style={{ width: '3rem', height: '3rem' }}
                      />
                      <h5 className="mb-0">Adding Tables...</h5>
                      <small className="text-muted">Please wait a moment</small>
                    </Card.Body>
                  </Card>
                </div>
              )} */}
            </Card>
          </section>
        </Col>
      </Row>
    </>
  );
};

export default AddTable;