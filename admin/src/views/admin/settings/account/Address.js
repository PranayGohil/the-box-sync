import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { Country, State, City } from 'country-state-city';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

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

    const [intialProfile, setIntialProfile] = useState({ ...profile });

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                const data = res.data.user || res.data;

                setProfile({
                    address: data.address || '',
                    country: data.country || '',
                    state: data.state || '',
                    city: data.city || '',
                    pincode: data.pincode || '',
                });

                setIntialProfile({
                    address: data.address || '',
                    country: data.country || '',
                    state: data.state || '',
                    city: data.city || '',
                    pincode: data.pincode || '',
                });
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

    // Load states when country changes
    useEffect(() => {
        let timer;
        if (intialProfile.country) {
            setLoadingStates(prev => ({ ...prev, states: true }));
            timer = setTimeout(() => {
                const selectedCountry = Country.getAllCountries()
                    .find(c => c.name === intialProfile.country);
                if (selectedCountry) {
                    setStates(State.getStatesOfCountry(selectedCountry.isoCode));
                } else {
                    setStates([]);
                }
                setLoadingStates(prev => ({ ...prev, states: false }));
            }, 300);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [intialProfile.country]);

    // Load cities when state changes
    useEffect(() => {
        let timer;
        if (intialProfile.country && intialProfile.state) {
            setLoadingStates(prev => ({ ...prev, cities: true }));
            timer = setTimeout(() => {
                const selectedCountry = Country.getAllCountries()
                    .find(c => c.name === intialProfile.country);
                if (selectedCountry) {
                    const selectedState = State.getStatesOfCountry(selectedCountry.isoCode)
                        .find(s => s.name === intialProfile.state);
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
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [intialProfile.country, intialProfile.state]);


    const handleChange = (e) => {
        const { name, value } = e.target;

        setIntialProfile((prev) => {
            const updated = { ...prev, [name]: value };

            if (name === 'country') {
                updated.state = '';
                updated.city = '';
                setCities([]);
            }

            if (name === 'state') {
                updated.city = '';
            }

            return updated;
        });
    };

    const handleSave = async () => {
        if (!intialProfile.address || !intialProfile.country || !intialProfile.state || !intialProfile.city || !intialProfile.pincode) {
            setError('Please fill all the fields.');
            return;
        }
        setSaving(true);
        try {
            setError('');
            await axios.put(
                `${process.env.REACT_APP_API}/user/update`,
                {
                    address: intialProfile.address,
                    country: intialProfile.country,
                    state: intialProfile.state,
                    city: intialProfile.city,
                    pincode: intialProfile.pincode,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            setProfile({ ...intialProfile });
            setEditMode(false);
            toast.success('Address updated successfully!');
        } catch (err) {
            console.error('Failed to update address', err);
            setError(err.response?.data?.message || 'Update failed. Please try again.');
            toast.error('Update failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIntialProfile({ ...profile });
        setEditMode(false);
        setError('');
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
                            <Form>
                                <Row className="mb-4">
                                    <Col md="12">
                                        <Form.Label>Address</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="address"
                                            value={intialProfile.address}
                                            onChange={handleChange}
                                            disabled={!editMode || saving}
                                        />
                                    </Col>
                                </Row>

                                <Row className="mb-4">
                                    <Col md="4">
                                        <Form.Label>Country</Form.Label>
                                        <div className="position-relative">
                                            <Form.Select
                                                name="country"
                                                value={intialProfile.country}
                                                onChange={handleChange}
                                                disabled={!editMode || saving || loadingStates.countries}
                                            >
                                                <option value="">Select Country</option>
                                                {countries.map((country) => (
                                                    <option key={country.isoCode} value={country.name}>
                                                        {country.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            {loadingStates.countries && (
                                                <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                    <Spinner animation="border" size="sm" />
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col md="4">
                                        <Form.Label>State</Form.Label>
                                        <div className="position-relative">
                                            <Form.Select
                                                name="state"
                                                value={intialProfile.state}
                                                onChange={handleChange}
                                                disabled={!editMode || saving || !intialProfile.country || loadingStates.states}
                                            >
                                                <option value="">Select State</option>
                                                {states.map((state) => (
                                                    <option key={state.isoCode} value={state.name}>
                                                        {state.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            {loadingStates.states && (
                                                <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                    <Spinner animation="border" size="sm" />
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col md="4">
                                        <Form.Label>City</Form.Label>
                                        <div className="position-relative">
                                            <Form.Select
                                                name="city"
                                                value={intialProfile.city}
                                                onChange={handleChange}
                                                disabled={!editMode || saving || !intialProfile.country || !intialProfile.state || loadingStates.cities}
                                            >
                                                <option value="">Select City</option>
                                                {cities.map((city) => (
                                                    <option key={city.name} value={city.name}>
                                                        {city.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            {loadingStates.cities && (
                                                <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                    <Spinner animation="border" size="sm" />
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                </Row>

                                <Row className="mb-4">
                                    <Col md="4">
                                        <Form.Label>Pin Code</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="pincode"
                                            value={intialProfile.pincode}
                                            onChange={handleChange}
                                            disabled={!editMode || saving}
                                        />
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
                                                onClick={handleSave}
                                                className="me-2"
                                                disabled={saving}
                                                style={{ minWidth: '100px' }}
                                            >
                                                {saving ? (
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
                                                onClick={handleCancel}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="outline-primary"
                                            onClick={() => setEditMode(true)}
                                        >
                                            <CsLineIcons icon="edit" className="me-2" />
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </Form>

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