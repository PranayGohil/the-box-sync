import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { Country, State, City } from 'country-state-city';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { Formik } from 'formik';
import * as Yup from 'yup';

const Address = () => {
    const title = 'Address';
    const description = 'Update your address details.';

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'settings', text: 'Settings' },
        { to: 'settings/address', title: 'Address' },
    ];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [error, setError] = useState('');
    const [loadingStates, setLoadingStates] = useState({ countries: true, states: false, cities: false });

    const [profile, setProfile] = useState({
        address: '',
        country: '',
        state: '',
        city: '',
        pincode: '',
    });

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    // Yup validation schema
    const validationSchema = Yup.object().shape({
        address: Yup.string()
            .required('Address is required')
            .min(10, 'Address must be at least 10 characters')
            .max(200, 'Address must not exceed 200 characters'),
        country: Yup.string()
            .required('Country is required'),
        state: Yup.string()
            .required('State is required'),
        city: Yup.string()
            .required('City is required'),
        pincode: Yup.string()
            .required('Pin code is required')
            .matches(/^[0-9]{6}$/, 'Pin code must be exactly 6 digits'),
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                const data = res.data.user || res.data;

                const profileData = {
                    address: data.address || '',
                    country: data.country || '',
                    state: data.state || '',
                    city: data.city || '',
                    pincode: data.pincode || '',
                };

                setProfile(profileData);

                // Load states and cities if country/state exist
                if (profileData.country) {
                    const selectedCountry = Country.getAllCountries()
                        .find(c => c.name === profileData.country);

                    if (selectedCountry) {
                        const countryStates = State.getStatesOfCountry(selectedCountry.isoCode);
                        setStates(countryStates);

                        if (profileData.state) {
                            const selectedState = countryStates.find(s => s.name === profileData.state);

                            if (selectedState) {
                                const stateCities = City.getCitiesOfState(
                                    selectedCountry.isoCode,
                                    selectedState.isoCode
                                );
                                setCities(stateCities);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load address data', err);
                setError('Failed to load data');
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    useEffect(() => {
        setLoadingStates(prev => ({ ...prev, countries: true }));
        const timer = setTimeout(() => {
            setCountries(Country.getAllCountries());
            setLoadingStates(prev => ({ ...prev, countries: false }));
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const handleCountryChange = (countryName, setFieldValue) => {
        setFieldValue('country', countryName);
        setFieldValue('state', '');
        setFieldValue('city', '');
        setCities([]);

        if (countryName) {
            setLoadingStates(prev => ({ ...prev, states: true }));
            setTimeout(() => {
                const selectedCountry = Country.getAllCountries()
                    .find(c => c.name === countryName);
                if (selectedCountry) {
                    setStates(State.getStatesOfCountry(selectedCountry.isoCode));
                } else {
                    setStates([]);
                }
                setLoadingStates(prev => ({ ...prev, states: false }));
            }, 300);
        } else {
            setStates([]);
        }
    };

    const handleStateChange = (stateName, countryName, setFieldValue) => {
        setFieldValue('state', stateName);
        setFieldValue('city', '');

        if (stateName && countryName) {
            setLoadingStates(prev => ({ ...prev, cities: true }));
            setTimeout(() => {
                const selectedCountry = Country.getAllCountries()
                    .find(c => c.name === countryName);
                if (selectedCountry) {
                    const selectedState = State.getStatesOfCountry(selectedCountry.isoCode)
                        .find(s => s.name === stateName);
                    if (selectedState) {
                        setCities(
                            City.getCitiesOfState(
                                selectedCountry.isoCode,
                                selectedState.isoCode
                            )
                        );
                    } else {
                        setCities([]);
                    }
                } else {
                    setCities([]);
                }
                setLoadingStates(prev => ({ ...prev, cities: false }));
            }, 300);
        } else {
            setCities([]);
        }
    };

    const handleEditSubmit = async (values, { setSubmitting }) => {
        setSaving(true);
        try {
            setError('');
            await axios.put(
                `${process.env.REACT_APP_API}/user/update`,
                {
                    address: values.address,
                    country: values.country,
                    state: values.state,
                    city: values.city,
                    pincode: values.pincode,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            setProfile({ ...values });
            setEditMode(false);
            toast.success('Address updated successfully!');
        } catch (err) {
            console.error('Failed to update address', err);
            const errorMessage = err.response?.data?.message || 'Update failed. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setSaving(false);
            setSubmitting(false);
        }
    };

    const handleCancel = (resetForm) => {
        resetForm();
        setEditMode(false);
        setError('');

        // Reset dependent dropdowns
        if (profile.country) {
            const selectedCountry = Country.getAllCountries()
                .find(c => c.name === profile.country);
            if (selectedCountry) {
                setStates(State.getStatesOfCountry(selectedCountry.isoCode));

                if (profile.state) {
                    const selectedState = State.getStatesOfCountry(selectedCountry.isoCode)
                        .find(s => s.name === profile.state);
                    if (selectedState) {
                        setCities(
                            City.getCitiesOfState(
                                selectedCountry.isoCode,
                                selectedState.isoCode
                            )
                        );
                    }
                }
            }
        }
    };

    if (loading) {
        return (
            <>
                <HtmlHead title={title} description={description} />
                <Row>
                    <Col>
                        <div className="page-title-container">
                            <h1 className="mb-0 pb-0 display-4">{title}</h1>
                            <BreadcrumbList items={breadcrumbs} />
                        </div>
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" className="mb-3" />
                            <h5>Loading Address Information...</h5>
                            <p className="text-muted">Please wait while we fetch your address details</p>
                        </div>
                    </Col>
                </Row>
            </>
        );
    }

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

                    <section className="scroll-section" id="addressForm">
                        <Card body className="mb-5">
                            <Formik
                                initialValues={{
                                    address: profile.address,
                                    country: profile.country,
                                    state: profile.state,
                                    city: profile.city,
                                    pincode: profile.pincode,
                                }}
                                validationSchema={validationSchema}
                                onSubmit={handleEditSubmit}
                                enableReinitialize
                            >
                                {({
                                    values,
                                    errors,
                                    touched,
                                    handleChange,
                                    handleBlur,
                                    handleSubmit,
                                    isSubmitting,
                                    resetForm,
                                    setFieldValue,
                                }) => (
                                    <Form onSubmit={handleSubmit}>
                                        <Row className="mb-3">
                                            <Col md="12" className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Address <span className="text-danger">*</span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        name="address"
                                                        value={values.address}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        disabled={!editMode || saving}
                                                        isInvalid={touched.address && errors.address}
                                                        isValid={touched.address && !errors.address && editMode}
                                                        placeholder="Enter your complete address"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.address}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md="4" className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Country <span className="text-danger">*</span>
                                                    </Form.Label>
                                                    <div className="position-relative">
                                                        <Form.Select
                                                            name="country"
                                                            value={values.country}
                                                            onChange={(e) => handleCountryChange(e.target.value, setFieldValue)}
                                                            onBlur={handleBlur}
                                                            disabled={!editMode || saving || loadingStates.countries}
                                                            isInvalid={touched.country && errors.country}
                                                            isValid={touched.country && !errors.country && editMode}
                                                        >
                                                            <option value="">Select Country</option>
                                                            {countries.map((country) => (
                                                                <option key={country.isoCode} value={country.name}>
                                                                    {country.name}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                        {loadingStates.countries && (
                                                            <div className="position-absolute" style={{ right: '30px', top: '50%', transform: 'translateY(-50%)' }}>
                                                                <Spinner animation="border" size="sm" />
                                                            </div>
                                                        )}
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.country}
                                                        </Form.Control.Feedback>
                                                    </div>
                                                </Form.Group>
                                            </Col>

                                            <Col md="4" className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        State <span className="text-danger">*</span>
                                                    </Form.Label>
                                                    <div className="position-relative">
                                                        <Form.Select
                                                            name="state"
                                                            value={values.state}
                                                            onChange={(e) => handleStateChange(e.target.value, values.country, setFieldValue)}
                                                            onBlur={handleBlur}
                                                            disabled={!editMode || saving || !values.country || loadingStates.states}
                                                            isInvalid={touched.state && errors.state}
                                                            isValid={touched.state && !errors.state && editMode}
                                                        >
                                                            <option value="">Select State</option>
                                                            {states.map((state) => (
                                                                <option key={state.isoCode} value={state.name}>
                                                                    {state.name}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                        {loadingStates.states && (
                                                            <div className="position-absolute" style={{ right: '30px', top: '50%', transform: 'translateY(-50%)' }}>
                                                                <Spinner animation="border" size="sm" />
                                                            </div>
                                                        )}
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.state}
                                                        </Form.Control.Feedback>
                                                    </div>
                                                </Form.Group>
                                            </Col>

                                            <Col md="4" className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        City <span className="text-danger">*</span>
                                                    </Form.Label>
                                                    <div className="position-relative">
                                                        <Form.Select
                                                            name="city"
                                                            value={values.city}
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            disabled={!editMode || saving || !values.country || !values.state || loadingStates.cities}
                                                            isInvalid={touched.city && errors.city}
                                                            isValid={touched.city && !errors.city && editMode}
                                                        >
                                                            <option value="">Select City</option>
                                                            {cities.map((city) => (
                                                                <option key={city.name} value={city.name}>
                                                                    {city.name}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                        {loadingStates.cities && (
                                                            <div className="position-absolute" style={{ right: '30px', top: '50%', transform: 'translateY(-50%)' }}>
                                                                <Spinner animation="border" size="sm" />
                                                            </div>
                                                        )}
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.city}
                                                        </Form.Control.Feedback>
                                                    </div>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md="4" className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Pin Code <span className="text-danger">*</span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="pincode"
                                                        value={values.pincode}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        disabled={!editMode || saving}
                                                        isInvalid={touched.pincode && errors.pincode}
                                                        isValid={touched.pincode && !errors.pincode && editMode}
                                                        placeholder="Enter 6-digit pin code"
                                                        maxLength={6}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.pincode}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        {error && (
                                            <Alert variant="danger" className="mb-3">
                                                <CsLineIcons icon="error" className="me-2" />
                                                {error}
                                            </Alert>
                                        )}

                                        <div className="mt-4">
                                            {editMode ? (
                                                <>
                                                    <Button
                                                        variant="primary"
                                                        type="submit"
                                                        className="me-2"
                                                        disabled={saving || isSubmitting}
                                                        style={{ minWidth: '100px' }}
                                                    >
                                                        {saving || isSubmitting ? (
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
                                                                Save
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation(); handleCancel(resetForm);
                                                        }}
                                                        disabled={saving || isSubmitting}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    variant="outline-primary"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setEditMode(true);
                                                    }}
                                                >
                                                    <CsLineIcons icon="edit" className="me-2" />
                                                    Edit
                                                </Button>
                                            )}
                                        </div>
                                    </Form>
                                )}
                            </Formik>

                            {/* Saving overlay */}
                            {saving && (
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
                                            <h5 className="mb-0">Updating Address...</h5>
                                            <small className="text-muted">Please wait a moment</small>
                                        </Card.Body>
                                    </Card>
                                </div>
                            )}
                        </Card>
                    </section>
                </Col>
            </Row>
        </>
    );
};

export default Address;