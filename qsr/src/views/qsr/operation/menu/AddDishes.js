import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Card, Col, Row, Button, Form as BForm, Spinner } from 'react-bootstrap';
import { Formik, Form, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Select from 'react-select';
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
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
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
    border: 1.5px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 700 !important;
  }
  .custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
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
  .meal-type-radio:hover { background: #f9fafb; }
  .meal-type-radio.active.veg { background: #ecfdf5; border-color: #10b981; color: #047857; }
  .meal-type-radio.active.egg { background: #fffbeb; border-color: #f59e0b; color: #b45309; }
  .meal-type-radio.active.non-veg { background: #fef2f2; border-color: #ef4444; color: #b91c1c; }
  
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
  .custom-check.active { background: #23b3f4 !important; border-color: #23b3f4 !important; }
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
  const [counterOptions, setCounterOptions] = useState([]);

  const isFromManageMenu = location.state?.fromManageMenu || false;
  const prefilledCategory = isFromManageMenu ? location.state?.category || '' : '';
  const prefilledMealType = isFromManageMenu ? location.state?.mealType || 'veg' : 'veg';
  const prefilledCounter = isFromManageMenu ? location.state?.counter || '' : '';

  const initialValues = {
    category: prefilledCategory,
    mealType: prefilledMealType,
    counter: prefilledCounter,
    hideOnKot: false,
    dishes: [{
      dish_name: '',
      dish_price: '',
      dish_img: null,
      description: '',
      quantity: '',
      unit: '',
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

  const validationSchema = Yup.object().shape({
    category: Yup.string().required('Category is required'),
    mealType: Yup.string().required('Meal type is required'),
    dishes: Yup.array().of(
      Yup.object().shape({
        dish_name: Yup.string().required('Dish name is required'),
        dish_price: Yup.number().typeError('Must be a number').required('Price is required'),
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
      await axios.post(`${process.env.REACT_APP_API}/menu/add`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Menu saved successfully!');
      history.push('/operations/manage-menu');
    } catch (error) {
      toast.error('Failed to save menu.');
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  const brandColor = '#23b3f4';

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '12px',
      padding: '2px',
      border: state.isFocused ? `1px solid ${brandColor}` : '1px solid #e5e7eb',
      boxShadow: state.isFocused ? `0 0 0 4px rgba(35, 179, 244, 0.1)` : 'none',
      backgroundColor: '#fff',
      '&:hover': { border: `1px solid ${brandColor}` },
    }),
  };

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      
      <div className="page-title-container mb-4">
        <h1 className="mb-0 pb-0 fw-800" style={{ color: brandColor, fontSize: '1.5rem' }}>{title}</h1>
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
                            getMenuCategories(type);
                          }}
                        >
                          <div className="rounded-circle" style={{ width: '12px', height: '12px', background: type === 'veg' ? '#10b981' : type === 'egg' ? '#f59e0b' : '#ef4444' }} />
                          {type === 'veg' ? 'Veg' : type === 'egg' ? 'Egg' : 'Non-Veg'}
                        </div>
                      ))}
                    </div>
                  </Col>
                  <Col lg={4}>
                    <BForm.Group>
                      <BForm.Label className="fw-bold text-muted text-uppercase small mb-2">Category</BForm.Label>
                      <CreatableSelect
                        styles={selectStyles}
                        options={(suggestions.categories || []).map(c => ({ label: c, value: c }))}
                        value={values.category ? { label: values.category, value: values.category } : null}
                        onChange={(selected) => setFieldValue('category', selected ? selected.value : '')}
                        placeholder="Select or create category"
                      />
                      <ErrorMessage name="category" component="div" className="text-danger small mt-1" />
                    </BForm.Group>
                  </Col>
                  <Col lg={4}>
                    <BForm.Group>
                      <BForm.Label className="fw-bold text-muted text-uppercase small mb-2">Counter</BForm.Label>
                      <CreatableSelect
                        styles={selectStyles}
                        options={counterOptions}
                        value={values.counter ? { label: values.counter, value: values.counter } : null}
                        onChange={(selected) => setFieldValue('counter', selected ? selected.value : '')}
                        placeholder="Select or create counter"
                      />
                    </BForm.Group>
                  </Col>
                </Row>

                <div className="mt-5 pt-4 border-top">
                  <h5 className="fw-bold mb-4">Dish Details</h5>
                  <FieldArray name="dishes">
                    {({ push, remove }) => (
                      <div className="d-flex flex-column gap-3">
                        {values.dishes.map((dish, index) => (
                          <div key={index} className="p-4 position-relative shadow-sm mb-3" style={{ background: '#f8fafc', borderRadius: '1.25rem' }}>
                            <Button 
                              variant="outline-danger" 
                              className="position-absolute border-0 p-0" 
                              style={{ top: '1rem', right: '1rem', width: '32px', height: '32px', borderRadius: '50%' }}
                              onClick={() => remove(index)} 
                              disabled={values.dishes.length === 1}
                            >
                              <CsLineIcons icon="bin" size="16" />
                            </Button>
                            <Row className="g-3">
                              <Col md={4}>
                                <BForm.Group>
                                  <BForm.Label className="text-muted text-small fw-bold mb-1">Dish Name</BForm.Label>
                                  <BForm.Control name={`dishes[${index}].dish_name`} value={dish.dish_name} onChange={handleChange} className="pill-input" placeholder="Enter dish name" />
                                </BForm.Group>
                              </Col>
                              <Col md={2}>
                                <BForm.Group>
                                  <BForm.Label className="text-muted text-small fw-bold mb-1">Price</BForm.Label>
                                  <BForm.Control name={`dishes[${index}].dish_price`} value={dish.dish_price} onChange={handleChange} className="pill-input" placeholder="0" />
                                </BForm.Group>
                              </Col>
                              <Col md={6}>
                                <BForm.Group>
                                  <BForm.Label className="text-muted text-small fw-bold mb-1">Description</BForm.Label>
                                  <BForm.Control name={`dishes[${index}].description`} value={dish.description} onChange={handleChange} className="pill-input" placeholder="Optional description" />
                                </BForm.Group>
                              </Col>
                            </Row>
                          </div>
                        ))}

                        <div className="d-flex justify-content-between mt-4">
                          <Button className="custom-btn-outline px-4" onClick={() => push({ dish_name: '', dish_price: '', description: '' })}>
                            <CsLineIcons icon="plus" size="18" className="me-2" /> Add More
                          </Button>
                          <Button type="submit" className="custom-btn-outline px-5" disabled={isSubmitting}>
                            {isSubmitting ? <Spinner size="sm" className="me-2" /> : <CsLineIcons icon="save" size="18" className="me-2" />}
                            Submit Menu
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
    </div>
  );
};

export default AddDishes;
