import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Col, Row, Form, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import csInterfaceIcons from 'views/interface/content/icons/data/cs-interface-icons-tags';
import HtmlHead from 'components/html-head/HtmlHead';
import LayoutFull from 'layout/LayoutFull';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import BoxedVariationsStripe from './components/BoxedVariationsStripe';

const ShowMenu = () => {
  const { res_code } = useParams();

  const title = 'Restaurant Menu';
  const description = 'Modern menu display for restaurants';

  const [menuData, setMenuData] = useState([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [filteredMenuData, setFilteredMenuData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ meal_type: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [totalDishes, setTotalDishes] = useState(0);
  const [filteredDishes, setFilteredDishes] = useState(0);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const starFillIcon = csInterfaceIcons.find((icon) => icon.c === 'cs-star-full');

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/menu/get/rescode/${res_code}`);

      const transformedMenu = res.data.data.map(({ _id, ...rest }) => ({
        ...rest,
        id: _id,
      }));

      setMenuData(transformedMenu);
      setRestaurantName(res.data.restaurant_name);
      setFilteredMenuData(transformedMenu);

      // Calculate total dishes
      const total = transformedMenu.reduce((sum, category) => sum + category.dishes.length, 0);
      setTotalDishes(total);
      setFilteredDishes(total);

      // Initialize category options
      const allCategories = Array.from(new Set(transformedMenu.map((item) => item.category)));
      setCategoryOptions(allCategories);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast.error('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, [res_code]);

  // Calculate active filter count
  useEffect(() => {
    let count = 0;
    if (searchTerm) count+=1;
    if (filters.meal_type) count+=1;
    if (filters.category) count+=1;
    setActiveFilterCount(count);
  }, [searchTerm, filters]);

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

    // Calculate filtered dishes count
    const filteredCount = filtered.reduce((sum, cat) => sum + cat.dishes.length, 0);
    setFilteredDishes(filteredCount);

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
        // 🔹 FILTER CATEGORIES BY MEAL TYPE
        const filteredByMealType = menuData.filter((item) => item.meal_type === value);
        const categoriesByMealType = Array.from(new Set(filteredByMealType.map((item) => item.category)));
        setCategoryOptions(categoriesByMealType);
      }
    }

    setFilters(newFilters);
    applyFilters({ ...newFilters, searchText: searchTerm });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ meal_type: '', category: '' });
    setCategoryOptions(Array.from(new Set(menuData.map((item) => item.category))));
    setFilteredMenuData(menuData);
    setFilteredDishes(totalDishes);
  };

  // Define columns for BoxedVariationsStripe
  const columns = [
    {
      Header: 'Dish Name',
      accessor: 'dish_name',
      sortable: true,
      headerClassName: 'text-muted text-small text-uppercase w-60',
      Cell: ({ row }) => (
        <div className="d-flex gap-2 align-items-center px-3 py-2">
          <div className="fw-medium mb-1">{row.original.dish_name}</div>
          <div className="d-flex align-items-center gap-2">
            {row.original.is_special && (
              <Badge bg="warning" className="badge-sm px-2 py-1" style={{ background: 'linear-gradient(45deg, #ff9a00, #ffcc00)' }}>
                <i className={`icon-14 ${starFillIcon?.c || 'cs-star'} me-1`} />
                <span className="fw-medium">Special</span>
              </Badge>
            )}
            {row.original.meal_type === 'veg' && (
              <Badge bg="success" className="badge-sm px-2 py-1">
                <CsLineIcons icon="leaf" className="me-1" size={12} />
                Veg
              </Badge>
            )}
            {row.original.meal_type === 'non-veg' && (
              <Badge bg="danger" className="badge-sm px-2 py-1">
                <CsLineIcons icon="steak" className="me-1" size={12} />
                Non-Veg
              </Badge>
            )}
            {row.original.meal_type === 'egg' && (
              <Badge bg="primary" className="badge-sm px-2 py-1">
                <CsLineIcons icon="egg" className="me-1" size={12} />
                Egg
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      Header: 'Price',
      accessor: 'dish_price',
      sortable: true,
      headerClassName: 'text-muted text-small text-uppercase w-40 text-end',
      cellClassName: 'text-end',
      Cell: ({ value }) => (
        <div className="d-flex align-items-center justify-content-end">
          <div className="px-3 py-2">
            <span className="fw-bold text-primary fs-5">₹{value}</span>
          </div>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <LayoutFull>
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-4" style={{ width: '3rem', height: '3rem' }} />
            <h5 className="mb-2">Loading Menu</h5>
            <p className="text-muted">Crafting your dining experience</p>
          </div>
        </div>
      </LayoutFull>
    );
  }

  return (
    <LayoutFull>
      <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
        {/* Hero Section */}
        <div
          className="position-relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '4rem 0 3rem',
            marginBottom: '2rem',
          }}
        >
          <div className="container">
            <div className="text-center text-white mb-4">
              <h1 className="display-4 fw-light mb-3">{restaurantName}</h1>
              {/* <p className="lead opacity-75 mb-4">Experience culinary excellence</p> */}

              {/* <div className="d-flex justify-content-center gap-4 mb-4">
                <div className="text-center">
                  <div className="fs-2 fw-bold mb-1">{totalDishes}</div>
                  <div className="opacity-75">Total Dishes</div>
                </div>
                <div className="text-center">
                  <div className="fs-2 fw-bold mb-1">{menuData.length}</div>
                  <div className="opacity-75">Categories</div>
                </div>
                <div className="text-center">
                  <div className="fs-2 fw-bold mb-1">{filteredDishes}</div>
                  <div className="opacity-75">Currently Showing</div>
                </div>
              </div> */}
            </div>
          </div>

          {/* Decorative wave */}
          <div
            className="position-absolute bottom-0 start-0 w-100"
            style={{
              height: '50px',
              background: '#f8f9fa',
              borderTopLeftRadius: '50%',
              borderTopRightRadius: '50%',
            }}
          />
        </div>

        <div className="container px-3 px-md-4 px-lg-5 pb-5">
          <HtmlHead title={restaurantName || title} description={description} />

          {/* Search & Filters Card */}
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px' }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="mb-0 fw-medium">Refine Your Selection</h5>
                  <p className="text-muted small mb-0">Find exactly what you're craving</p>
                </div>

                {activeFilterCount > 0 && (
                  <button type='button' onClick={clearFilters} className="btn btn-sm btn-outline-danger d-flex align-items-center">
                    <CsLineIcons icon="close" className="me-1" size={14} />
                    Clear
                  </button>
                )}
              </div>

              <Form>
                <Row className="g-3">
                  <Col md={5}>
                    <Form.Group>
                      <div className="input-group input-group">
                        <span className="input-group-text bg-transparent border-end-0">
                          <CsLineIcons icon="search" />
                        </span>
                        <Form.Control
                          type="text"
                          placeholder="Search for dishes..."
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="border-start-0 ps-0"
                          style={{ borderColor: '#dee2e6' }}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <div className="input-group input-group">
                        <Form.Select
                          value={filters.meal_type}
                          onChange={(e) => handleFilter('meal_type', e.target.value)}
                          className="px-3"
                          style={{ borderLeft: 'none' }}
                        >
                          <option value="">All Types</option>
                          <option value="veg">Veg</option>
                          <option value="non-veg">Non-Veg</option>
                          <option value="egg">Egg</option>
                        </Form.Select>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <div className="input-group input-group">
                        <Form.Select
                          value={filters.category}
                          onChange={(e) => handleFilter('category', e.target.value)}
                          className="px-3"
                          style={{ borderLeft: 'none' }}
                          disabled={filters.meal_type && categoryOptions.length === 0}
                        >
                          <option value="">All Categories</option>
                          {categoryOptions.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          {/* Results Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 px-3">
            <div>
              <h3 className="fw-light mb-1">Our Menu</h3>
              <p className="text-muted mb-0">
                {filteredDishes} {filteredDishes === 1 ? 'item' : 'items'} available
                {activeFilterCount > 0 && ' (filtered)'}
              </p>
            </div>

            <div className="d-flex gap-2">
              {searchTerm && (
                <Badge bg="dark" text="light" className="px-3 py-2">
                  {searchTerm}
                </Badge>
              )}
              {filters.meal_type && (
                <Badge bg={filters.meal_type === 'veg' ? 'success' : filters.meal_type === 'non-veg' ? 'danger' : 'primary'} className="px-3 py-2">
                  {filters.meal_type}
                </Badge>
              )}
              {filters.category && (
                <Badge bg="secondary" className="px-3 py-2">
                  <CsLineIcons icon="category" className="me-1" />
                  {filters.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Menu Content */}
          {filteredMenuData.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-4">
                <CsLineIcons icon="inbox" size={64} className="text-muted opacity-50" />
              </div>
              <h4 className="fw-light mb-3">No Dishes Found</h4>
              <p className="text-muted mb-4">
                {searchTerm || filters.meal_type || filters.category ? 'Try adjusting your search or filters' : 'Menu is currently being updated'}
              </p>
              {activeFilterCount > 0 && (
                <button type='button' onClick={clearFilters} className="btn btn-outline-primary">
                  <CsLineIcons icon="refresh" className="me-2" />
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Categories Grid */}
              <Row className="g-4 px-3">
                {filteredMenuData.map((category) => {
                  const data = category.dishes;

                  // Get meal type icon and color
                  const getMealTypeInfo = (type) => {
                    switch (type) {
                      case 'veg':
                        return { icon: 'leaf', color: '#28a745', bg: '#d4edda' };
                      case 'non-veg':
                        return { icon: 'steak', color: '#dc3545', bg: '#f8d7da' };
                      case 'egg':
                        return { icon: 'egg', color: '#6f42c1', bg: '#e2d9f3' };
                      default:
                        return { icon: 'food', color: '#6c757d', bg: '#e9ecef' };
                    }
                  };

                  const mealTypeInfo = getMealTypeInfo(category.meal_type);

                  return (
                    <Col lg={6} key={category.id}>
                      <Card className="border shadow-md h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <Card.Header
                          className="border-0 py-4"
                          style={{
                            backgroundColor: '#f8f9fa',
                            borderBottom: '2px solid #e9ecef',
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h5 className="fw-bold mb-1">{category.category}</h5>
                              <div className="d-flex align-items-center gap-3">
                                <span className="text-muted">
                                  {data.length} {data.length === 1 ? 'dish' : 'dishes'}
                                </span>
                                <span
                                  className="badge px-3 py-1"
                                  style={{
                                    backgroundColor: mealTypeInfo.bg,
                                    color: mealTypeInfo.color,
                                  }}
                                >
                                  {category.meal_type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body className="px-5 py-4">
                          <BoxedVariationsStripe columns={columns} data={data} category={category} />
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </>
          )}
        </div>
      </div>
    </LayoutFull>
  );
};

export default ShowMenu;
