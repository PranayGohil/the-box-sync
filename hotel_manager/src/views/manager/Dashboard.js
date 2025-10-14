import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Row, Col, Card, Table } from "react-bootstrap";

const HotelBookingDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const [formData, setFormData] = useState({
    customer_id: "",
    category_id: "",
    subcategory_name: "",
    room_id: "",
    check_in: "",
    check_out: "",
    num_guests: "",
    total_price: "",
  });


  const fetchInitialData = async () => {
    const cust = await axios.get(`${process.env.REACT_APP_API}/customer/get-all`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const cat = await axios.get(`${process.env.REACT_APP_API}/room/category/get`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const book = await axios.get(`${process.env.REACT_APP_API}/hotel-booking/get-all`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setCustomers(cust.data);
    setCategories(cat.data);
    setBookings(book.data);
    console.log("Customers:", cust.data);
    console.log("Categories:", cat);
    console.log("Bookings:", book.data);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    setSelectedCategory(catId);
    const selected = categories.find((c) => c._id === catId);
    setSubcategories(selected?.subcategory || []);
    setFormData({ ...formData, category_id: catId });
  };

  const handleSubCategoryChange = async (e) => {
    const sub = e.target.value;
    setSelectedSubCategory(sub);
    setFormData({ ...formData, subcategory_name: sub });
    const roomRes = await axios.get(`/api/rooms/by-category/${selectedCategory}`);
    const available = roomRes.data.filter((r) => r.room_status === "Available");
    setRooms(available);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("/api/bookings/create", formData);
    alert("Booking Created!");
    fetchInitialData();
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Hotel Room Booking</h2>

      <Card className="p-3 mb-4">
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Customer</Form.Label>
                <Form.Select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                >
                  <option value="">Select</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Select onChange={handleCategoryChange}>
                  <option value="">Select</option>
                  {categories?.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.category}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Sub Category</Form.Label>
                <Form.Select onChange={handleSubCategoryChange}>
                  <option value="">Select</option>
                  {subcategories.map((sub) => (
                    <option key={sub.subcategory_name} value={sub.subcategory_name}>
                      {sub.subcategory_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Room</Form.Label>
                <Form.Select
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                >
                  <option value="">Select Room</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.room_no} - {r.room_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Check In</Form.Label>
                <Form.Control
                  type="date"
                  onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Check Out</Form.Label>
                <Form.Control
                  type="date"
                  onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Guests</Form.Label>
                <Form.Control
                  type="number"
                  onChange={(e) => setFormData({ ...formData, num_guests: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Total Price</Form.Label>
                <Form.Control
                  type="number"
                  onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={12} className="mt-3">
              <Button type="submit" variant="primary">
                Create Booking
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      <h4>All Bookings</h4>
      <Table striped bordered>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Room</th>
            <th>Category</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td>{b.customer_id?.name}</td>
              <td>{b.room_id?.room_no}</td>
              <td>{b.category_id?.category}</td>
              <td>{new Date(b.check_in).toLocaleDateString()}</td>
              <td>{new Date(b.check_out).toLocaleDateString()}</td>
              <td>{b.status}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default HotelBookingDashboard;
