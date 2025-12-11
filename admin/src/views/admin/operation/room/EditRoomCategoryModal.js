import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const EditRoomCategoryModal = ({ show, handleClose, data, fetchRoomData }) => {
  const [roomImages, setRoomImages] = useState([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    if (data?.room_imgs) {
      const existingImages = data.room_imgs.map((img) => ({
        image: img.image,
        is_thumbnail: img.is_thumbnail,
        preview: `${process.env.REACT_APP_UPLOAD_DIR}${img.image}`,
        isExisting: true,
      }));
      setRoomImages(existingImages);
      const thumbIndex = existingImages.findIndex((img) => img.is_thumbnail);
      setThumbnailIndex(thumbIndex >= 0 ? thumbIndex : 0);
    }
    console.log('Edit Category Data:', data);
  }, [data]);

  const formik = useFormik({
    initialValues: {
      category: data?.category || '',
      amenities: data?.amenities || [{ title: '', amenities: [''] }],
      subcategory: data?.subcategory || [{
        subcategory_name: '',
        base_price: '',
        max_price: '',
        current_price: '',
        description: '',
        is_refundable: false,
        is_available: true,
      }],
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const formData = new FormData();
        formData.append('category', values.category);
        formData.append('amenities', JSON.stringify(values.amenities));
        formData.append('subcategory', JSON.stringify(values.subcategory));

        // Send existing images data
        const existingImages = roomImages
          .filter((img) => img.isExisting)
          .map((img) => ({
            image: img.image,
            is_thumbnail: img.is_thumbnail,
          }));
        formData.append('existing_images', JSON.stringify(existingImages));

        // Append new images
        newImages.forEach((img) => {
          formData.append('room_imgs', img.file);
        });

        formData.append('thumbnail_index', thumbnailIndex);

        await axios.put(`${process.env.REACT_APP_API}/room/category/update/${data.id}`, formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        fetchRoomData();
        handleClose();
      } catch (err) {
        console.error('Error updating category:', err);
        toast.error('Error updating category');
      }
    },
  });

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const uploadedImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      is_thumbnail: false,
      isExisting: false,
    }));
    setRoomImages([...roomImages, ...uploadedImages]);
    setNewImages([...newImages, ...uploadedImages]);
  };

  const removeImage = (index) => {
    const updatedImages = roomImages.filter((_, i) => i !== index);

    // Update new images array if it's a new image
    if (!roomImages[index].isExisting) {
      const newImagesUpdated = newImages.filter((img) => img.preview !== roomImages[index].preview);
      setNewImages(newImagesUpdated);
    }

    // Update thumbnail index
    if (thumbnailIndex === index) {
      setThumbnailIndex(0);
      if (updatedImages.length > 0) {
        updatedImages[0].is_thumbnail = true;
      }
    } else if (thumbnailIndex > index) {
      setThumbnailIndex(thumbnailIndex - 1);
    }

    setRoomImages(updatedImages);
  };

  const setAsThumbnail = (index) => {
    const updatedImages = roomImages.map((img, i) => ({
      ...img,
      is_thumbnail: i === index,
    }));
    setRoomImages(updatedImages);
    setThumbnailIndex(index);
  };

  return (
    <Modal className="modal-right large" show={show} onHide={handleClose} backdrop="static" size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Edit Room Category</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <FormikProvider value={formik}>
          <Form id="edit_category_form" onSubmit={formik.handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Category Name</Form.Label>
              <Form.Control
                type="text"
                name="category"
                value={formik.values.category}
                onChange={formik.handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category Images</Form.Label>
              <Form.Control type="file" multiple accept="image/*" onChange={handleImageUpload} />
              <Form.Text className="text-muted">
                You can add multiple images. Click on an image to set it as thumbnail.
              </Form.Text>
            </Form.Group>

            {roomImages.length > 0 && (
              <Row className="mb-4">
                <Col md={12}>
                  <div className="d-flex flex-wrap gap-3">
                    {roomImages.map((img, index) => (
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
                        {img.isExisting && (
                          <Badge
                            bg="success"
                            className="position-absolute bottom-0 start-0 m-2"
                            style={{ fontSize: '10px' }}
                          >
                            Existing
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