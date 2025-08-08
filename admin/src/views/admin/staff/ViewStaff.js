import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card } from 'react-bootstrap';
import { Switch, Route, useHistory } from 'react-router-dom';
import axios from 'axios';
import Glide from 'components/carousel/Glide';

const ViewStaff = ({ setSection }) => {

  const history = useHistory();

  const [staff, setStaff] = useState([]);
  const [selectedStaffData, setSelectedStaffData] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/staff/staffdata`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleProfileClick = async (id) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/staff/staffdata/${id}`);
      setSelectedStaffData(response.data);
      setShowProfileModal(true);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="display-5 fw-bold">Manage Staff</h1>
        </Col>
        <Col className="text-end">
          <Button variant="dark" onClick={() => history.push('/staff/add')} className="me-2">
            <img src="../dist/img/icon/add.svg" alt="Add" className="me-1" /> Add Staff
          </Button>

          <Button variant="dark" onClick={() => history.push('/staff/attendance')}>
            Manage Attendance
          </Button>

        </Col>
      </Row>

      <Row>
        <Col className="p-0">
          {staff.length > 0 ? (
            <Glide
              options={{
                gap: 0,
                rewind: false,
                bound: true,
                perView: 6,
                breakpoints: {
                  400: { perView: 2 },
                  600: { perView: 3 },
                  1400: { perView: 4 },
                  1600: { perView: 5 },
                  1900: { perView: 6 },
                  3840: { perView: 6 },
                },
              }}
            >
              {staff.map((staffMember, i) => (
                <Glide.Item key={staffMember._id}>
                  <Card
                    className="sh-20 hover-shadow hover-border-primary cursor-pointer"
                    onClick={() => handleProfileClick(staffMember._id)}
                  >
                    <Card.Body className="p-4 text-center d-flex flex-column align-items-center justify-content-between">
                      <div className="d-flex sh-8 sw-8 bg-gradient-light rounded-xl overflow-hidden mb-3">
                        <img
                          src={`${process.env.REACT_APP_UPLOAD_DIR}/staff/profile/${staffMember.photo}`}
                          alt={`${staffMember.f_name} ${staffMember.l_name}`}
                          className="w-100 h-100 object-fit-cover"
                        />
                      </div>
                      <p className="mb-0 lh-1 fw-bold">
                        {staffMember.f_name} {staffMember.l_name}
                      </p>
                      <small className="text-muted">{staffMember.position}</small>
                    </Card.Body>
                  </Card>
                </Glide.Item>
              ))}
            </Glide>
          ) : (
            <p className="text-center text-muted mt-5">No staff found.</p>
          )}
        </Col>
      </Row>
    </>
  );
};

export default ViewStaff;
