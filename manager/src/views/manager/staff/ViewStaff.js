import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card } from 'react-bootstrap';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Glide from 'components/carousel/Glide';

const ViewStaff = () => {
  const history = useHistory();
  const [staff, setStaff] = useState([]);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/staff/get-all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.data || response.data !== "Null") {
        console.log(response.data);
        setStaff(response.data);
      } else {
        setStaff([]);
      }
    } catch (error) {
      console.error('Error fetching staff data:', error);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Group staff by position
  const groupedStaff = staff.reduce((groups, member) => {
    const position = member.position || 'Other';
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(member);
    return groups;
  }, {});

  const handleProfileClick = async (id) => {
    try {
      await axios.get(`${process.env.REACT_APP_API}/staff/get/${id}`);
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
          <Button variant="outline-primary" onClick={() => history.push('/staff/add')} className="me-2">
            <CsLineIcons icon="plus" className="me-2" /> Add Staff
          </Button>
          <Button variant="outline-primary" onClick={() => history.push('/staff/attendance')}>
            Manage Attendance
          </Button>
        </Col>
      </Row>

      {Object.keys(groupedStaff).length > 0 ? (
        Object.entries(groupedStaff).map(([position, members]) => (
          <div key={position} className="mb-5">
            <h4 className="fw-bold mb-3">{position}</h4>
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
                noControls: true,
              }}
            >
              {members.map((staffMember) => (
                <Link to={`/staff/profile/${staffMember._id}`} key={staffMember._id} className="my-3">
                  <Glide.Item className="my-3">
                    <Card
                      className="sh-20 hover-shadow hover-border-primary cursor-pointer"
                      onClick={() => handleProfileClick(staffMember._id)}
                    >
                      <Card.Body className="p-4 text-center d-flex flex-column align-items-center justify-content-between">
                        <div className="d-flex sh-8 sw-8 bg-gradient-light rounded-xl overflow-hidden mb-3">
                          <img
                            src={`${process.env.REACT_APP_UPLOAD_DIR}${staffMember.photo}`}
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
                </Link>
              ))}
            </Glide>
          </div>
        ))
      ) : (
        <p className="text-center text-muted mt-5">No staff found.</p>
      )}
    </>
  );
};

export default ViewStaff;
