import React, { useMemo, useState, useEffect } from 'react';
import { Card, Col, Row, Form, Spinner, Alert, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import csInterfaceIcons from 'views/interface/content/icons/data/cs-interface-icons-tags';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import BoxedVariationsStripe from './components/BoxedVariationsStripe';
import EditDishModal from './EditDishModal';
import EditDishCategoryModal from './EditDishCategoryModal';
import DeleteDishModal from './DeleteDishModal';

const ManageMenu = () => {
  const title = 'Manage Menu';
  const description = 'Dynamic menu table with search and pagination';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/manage-menu', title: 'Manage Menu' },
  ];

  const [editMenuModalShow, setEditMenuModalShow] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [editCategoryModalShow, setEditCategoryModalShow] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteDishModalShow, setDeleteDishModalShow] = useState(false);
  const [dishToDelete, setDishToDelete] = useState(null);
  const [menuData, setMenuData] = useState([]);
  const [filteredMenuData, setFilteredMenuData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ meal_type: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState([]);


  const starFillIcon = csInterfaceIcons.find((icon) => icon.c === 'cs-star-full');

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/menu/get`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const transformedMenu = res.data.data.map(({ _id, ...rest }) => ({
        ...rest,
        id: _id,
      }));

      setMenuData(transformedMenu);
      setFilteredMenuData(transformedMenu);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast.error('Failed to fetch menu data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

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
          dishes: item.dishes.filter((dish) =>
            dish.dish_name.toLowerCase().includes(searchText.toLowerCase())
          ),
        }))
        .filter((item) => item.dishes.length > 0);
    }

    setFilteredMenuData(filtered);
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    applyFilters({ ...filters, searchText: text });
  };

  const handleFilter = async (key, value) => {
    const newFilters = { ...filters, [key]: value };

    // RESET category if meal_type changes
    if (key === 'meal_type') {
      newFilters.category = '';

      if (value === '') {
        // 🔹 ALL MEAL TYPES → SHOW ALL CATEGORIES
        const allCategories = Array.from(
          new Set(menuData.map((item) => item.category))
        );
        setCategoryOptions(allCategories);
      } else {
        // 🔹 FETCH CATEGORY BY MEAL TYPE
        try {
          const res = await axios.get(
            `${process.env.REACT_APP_API}/menu/get-categories?meal_type=${value}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );
          setCategoryOptions(res.data.data || []);
        } catch (error) {
          console.error('Error fetching categories:', error);
          toast.error('Failed to load categories');
          setCategoryOptions([]);
        }
      }
    }

    setFilters(newFilters);
    applyFilters({ ...newFilters, searchText: searchTerm });
  };

  if (loading) {
    return (
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <div className="page-title-container mb-4">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p>Loading menu data...</p>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container mb-4">
            <Row className="align-items-center">
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="5" className="text-end">
                <Button
                  variant="primary"
                  href="/operations/add-dish"
                >
                  <CsLineIcons icon="plus" className="me-2" />
                  Add New Dish
                </Button>
              </Col>
            </Row>
          </div>

          <Form className="mb-4">
            <Row>
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Search dishes..."
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Select
                  onChange={(e) => handleFilter('meal_type', e.target.value)}
                >
                  <option value="">All Meal Types</option>
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                  <option value="egg">Egg</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={filters.category}
                  onChange={(e) => handleFilter('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Form>

          {filteredMenuData.length === 0 ? (
            <Alert variant="info" className="text-center">
              <CsLineIcons icon="inbox" size={24} className="me-2" />
              No dishes found. Add some dishes to get started.
            </Alert>
          ) : (
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
                      <BoxedVariationsStripe
                        columns={columns}
                        data={data}
                        category={category}
                        setEditCategoryModalShow={setEditCategoryModalShow}
                        setSelectedCategory={setSelectedCategory}
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}

          {selectedDish && (
            <EditDishModal
              show={editMenuModalShow}
              handleClose={() => setEditMenuModalShow(false)}
              data={selectedDish}
              fetchMenuData={fetchMenuData}
            />
          )}

          {selectedCategory && (
            <EditDishCategoryModal
              show={editCategoryModalShow}
              handleClose={() => setEditCategoryModalShow(false)}
              data={selectedCategory}
              fetchMenuData={fetchMenuData}
            />
          )}

          {dishToDelete && (
            <DeleteDishModal
              show={deleteDishModalShow}
              handleClose={() => setDeleteDishModalShow(false)}
              data={dishToDelete}
              fetchMenuData={fetchMenuData}
            />
          )}
        </Col>
      </Row>
    </>
  );
};

export default ManageMenu;