import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import * as Yup from "yup";
import HtmlHead from "components/html-head/HtmlHead";
import BreadcrumbList from "components/breadcrumb-list/BreadcrumbList";
import axios from "axios";
import { useFormik } from "formik";

function AddInventory() {
  const title = "Add Inventory";
  const description = "Add new inventory items.";
  const breadcrumbs = [
    { to: "", text: "Home" },
    { to: "operations", text: "Operations" },
    { to: "operations/add-inventory", title: "Add Inventory" },
  ];

  const history = useHistory();
  const [items, setItems] = useState([
    { item_name: "", unit: "", item_quantity: "" },
  ]);

  // ✅ Formik setup with your schema
  const formik = useFormik({
    initialValues: { items, status: "Requested" },
    validationSchema: Yup.object({
      items: Yup.array()
        .of(
          Yup.object().shape({
            item_name: Yup.string().required("Item Name is required"),
            unit: Yup.string().required("Unit is required"),
            item_quantity: Yup.number()
              .typeError("Quantity must be a number") // handles non-numeric input
              .required("Item Quantity is required")
              .positive("Quantity must be greater than 0"),
          })
        )
        .min(1, "At least one item is required"), // optional: at least one item
      status: Yup.string().required("Status is required"),
    }),
    onSubmit: (values) => {
      console.log("Submitting: ", values);
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (key === 'items') {
          formData.append('items', JSON.stringify(val));
        } else {
          formData.append(key, val);
        }
      });

      axios.post(
        `${process.env.REACT_APP_API}/inventory/add-request`,
        formik.values,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      ).then((res) => {
        console.log("res: ", res.data);
        history.push("/operations/requested-inventory"); // ✅ redirect after success
      }).catch((err) => {
        console.error(err);
      })
    },
  });

  // ✅ Add/Remove/Change handlers
  const addItem = () => {
    const updated = [
      ...items,
      { item_name: "", unit: "", item_quantity: "" },
    ];
    setItems(updated);
    formik.setFieldValue("items", updated);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    formik.setFieldValue("items", updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
    formik.setFieldValue("items", updated);
  };

  const { handleSubmit, errors, touched } = formik;

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container">
            <h1 className="mb-0 pb-0 display-4">Add Inventory</h1>
            <BreadcrumbList items={breadcrumbs} />
          </div>

          {/* ✅ Inventory Form */}
          <Form onSubmit={handleSubmit}>
            <Card body className="mb-4">
              <h5 className="mb-3">Item Details</h5>
              {items.map((item, index) => {
                const itemErrors = errors.items?.[index] || {};
                const itemTouched = touched.items?.[index] || {};

                return (
                  <Row key={index} className="mb-3">
                    {/* Item Name */}
                    <Col md={4}>
                      <Form.Group>
                        <Form.Control
                          type="text"
                          placeholder="Item Name"
                          value={item.item_name}
                          onChange={(e) =>
                            handleItemChange(index, "item_name", e.target.value)
                          }
                          isInvalid={itemTouched.item_name && itemErrors.item_name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {itemErrors.item_name}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>



                    {/* Quantity */}
                    <Col md={3}>
                      <Form.Group>
                        <Form.Control
                          type="number"
                          placeholder="Quantity"
                          value={item.item_quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "item_quantity",
                              e.target.value
                            )
                          }
                          isInvalid={
                            itemTouched.item_quantity && itemErrors.item_quantity
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {itemErrors.item_quantity}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Unit */}
                    <Col md={3}>
                      <Form.Group>
                        <Form.Select
                          value={item.unit}
                          onChange={(e) =>
                            handleItemChange(index, "unit", e.target.value)
                          }
                          isInvalid={itemTouched.unit && itemErrors.unit}
                        >
                          <option value="">Select</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="litre">litre</option>
                          <option value="ml">ml</option>
                          <option value="piece">piece</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {itemErrors.unit}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Remove button */}
                    <Col md={2} className="d-flex align-items-center">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        Remove
                      </Button>
                    </Col>
                  </Row>
                );
              })}

              {/* Add Item Button */}
              <Button variant="primary" onClick={addItem} className="me-2">
                + Add More
              </Button>
            </Card>

            {/* Submit */}
            <Button variant="success" type="submit">
              Send Request
            </Button>
          </Form>
        </Col>
      </Row>
    </>
  );
}

export default AddInventory;
