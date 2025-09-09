import React, { useMemo, useState, useEffect } from 'react';
import { Card, Col, Row, Form } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import csInterfaceIcons from 'views/interface/content/icons/data/cs-interface-icons-tags';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import BoxedVariationsStripe from './components/BoxedVariationsStripe';
import EditDishModal from './EditDishModal';
import DeleteDishModal from './DeleteDishModal';

const ManageMenu = () => {
  const title = 'Manage Menu';
  const description = 'Dynamic menu table with search and pagination';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/manage-menu', title: 'Manage Menu' },
  ];

  // Modal and selected dish state
  const [editMenuModalShow, setEditMenuModalShow] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [deleteDishModalShow, setDeleteDishModalShow] = useState(false);
  const [dishToDelete, setDishToDelete] = useState(null);
  const [menuData, setMenuData] = useState([]);
  const [filteredMenuData, setFilteredMenuData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ meal_type: '', category: '' });

  const starFillIcon = csInterfaceIcons.find((icon) => icon.c === 'cs-star-full');

  const fetchMenuData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/menu/get`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log(res.data.data);
      const transformedMenu = res.data.data.map(({ _id, ...rest }) => ({
        ...rest,
        id: _id,
      }));
      setMenuData(transformedMenu);
      setFilteredMenuData(transformedMenu);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  /* eslint-disable camelcase */
  const applyFilters = ({ meal_type, category, searchText }) => {
    let filtered = [...menuData];

    if (meal_type) {
      filtered = filtered.filter((item) => item.meal_type === meal_type);
    }

    if (category) {
      filtered = filtered.filter((item) => item.category === category);
    }

    if (searchText) {
      filtered = filtered
        .map((item) => ({
          ...item,
          dishes: item.dishes.filter((dish) => dish.dish_name.toLowerCase().includes(searchText.toLowerCase())),
        }))
        .filter((item) => item.dishes.length > 0);
    }

    setFilteredMenuData(filtered);
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
                <Form.Control type="text" placeholder="Search dishes..." onChange={(e) => handleSearch(e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Select onChange={(e) => handleFilter('meal_type', e.target.value)}>
                  <option value="">All Meal Types</option>
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                  <option value="egg">Egg</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select onChange={(e) => handleFilter('category', e.target.value)}>
                  <option value="">All Categories</option>
                  {Array.from(new Set(menuData.map((cat) => cat.category))).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Form>

          <Row>
            {filteredMenuData.map((category) => {
              const columns = [
                {
                  Header: 'Dish Name',
                  accessor: 'dish_name',
                  sortable: true,
                  headerClassName: 'text-muted text-small text-uppercase w-40',
                  Cell: ({ row }) => (
                    <>
                      {row.original.dish_name}
                      {row.original.is_special && <i className={`icon-20 ${starFillIcon.c} ms-2 text-warning`} />}
                    </>
                  ),
                },
                {
                  Header: 'Price',
                  accessor: 'dish_price',
                  sortable: true,
                  headerClassName: 'text-muted text-small text-uppercase w-20',
                  cellClassName: 'text-alternate',
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
                          setSelectedDish(row.original);
                          setEditMenuModalShow(true);
                        }}
                      >
                        <CsLineIcons icon="edit" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-icon btn-outline-danger"
                        onClick={() => {
                          setDishToDelete(row.original);
                          setDeleteDishModalShow(true);
                        }}
                      >
                        <CsLineIcons icon="bin" />
                      </button>
                    </div>
                  ),
                },
              ];

              const data = category.dishes;

              return (
                <Col md={6} lg={6} key={category.id}>
                  <Card body className="mb-4">
                    <BoxedVariationsStripe columns={columns} data={data} category={category} />
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Col>
      </Row>

      {/* Edit Modal */}
      {selectedDish && <EditDishModal show={editMenuModalShow} handleClose={() => setEditMenuModalShow(false)} data={selectedDish} fetchMenuData={fetchMenuData} />}

      {dishToDelete && <DeleteDishModal show={deleteDishModalShow} handleClose={() => setDeleteDishModalShow(false)} data={dishToDelete} fetchMenuData={fetchMenuData} />}
    </>
  );
};

export default ManageMenu;
