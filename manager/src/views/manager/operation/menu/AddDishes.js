import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Card, Col, Row, Button, Form as BForm, Spinner, Alert } from 'react-bootstrap';
import { Formik, Form, FieldArray, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import CreatableSelect from 'react-select/creatable';

const AddDishes = () => {
  const title = 'Add Dishes';
  const description = 'Form to add dishes using Formik and Yup';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/add-dish', title: 'Add Dishes' },
  ];

  const history = useHistory();
  const location = useLocation();

  const [suggestions, setSuggestions] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const categoryOptions = (suggestions.categories || []).map(c => ({
    label: c,
    value: c,
  }));
  const dishOptions = (suggestions.dishes || []).map(d => ({
    label: d,
    value: d,
  }));

  const isFromManageMenu = location.state?.fromManageMenu || false;
  const prefilledCategory = isFromManageMenu ? location.state?.category || '' : '';
  const prefilledMealType = isFromManageMenu ? location.state?.mealType || 'veg' : 'veg';

  const initialValues = {
    category: prefilledCategory,
    mealType: prefilledMealType,
    dishes: [
      {
        dish_name: '',
        dish_price: '',
        dish_img: null,
        description: '',
        quantity: '',
        unit: '',
        showAdvancedOptions: false,
      },
    ],
  };

  const getMenuCategories = async (mealType) => {
    try {
      setLoadingCategories(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API}/menu/get-categories?meal_type=${mealType}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      setSuggestions((prev) => ({
        ...prev,
        categories: response.data.data,
        dishes: [], // 🔥 RESET DISHES
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    getMenuCategories('veg'); // 🔥 DEFAULT LOAD
  }, []);

  const getDishesByCategory = async (category) => {
    if (!category) {
      setSuggestions((prev) => ({ ...prev, dishes: [] }));
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}/menu/get-dishes-by-category?category=${category}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      setSuggestions((prev) => ({
        ...prev,
        dishes: response.data.data,
      }));
    } catch (error) {
      console.error('Error fetching dishes:', error);
      toast.error('Failed to load dishes');
    }
  };

  const validationSchema = Yup.object().shape({
    category: Yup.string().required('Category is required'),
    mealType: Yup.string().required('Meal type is required'),
    dishes: Yup.array().of(
      Yup.object().shape({
        dish_name: Yup.string().required('Dish name is required'),
        dish_price: Yup.number().typeError('Must be a number').required('Price is required'),
        description: Yup.string(),
        quantity: Yup.string(),
        unit: Yup.string(),
      })
    ),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', values.category);
      formData.append('meal_type', values.mealType);

      const dishData = values.dishes.map((dish, i) => {
        if (dish.dish_img) {
          formData.append(`dish_img`, dish.dish_img);
        }
        return {
          ...dish,
          dish_img: '',
        };
      });

      formData.append('dishes', JSON.stringify(dishData));

      const res = await axios.post(`${process.env.REACT_APP_API}/menu/add`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      toast.success(res.data.message || 'Menu saved successfully!');
      resetForm();
      setImagePreviews({});
      history.push('/operations/manage-menu');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || 'Failed to save menu. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  const handleImageChange = (e, index, setFieldValue) => {
    const file = e.currentTarget.files[0];
    if (file) {
      setFieldValue(`dishes[${index}].dish_img`, file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews(prev => ({ ...prev, [index]: previewUrl }));
    }
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
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {({ values, handleChange, setFieldValue }) => (
                  <Form>
                    <Row className="mb-3">
                      <Col md={4}>
                        <BForm.Group>
                          <BForm.Label>Dish Category</BForm.Label>
                          <CreatableSelect
                            isClearable
                            isDisabled={isSubmitting || loadingCategories || isFromManageMenu}
                            options={categoryOptions}
                            value={
                              values.category
                                ? { label: values.category, value: values.category }
                                : null
                            }
                            onChange={(selected) => {
                              const category = selected ? selected.value : '';
                              setFieldValue('category', category);

                              // 🔥 RESET dish names
                              values.dishes.forEach((_, index) => {
                                setFieldValue(`dishes[${index}].dish_name`, '');
                              });

                              // 🔥 FETCH dishes for selected category
                              getDishesByCategory(category);
                            }}
                            placeholder="Select or create category"
                            classNamePrefix="react-select"
                          />

                          <ErrorMessage
                            name="category"
                            component="div"
                            className="text-danger mt-1"
                          />
                        </BForm.Group>

                      </Col>
                      <Col md={8}>
                        <BForm.Label className="d-block">Meal Type</BForm.Label>
                        {['veg', 'egg', 'non-veg'].map((type) => (
                          <BForm.Check
                            inline
                            key={type}
                            label={type}
                            name="mealType"
                            type="radio"
                            id={`meal-${type}`}
                            checked={values.mealType === type}
                            onChange={() => {
                              setFieldValue('mealType', type);

                              // 🔥 RESET category & dishes
                              setFieldValue('category', '');
                              setSuggestions((prev) => ({
                                ...prev,
                                categories: [],
                                dishes: [],
                              }));

                              values.dishes.forEach((_, index) => {
                                setFieldValue(`dishes[${index}].dish_name`, '');
                              });

                              // 🔥 FETCH categories BY MEAL TYPE
                              getMenuCategories(type);
                            }}
                            disabled={isSubmitting}
                          />
                        ))}
                      </Col>
                    </Row>
                    <FieldArray name="dishes">
                      {({ push, remove }) => (
                        <>
                          {values.dishes.map((dish, index) => (
                            <Card key={index} className="mb-4 p-3">
                              <Row>
                                <Col md={4}>
                                  <BForm.Group>
                                    <BForm.Label>Dish Name</BForm.Label>
                                    <CreatableSelect
                                      isClearable
                                      isDisabled={isSubmitting}
                                      options={dishOptions}
                                      value={
                                        dish.dish_name
                                          ? { label: dish.dish_name, value: dish.dish_name }
                                          : null
                                      }
                                      onChange={(selected) =>
                                        setFieldValue(`dishes[${index}].dish_name`, selected ? selected.value : '')
                                      }
                                      placeholder="Select or create dish name"
                                      classNamePrefix="react-select"
                                    />
                                    <ErrorMessage name={`dishes[${index}].dish_name`} component="div" className="text-danger" />
                                  </BForm.Group>
                                </Col>
                                <Col md={4}>
                                  <BForm.Group>
                                    <BForm.Label>Price</BForm.Label>
                                    <Field
                                      name={`dishes[${index}].dish_price`}
                                      className="form-control"
                                      disabled={isSubmitting}
                                    />
                                    <ErrorMessage name={`dishes[${index}].dish_price`} component="div" className="text-danger" />
                                  </BForm.Group>
                                </Col>
                                <Col md={4} className="d-flex align-items-start">
                                  <Button
                                    variant="outline-danger"
                                    onClick={() => remove(index)}
                                    disabled={isSubmitting || values.dishes.length === 1}
                                  >
                                    <CsLineIcons icon="bin" className='me-1' />
                                    Remove
                                  </Button>
                                </Col>
                              </Row>

                              <Row className="mt-2">
                                <Col md={4}>
                                  <BForm.Group>
                                    <BForm.Label>Image</BForm.Label>
                                    <input
                                      type="file"
                                      className="form-control"
                                      accept="image/*"
                                      onChange={(e) => handleImageChange(e, index, setFieldValue)}
                                      disabled={isSubmitting}
                                    />
                                    {imagePreviews[index] && (
                                      <div className="mt-2">
                                        <img
                                          src={imagePreviews[index]}
                                          alt="Preview"
                                          className="img-thumbnail"
                                          style={{ maxWidth: '100px', maxHeight: '100px' }}
                                        />
                                        <small className="text-muted d-block">Image preview</small>
                                      </div>
                                    )}
                                  </BForm.Group>
                                </Col>
                                <Col md={8}>
                                  <BForm.Group>
                                    <BForm.Label>Description</BForm.Label>
                                    <Field
                                      as="textarea"
                                      rows={2}
                                      name={`dishes[${index}].description`}
                                      className="form-control"
                                      disabled={isSubmitting}
                                    />
                                  </BForm.Group>
                                </Col>
                              </Row>

                              <BForm.Check
                                type="checkbox"
                                label="Advanced Options"
                                checked={dish.showAdvancedOptions}
                                onChange={() => setFieldValue(`dishes[${index}].showAdvancedOptions`, !dish.showAdvancedOptions)}
                                className="mt-2"
                                disabled={isSubmitting}
                              />

                              {dish.showAdvancedOptions && (
                                <Row className="mt-2">
                                  <Col md={6}>
                                    <BForm.Group>
                                      <BForm.Label>Quantity</BForm.Label>
                                      <Field
                                        name={`dishes[${index}].quantity`}
                                        className="form-control"
                                        disabled={isSubmitting}
                                      />
                                    </BForm.Group>
                                  </Col>
                                  <Col md={6}>
                                    <BForm.Group>
                                      <BForm.Label>Unit</BForm.Label>
                                      <Field
                                        as="select"
                                        name={`dishes[${index}].unit`}
                                        className="form-select"
                                        disabled={isSubmitting}
                                      >
                                        <option value="">Select unit</option>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="litre">litre</option>
                                        <option value="ml">ml</option>
                                        <option value="piece">piece</option>
                                      </Field>
                                    </BForm.Group>
                                  </Col>
                                </Row>
                              )}
                            </Card>
                          ))}

                          <div className="d-flex gap-2 mt-3">
                            <Button
                              type="button"
                              variant="primary"
                              onClick={() =>
                                push({
                                  dish_name: '',
                                  dish_price: '',
                                  dish_img: null,
                                  description: '',
                                  quantity: '',
                                  unit: '',
                                  showAdvancedOptions: false,
                                })
                              }
                              disabled={isSubmitting}
                            >
                              <CsLineIcons icon="plus" className="me-1" />
                              Add More
                            </Button>
                          </div>
                        </>
                      )}
                    </FieldArray>

                    <div className="mt-4">
                      <Button
                        type="submit"
                        variant="success"
                        disabled={isSubmitting}
                        style={{ minWidth: '120px' }}
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
                            Saving...
                          </>
                        ) : (
                          <>
                            <CsLineIcons icon="save" className="me-2" />
                            Save Menu
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card>

            {/* Full page loader overlay */}
            {isSubmitting && (
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
                      variant="success"
                      className="mb-3"
                      style={{ width: '3rem', height: '3rem' }}
                    />
                    <h5 className="mb-0">Saving Dishes...</h5>
                    <small className="text-muted">Please wait a moment</small>
                  </Card.Body>
                </Card>
              </div>
            )}
          </section>
        </Col>
      </Row>
    </>
  );
};

export default AddDishes;