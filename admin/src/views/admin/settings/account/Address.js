import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import { Country, State, City } from 'country-state-city';

const Address = () => {
    const title = 'Address';
    const description = 'Update your address details.';

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'settings', text: 'Settings' },
        { to: 'settings/address', title: 'Address' },
    ];

    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [error, setError] = useState('');

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
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);


    // Load cities when state changes
    useEffect(() => {
        const selectedCountry = Country.getAllCountries().find((c) => c.name === intialProfile.country);
        if (selectedCountry) {
            const fetchedStates = State.getStatesOfCountry(selectedCountry.isoCode);
            setStates(fetchedStates);

            const selectedState = fetchedStates.find((s) => s.name === intialProfile.state);
            if (selectedState) {
                const fetchedCities = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
                setCities(fetchedCities);
            } else {
                setCities([]);
            }
        } else {
            setStates([]);
            setCities([]);
        }
    }, [intialProfile.country, intialProfile.state]);



    const handleChange = (e) => {
        const { name, value } = e.target;

        setIntialProfile((prev) => {
            const updated = { ...prev, [name]: value };

            if (name === 'country') {
                updated.state = '';
                updated.city = '';

                const selectedCountry = Country.getAllCountries().find(c => c.name === value);
                if (selectedCountry) {
                    setStates(State.getStatesOfCountry(selectedCountry.isoCode));
                    setCities([]);
                }
            }

            if (name === 'state') {
                updated.city = '';

                const selectedCountry = Country.getAllCountries().find(c => c.name === prev.country);
                const selectedState = State.getStatesOfCountry(selectedCountry?.isoCode || '').find(s => s.name === value);

                if (selectedCountry && selectedState) {
                    setCities(City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode));
                }
            }

            return updated;
        });
    };


    const handleSave = async () => {
        if (!intialProfile.address || !intialProfile.country || !intialProfile.state || !intialProfile.city || !intialProfile.pincode) { 
            setError('Please fill all the fields.'); 
            return;
        }
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
            window.location.reload();
        } catch (err) {
            console.error('Failed to update address', err);
            setError('Update failed. Please try again.');
        }
    };

    const handleCancel = () => {
        setIntialProfile({ ...profile });
        setEditMode(false);
        setError('');
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
            </div>
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
                                            disabled={!editMode}
                                        />
                                    </Col>
                                </Row>

                                <Row className="mb-4">
                                    <Col md="4">
                                        <Form.Label>Country</Form.Label>
                                        <Form.Select
                                            name="country"
                                            value={intialProfile.country}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map((country) => (
                                                <option key={country.isoCode} value={country.name}>
                                                    {country.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>

                                    <Col md="4">
                                        <Form.Label>State</Form.Label>
                                        <Form.Select
                                            name="state"
                                            value={intialProfile.state}
                                            onChange={handleChange}
                                            disabled={!editMode || !intialProfile.country}
                                        >
                                            <option value="">Select State</option>
                                            {states.map((state) => (
                                                <option key={state.isoCode} value={state.name}>
                                                    {state.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>

                                    <Col md="4">
                                        <Form.Label>City</Form.Label>
                                        <Form.Select
                                            name="city"
                                            value={intialProfile.city}
                                            onChange={handleChange}
                                            disabled={!editMode || !intialProfile.country || !intialProfile.state}
                                        >
                                            <option value="">Select City</option>
                                            {cities.map((city) => (
                                                <option key={city.name} value={city.name}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </Form.Select>
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
                                            disabled={!editMode}
                                        />
                                    </Col>
                                </Row>

                                {error && <p className="text-danger">{error}</p>}

                                <div className="mt-4">
                                    {editMode ? (
                                        <>
                                            <Button variant="primary" onClick={handleSave} className="me-2">
                                                Save
                                            </Button>
                                            <Button variant="secondary" onClick={handleCancel}>
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <Button variant="outline-primary" onClick={() => setEditMode(true)}>
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </Form>
                        </Card>
                    </section>
                </Col>
            </Row>
        </>
    );
};

export default Address;
