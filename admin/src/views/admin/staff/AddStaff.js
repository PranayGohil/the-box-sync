import React, { useState, useEffect } from "react";
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { useFormik } from "formik";
import axios from "axios";
import { Country, State, City } from "country-state-city";

const AddStaff = ({ setSection }) => {
    const title = 'Add Staff';
    const description = 'Add a new staff member.';
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'staff', text: 'Staff Management' },
        { to: 'staff/add-staff', title: 'Add Staff' },
    ];

    const history = useHistory();

    const [fileUploadError, setFileUploadError] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [frontImagePreview, setFrontImagePreview] = useState(null);
    const [backImagePreview, setBackImagePreview] = useState(null);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [positions, setPositions] = useState([]);

    const formik = useFormik({
        initialValues: {
            staff_id: "",
            f_name: "",
            l_name: "",
            birth_date: "",
            joining_date: "",
            address: "",
            country: "",
            state: "",
            city: "",
            phone_no: "",
            email: "",
            salary: "",
            position: "",
            photo: "",
            document_type: "",
            id_number: "",
            front_image: "",
            back_image: "",
        },
        onSubmit: async (values, { setSubmitting }) => {
            try {
                // Step 1: Upload files
                const formData = new FormData();
                if (values.photo) formData.append("photo", values.photo);
                if (values.front_image)
                    formData.append("front_image", values.front_image);
                if (values.back_image) formData.append("back_image", values.back_image);

                const uploadResponse = await axios.post(
                    `${process.env.REACT_APP_API}/upload/uploadstaff`,
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }
                );

                // Add uploaded file paths to the values
                const { photo, front_image, back_image } = uploadResponse.data;
                values.photo = photo;
                values.front_image = front_image;
                values.back_image = back_image;

                // Step 2: Submit staff data
                const addResponse = await axios.post(
                    `${process.env.REACT_APP_API}/staff/addstaff`,
                    values,
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );

                console.log("Staff added successfully:", addResponse.data);
                alert('Staff added successfully!');
                setSection("ViewStaff");
            } catch (err) {
                console.error("Error during file upload or staff submission:", err);
                setFileUploadError(
                    "File upload or staff submission failed. Please try again."
                );
                alert('Add staff failed.');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = formik;

    useEffect(() => {
        setCountries(Country.getAllCountries());
        const fetchPositions = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_API}/staff/getstaffpositions`,
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );
                setPositions(response.data);
            } catch (error) {
                console.error("Error fetching positions:", error);
            }
        };
        fetchPositions();
    }, []);

    const handleCountryChange = (event) => {
        const countryIsoCode = event.target.value;
        setFieldValue("country", countryIsoCode);
        setStates(State.getStatesOfCountry(countryIsoCode));
        setCities([]);
        setFieldValue("state", "");
        setFieldValue("city", "");
    };

    const handleStateChange = (event) => {
        const stateIsoCode = event.target.value;
        setFieldValue("state", stateIsoCode);
        setCities(City.getCitiesOfState(values.country, stateIsoCode));
        setFieldValue("city", "");
    };

    const handleFileChange = (fieldName, file, setPreview) => {
        setFieldValue(fieldName, file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <>
            <HtmlHead title={title} description={description} />
            <Row>
                <Col>
                    <div className="page-title-container">
                        <Row className="align-items-center">
                            <Col>
                                <h1 className="mb-0 pb-0 display-4">Add Staff</h1>
                                <BreadcrumbList items={breadcrumbs} />
                            </Col>
                            <Col xs="auto">
                                <Button
                                    variant="outline-primary"
                                    onClick={() => setSection("ViewStaff")}
                                >
                                    View Staff
                                </Button>
                            </Col>
                        </Row>
                    </div>

                    {fileUploadError && (
                        <div className="alert alert-danger" role="alert">
                            {fileUploadError}
                        </div>
                    )}

                    <Form onSubmit={handleSubmit}>
                        {/* Personal Details Card */}
                        <Card body className="mb-4">
                            <h5 className="mb-3">Personal Details</h5>

                            <Row>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Staff ID</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="staff_id"
                                            value={values.staff_id}
                                            onChange={handleChange}
                                            isInvalid={touched.staff_id && errors.staff_id}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.staff_id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>First Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="f_name"
                                            value={values.f_name}
                                            onChange={handleChange}
                                            isInvalid={touched.f_name && errors.f_name}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.f_name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Last Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="l_name"
                                            value={values.l_name}
                                            onChange={handleChange}
                                            isInvalid={touched.l_name && errors.l_name}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.l_name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="mt-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Birthday</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="birth_date"
                                            value={values.birth_date}
                                            onChange={handleChange}
                                            isInvalid={touched.birth_date && errors.birth_date}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.birth_date}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Joining Date</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="joining_date"
                                            value={values.joining_date}
                                            onChange={handleChange}
                                            isInvalid={touched.joining_date && errors.joining_date}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.joining_date}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="mt-3">
                                <Col>
                                    <Form.Group>
                                        <Form.Label>Address</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="address"
                                            value={values.address}
                                            onChange={handleChange}
                                            isInvalid={touched.address && errors.address}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.address}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="mt-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Country</Form.Label>
                                        <Form.Select
                                            name="country"
                                            value={values.country}
                                            onChange={handleCountryChange}
                                            isInvalid={touched.country && errors.country}
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map((country) => (
                                                <option key={country.isoCode} value={country.isoCode}>
                                                    {country.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.country}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>State</Form.Label>
                                        <Form.Select
                                            name="state"
                                            value={values.state}
                                            onChange={handleStateChange}
                                            disabled={!values.country}
                                            isInvalid={touched.state && errors.state}
                                        >
                                            <option value="">Select State</option>
                                            {states.map((state) => (
                                                <option key={state.isoCode} value={state.isoCode}>
                                                    {state.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.state}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>City</Form.Label>
                                        <Form.Select
                                            name="city"
                                            value={values.city}
                                            onChange={handleChange}
                                            disabled={!values.state}
                                            isInvalid={touched.city && errors.city}
                                        >
                                            <option value="">Select City</option>
                                            {cities.map((city) => (
                                                <option key={city.name} value={city.name}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.city}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="mt-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Contact No.</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="phone_no"
                                            value={values.phone_no}
                                            onChange={handleChange}
                                            isInvalid={touched.phone_no && errors.phone_no}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.phone_no}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={values.email}
                                            onChange={handleChange}
                                            isInvalid={touched.email && errors.email}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.email}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="mt-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Position</Form.Label>
                                        <Form.Control
                                            list="positions"
                                            name="position"
                                            value={values.position}
                                            onChange={handleChange}
                                            isInvalid={touched.position && errors.position}
                                        />
                                        <datalist id="positions">
                                            {positions.map((pos, index) => (
                                                <option key={index} value={pos} />
                                            ))}
                                        </datalist>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.position}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Salary</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            name="salary"
                                            value={values.salary}
                                            onChange={handleChange}
                                            isInvalid={touched.salary && errors.salary}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.salary}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card>

                        {/* ID Proof Card */}
                        <Card body className="mb-4">
                            <h5 className="mb-3">ID Proof & Documents</h5>

                            <Row>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Photo</Form.Label>
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                handleFileChange("photo", file, setPhotoPreview);
                                            }}
                                            isInvalid={touched.photo && errors.photo}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.photo}
                                        </Form.Control.Feedback>
                                        {photoPreview && (
                                            <div className="mt-2">
                                                <img
                                                    src={photoPreview}
                                                    alt="Photo Preview"
                                                    className="img-thumbnail"
                                                    style={{ maxWidth: "150px", maxHeight: "150px" }}
                                                />
                                            </div>
                                        )}
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>ID Card Type</Form.Label>
                                        <Form.Select
                                            name="document_type"
                                            value={values.document_type}
                                            onChange={handleChange}
                                            isInvalid={touched.document_type && errors.document_type}
                                        >
                                            <option value="">Select ID Type</option>
                                            <option value="National Identity Card">National Identity Card</option>
                                            <option value="Pan Card">Pan Card</option>
                                            <option value="Voter Card">Voter Card</option>
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.document_type}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="mt-3">
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label>ID Card Number</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="id_number"
                                            value={values.id_number}
                                            onChange={handleChange}
                                            isInvalid={touched.id_number && errors.id_number}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.id_number}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="mt-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>ID Card Front Image</Form.Label>
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                handleFileChange("front_image", file, setFrontImagePreview);
                                            }}
                                            isInvalid={touched.front_image && errors.front_image}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.front_image}
                                        </Form.Control.Feedback>
                                        {frontImagePreview && (
                                            <div className="mt-2">
                                                <img
                                                    src={frontImagePreview}
                                                    alt="Front Image Preview"
                                                    className="img-thumbnail"
                                                    style={{ maxWidth: "150px", maxHeight: "150px" }}
                                                />
                                            </div>
                                        )}
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>ID Card Back Image</Form.Label>
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                handleFileChange("back_image", file, setBackImagePreview);
                                            }}
                                            isInvalid={touched.back_image && errors.back_image}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.back_image}
                                        </Form.Control.Feedback>
                                        {backImagePreview && (
                                            <div className="mt-2">
                                                <img
                                                    src={backImagePreview}
                                                    alt="Back Image Preview"
                                                    className="img-thumbnail"
                                                    style={{ maxWidth: "150px", maxHeight: "150px" }}
                                                />
                                            </div>
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card>

                        <div className="d-flex justify-content-between">
                            <Button
                                variant="outline-secondary"
                                onClick={() => setSection("ViewStaff")}
                            >
                                Cancel
                            </Button>
                            <Button variant="success" type="submit">
                                Add Staff
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </>
    );
};

export default AddStaff;