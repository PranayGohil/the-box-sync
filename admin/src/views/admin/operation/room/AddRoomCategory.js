import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Col, Row, Button, Form as BForm, Badge } from 'react-bootstrap';
import { Formik, Form, FieldArray, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const AddRoomCategory = () => {
  const title = 'Add Room Category';
  const description = 'Form to add room categories using Formik and Yup';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/add-room-category', title: 'Add Room Category' },
  ];

  const history = useHistory();
  const [categoryImages, setCategoryImages] = useState([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);

  const initialValues = {
    category: '',
    amenities: [
      {
        title: '',
        amenities: [''],
      },
    ],
    subcategory: [
      {
        subcategory_name: '',
        base_price: '',
        max_price: '',
        current_price: '',
        description: '',
        is_refundable: false,
        is_available: true,
      },
    ],
  };

  const validationSchema = Yup.object().shape({
    category: Yup.string().required('Category name is required'),
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      is_thumbnail: categoryImages.length === 0 && index === 0,
    }));
    setCategoryImages([...categoryImages, ...newImages]);
  };

  const removeImage = (index) => {
    const updatedImages = categoryImages.filter((_, i) => i !== index);
    if (thumbnailIndex === index) {
      setThumbnailIndex(0);
      if (updatedImages.length > 0) {
        updatedImages[0].is_thumbnail = true;
      }
    } else if (thumbnailIndex > index) {
      setThumbnailIndex(thumbnailIndex - 1);
    }
    setCategoryImages(updatedImages);
  };

  const setAsThumbnail = (index) => {
    const updatedImages = categoryImages.map((img, i) => ({
      ...img,
      is_thumbnail: i === index,
    }));
    setCategoryImages(updatedImages);
    setThumbnailIndex(index);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const formData = new FormData();
      formData.append('category', values.category);
      formData.append('amenities', JSON.stringify(values.amenities));
      formData.append('subcategory', JSON.stringify(values.subcategory));

      // Append images
      categoryImages.forEach((img, index) => {
        formData.append('room_imgs', img.file);
      });
      formData.append('thumbnail_index', thumbnailIndex);

      const res = await axios.post(`${process.env.REACT_APP_API}/room/category/add`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      alert(res.data.message || 'Room category saved successfully');
      resetForm();
      setCategoryImages([]);
      setThumbnailIndex(0);
      history.push('/operations/manage-rooms');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Something went wrong!');
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
                      <Col md={12}>
                        <BForm.Group>
                          <BForm.Label>Category Name</BForm.Label>
                          <Field name="category" className="form-control" placeholder="e.g. Deluxe, Suite, Standard" />
                          <ErrorMessage name="category" component="div" className="text-danger" />
                        </BForm.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={12}>
                        <BForm.Group>
                          <BForm.Label>Category Images</BForm.Label>
                          <BForm.Control type="file" multiple accept="image/*" onChange={handleImageUpload} />
                          <BForm.Text className="text-muted">
                            You can select multiple images. Click on an image to set it as thumbnail.
                          </BForm.Text>
                        </BForm.Group>
                      </Col>
                    </Row>

                    {categoryImages.length > 0 && (
                      <Row className="mb-4">
                        <Col md={12}>
                          <div className="d-flex flex-wrap gap-3">
                            {categoryImages.map((img, index) => (
                              <div
                                key={index}
                                className="position-relative"
                                style={{
                                  width: '150px',
                                  height: '150px',
                                  border: img.is_thumbnail ? '3px solid #0d6efd' : '1px solid #dee2e6',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                }}
                                onClick={() => setAsThumbnail(index)}
                              >
                                <img
                                  src={img.preview}
                                  alt={`Preview ${index}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                {img.is_thumbnail && (
                                  <Badge
                                    bg="primary"
                                    className="position-absolute top-0 start-0 m-2"
                                    style={{ fontSize: '10px' }}
                                  >
                                    Thumbnail
                                  </Badge>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '12px' }}
                                >
                                  <CsLineIcons icon="close" size="12" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </Col>
                      </Row>
                    )}

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