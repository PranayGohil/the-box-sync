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

const customStyles = `
  .pill-input {
    border-radius: 12px !important;
    padding: 0.7rem 1.2rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
  }
  .pill-input:focus {
    border-color: #1ea8e7 !important;
    box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.1) !important;
    outline: none !important;
  }
  .glass-card {
    background: #fff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.25rem !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
    transition: all 0.3s ease;
  }
  .custom-btn-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .custom-btn-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
  }
  .custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .meal-type-radio {
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 50px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
  .meal-type-radio:hover {
    background: #f9fafb;
  }
  .meal-type-radio.active.veg {
    background: #ecfdf5;
    border-color: #10b981;
    color: #047857;
  }
  .meal-type-radio.active.egg {
    background: #fffbeb;
    border-color: #f59e0b;
    color: #b45309;
  }
  .meal-type-radio.active.non-veg {
    background: #fef2f2;
    border-color: #ef4444;
    color: #b91c1c;
  }
  .custom-check {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  .delete-btn-table {
    border: 1px solid #cf2637 !important;
    color: #cf2637 !important;
    background-color: #fff !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
    transition: all 0.2s ease !important;
    width: 38px !important;
    height: 38px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
    padding: 0 !important;
  }
  .delete-btn-table:hover {
    background-color: #cf2637 !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(207, 38, 55, 0.2) !important;
  }
  .custom-check.active {
    background: #1ea8e7 !important;
    border-color: #1ea8e7 !important;
  }
`;

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
  const categoryOptions = (suggestions.categories || []).map((c) => ({ label: c, value: c }));
  const dishOptions = (suggestions.dishes || []).map((d) => ({ label: d, value: d }));
  const [counterOptions, setCounterOptions] = useState([]);

  const isFromManageMenu = location.state?.fromManageMenu || false;
  const prefilledCategory = isFromManageMenu ? location.state?.category || '' : '';
  const prefilledMealType = isFromManageMenu ? location.state?.mealType || 'veg' : 'veg';
  const prefilledCounter = isFromManageMenu ? location.state?.counter || '' : '';
  const prefilledHideOnKot = isFromManageMenu ? location.state?.hide_on_kot || false : false;

  const initialValues = {
    category: prefilledCategory,
    mealType: prefilledMealType,
    counter: prefilledCounter,
    hideOnKot: prefilledHideOnKot,
    dishes: [{
      dish_name: '',
      dish_price: '',
      dish_img: null,
      description: '',
      quantity: '',
      unit: '',
      showAdvancedOptions: false,
    }],
  };

  const getMenuCategories = async (mealType) => {
    try {
      setLoadingCategories(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/menu/get-categories?meal_type=${mealType}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSuggestions((prev) => ({ ...prev, categories: response.data.data, dishes: [] }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const getCounters = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/menu/get-counter-options`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCounterOptions(response.data.data.map((counter) => ({ value: counter, label: counter })));
    } catch (err) {
      console.error('Error fetching counters:', err);
    }
  };

  useEffect(() => {
    getMenuCategories('veg');
    getCounters();
  }, []);

  const getDishesByCategory = async (category) => {
    if (!category) {
      setSuggestions((prev) => ({ ...prev, dishes: [] }));
      return;
    }
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/menu/get-dishes-by-category?category=${category}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSuggestions((prev) => ({ ...prev, dishes: response.data.data }));
    } catch (error) {
      console.error('Error fetching dishes:', error);
    }
  };

  const validationSchema = Yup.object().shape({
    category: Yup.string().required('Category is required'),
    mealType: Yup.string().required('Meal type is required'),
    counter: Yup.string(),
    hideOnKot: Yup.boolean(),
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
      formData.append('counter', values.counter);
      formData.append('hide_on_kot', values.hideOnKot);
      const dishData = values.dishes.map((dish, i) => {
        if (dish.dish_img) formData.append(`dish_img`, dish.dish_img);
        return { ...dish, dish_img: '' };
      });
      formData.append('dishes', JSON.stringify(dishData));
      const res = await axios.post(`${process.env.REACT_APP_API}/menu/add`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success(res.data.message || 'Menu saved successfully!');
      resetForm();
      setImagePreviews({});
      history.push('/operations/manage-menu');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || 'Failed to save menu.');
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  const handleImageChange = (e, index, setFieldValue) => {
    const file = e.currentTarget.files[0];
    if (file) {
      setFieldValue(`dishes[${index}].dish_img`, file);
      setImagePreviews((prev) => ({ ...prev, [index]: URL.createObjectURL(file) }));
    }
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '12px',
      padding: '2px',
      border: state.isFocused ? '1px solid #1ea8e7' : '1px solid #e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(30, 168, 231, 0.1)' : 'none',
      backgroundColor: '#fff',
      '&:hover': { border: '1px solid #1ea8e7' },
    }),
  };

  return (
    <>
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid pb-5">
        <div className="page-title-container mb-4">
          <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
          <BreadcrumbList items={breadcrumbs} />
        </div>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
          {({ values, handleChange, setFieldValue }) => (
            <Form>
              <Card className="glass-card mb-4 border-0">
                <Card.Body className="p-4">
                  <Row className="g-4">
                    <Col lg={4}>
                      <BForm.Label className="fw-bold text-muted text-uppercase small mb-3">Meal Type</BForm.Label>
                      <div className="d-flex gap-2">
                        {['veg', 'egg', 'non-veg'].map((type) => (
                          <div
                            key={type}
                            className={`meal-type-radio ${type} ${values.mealType === type ? 'active' : ''}`}
                            onClick={() => {
                              setFieldValue('mealType', type);
                              setFieldValue('category', '');
                              getMenuCategories(type);
                            }}
                          >
                            <div className="rounded-circle" style={{ 
                              width: '12px', 
                              height: '12px', 
                              background: type === 'veg' ? '#10b981' : type === 'egg' ? '#f59e0b' : '#ef4444' 
                            }} />
                            {type === 'veg' ? 'Veg' : type === 'egg' ? 'Egg' : 'Non-Veg'}
                          </div>
                        ))}
                      </div>
                    </Col>
                    <Col lg={4}>
                      <BForm.Group>
                        <BForm.Label className="fw-bold text-muted text-uppercase small mb-2">Dish Category</BForm.Label>
                        <div className="position-relative">
                          <CreatableSelect
                            styles={{
                              ...selectStyles,
                              control: (base, state) => ({
                                ...selectStyles.control(base, state),
                                borderColor: values.category === '' && isSubmitting ? '#ef4444' : state.isFocused ? '#1ea8e7' : '#e5e7eb',
                              })
                            }}
                            isClearable
                            isDisabled={isSubmitting || loadingCategories || isFromManageMenu}
                            options={categoryOptions}
                            value={values.category ? { label: values.category, value: values.category } : null}
                            onChange={(selected) => {
                              const cat = selected ? selected.value : '';
                              setFieldValue('category', cat);
                              getDishesByCategory(cat);
                            }}
                            placeholder="Select or create category"
                          />
                          <ErrorMessage name="category" component="div" className="text-danger small mt-1" />
                        </div>
                      </BForm.Group>
                    </Col>
                    <Col lg={4}>
                      <BForm.Group>
                        <BForm.Label className="fw-bold text-muted text-uppercase small mb-2">Counter</BForm.Label>
                        <CreatableSelect
                          styles={selectStyles}
                          isClearable
                          isDisabled={isSubmitting || isFromManageMenu}
                          options={counterOptions}
                          value={values.counter ? { label: values.counter, value: values.counter } : null}
                          onChange={(selected) => setFieldValue('counter', selected ? selected.value : '')}
                          placeholder="Select or create counter"
                        />
                      </BForm.Group>
                    </Col>
                    <Col xs={12}>
                      <div 
                        className="d-flex align-items-center gap-2 cursor-pointer"
                        onClick={() => setFieldValue('hideOnKot', !values.hideOnKot)}
                      >
                        <div className={`custom-check ${values.hideOnKot ? 'active' : ''}`}>
                          {values.hideOnKot && <CsLineIcons icon="check" size="12" className="text-white" />}
                        </div>
                        <span className="fw-bold text-alternate">Hide on KOT</span>
                      </div>
                    </Col>
                  </Row>

                  <div className="mt-5 pt-4 border-top">
                    <h5 className="fw-bold mb-4">Dish Configuration</h5>
                    <FieldArray name="dishes">
                      {({ push, remove }) => (
                        <div className="d-flex flex-column gap-3">
                          {values.dishes.map((dish, index) => (
                            <div key={index} className="p-4 rounded-xl border-0 position-relative" style={{ background: '#f8fafc' }}>
                              <Row className="g-3">
                                <Col md={4}>
                                  <BForm.Group>
                                    <BForm.Label className="text-muted text-small fw-bold mb-1">Dish Name</BForm.Label>
                                    <div className="position-relative">
                                      <CreatableSelect
                                        styles={{
                                          ...selectStyles,
                                          control: (base, state) => ({
                                            ...selectStyles.control(base, state),
                                            borderColor: values.dishes[index].dish_name === '' && isSubmitting ? '#ef4444' : state.isFocused ? '#1ea8e7' : '#e5e7eb',
                                          })
                                        }}
                                        isClearable
                                        options={dishOptions}
                                        value={dish.dish_name ? { label: dish.dish_name, value: dish.dish_name } : null}
                                        onChange={(selected) => setFieldValue(`dishes[${index}].dish_name`, selected ? selected.value : '')}
                                        placeholder="Select or create dish name"
                                      />
                                      <ErrorMessage name={`dishes[${index}].dish_name`} component="div" className="text-danger small mt-1" />
                                    </div>
                                  </BForm.Group>
                                </Col>
                                <Col md={2}>
                                  <BForm.Group>
                                    <BForm.Label className="text-muted text-small fw-bold mb-1">Price</BForm.Label>
                                    <BForm.Control
                                      type="text"
                                      name={`dishes[${index}].dish_price`}
                                      value={dish.dish_price}
                                      onChange={handleChange}
                                      placeholder="0"
                                      className="pill-input"
                                      isInvalid={values.dishes[index].dish_price === '' && isSubmitting}
                                    />
                                    <ErrorMessage name={`dishes[${index}].dish_price`} component="div" className="text-danger small mt-1" />
                                  </BForm.Group>
                                </Col>
                                <Col md={2}>
                                  <BForm.Group>
                                    <BForm.Label className="text-muted text-small fw-bold mb-1">Qty</BForm.Label>
                                    <BForm.Control
                                      type="text"
                                      name={`dishes[${index}].quantity`}
                                      value={dish.quantity}
                                      onChange={handleChange}
                                      placeholder="1"
                                      className="pill-input"
                                    />
                                  </BForm.Group>
                                </Col>
                                <Col md={3}>
                                  <BForm.Group>
                                    <BForm.Label className="text-muted text-small fw-bold mb-1">Unit</BForm.Label>
                                    <BForm.Select
                                      name={`dishes[${index}].unit`}
                                      value={dish.unit}
                                      onChange={handleChange}
                                      className="pill-input"
                                    >
                                      <option value="">Select Unit</option>
                                      <option value="kg">kg</option>
                                      <option value="g">g</option>
                                      <option value="piece">piece</option>
                                      <option value="plate">Plate</option>
                                      <option value="portion">Portion</option>
                                    </BForm.Select>
                                  </BForm.Group>
                                </Col>
                                <Col md={1} className="text-end pt-4">
                                  <Button 
                                    variant="outline-danger" 
                                    className="delete-btn-table"
                                    onClick={() => remove(index)} 
                                    disabled={values.dishes.length === 1}
                                  >
                                    <CsLineIcons icon="bin" size="18" />
                                  </Button>
                                </Col>

                                <Col md={3} className="pt-2">
                                  <div className="d-flex align-items-center">
                                    <input
                                      type="file"
                                      id={`file-${index}`}
                                      className="d-none"
                                      accept="image/*"
                                      onChange={(e) => handleImageChange(e, index, setFieldValue)}
                                    />
                                    <label htmlFor={`file-${index}`} className="custom-btn-outline px-3 py-1 rounded-pill small fw-bold cursor-pointer mb-0">
                                      <CsLineIcons icon="upload" size="14" className="me-1" />
                                      {dish.dish_img ? 'Change Image' : 'Add Image'}
                                    </label>
                                    {imagePreviews[index] && (
                                      <img src={imagePreviews[index]} alt="Preview" className="ms-2 rounded shadow-sm" style={{ width: '38px', height: '38px', objectFit: 'cover' }} />
                                    )}
                                  </div>
                                </Col>
                                <Col md={9} className="pt-2">
                                  <Field name={`dishes[${index}].description`} className="form-control pill-input bg-white" placeholder="Add description (optional)..." />
                                </Col>
                              </Row>
                            </div>
                          ))}

                          <div className="d-flex justify-content-between align-items-center mt-4">
                            <Button
                              type="button"
                              className="custom-btn-outline px-4 py-2 d-flex align-items-center gap-2"
                              onClick={() => push({
                                dish_name: '', dish_price: '', dish_img: null, description: '', quantity: '', unit: '', showAdvancedOptions: false,
                              })}
                            >
                              <CsLineIcons icon="plus" size="18" />
                              Add More Dish
                            </Button>

                            <Button 
                              type="submit" 
                              className="custom-btn-outline px-5 py-2 d-flex align-items-center gap-2"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? <Spinner size="sm" /> : <CsLineIcons icon="save" size="18" />}
                              {isSubmitting ? 'Saving...' : 'Submit Menu'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </FieldArray>
                  </div>
                </Card.Body>
              </Card>
            </Form>
          )}
        </Formik>

        {isSubmitting && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ background: 'rgba(255,255,255,0.8)', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
            <Card className="glass-card border-0 shadow-lg text-center p-5">
              <Spinner animation="grow" variant="primary" className="mb-4" />
              <h4 className="fw-bold mb-1">Finalizing Menu</h4>
              <p className="text-muted mb-0">Saving your delicious dishes...</p>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default AddDishes;
