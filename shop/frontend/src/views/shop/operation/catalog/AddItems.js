/* eslint-disable react/no-this-in-sfc, func-names, no-unused-vars */
import React, { useEffect, useState, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Card, Col, Row, Button, Form as BForm, Spinner, Alert, Table } from 'react-bootstrap';
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
  .type-type-radio {
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
    .type-type-radio {
      flex: 1 1 0% !important;
      justify-content: center !important;
      font-size: 0.75rem !important;
      padding: 6px 8px !important;
    }
  }
  @media (min-width: 576px) {
    .type-type-radio {
      padding: 8px 16px;
      gap: 8px;
      font-size: 0.85rem;
    }
  }
  .type-type-radio:hover {
    background: #f9fafb;
  }
  .type-type-radio.active.veg {
    background: #ecfdf5;
    border-color: #10b981;
    color: #047857;
  }
  .type-type-radio.active.egg {
    background: #fffbeb;
    border-color: #f59e0b;
    color: #b45309;
  }
  .type-type-radio.active.non-veg {
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
  .custom-check.active {
    background: #23b3f4 !important;
    border-color: #23b3f4 !important;
  }
`;

const AddItems = () => {
  const title = 'Add Items';
  const description = 'Form to add items using Formik and Yup';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/add-item', title: 'Add Items' },
  ];

  const history = useHistory();
  const location = useLocation();

  const [suggestions, setSuggestions] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [storePreferences, setStorePreferences] = useState('optional');
  const [shopType, setShopType] = useState('Other');
  const [submitAction, setSubmitAction] = useState('close'); // 'close' or 'add_another'

  const categoryOptions = (suggestions.categories || []).map((c) => ({ label: c.category || c, value: c.category || c }));
  const dishOptions = (suggestions.items || []).map((d) => ({ label: d, value: d }));
  const [counterOptions, setCounterOptions] = useState([]);

  const isFromManageCatalog = location.state?.fromManageCatalog || false;
  const prefilledCategory = isFromManageCatalog ? location.state?.category || '' : '';
  const prefilledCounter = isFromManageCatalog ? location.state?.counter || '' : '';
  const prefilledHideOnKot = isFromManageCatalog ? location.state?.hide_on_kot || false : false;

  let variantLabel = "Variant / Size Name";
  if (['Grocery Shop', 'Super Market', 'Dairy / Milk Shop', 'Sweet Shop / Mithai'].includes(shopType)) {
    variantLabel = "Weight / Volume";
  } else if (['Clothing / Garment'].includes(shopType)) {
    variantLabel = "Size & Color";
  } else if (['Hardware Shop', 'Electronics & Mobile'].includes(shopType)) {
    variantLabel = "Model / Spec";
  }

  const initialValues = {
    category: prefilledCategory,
    counter: prefilledCounter,
    hideOnKot: prefilledHideOnKot,
    items: [
      {
        _id: '',
        item_name: '',
        type: 'veg',
        item_img: null,
        description: '',
        barcode: '',
        variants: [{ size_name: '', price: '', extra: '', barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(), is_available: true }],
        addons: [],
      },
    ],
  };

  const getCatalogCategories = async () => {
    try {
      setLoadingCategories(true);
      const [catRes, userRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/catalog/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`${process.env.REACT_APP_API}/user/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
      ]);
      setSuggestions((prev) => ({ ...prev, categories: catRes.data.data || [], items: [] }));
      setStorePreferences(userRes.data?.user?.item_type_setting || userRes.data?.item_type_setting || 'optional');
      setShopType(userRes.data?.user?.shop_type || 'Other');
    } catch (error) {
      console.error('Error fetching catalog data:', error);
      toast.error('Failed to load catalog details');
    } finally {
      setLoadingCategories(false);
    }
  };

  const getCounters = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/catalog/get-counter-options`, {
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
      new Set(
        fullMenuData.flatMap((c) =>
          (c.items || []).flatMap((d) =>
            (d.variants || []).map((v) => v.size_name?.trim()).filter(Boolean)
          )
        )
      )
    ).sort();
  }, [fullMenuData]);

  const extraSuggestions = useMemo(() => {
    return Array.from(
      new Set(
        fullMenuData.flatMap((c) =>
          (c.items || []).flatMap((d) =>
            (d.variants || []).map((v) => v.extra?.trim()).filter(Boolean)
          )
        )
      )
    ).sort();
  }, [fullMenuData]);

  const addonSuggestions = useMemo(() => {
    return Array.from(
      new Set(
        fullMenuData.flatMap((c) =>
          (c.items || []).flatMap((d) =>
            (d.addons || []).map((a) => a.addon_name?.trim()).filter(Boolean)
          )
        )
      )
    ).sort();
  }, [fullMenuData]);

  const fetchFullMenuData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/catalog/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const transformedMenu = res.data.data.map(({ _id, ...rest }) => ({
        ...rest,
        id: _id,
      }));
      setFullMenuData(transformedMenu);
    } catch (error) {
      console.error('Error fetching full catalog data:', error);
    }
  };

  const getItemsByCategory = async (category) => {
    if (!category) {
      setSuggestions((prev) => ({ ...prev, items: [] }));
      return;
    }
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/catalog/get-items-by-category?category=${category}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSuggestions((prev) => ({ ...prev, items: response.data.data }));
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  useEffect(() => {
    getCatalogCategories();
    getCounters();
    fetchFullMenuData();
    if (prefilledCategory) {
      getItemsByCategory(prefilledCategory);
    }
  }, [prefilledCategory]);

  const handleDishNameChange = (selected, index, values, setFieldValue) => {
    const name = selected ? selected.value : '';
    setFieldValue(`items[${index}].item_name`, name);

    if (name) {
      const currentCategory = values.category;

      const matchedCategory = fullMenuData.find(
        (c) => c.category.toLowerCase() === currentCategory.toLowerCase() &&
          (c.items || []).some((d) => d.item_name.toLowerCase() === name.toLowerCase())
      );

      if (matchedCategory) {
        const matchedDish = matchedCategory.items.find(
          (d) => d.item_name.toLowerCase() === name.toLowerCase()
        );

        if (matchedDish) {
          // Autofill existing ID
          setFieldValue(`items[${index}]._id`, matchedDish._id || '');
          // Autofill description
          setFieldValue(`items[${index}].description`, matchedDish.description || '');
          // Autofill type type
          setFieldValue(`items[${index}].type`, matchedDish.type || 'veg');

          // Autofill variants
          if (matchedDish.variants && matchedDish.variants.length > 0) {
            setFieldValue(
              `items[${index}].variants`,
              matchedDish.variants.map((v) => ({
                size_name: v.size_name || '',
                price: v.price || '',
                extra: v.extra || '',
                is_available: v.is_available !== false,
              }))
            );
          } else {
            setFieldValue(`items[${index}].variants`, [
              { size_name: '', price: matchedDish.item_price || '', extra: '', is_available: true },
            ]);
          }

          // Autofill addons
          if (matchedDish.addons && matchedDish.addons.length > 0) {
            setFieldValue(
              `items[${index}].addons`,
              matchedDish.addons.map((a) => ({
                addon_name: a.addon_name || '',
                price: a.price || '',
                is_available: a.is_available !== false,
              }))
            );
          } else {
            setFieldValue(`items[${index}].addons`, []);
          }

          // Autofill image preview if any
          if (matchedDish.item_img) {
            setImagePreviews((prev) => ({
              ...prev,
              [index]: `${process.env.REACT_APP_UPLOAD_DIR || 'http://localhost:5001/uploads'}${matchedDish.item_img}`,
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
    items: Yup.array().of(
      Yup.object().shape({
        item_name: Yup.string().required('Item name is required'),
        type: Yup.string().required('Type is required'),
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
      const dishData = values.items.map((item, i) => {
        if (item.item_img) formData.append(`item_img`, item.item_img);

        let cleanedVariants = [];
        if (Array.isArray(item.variants)) {
          cleanedVariants = item.variants.map((v) => ({
            size_name: v.size_name || '',
            price: Number(v.price) || 0,
            extra: v.extra || '',
            is_available: v.is_available !== false,
          }));
        }

        let cleanedAddons = [];
        if (Array.isArray(item.addons)) {
          cleanedAddons = item.addons
            .filter((a) => a.addon_name && a.addon_name.trim() !== '')
            .map((a) => ({
              addon_name: a.addon_name,
              price: Number(a.price) || 0,
              is_available: a.is_available !== false,
            }));
        }

        return {
          _id: item._id || undefined,
          item_name: item.item_name,
          type: item.type || 'veg',
          item_price: cleanedVariants[0] ? Number(cleanedVariants[0].price) || 0 : 0,
          description: item.description,
          has_variants: cleanedVariants.length > 1,
          variants: cleanedVariants,
          addons: cleanedAddons,
          item_img: '',
        };
      });
      formData.append('items', JSON.stringify(dishData));
      const res = await axios.post(`${process.env.REACT_APP_API}/catalog/add`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success(res.data.message || 'Catalog saved successfully!');
      resetForm();
      setImagePreviews({});
      if (submitAction === 'close') {
        history.push('/operations/manage-catalog');
      } else {
        // Keep category and counter, reset items
        resetForm({
          values: {
            category: values.category,
            counter: values.counter,
            hideOnKot: values.hideOnKot,
            items: [{
              _id: '',
              item_name: '',
              type: 'veg',
              item_img: null,
              description: '',
              barcode: '',
              variants: [{ size_name: '', price: '', extra: '', barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(), is_available: true }],
              addons: [],
            }]
          }
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      let errorMsg = error.response?.data?.message || 'Failed to save catalog.';
      if (typeof errorMsg === 'object') {
        errorMsg = Object.values(errorMsg).join(', ') || JSON.stringify(errorMsg);
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  const handleImageChange = (e, index, setFieldValue) => {
    const file = e.currentTarget.files[0];
    if (file) {
      setFieldValue(`items[${index}].item_img`, file);
      setImagePreviews((prev) => ({ ...prev, [index]: URL.createObjectURL(file) }));
    }
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '10px',
      padding: '0px',
      border: state.isFocused ? '1px solid #23b3f4' : '1px solid #e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(35, 179, 244, 0.1)' : 'none',
      backgroundColor: '#fff',
      fontSize: '0.88rem',
      fontWeight: '600',
      minHeight: '38px',
      height: '38px',
      '&:hover': { border: '1px solid #23b3f4' },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <>
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid qsr-page-container">
        <div className="qsr-page-title-container text-start">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto text-start">
              <h1 className="qsr-page-title">
                {title}
              </h1>
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
                        <BForm.Label className="fw-bold text-muted text-uppercase small mb-2">Item Category</BForm.Label>
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
                            isDisabled={isSubmitting}
                            isLoading={loadingCategories}
                            options={categoryOptions}
                            value={values.category ? { label: values.category, value: values.category } : null}
                            onChange={(selected) => {
                              const cat = selected ? selected.value : '';
                              setFieldValue('category', cat);
                              getItemsByCategory(cat);
                            }}
                            placeholder="Select or create category"
                          />
                          <ErrorMessage name="category" component="div" className="text-danger small mt-1" />
                        </div>
                      </BForm.Group>
                    </Col>
                  </Row>

                  <div className="mt-5 pt-4 border-top">
                    <h5 className="fw-bold mb-4">Item Configuration</h5>

                    <div className="d-flex flex-column gap-3">
                      <div
                        className="p-3 p-md-4 rounded-xl border-0 shadow-sm mb-3"
                        style={{ background: '#f8fafc', borderRadius: '1.25rem' }}
                      >
                        <Row className="g-2 g-md-3 align-items-start">
                          <Col xs={12} md={6}>
                            <BForm.Group>
                              <BForm.Label className="fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                                Item Name
                              </BForm.Label>
                              <div className="position-relative">
                                <Field
                                  as={CreatableSelect}
                                  name="items[0].item_name"
                                  styles={{
                                    ...selectStyles,
                                    control: (base, state) => ({
                                      ...selectStyles.control(base, state),
                                      borderColor: values.items[0].item_name === '' && isSubmitting ? '#ef4444' : state.isFocused ? '#23b3f4' : '#e5e7eb',
                                      minHeight: '38px',
                                      borderRadius: '10px'
                                    })
                                  }}
                                  options={dishOptions}
                                  value={values.items[0].item_name ? { label: values.items[0].item_name, value: values.items[0].item_name } : null}
                                  onChange={(selected) => handleDishNameChange(selected, 0, values, setFieldValue)}
                                  placeholder="Select or create item name"
                                />
                                <ErrorMessage name="items[0].item_name" component="div" className="text-danger small mt-1" />
                              </div>
                            </BForm.Group>
                          </Col>

                          {(() => {
                            const selectedCatObj = (suggestions.categories || []).find(c => c.category === values.category);
                            const isFoodCategory = selectedCatObj ? selectedCatObj.is_food_category : false;
                            const shouldShowDietary = storePreferences === 'mandatory' || (storePreferences === 'optional' && isFoodCategory);

                            if (!shouldShowDietary) return null;

                            return (
                              <Col xs={12} md={6}>
                                <BForm.Label className="fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                                  Dietary Preference
                                </BForm.Label>
                                <div className="d-flex flex-wrap gap-2" style={{ height: '38px', alignItems: 'center' }}>
                                  {['veg', 'egg', 'non-veg'].map((type) => (
                                    <div
                                      key={type}
                                      className={`type-type-radio ${type} ${values.items[0].type === type ? 'active' : ''}`}
                                      onClick={() => setFieldValue('items[0].type', type)}
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
                            );
                          })()}

                          <Col xs={12} md={4} className="pt-md-2 mt-3">
                            <div className="d-flex align-items-center h-100">
                              <input
                                type="file"
                                id="file-0"
                                className="d-none"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 0, setFieldValue)}
                              />
                              <label
                                htmlFor="file-0"
                                className="custom-btn-outline px-4 py-2 rounded-pill small fw-bold cursor-pointer mb-0 d-inline-flex align-items-center justify-content-center"
                                style={{ height: '38px' }}
                              >
                                <CsLineIcons icon="upload" size="14" className="me-2" />
                                {values.items[0].item_img ? 'Change Image' : 'Add Image'}
                              </label>
                              {imagePreviews[0] && (
                                <img
                                  src={imagePreviews[0]}
                                  alt="Preview"
                                  className="ms-2 rounded shadow-sm"
                                  style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                                />
                              )}
                            </div>
                          </Col>
                          <Col xs={12} md={8} className="pt-md-2 mt-3">
                            <Field
                              as="textarea"
                              rows={3}
                              style={{ resize: 'none' }}
                              name="items[0].description"
                              className="form-control pill-input bg-white"
                              placeholder="Add description (optional)..."
                            />
                          </Col>

                          <Col xs={12} className="mt-4">
                            <div className="p-3 p-md-4 rounded-xl border bg-white" style={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold text-primary mb-0" style={{ fontSize: '1rem' }}>
                                  Inventory & Pricing
                                </h6>
                                {typeof errors?.items?.[0]?.variants === 'string' && (
                                  <div className="text-danger small fw-bold">{errors.items[0].variants}</div>
                                )}
                              </div>
                              <FieldArray name="items[0].variants">
                                {({ push: pushVariant, remove: removeVariant }) => (
                                  <>
                                    {/* Desktop Table Layout */}
                                    <div className="table-responsive d-none d-md-block">
                                      <Table borderless hover className="align-middle mb-0">
                                        <thead>
                                          <tr className="border-bottom" style={{ color: '#64748b', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                                            <th className="pb-2 text-uppercase">{variantLabel}</th>
                                            <th className="pb-2 text-uppercase" width="140">Price</th>
                                            <th className="pb-2 text-uppercase" width="200">Extra Details</th>
                                            <th className="pb-2 text-uppercase" width="280">Barcode</th>
                                            <th className="pb-2 text-uppercase text-center" width="60" />
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(values.items[0].variants || []).map((variant, vIdx) => (
                                            <tr key={vIdx} className="border-bottom border-light">
                                              <td className="py-3">
                                                <CreatableSelect
                                                  styles={selectStyles}
                                                  isClearable
                                                  menuPlacement="auto"
                                                  menuPortalTarget={document.body}
                                                  options={sizeSuggestions.map((opt) => ({ value: opt, label: opt }))}
                                                  value={variant.size_name ? { value: variant.size_name, label: variant.size_name } : null}
                                                  onChange={(selected) => setFieldValue(`items[0].variants[${vIdx}].size_name`, selected ? selected.value : '')}
                                                  placeholder="e.g. 1kg"
                                                />
                                                <ErrorMessage name={`items[0].variants[${vIdx}].size_name`} component="div" className="text-danger small mt-1" />
                                              </td>
                                              <td className="py-3">
                                                <BForm.Control
                                                  type="text"
                                                  name={`items[0].variants[${vIdx}].price`}
                                                  value={variant.price || ''}
                                                  onChange={handleChange}
                                                  placeholder="Price"
                                                  className="pill-input"
                                                  style={{ height: '38px', borderRadius: '10px' }}
                                                />
                                                <ErrorMessage name={`items[0].variants[${vIdx}].price`} component="div" className="text-danger small mt-1" />
                                              </td>
                                              <td className="py-3">
                                                <CreatableSelect
                                                  styles={selectStyles}
                                                  isClearable
                                                  menuPlacement="auto"
                                                  menuPortalTarget={document.body}
                                                  options={extraSuggestions.map((opt) => ({ value: opt, label: opt }))}
                                                  value={variant.extra ? { value: variant.extra, label: variant.extra } : null}
                                                  onChange={(selected) => setFieldValue(`items[0].variants[${vIdx}].extra`, selected ? selected.value : '')}
                                                  placeholder="Optional"
                                                />
                                              </td>
                                              <td className="py-3">
                                                <div className="d-flex align-items-center gap-1">
                                                  <BForm.Control
                                                    type="text"
                                                    name={`items[0].variants[${vIdx}].barcode`}
                                                    value={variant.barcode || ''}
                                                    onChange={handleChange}
                                                    placeholder="Barcode"
                                                    className="pill-input"
                                                    style={{ height: '38px', borderRadius: '10px' }}
                                                  />
                                                  <Button
                                                    variant="outline-primary"
                                                    className="flex-shrink-0 d-flex align-items-center justify-content-center px-3"
                                                    style={{ height: '38px', borderRadius: '10px' }}
                                                    onClick={() => setFieldValue(`items[0].variants[${vIdx}].barcode`, Math.floor(100000000000 + Math.random() * 900000000000).toString())}
                                                  >
                                                    <span className="fw-bold" style={{ fontSize: '0.85rem' }}>Gen</span>
                                                  </Button>
                                                </div>
                                              </td>
                                              <td className="py-3 text-center">
                                                <Button
                                                  variant="outline-danger"
                                                  onClick={() => removeVariant(vIdx)}
                                                  disabled={values.items[0].variants.length === 1}
                                                  style={{ height: '34px', width: '34px', minWidth: '34px', borderRadius: '50%', padding: 0 }}
                                                  className="d-flex align-items-center justify-content-center btn btn-outline-danger mx-auto"
                                                >
                                                  <CsLineIcons icon="bin" size="14" />
                                                </Button>
                                              </td>
                                            </tr>
                                          ))}
                                          <tr>
                                            <td colSpan="5" className="pt-3 pb-0 border-0">
                                              <Button
                                                type="button"
                                                variant="outline-primary"
                                                className="custom-btn-outline py-1 px-3 d-flex align-items-center gap-1 btn btn-outline-primary"
                                                style={{ height: '34px', fontSize: '0.85rem', borderRadius: '8px' }}
                                                onClick={() => pushVariant({ size_name: '', price: '', extra: '', barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(), is_available: true })}
                                              >
                                                <CsLineIcons icon="plus" size="12" />
                                                Add Row
                                              </Button>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </Table>
                                    </div>

                                    {/* Mobile Stacked Layout (Hidden on Desktop) */}
                                    <div className="d-flex d-md-none flex-column gap-2">
                                      {(values.items[0].variants || []).map((variant, vIdx) => (
                                        <React.Fragment key={vIdx}>
                                          {vIdx > 0 && <hr className="my-3" style={{ borderTop: '1px dashed #cbd5e1' }} />}
                                          <Row className="g-2 align-items-start mb-3 pb-3 border-bottom border-light">
                                            <Col xs={10} className="order-1">
                                              <BForm.Group>
                                                <BForm.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                                                  {variantLabel}
                                                </BForm.Label>
                                                <CreatableSelect
                                                  styles={selectStyles}
                                                  isClearable
                                                  menuPlacement="auto"
                                                  menuPortalTarget={document.body}
                                                  options={sizeSuggestions.map((opt) => ({ value: opt, label: opt }))}
                                                  value={variant.size_name ? { value: variant.size_name, label: variant.size_name } : null}
                                                  onChange={(selected) => setFieldValue(`items[0].variants[${vIdx}].size_name`, selected ? selected.value : '')}
                                                  placeholder="e.g. 1kg"
                                                />
                                                <ErrorMessage name={`items[0].variants[${vIdx}].size_name`} component="div" className="text-danger small mt-1" />
                                              </BForm.Group>
                                            </Col>
                                            <Col xs={6} className="order-3">
                                              <BForm.Group>
                                                <BForm.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                                                  Price
                                                </BForm.Label>
                                                <BForm.Control
                                                  type="text"
                                                  name={`items[0].variants[${vIdx}].price`}
                                                  value={variant.price || ''}
                                                  onChange={handleChange}
                                                  placeholder="Price"
                                                  className="pill-input"
                                                  style={{ height: '38px', borderRadius: '10px' }}
                                                />
                                                <ErrorMessage name={`items[0].variants[${vIdx}].price`} component="div" className="text-danger small mt-1" />
                                              </BForm.Group>
                                            </Col>
                                            <Col xs={6} className="order-4">
                                              <BForm.Group>
                                                <BForm.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                                                  Extra Details
                                                </BForm.Label>
                                                <CreatableSelect
                                                  styles={selectStyles}
                                                  isClearable
                                                  menuPlacement="auto"
                                                  menuPortalTarget={document.body}
                                                  options={extraSuggestions.map((opt) => ({ value: opt, label: opt }))}
                                                  value={variant.extra ? { value: variant.extra, label: variant.extra } : null}
                                                  onChange={(selected) => setFieldValue(`items[0].variants[${vIdx}].extra`, selected ? selected.value : '')}
                                                  placeholder="Optional"
                                                />
                                              </BForm.Group>
                                            </Col>
                                            <Col xs={12} className="order-5">
                                              <BForm.Group>
                                                <BForm.Label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                                                  Barcode
                                                </BForm.Label>
                                                <div className="d-flex align-items-center gap-1">
                                                  <BForm.Control
                                                    type="text"
                                                    name={`items[0].variants[${vIdx}].barcode`}
                                                    value={variant.barcode || ''}
                                                    onChange={handleChange}
                                                    placeholder="Barcode"
                                                    className="pill-input"
                                                    style={{ height: '38px', borderRadius: '10px' }}
                                                  />
                                                  <Button
                                                    variant="outline-primary"
                                                    className="flex-shrink-0 d-flex align-items-center justify-content-center px-3"
                                                    style={{ height: '38px', borderRadius: '10px' }}
                                                    onClick={() => setFieldValue(`items[0].variants[${vIdx}].barcode`, Math.floor(100000000000 + Math.random() * 900000000000).toString())}
                                                  >
                                                    <span className="fw-bold" style={{ fontSize: '0.85rem' }}>Gen</span>
                                                  </Button>
                                                </div>
                                              </BForm.Group>
                                            </Col>
                                            <Col xs={2} className="order-2 d-flex flex-column justify-content-end pb-1 px-1">
                                              <BForm.Label className="d-none d-sm-block mb-1" style={{ fontSize: '0.75rem', visibility: 'hidden' }}>
                                                Delete
                                              </BForm.Label>
                                              <Button
                                                variant="outline-danger"
                                                onClick={() => removeVariant(vIdx)}
                                                disabled={values.items[0].variants.length === 1}
                                                style={{ height: '36px', width: '36px', minWidth: '36px', borderRadius: '50%', padding: 0 }}
                                                className="flex-shrink-0 d-flex align-items-center justify-content-center btn btn-outline-danger"
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
                                        onClick={() => pushVariant({ size_name: '', price: '', extra: '', barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(), is_available: true })}
                                      >
                                        <CsLineIcons icon="plus" size="12" />
                                        Add Row
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </FieldArray>
                            </div>
                          </Col>
                        </Row>
                      </div>

                      <div className="d-flex flex-column flex-sm-row justify-content-end align-items-stretch align-items-sm-center gap-3 mt-2">
                        <Button
                          type="submit"
                          variant="primary"
                          className="px-4 py-2 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2"
                          disabled={isSubmitting}
                          onClick={() => setSubmitAction('close')}
                        >
                          {isSubmitting && submitAction === 'close' ? <Spinner size="sm" /> : <CsLineIcons icon="save" size="18" />}
                          Save & Close
                        </Button>
                        <Button
                          type="submit"
                          variant="success"
                          className="px-4 py-2 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2 text-white"
                          disabled={isSubmitting}
                          onClick={() => setSubmitAction('add_another')}
                        >
                          {isSubmitting && submitAction === 'add_another' ? <Spinner size="sm" /> : <CsLineIcons icon="plus" size="18" />}
                          Save & Add Another
                        </Button>
                      </div>
                    </div>
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
              <h4 className="fw-bold mb-1">Finalizing Catalog</h4>
              <p className="text-muted mb-0">Saving your delicious items...</p>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default AddItems;

