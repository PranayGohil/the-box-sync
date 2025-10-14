import React, { useMemo, useState, useEffect } from 'react';
import { Card, Col, Row, Form, Button } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import BoxedVariationsStripe from './components/BoxedVariationsStripe';
import EditRoomModal from './EditRoomModal';
import DeleteRoomModal from './DeleteRoomModal';
import EditRoomCategoryModal from './EditRoomCategoryModal';
import DeleteCategoryModal from './DeleteCategoryModal';

const ManageRooms = () => {
  const title = 'Manage Rooms';
  const description = 'Dynamic rooms table with search and pagination';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/manage-rooms', title: 'Manage Rooms' },
  ];

  const [editRoomModalShow, setEditRoomModalShow] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [deleteRoomModalShow, setDeleteRoomModalShow] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  const [editCategoryModalShow, setEditCategoryModalShow] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteCategoryModalShow, setDeleteCategoryModalShow] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [roomData, setRoomData] = useState([]);
  const [filteredRoomData, setFilteredRoomData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '' });

  const fetchRoomData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/room/category/get`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log(res.data.data);
      const transformedData = res.data.data.map(({ _id, ...rest }) => ({
        ...rest,
        id: _id,
      }));
      setRoomData(transformedData);
      setFilteredRoomData(transformedData);
    } catch (error) {
      console.error('Error fetching room data:', error);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, []);

  const applyFilters = ({ status, category, searchText }) => {
    let filtered = [...roomData];

    if (category) {
      filtered = filtered.filter((item) => item.id === category);
    }

    if (searchText) {
      filtered = filtered
        .map((item) => ({
          ...item,
          rooms: item.rooms.filter((room) =>
            room.room_name.toLowerCase().includes(searchText.toLowerCase()) ||
            room.room_no.toLowerCase().includes(searchText.toLowerCase())
          ),
        }))
        .filter((item) => item.rooms.length > 0);
    }

    if (status) {
      filtered = filtered
        .map((item) => ({
          ...item,
          rooms: item.rooms.filter((room) => room.room_status === status),
        }))
        .filter((item) => item.rooms.length > 0);
    }

    setFilteredRoomData(filtered);
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    applyFilters({ ...filters, searchText: text });
  };

  const handleFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters({ ...newFilters, searchText: searchTerm });
  };

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container mb-4">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </div>
          <Form className="mb-4">
            <Row>
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Search rooms..."
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Select onChange={(e) => handleFilter('status', e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select onChange={(e) => handleFilter('category', e.target.value)}>
                  <option value="">All Categories</option>
                  {roomData.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Form>

          <Row>
            {filteredRoomData.map((category) => {
              const columns = [
                {
                  Header: 'Room Name',
                  accessor: 'room_name',
                  sortable: true,
                  headerClassName: 'text-muted text-small text-uppercase w-30',
                },
                {
                  Header: 'Room No',
                  accessor: 'room_no',
                  sortable: true,
                  headerClassName: 'text-muted text-small text-uppercase w-15',
                },
                {
                  Header: 'Status',
                  accessor: 'room_status',
                  sortable: true,
                  headerClassName: 'text-muted text-small text-uppercase w-15',
                  Cell: ({ row }) => (
                    <span className={`badge bg-${row.original.room_status === 'Available' ? 'success' :
                      row.original.room_status === 'Occupied' ? 'danger' : 'warning'
                      }`}>
                      {row.original.room_status}
                    </span>
                  ),
                },
                {
                  Header: 'Actions',
                  id: 'actions',
                  headerClassName: 'text-muted text-small text-uppercase w-20',
                  Cell: ({ row }) => (
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-icon btn-outline-primary"
                        onClick={() => {
                          setSelectedRoom(row.original);
                          setEditRoomModalShow(true);
                        }}
                      >
                        <CsLineIcons icon="edit" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-icon btn-outline-danger"
                        onClick={() => {
                          setRoomToDelete(row.original);
                          setDeleteRoomModalShow(true);
                        }}
                      >
                        <CsLineIcons icon="bin" />
                      </button>
                    </div>
                  ),
                },
              ];

              const data = category.rooms || [];

              return (
                <Col md={6} lg={6} key={category.id}>
                  <Card body className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">{category.category}</h5>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-primary"
                          onClick={() => {
                            setSelectedCategory(category);
                            setEditCategoryModalShow(true);
                          }}
                        >
                          <CsLineIcons icon="edit" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-danger"
                          onClick={() => {
                            setCategoryToDelete(category);
                            setDeleteCategoryModalShow(true);
                          }}
                        >
                          <CsLineIcons icon="bin" />
                        </button>
                      </div>
                    </div>
                    <BoxedVariationsStripe columns={columns} data={data} category={category} />
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Col>
      </Row>

      {selectedRoom && (
        <EditRoomModal
          show={editRoomModalShow}
          handleClose={() => {
            setEditRoomModalShow(false);
            setSelectedRoom(null);
          }}
          data={selectedRoom}
          fetchRoomData={fetchRoomData}
        />
      )}

      {roomToDelete && (
        <DeleteRoomModal
          show={deleteRoomModalShow}
          handleClose={() => {
            setDeleteRoomModalShow(false);
            setRoomToDelete(null);
          }}
          data={roomToDelete}
          fetchRoomData={fetchRoomData}
        />
      )}

      {selectedCategory && (
        <EditRoomCategoryModal
          show={editCategoryModalShow}
          handleClose={() => {
            setEditCategoryModalShow(false);
            setSelectedCategory(null);
          }}
          data={selectedCategory}
          fetchRoomData={fetchRoomData}
        />
      )}

      {categoryToDelete && (
        <DeleteCategoryModal
          show={deleteCategoryModalShow}
          handleClose={() => {
            setDeleteCategoryModalShow(false);
            setCategoryToDelete(null);
          }}
          data={categoryToDelete}
          fetchRoomData={fetchRoomData}
        />
      )}
    </>
  );
};

export default ManageRooms;