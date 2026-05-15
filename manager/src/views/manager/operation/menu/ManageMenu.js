import React, { useMemo, useState, useEffect } from 'react';
import { Card, Col, Row, Form, Spinner, Alert, Button, Badge, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import csInterfaceIcons from 'views/interface/content/icons/data/cs-interface-icons-tags';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import Select from 'react-select';
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

  const handleFilter = async (key, value) => {
    const newFilters = { ...filters, [key]: value };

    // RESET category if meal_type changes
    if (key === 'meal_type') {
      newFilters.category = '';

      if (value === '') {
        // 🔹 ALL MEAL TYPES → SHOW ALL CATEGORIES
        const allCategories = Array.from(new Set(menuData.map((item) => item.category)));
        setCategoryOptions(allCategories);
      } else {
        // 🔹 FETCH CATEGORY BY MEAL TYPE
        try {
          const res = await axios.get(`${process.env.REACT_APP_API}/menu/get-categories?meal_type=${value}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
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
              <p>Loading...</p>
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
            <Row className="g-3 align-items-center">
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4 fw-bold text-primary">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2">
                <Button 
                  href="/operations/add-dish"
                  className="px-4 py-2 rounded-pill d-flex align-items-center shadow-sm border-2"
                  variant="outline-primary"
                >
                  <CsLineIcons icon="plus" className="me-2" size="18" />
                  Add New Dish
                </Button>
              </Col>
            </Row>
          </div>

          <Card className="border-0 shadow-sm mb-5" style={{ borderRadius: '1.25rem' }}>
            <Card.Body className="p-3">
              <Row className="g-3 align-items-center">
                <Col xs={12} md={6}>
                  <div className="search-container shadow-sm rounded-pill bg-white border d-flex align-items-center px-3" style={{ height: '44px' }}>
                    <CsLineIcons icon="search" size="18" className="text-primary opacity-75" />
                    <Form.Control 
                      type="text" 
                      placeholder="Search dishes..." 
                      className="border-0 bg-transparent shadow-none flex-grow-1 ms-2"
                      style={{ fontSize: '14px', outline: 'none' }}
                      onChange={(e) => handleSearch(e.target.value)} 
                    />
                  </div>
                </Col>
                <Col xs={12} sm={6} md={3}>
                  <Select
                    classNamePrefix="react-select"
                    options={[
                      { value: '', label: 'All Meal Types' },
                      { value: 'veg', label: 'Veg Only' },
                      { value: 'non-veg', label: 'Non-Veg Only' },
                      { value: 'egg', label: 'Contains Egg' },
                    ]}
                    value={filters.meal_type ? { value: filters.meal_type, label: filters.meal_type === 'veg' ? 'Veg Only' : filters.meal_type === 'non-veg' ? 'Non-Veg Only' : 'Contains Egg' } : { value: '', label: 'All Meal Types' }}
                    onChange={(selected) => handleFilter('meal_type', selected ? selected.value : '')}
                    placeholder="Meal Type"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderRadius: '50px',
                        height: '44px',
                        border: '2px solid #1ea8e7',
                        boxShadow: 'none',
                        '&:hover': { border: '2px solid #1ea8e7' },
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.12)',
                        zIndex: 9999,
                      }),
                      placeholder: (base) => ({ ...base, color: '#1ea8e7', fontWeight: '600' }),
                      singleValue: (base) => ({ ...base, color: '#1ea8e7', fontWeight: '600' }),
                    }}
                  />
                </Col>
                <Col xs={12} sm={6} md={3}>
                  <Select
                    classNamePrefix="react-select"
                    options={[{ value: '', label: 'All Categories' }, ...categoryOptions.map(cat => ({ value: cat, label: cat }))]}
                    value={filters.category ? { value: filters.category, label: filters.category } : { value: '', label: 'All Categories' }}
                    onChange={(selected) => handleFilter('category', selected ? selected.value : '')}
                    placeholder="Category"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderRadius: '50px',
                        height: '44px',
                        border: '2px solid #1ea8e7',
                        boxShadow: 'none',
                        '&:hover': { border: '2px solid #1ea8e7' },
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.12)',
                        zIndex: 9999,
                      }),
                      placeholder: (base) => ({ ...base, color: '#1ea8e7', fontWeight: '600' }),
                      singleValue: (base) => ({ ...base, color: '#1ea8e7', fontWeight: '600' }),
                    }}
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>

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
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="btn-icon btn-icon-only"
                          onClick={() => {
                            setSelectedDish(row.original);
                            setEditMenuModalShow(true);
                          }}
                          title="Edit"
                          disabled={loading}
                        >
                          <CsLineIcons icon="edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="btn-icon btn-icon-only"
                          onClick={() => {
                            setDishToDelete(row.original);
                            setDeleteDishModalShow(true);
                          }}
                          title="Delete"
                          disabled={loading}
                        >
                          <CsLineIcons icon="bin" />
                        </Button>
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
            <EditDishModal show={editMenuModalShow} handleClose={() => setEditMenuModalShow(false)} data={selectedDish} fetchMenuData={fetchMenuData} />
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
            <DeleteDishModal show={deleteDishModalShow} handleClose={() => setDeleteDishModalShow(false)} data={dishToDelete} fetchMenuData={fetchMenuData} />
          )}
        </Col>
      </Row>
    </>
  );
};

export default ManageMenu;
