import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Form, Card, Col, Row } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const AddTable = () => {
  const history = useHistory();
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

  useEffect(() => {
    const fetchDiningAreas = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API}/table/get/dining-areas`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (res.data.success) {
          setDiningAreas(res.data.data);
        } else {
          setFetchError(res.data.message);
        }
      } catch (err) {
        console.error('Error fetching dining areas:', err);
        setFetchError('An error occurred while fetching dining areas.');
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
      area: '',
      tables: [{ tableNo: '', maxPerson: '' }],
    },
    validationSchema,
    onSubmit: async (values) => {
      console.log(values);
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
          return true;
        }
      };

      const results = await Promise.all(
        values.tables.map((table, index) =>
          checkTableExists(values.area, table.tableNo, index)
        )
      );

      const hasErrors = results.includes(true);
      if (hasErrors) return;

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API}/table/add`,
          values,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        console.log(response.data);
        history.push('/operations/manage-table');
      } catch (err) {
        console.error(err);
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
              <Form onSubmit={formik.handleSubmit}>
                <Row className="g-3">
                  <Col md="6">
                    <Form.Label>Dining Type</Form.Label>
                    <Form.Control
                      type="text"
                      name="area"
                      value={formik.values.area}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      list="diningAreaList"
                      isInvalid={formik.touched.area && !!formik.errors.area}
                    />
                    <datalist id="diningAreaList">
                      {diningAreas.map((area, i) => (
                        <option key={i} value={area} />
                      ))}
                    </datalist>
                    <Form.Control.Feedback type="invalid">
                      {formik.errors.area}
                    </Form.Control.Feedback>
                  </Col>
                </Row>

                <hr />

                {formik.values.tables.map((table, index) => (
                  <Row className="align-items-end" key={index}>
                    <Col md="4">
                      <Form.Label>Table No.</Form.Label>
                      <Form.Control
                        type="text"
                        name={`tables.${index}.tableNo`}
                        value={table.tableNo}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        isInvalid={
                          formik.touched.tables?.[index]?.tableNo &&
                          (!!formik.errors.tables?.[index]?.tableNo || !!tableErrors[index])
                        }
                      />
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
                        isInvalid={
                          formik.touched.tables?.[index]?.maxPerson &&
                          !!formik.errors.tables?.[index]?.maxPerson
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {formik.errors.tables?.[index]?.maxPerson}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md="4">
                      <Button variant="outline-danger" onClick={() => removeTable(index)}>
                        Delete
                      </Button>
                    </Col>
                  </Row>
                ))}

                {fetchError && <p className="text-danger">{fetchError}</p>}

                <div className="mt-4">
                  <Button variant="secondary" onClick={addMoreTable} className="me-2">
                    Add More Tables
                  </Button>
                  <Button type="submit" variant="primary">
                    Submit
                  </Button>
                </div>
              </Form>
            </Card>
          </section>
        </Col>
      </Row>
    </>
  );
};

export default AddTable;
