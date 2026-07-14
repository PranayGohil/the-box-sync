/* eslint-disable react/no-this-in-sfc, func-names, no-unused-vars */
import React, { useEffect, useState, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Card, Col, Row, Button, Form as BForm, Spinner, Alert } from 'react-bootstrap';
import { Formik, Form, FieldArray, Field, ErrorMessage } from 'formik';
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
    border-radius: 10px !important;
    padding: 0.45rem 1rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
    font-size: 0.88rem !important;
    font-weight: 600 !important;
    color: #334155 !important;
  }
  input.pill-input {
    height: 38px !important;
  }
  textarea.pill-input {
    min-height: 60px !important;
    height: auto !important;
  }
  @media (max-width: 767.98px) {
    textarea.pill-input {
      min-height: 130px !important;
    }
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
  @media (max-width: 575px) {
    .container-fluid {
      padding-left: 8px !important;
      padding-right: 8px !important;
    }
    .glass-card {
      border-radius: 12px !important;
    }
    .glass-card .card-body {
      padding: 12px !important;
    }
  }
  .custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .meal-type-radio {
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 50px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 0.8rem;
  }
  @media (max-width: 575px) {
    .meal-type-radio {
      flex: 1 1 0% !important;
      justify-content: center !important;
      font-size: 0.75rem !important;
      padding: 6px 8px !important;
    }
  }
  @media (min-width: 576px) {
    .meal-type-radio {
      padding: 8px 16px;
      gap: 8px;
      font-size: 0.85rem;
    }
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
    border: 1px solid #ef4444 !important;
    color: #ef4444 !important;
    background-color: #fff !important;
    transition: all 0.2s ease !important;
    width: 32px !important;
    height: 32px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
    padding: 0 !important;
    position: absolute !important;
    top: 1rem !important;
    right: 1rem !important;
    z-index: 10 !important;
  }
  .delete-btn-table:hover {
    background-color: #cf2637 !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(207, 38, 55, 0.2) !important;
  }
  .custom-check.active {
    background: #23b3f4 !important;
    border-color: #23b3f4 !important;
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
  const prefilledCounter = isFromManageMenu ? location.state?.counter || '' : '';
  const prefilledHideOnKot = isFromManageMenu ? location.state?.hide_on_kot || false : false;

  const initialValues = {
    category: prefilledCategory,
    counter: prefilledCounter,
    hideOnKot: prefilledHideOnKot,
    dishes: [
      {
        _id: '',
        dish_name: '',
        meal_type: 'veg',
        dish_img: null,
        description: '',
        variants: [{ size_name: '', price: '', extra: '', is_available: true }],
        addons: [],
      },
    ],
  };

  const getMenuCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/menu/get-categories`, {
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

  const [fullMenuData, setFullMenuData] = useState([]);

  const sizeSuggestions = useMemo(() => {
    return Array.from(
      new Set(fullMenuData.flatMap((c) => (c.dishes || []).flatMap((d) => (d.variants || []).map((v) => v.size_name?.trim()).filter(Boolean))))
    ).sort();
  }, [fullMenuData]);

  const extraSuggestions = useMemo(() => {
    return Array.from(
      new Set(fullMenuData.flatMap((c) => (c.dishes || []).flatMap((d) => (d.variants || []).map((v) => v.extra?.trim()).filter(Boolean))))
    ).sort();
  }, [fullMenuData]);

  const addonSuggestions = useMemo(() => {
    return Array.from(
      new Set(fullMenuData.flatMap((c) => (c.dishes || []).flatMap((d) => (d.addons || []).map((a) => a.addon_name?.trim()).filter(Boolean))))
    ).sort();
  }, [fullMenuData]);

  const fetchFullMenuData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/menu/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const transformedMenu = res.data.data.map(({ _id, ...rest }) => ({
        ...rest,
        id: _id,
      }));
      setFullMenuData(transformedMenu);
    } catch (error) {
      console.error('Error fetching full menu data:', error);
    }
  };

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

  useEffect(() => {
    getMenuCategories();
    getCounters();
    fetchFullMenuData();
    if (prefilledCategory) {
      getDishesByCategory(prefilledCategory);
    }
  }, [prefilledCategory]);

  const handleDishNameChange = (selected, index, values, setFieldValue) => {
    const name = selected ? selected.value : '';
    setFieldValue(`dishes[${index}].dish_name`, name);

    if (name) {
      const currentCategory = values.category;

      const matchedCategory = fullMenuData.find(
        (c) => c.category.toLowerCase() === currentCategory.toLowerCase() && (c.dishes || []).some((d) => d.dish_name.toLowerCase() === name.toLowerCase())
      );

      if (matchedCategory) {
        const matchedDish = matchedCategory.dishes.find((d) => d.dish_name.toLowerCase() === name.toLowerCase());

        if (matchedDish) {
          // Autofill existing ID
          setFieldValue(`dishes[${index}]._id`, matchedDish._id || '');
          // Autofill description
          setFieldValue(`dishes[${index}].description`, matchedDish.description || '');
          // Autofill meal type
          setFieldValue(`dishes[${index}].meal_type`, matchedDish.meal_type || 'veg');

          // Autofill variants
          if (matchedDish.variants && matchedDish.variants.length > 0) {
            setFieldValue(
              `dishes[${index}].variants`,
              matchedDish.variants.map((v) => ({
                size_name: v.size_name || '',
                price: v.price || '',
                extra: v.extra || '',
                is_available: v.is_available !== false,
              }))
            );
          } else {
            setFieldValue(`dishes[${index}].variants`, [{ size_name: '', price: matchedDish.dish_price || '', extra: '', is_available: true }]);
          }

          // Autofill addons
          if (matchedDish.addons && matchedDish.addons.length > 0) {
            setFieldValue(
              `dishes[${index}].addons`,
              matchedDish.addons.map((a) => ({
                addon_name: a.addon_name || '',
                price: a.price || '',
                is_available: a.is_available !== false,
              }))
            );
          } else {
            setFieldValue(`dishes[${index}].addons`, []);
          }

          // Autofill image preview if any
          if (matchedDish.dish_img) {
            setImagePreviews((prev) => ({
              ...prev,
              [index]: `${process.env.REACT_APP_UPLOAD_DIR || 'http://localhost:5001/uploads'}${matchedDish.dish_img}`,
            }));
          } else {
            setImagePreviews((prev) => {
              const updated = { ...prev };
              delete updated[index];
              return updated;
            });
          }
        }
      }
    }
  };

  const validationSchema = Yup.object().shape({
    category: Yup.string().required('Category is required'),
    counter: Yup.string(),
    hideOnKot: Yup.boolean(),
    dishes: Yup.array().of(
      Yup.object().shape({
        dish_name: Yup.string().required('Dish name is required'),
        meal_type: Yup.string().required('Meal type is required'),
        description: Yup.string(),
        variants: Yup.array()
          .of(
            Yup.object().shape({
              size_name: Yup.string(),
              price: Yup.number().typeError('Must be a number').required('Price is required'),
              extra: Yup.string(),
            })
          )
          .min(1, 'At least one variant/price is required'),
        addons: Yup.array().of(
          Yup.object().shape({
            addon_name: Yup.string().required('Addon name is required'),
            price: Yup.number().typeError('Must be a number').required('Price is required'),
          })
        ),
      })
    ),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', values.category);
      formData.append('counter', values.counter);
      formData.append('hide_on_kot', values.hideOnKot);
      const dishData = values.dishes.map((dish, i) => {
        if (dish.dish_img) formData.append(`dish_img`, dish.dish_img);

        let cleanedVariants = [];
        if (Array.isArray(dish.variants)) {
          cleanedVariants = dish.variants.map((v) => ({
            size_name: v.size_name || '',
            price: Number(v.price) || 0,
            extra: v.extra || '',
            is_available: v.is_available !== false,
          }));
        }

        let cleanedAddons = [];
        if (Array.isArray(dish.addons)) {
          cleanedAddons = dish.addons
            .filter((a) => a.addon_name && a.addon_name.trim() !== '')
            .map((a) => ({
              addon_name: a.addon_name,
              price: Number(a.price) || 0,
              is_available: a.is_available !== false,
            }));
        }

        return {
          _id: dish._id || undefined,
          dish_name: dish.dish_name,
          meal_type: dish.meal_type || 'veg',
          dish_price: cleanedVariants[0] ? Number(cleanedVariants[0].price) || 0 : 0,
          description: dish.description,
          has_variants: cleanedVariants.length > 1,
          variants: cleanedVariants,
          addons: cleanedAddons,
          dish_img: '',
        };
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
      border: state.isFocused ? '1px solid #23b3f4' : '1px solid #e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(35, 179, 244, 0.1)' : 'none',
      backgroundColor: '#fff',
      '&:hover': { border: '1px solid #23b3f4' },
    }),
  };

  return (
    <>
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid qsr-page-container">
        <div className="qsr-page-title-container text-start">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto text-start">
              <h1 className="qsr-page-title">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
          {({ values, handleChange, setFieldValue, errors }) => (
            <Form>
              <Card className="glass-card mb-4 border-0">
                <Card.Body className="p-3 p-sm-4">
                  <Row className="g-4">
                    <Col lg={6}>
                      <BForm.Group>
                        <BForm.Label className="fw-bold text-muted text-uppercase small mb-2">Dish Category</BForm.Label>
                        <div className="position-relative">
                          <CreatableSelect
                            styles={{
                              ...selectStyles,
                              control: (base, state) => ({
                                ...selectStyles.control(base, state),
                                borderColor: values.category === '' && isSubmitting ? '#ef4444' : state.isFocused ? '#23b3f4' : '#e5e7eb',
                                minHeight: '38px',
                              }),
                            }}
                            isClearable
                            menuPlacement="auto"
                            menuPortalTarget={document.body}
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
                    <Col lg={6}>
                      <BForm.Group>
                        <BForm.Label className="fw-bold text-muted text-uppercase small mb-2">Counter</BForm.Label>
                        <CreatableSelect
                          styles={{
                            ...selectStyles,
                            control: (base, state) => ({
                              ...selectStyles.control(base, state),
                              minHeight: '48px',
                            }),
                          }}
                          isClearable
                          menuPlacement="auto"
                          menuPortalTarget={document.body}
                          isDisabled={isSubmitting || isFromManageMenu}
                          options={counterOptions}
                          value={values.counter ? { label: values.counter, value: values.counter } : null}
                          onChange={(selected) => setFieldValue('counter', selected ? selected.value : '')}
                          placeholder="Select or create counter"
                        />
                      </BForm.Group>
                    </Col>
                    <Col xs={12}>
                      <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => setFieldValue('hideOnKot', !values.hideOnKot)}>
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
                            <div
                              key={index}
                              className="p-3 p-md-4 rounded-xl border-0 position-relative shadow-sm mb-3"
                              style={{ background: '#f8fafc', borderRadius: '1.25rem' }}
                            >
                              <Button
                                variant="outline-danger"
                                className="delete-btn-table"
                                onClick={() => remove(index)}
                                disabled={values.dishes.length === 1}
                                title="Remove Dish"
                              >
                                <CsLineIcons icon="bin" size="16" />
                              </Button>
                              <Row className="g-2 g-md-3 align-items-end">
                                <Col xs={12} md={6}>
                                  <BForm.Group>
                                    <BForm.Label className="fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                                      Dish Name
                                    </BForm.Label>
                                    <div className="position-relative">
                                      <CreatableSelect
                                        styles={{
                                          ...selectStyles,
                                          control: (base, state) => ({
                                            ...selectStyles.control(base, state),
                                            borderColor:
                                              values.dishes[index].dish_name === '' && isSubmitting ? '#ef4444' : state.isFocused ? '#23b3f4' : '#e5e7eb',
                                            minHeight: '48px',
                                          }),
                                        }}
                                        isClearable
                                        menuPlacement="auto"
                                        menuPortalTarget={document.body}
                                        options={dishOptions}
                                        value={dish.dish_name ? { label: dish.dish_name, value: dish.dish_name } : null}
                                        onChange={(selected) => handleDishNameChange(selected, index, values, setFieldValue)}
                                        placeholder="Select or create dish name"
                                      />
                                      <ErrorMessage name={`dishes[${index}].dish_name`} component="div" className="text-danger small mt-1" />
                                    </div>
                                  </BForm.Group>
                                </Col>
                                <Col xs={12} md={6}>
                                  <BForm.Label className="fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                                    Meal Type
                                  </BForm.Label>
                                  <div className="d-flex flex-wrap gap-2" style={{ height: '48px', alignItems: 'center' }}>
                                    {['veg', 'egg', 'non-veg'].map((type) => (
                                      <div
                                        key={type}
                                        className={`meal-type-radio ${type} ${dish.meal_type === type ? 'active' : ''}`}
                                        onClick={() => setFieldValue(`dishes[${index}].meal_type`, type)}
                                        style={{ flexGrow: 1, height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      >
                                        <div
                                          className="rounded-circle"
                                          style={{
                                            width: '10px',
                                            height: '10px',
                                            background: type === 'veg' ? '#10b981' : type === 'egg' ? '#f59e0b' : '#ef4444',
                                          }}
                                        />
                                        {type === 'veg' ? 'Veg' : type === 'egg' ? 'Egg' : 'Non-Veg'}
                                      </div>
                                    ))}
                                  </div>
                                </Col>
                                <Col xs={12} className="mt-3">
                                  <div className="p-3 rounded-xl border mb-3 bg-white" style={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h6 className="fw-bold text-primary mb-0" style={{ fontSize: '0.9rem' }}>
                                        Sizes, Pricing & Details
                                      </h6>
                                      {errors.dishes?.[index]?.variants && typeof errors.dishes[index].variants === 'string' && (
                                        <div className="text-danger small fw-bold">{errors.dishes[index].variants}</div>
                                      )}
                                    </div>
                                    <FieldArray name={`dishes[${index}].variants`}>
                                      {({ push: pushVariant, remove: removeVariant }) => (
                                        <div className="d-flex flex-column gap-2">
                                          {(dish.variants || []).map((variant, vIdx) => (
                                            <React.Fragment key={vIdx}>
                                              {vIdx > 0 && <hr className="my-3" style={{ borderTop: '1px dashed #cbd5e1' }} />}
                                              <Row className="g-2 align-items-end mb-2">
                                                <Col xs={12} sm={4}>
                                                  <BForm.Group>
                                                    <BForm.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                                                      Size / Variant Name
                                                    </BForm.Label>
                                                    <CreatableSelect
                                                      styles={{
                                                        ...selectStyles,
                                                        control: (base, state) => ({
                                                          ...selectStyles.control(base, state),
                                                          minHeight: '48px',
                                                          borderRadius: '12px',
                                                        }),
                                                      }}
                                                      isClearable
                                                      menuPlacement="auto"
                                                      menuPortalTarget={document.body}
                                                      options={sizeSuggestions.map((opt) => ({ value: opt, label: opt }))}
                                                      value={variant.size_name ? { value: variant.size_name, label: variant.size_name } : null}
                                                      onChange={(selected) =>
                                                        setFieldValue(`dishes[${index}].variants[${vIdx}].size_name`, selected ? selected.value : '')
                                                      }
                                                      placeholder="e.g. Regular"
                                                    />
                                                    <ErrorMessage
                                                      name={`dishes[${index}].variants[${vIdx}].size_name`}
                                                      component="div"
                                                      className="text-danger small mt-1"
                                                    />
                                                  </BForm.Group>
                                                </Col>
                                                <Col xs={12} sm={3}>
                                                  <BForm.Group>
                                                    <BForm.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                                                      Price (₹)
                                                    </BForm.Label>
                                                    <BForm.Control
                                                      type="text"
                                                      name={`dishes[${index}].variants[${vIdx}].price`}
                                                      value={variant.price || ''}
                                                      onChange={handleChange}
                                                      placeholder="Price"
                                                      className="pill-input"
                                                      style={{ height: '48px', borderRadius: '12px' }}
                                                    />
                                                    <ErrorMessage
                                                      name={`dishes[${index}].variants[${vIdx}].price`}
                                                      component="div"
                                                      className="text-danger small mt-1"
                                                    />
                                                  </BForm.Group>
                                                </Col>
                                                <Col xs={10} sm={4}>
                                                  <BForm.Group>
                                                    <BForm.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                                                      Extra Details
                                                    </BForm.Label>
                                                    <CreatableSelect
                                                      styles={{
                                                        ...selectStyles,
                                                        control: (base, state) => ({
                                                          ...selectStyles.control(base, state),
                                                          minHeight: '48px',
                                                          borderRadius: '12px',
                                                        }),
                                                      }}
                                                      isClearable
                                                      menuPlacement="auto"
                                                      menuPortalTarget={document.body}
                                                      options={extraSuggestions.map((opt) => ({ value: opt, label: opt }))}
                                                      value={variant.extra ? { value: variant.extra, label: variant.extra } : null}
                                                      onChange={(selected) =>
                                                        setFieldValue(`dishes[${index}].variants[${vIdx}].extra`, selected ? selected.value : '')
                                                      }
                                                      placeholder="e.g. Serves 1-2"
                                                    />
                                                  </BForm.Group>
                                                </Col>
                                                <Col xs={2} sm="auto" className="pb-1 text-end">
                                                  <Button
                                                    variant="outline-danger"
                                                    onClick={() => removeVariant(vIdx)}
                                                    disabled={dish.variants.length === 1}
                                                    style={{ height: '48px', width: '48px', minWidth: '48px', borderRadius: '12px', padding: 0, flexShrink: 0 }}
                                                    className="d-flex align-items-center justify-content-center btn btn-outline-danger"
                                                  >
                                                    <CsLineIcons icon="bin" size="14" />
                                                  </Button>
                                                </Col>
                                              </Row>
                                            </React.Fragment>
                                          ))}
                                          <Button
                                            type="button"
                                            variant="outline-primary"
                                            className="custom-btn-outline py-1 px-3 mt-2 d-flex align-items-center gap-1 align-self-start btn btn-outline-primary"
                                            style={{ height: '34px', fontSize: '0.8rem', borderRadius: '8px' }}
                                            onClick={() => pushVariant({ size_name: '', price: '', extra: '', is_available: true })}
                                          >
                                            <CsLineIcons icon="plus" size="12" />
                                            Add Size/Variant
                                          </Button>
                                        </div>
                                      )}
                                    </FieldArray>
                                  </div>
                                </Col>

                                <Col xs={12} className="mt-2">
                                  <div className="p-3 rounded-xl border mb-3 bg-white" style={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h6 className="fw-bold text-primary mb-0" style={{ fontSize: '0.9rem' }}>
                                        Configure Add-ons (Optional)
                                      </h6>
                                    </div>
                                    <FieldArray name={`dishes[${index}].addons`}>
                                      {({ push: pushAddon, remove: removeAddon }) => (
                                        <div className="d-flex flex-column gap-2">
                                          {(dish.addons || []).map((addon, aIdx) => (
                                            <React.Fragment key={aIdx}>
                                              {aIdx > 0 && <hr className="my-2" style={{ borderTop: '1px dashed #e2e8f0' }} />}
                                              <Row className="g-2 align-items-end mb-2">
                                                <Col xs={12} sm={6}>
                                                  <BForm.Group>
                                                    <BForm.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                                                      Add-on Name
                                                    </BForm.Label>
                                                    <CreatableSelect
                                                      styles={{
                                                        ...selectStyles,
                                                        control: (base, state) => ({
                                                          ...selectStyles.control(base, state),
                                                          minHeight: '48px',
                                                          borderRadius: '12px',
                                                        }),
                                                      }}
                                                      isClearable
                                                      menuPlacement="auto"
                                                      menuPortalTarget={document.body}
                                                      options={addonSuggestions.map((opt) => ({ value: opt, label: opt }))}
                                                      value={addon.addon_name ? { value: addon.addon_name, label: addon.addon_name } : null}
                                                      onChange={(selected) =>
                                                        setFieldValue(`dishes[${index}].addons[${aIdx}].addon_name`, selected ? selected.value : '')
                                                      }
                                                      placeholder="Add-on Name"
                                                    />
                                                    <ErrorMessage
                                                      name={`dishes[${index}].addons[${aIdx}].addon_name`}
                                                      component="div"
                                                      className="text-danger small mt-1"
                                                    />
                                                  </BForm.Group>
                                                </Col>
                                                <Col xs={9} sm={4}>
                                                  <BForm.Group>
                                                    <BForm.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                                                      Price (Extra charge)
                                                    </BForm.Label>
                                                    <BForm.Control
                                                      type="text"
                                                      name={`dishes[${index}].addons[${aIdx}].price`}
                                                      value={addon.price || ''}
                                                      onChange={handleChange}
                                                      placeholder="Price"
                                                      className="pill-input"
                                                      style={{ height: '48px', borderRadius: '12px' }}
                                                    />
                                                    <ErrorMessage
                                                      name={`dishes[${index}].addons[${aIdx}].price`}
                                                      component="div"
                                                      className="text-danger small mt-1"
                                                    />
                                                  </BForm.Group>
                                                </Col>
                                                <Col xs="auto" className="pb-1">
                                                  <Button
                                                    variant="outline-danger"
                                                    onClick={() => removeAddon(aIdx)}
                                                    style={{ height: '48px', width: '48px', minWidth: '48px', borderRadius: '12px', padding: 0, flexShrink: 0 }}
                                                    className="d-flex align-items-center justify-content-center btn btn-outline-danger"
                                                  >
                                                    <CsLineIcons icon="bin" size="14" />
                                                  </Button>
                                                </Col>
                                              </Row>
                                            </React.Fragment>
                                          ))}
                                          <Button
                                            type="button"
                                            variant="outline-primary"
                                            className="custom-btn-outline py-1 px-3 mt-2 d-flex align-items-center gap-1 align-self-start"
                                            style={{ height: '34px', fontSize: '0.8rem', borderRadius: '8px' }}
                                            onClick={() => pushAddon({ addon_name: '', price: '', is_available: true })}
                                          >
                                            <CsLineIcons icon="plus" size="12" />
                                            Add Add-on
                                          </Button>
                                        </div>
                                      )}
                                    </FieldArray>
                                  </div>
                                </Col>

                                <Col xs={12} md={4} className="pt-md-2">
                                  <div className="d-flex align-items-center h-100">
                                    <input
                                      type="file"
                                      id={`file-${index}`}
                                      className="d-none"
                                      accept="image/*"
                                      onChange={(e) => handleImageChange(e, index, setFieldValue)}
                                    />
                                    <label
                                      htmlFor={`file-${index}`}
                                      className="custom-btn-outline px-3 py-2 rounded-pill small fw-bold cursor-pointer mb-0 d-flex align-items-center justify-content-center w-100"
                                      style={{ height: '48px' }}
                                    >
                                      <CsLineIcons icon="upload" size="14" className="me-2" />
                                      {dish.dish_img ? 'Change Image' : 'Add Image'}
                                    </label>
                                    {imagePreviews[index] && (
                                      <img
                                        src={imagePreviews[index]}
                                        alt="Preview"
                                        className="ms-2 rounded shadow-sm"
                                        style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                                      />
                                    )}
                                  </div>
                                </Col>
                                <Col xs={12} md={8} className="pt-md-2">
                                  <Field
                                    as="textarea"
                                    rows={2}
                                    style={{ resize: 'none' }}
                                    name={`dishes[${index}].description`}
                                    className="form-control pill-input bg-white"
                                    placeholder="Add description (optional)..."
                                  />
                                </Col>
                              </Row>
                            </div>
                          ))}

                          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-3 mt-4">
                            <Button
                              type="button"
                              className="custom-btn-outline px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                              onClick={() =>
                                push({
                                  _id: '',
                                  dish_name: '',
                                  meal_type: 'veg',
                                  dish_price: '',
                                  dish_img: null,
                                  description: '',
                                  quantity: '',
                                  unit: '',
                                  showAdvancedOptions: false,
                                  variants: [{ size_name: '', price: '', extra: '', is_available: true }],
                                  addons: [],
                                })
                              }
                            >
                              <CsLineIcons icon="plus" size="18" />
                              Add More Dish
                            </Button>

                            <Button
                              type="submit"
                              className="custom-btn-outline px-5 py-2 d-flex align-items-center justify-content-center gap-2"
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
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ background: 'rgba(255,255,255,0.8)', zIndex: 9999, backdropFilter: 'blur(4px)' }}
          >
            <Card className="glass-card border-0 shadow-lg text-center p-5">
              <Spinner animation="grow" style={{ color: '#23b3f4' }} className="mb-4" />
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
