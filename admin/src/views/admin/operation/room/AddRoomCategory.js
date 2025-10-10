import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Col, Row, Button, Form as BForm } from 'react-bootstrap';
import { Formik, Form, FieldArray, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';

const AddRoomCategory = () => {
    const title = 'Add Room Category';
    const description = 'Form to add room categories using Formik and Yup';

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'operations', text: 'Operations' },
        { to: 'operations/add-room-category', title: 'Add Room Category' },
    ];

    const history = useHistory();
    const [previewImgs, setPreviewImgs] = useState([]);
    const [thumbnailIndex, setThumbnailIndex] = useState(null);

    const initialValues = {
        category: "",
        room_imgs: [],
        amenities: [{ title: "", amenities: [""] }],
        subcategory: [
            {
                subcategory_name: "",
                base_price: "",
                max_price: "",
                current_price: "",
                description: "",
                is_refundable: false,
                is_available: true,
            },
        ],
    };

    const validationSchema = Yup.object().shape({
        category: Yup.string().required("Category name is required"),
        amenities: Yup.array().of(
            Yup.object().shape({
                title: Yup.string().required('Amenity group title is required'),
                amenities: Yup.array().of(Yup.string()),
            })
        ),
        subcategory: Yup.array().of(
            Yup.object().shape({
                subcategory_name: Yup.string().required('Subcategory name is required'),
                base_price: Yup.number().typeError('Must be a number').required('Base price is required'),
                max_price: Yup.number().typeError('Must be a number').required('Max price is required'),
                current_price: Yup.number().typeError('Must be a number').required('Current price is required'),
                description: Yup.string(),
            })
        ),
    });

    const handleImageChange = (e, setFieldValue) => {
        const files = Array.from(e.target.files);
        setFieldValue("room_imgs", files);
        setPreviewImgs(files.map((f) => URL.createObjectURL(f)));
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            const formData = new FormData();
            formData.append("category", values.category);
            formData.append("amenities", JSON.stringify(values.amenities));
            formData.append("subcategory", JSON.stringify(values.subcategory));
            formData.append("thumbnailIndex", thumbnailIndex ?? -1);

            values.room_imgs.forEach((file) => {
                formData.append("room_imgs", file);
            });

            const res = await axios.post(`${process.env.REACT_APP_API}/room/category/add`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            alert(res.data.message);
            resetForm();
            history.push("/operations/manage-rooms");
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Something went wrong!");
        } finally {
            setSubmitting(false);
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
                            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
                                {({ values, isSubmitting, setFieldValue }) => (
                                    <Form>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <BForm.Group>
                                                    <BForm.Label>Category Name</BForm.Label>
                                                    <Field name="category" className="form-control" placeholder="e.g. Deluxe, Suite, Standard" />
                                                    <ErrorMessage name="category" component="div" className="text-danger" />
                                                </BForm.Group>
                                            </Col>
                                            <Col md={6}>
                                                <BForm.Group>
                                                    <BForm.Label>Room Images</BForm.Label>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        className="form-control"
                                                        onChange={(e) => handleImageChange(e, setFieldValue)}
                                                    />
                                                </BForm.Group>
                                                {previewImgs.length > 0 && (
                                                    <div className="d-flex flex-wrap mt-2">
                                                        {previewImgs.map((src, index) => (
                                                            <div key={index} className="position-relative me-2 mb-2">
                                                                <img
                                                                    src={src}
                                                                    alt="preview"
                                                                    style={{
                                                                        width: 100,
                                                                        height: 100,
                                                                        objectFit: "cover",
                                                                        border: thumbnailIndex === index ? "3px solid green" : "1px solid #ccc",
                                                                        borderRadius: 6,
                                                                        cursor: "pointer",
                                                                    }}
                                                                    onClick={() => setThumbnailIndex(index)}
                                                                />
                                                                <div className="text-center small">
                                                                    {thumbnailIndex === index ? "Thumbnail" : "Set as Thumbnail"}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>

                                        <h5 className="mt-4 mb-3">Amenities</h5>
                                        <FieldArray name="amenities">
                                            {({ push: pushAmenityGroup, remove: removeAmenityGroup }) => (
                                                <>
                                                    {values.amenities.map((amenityGroup, groupIndex) => (
                                                        <Card key={groupIndex} className="mb-3 p-3">
                                                            <Row>
                                                                <Col md={10}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Amenity Group Title</BForm.Label>
                                                                        <Field
                                                                            name={`amenities[${groupIndex}].title`}
                                                                            className="form-control"
                                                                            placeholder="e.g. Room Features, Bathroom Amenities"
                                                                        />
                                                                        <ErrorMessage name={`amenities[${groupIndex}].title`} component="div" className="text-danger" />
                                                                    </BForm.Group>
                                                                </Col>
                                                                <Col md={2} className="d-flex align-items-end">
                                                                    <Button variant="outline-danger" onClick={() => removeAmenityGroup(groupIndex)}>
                                                                        Remove Group
                                                                    </Button>
                                                                </Col>
                                                            </Row>

                                                            <FieldArray name={`amenities[${groupIndex}].amenities`}>
                                                                {({ push: pushAmenity, remove: removeAmenity }) => (
                                                                    <>
                                                                        {amenityGroup.amenities.map((amenity, amenityIndex) => (
                                                                            <Row key={amenityIndex} className="mt-2">
                                                                                <Col md={10}>
                                                                                    <Field
                                                                                        name={`amenities[${groupIndex}].amenities[${amenityIndex}]`}
                                                                                        className="form-control"
                                                                                        placeholder="e.g. Air Conditioning, WiFi, TV"
                                                                                    />
                                                                                </Col>
                                                                                <Col md={2}>
                                                                                    <Button
                                                                                        variant="outline-danger"
                                                                                        size="sm"
                                                                                        onClick={() => removeAmenity(amenityIndex)}
                                                                                    >
                                                                                        Remove
                                                                                    </Button>
                                                                                </Col>
                                                                            </Row>
                                                                        ))}
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline-primary"
                                                                            size="sm"
                                                                            className="mt-2"
                                                                            onClick={() => pushAmenity('')}
                                                                        >
                                                                            + Add Amenity Item
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </FieldArray>
                                                        </Card>
                                                    ))}

                                                    <Button
                                                        type="button"
                                                        variant="primary"
                                                        onClick={() => pushAmenityGroup({ title: '', amenities: [''] })}
                                                    >
                                                        + Add Amenity Group
                                                    </Button>
                                                </>
                                            )}
                                        </FieldArray>

                                        <h5 className="mt-4 mb-3">Subcategories</h5>
                                        <FieldArray name="subcategory">
                                            {({ push, remove }) => (
                                                <>
                                                    {values.subcategory.map((subcat, index) => (
                                                        <Card key={index} className="mb-4 p-3">
                                                            <Row>
                                                                <Col md={8}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Subcategory Name</BForm.Label>
                                                                        <Field
                                                                            name={`subcategory[${index}].subcategory_name`}
                                                                            className="form-control"
                                                                            placeholder="e.g. King Bed, Twin Bed"
                                                                        />
                                                                        <ErrorMessage
                                                                            name={`subcategory[${index}].subcategory_name`}
                                                                            component="div"
                                                                            className="text-danger"
                                                                        />
                                                                    </BForm.Group>
                                                                </Col>
                                                                <Col md={4} className="d-flex align-items-end">
                                                                    <Button variant="outline-danger" onClick={() => remove(index)}>
                                                                        Remove Subcategory
                                                                    </Button>
                                                                </Col>
                                                            </Row>

                                                            <Row className="mt-2">
                                                                <Col md={4}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Base Price</BForm.Label>
                                                                        <Field name={`subcategory[${index}].base_price`} className="form-control" type="number" />
                                                                        <ErrorMessage
                                                                            name={`subcategory[${index}].base_price`}
                                                                            component="div"
                                                                            className="text-danger"
                                                                        />
                                                                    </BForm.Group>
                                                                </Col>
                                                                <Col md={4}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Max Price</BForm.Label>
                                                                        <Field name={`subcategory[${index}].max_price`} className="form-control" type="number" />
                                                                        <ErrorMessage
                                                                            name={`subcategory[${index}].max_price`}
                                                                            component="div"
                                                                            className="text-danger"
                                                                        />
                                                                    </BForm.Group>
                                                                </Col>
                                                                <Col md={4}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Current Price</BForm.Label>
                                                                        <Field name={`subcategory[${index}].current_price`} className="form-control" type="number" />
                                                                        <ErrorMessage
                                                                            name={`subcategory[${index}].current_price`}
                                                                            component="div"
                                                                            className="text-danger"
                                                                        />
                                                                    </BForm.Group>
                                                                </Col>
                                                            </Row>

                                                            <Row className="mt-2">
                                                                <Col md={12}>
                                                                    <BForm.Group>
                                                                        <BForm.Label>Description</BForm.Label>
                                                                        <Field
                                                                            as="textarea"
                                                                            rows={3}
                                                                            name={`subcategory[${index}].description`}
                                                                            className="form-control"
                                                                        />
                                                                    </BForm.Group>
                                                                </Col>
                                                            </Row>

                                                            <Row className="mt-2">
                                                                <Col md={6}>
                                                                    <BForm.Check
                                                                        type="checkbox"
                                                                        label="Refundable"
                                                                        checked={subcat.is_refundable}
                                                                        onChange={(e) =>
                                                                            setFieldValue(`subcategory[${index}].is_refundable`, e.target.checked)
                                                                        }
                                                                    />
                                                                </Col>
                                                                <Col md={6}>
                                                                    <BForm.Check
                                                                        type="checkbox"
                                                                        label="Available"
                                                                        checked={subcat.is_available}
                                                                        onChange={(e) =>
                                                                            setFieldValue(`subcategory[${index}].is_available`, e.target.checked)
                                                                        }
                                                                    />
                                                                </Col>
                                                            </Row>
                                                        </Card>
                                                    ))}

                                                    <Button
                                                        type="button"
                                                        variant="primary"
                                                        onClick={() =>
                                                            push({
                                                                subcategory_name: '',
                                                                base_price: '',
                                                                max_price: '',
                                                                current_price: '',
                                                                description: '',
                                                                is_refundable: false,
                                                                is_available: true,
                                                            })
                                                        }
                                                    >
                                                        + Add Subcategory
                                                    </Button>
                                                </>
                                            )}
                                        </FieldArray>

                                        <div className="mt-4">
                                            <Button type="submit" variant="success" disabled={isSubmitting}>
                                                {isSubmitting ? 'Saving...' : 'Save Room Category'}
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </Card>
                    </section>
                </Col>
            </Row>
        </>
    );
};

export default AddRoomCategory;