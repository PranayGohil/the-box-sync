import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import axios from 'axios';

const EditRoomCategoryModal = ({ show, handleClose, data, fetchRoomData }) => {
  const [previewImgs, setPreviewImgs] = useState([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(null);

  useEffect(() => {
    if (data?.room_imgs?.length > 0) {
      const previews = data.room_imgs.map(
        (img) => `${process.env.REACT_APP_UPLOAD_DIR}${img.image}`
      );
      setPreviewImgs(previews);
      const thumbIndex = data.room_imgs.findIndex((i) => i.is_thumbnail);
      setThumbnailIndex(thumbIndex);
    }
  }, [data]);

  const formik = useFormik({
    initialValues: {
      category: data?.category || "",
      room_imgs: [],
      amenities: data?.amenities || [],
      subcategory: data?.subcategory || [],
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("_id", data._id);
      formData.append("category", values.category);
      formData.append("amenities", JSON.stringify(values.amenities));
      formData.append("subcategory", JSON.stringify(values.subcategory));
      formData.append("thumbnailIndex", thumbnailIndex);

      values.room_imgs.forEach((file) => formData.append("room_imgs", file));

      await axios.put(`${process.env.REACT_APP_API}/room/category/update`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      fetchRoomData();
      handleClose();
    },
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    formik.setFieldValue("room_imgs", files);
    setPreviewImgs([...previewImgs, ...files.map((f) => URL.createObjectURL(f))]);
  };

  return (
    <Modal className="modal-right large" show={show} onHide={handleClose} backdrop="static" size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Edit Room Category</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <FormikProvider value={formik}>
          <Form id="edit_category_form" onSubmit={formik.handleSubmit}>
            <Form.Group className="mt-3">
              <Form.Label>Category Images</Form.Label>
              <Form.Control type="file" multiple onChange={handleImageChange} />
            </Form.Group>
            <div className="d-flex flex-wrap mt-3">
              {previewImgs.map((src, index) => (
                <div key={index} className="position-relative me-2 mb-2 text-center">
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
                  <div className="small">
                    {thumbnailIndex === index ? "Thumbnail" : "Set as Thumbnail"}
                  </div>
                </div>
              ))}
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Category Image</Form.Label>
              <Form.Control
                type="file"
                name="category_img"
                onChange={(e) => {
                  const file = e.currentTarget.files[0];
                  formik.setFieldValue('category_img', file);
                  if (file) setPreviewImgs(URL.createObjectURL(file));
                }}
              />
              {setPreviewImgs && (
                <img
                  src={previewImgs}
                  alt="Preview"
                  className="img-thumbnail mt-2"
                  style={{ maxWidth: '150px' }}
                />
              )}
            </Form.Group>

            <h5 className="mt-4">Amenities</h5>
            <FieldArray name="amenities">
              {({ push, remove }) => (
                <>
                  {formik.values.amenities.map((amenityGroup, index) => (
                    <div key={index} className="border p-3 mb-3 rounded">
                      <Row>
                        <Col md={10}>
                          <Form.Group className="mb-2">
                            <Form.Label>Amenity Group Title</Form.Label>
                            <Form.Control
                              type="text"
                              value={amenityGroup.title}
                              onChange={(e) => formik.setFieldValue(`amenities[${index}].title`, e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            Remove
                          </Button>
                        </Col>
                      </Row>
                      <FieldArray name={`amenities[${index}].amenities`}>
                        {({ push: pushAmenity, remove: removeAmenity }) => (
                          <>
                            {amenityGroup.amenities.map((amenity, amenityIndex) => (
                              <Row key={amenityIndex} className="mt-2">
                                <Col md={10}>
                                  <Form.Control
                                    type="text"
                                    placeholder="Amenity item"
                                    value={amenity}
                                    onChange={(e) =>
                                      formik.setFieldValue(
                                        `amenities[${index}].amenities[${amenityIndex}]`,
                                        e.target.value
                                      )
                                    }
                                  />
                                </Col>
                                <Col md={2}>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => removeAmenity(amenityIndex)}
                                  >
                                    -
                                  </Button>
                                </Col>
                              </Row>
                            ))}
                            <Button
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
                    </div>
                  ))}
                  <Button
                    variant="primary"
                    onClick={() => push({ title: '', amenities: [''] })}
                  >
                    + Add Amenity Group
                  </Button>
                </>
              )}
            </FieldArray>

            <h5 className="mt-4">Subcategories</h5>
            <FieldArray name="subcategory">
              {({ push, remove }) => (
                <>
                  {formik.values.subcategory.map((subcat, index) => (
                    <div key={index} className="border p-3 mb-3 rounded">
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-2">
                            <Form.Label>Subcategory Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={subcat.subcategory_name}
                              onChange={(e) =>
                                formik.setFieldValue(`subcategory[${index}].subcategory_name`, e.target.value)
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6} className="d-flex align-items-end">
                          <Button
                            variant="outline-danger"
                            onClick={() => remove(index)}
                          >
                            Remove Subcategory
                          </Button>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label>Base Price</Form.Label>
                            <Form.Control
                              type="number"
                              value={subcat.base_price}
                              onChange={(e) =>
                                formik.setFieldValue(`subcategory[${index}].base_price`, e.target.value)
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label>Max Price</Form.Label>
                            <Form.Control
                              type="number"
                              value={subcat.max_price}
                              onChange={(e) =>
                                formik.setFieldValue(`subcategory[${index}].max_price`, e.target.value)
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label>Current Price</Form.Label>
                            <Form.Control
                              type="number"
                              value={subcat.current_price}
                              onChange={(e) =>
                                formik.setFieldValue(`subcategory[${index}].current_price`, e.target.value)
                              }
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-2">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={subcat.description}
                          onChange={(e) =>
                            formik.setFieldValue(`subcategory[${index}].description`, e.target.value)
                          }
                        />
                      </Form.Group>
                      <Form.Check
                        type="checkbox"
                        label="Refundable"
                        checked={subcat.is_refundable}
                        onChange={(e) =>
                          formik.setFieldValue(`subcategory[${index}].is_refundable`, e.target.checked)
                        }
                        className="mb-2"
                      />
                      <Form.Check
                        type="checkbox"
                        label="Available"
                        checked={subcat.is_available}
                        onChange={(e) =>
                          formik.setFieldValue(`subcategory[${index}].is_available`, e.target.checked)
                        }
                      />
                    </div>
                  ))}
                  <Button
                    variant="primary"
                    onClick={() => push({
                      subcategory_name: '',
                      base_price: '',
                      max_price: '',
                      current_price: '',
                      description: '',
                      is_refundable: false,
                      is_available: true,
                    })}
                  >
                    + Add Subcategory
                  </Button>
                </>
              )}
            </FieldArray>
          </Form>
        </FormikProvider>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="dark" type="submit" form="edit_category_form">
          Update Category
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditRoomCategoryModal;