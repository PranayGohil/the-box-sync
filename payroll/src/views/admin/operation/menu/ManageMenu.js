import React, { useMemo, useState, useEffect } from 'react';
import { Card, Col, Row, Form, Spinner, Alert, Button, Badge } from 'react-bootstrap';
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

const customStyles = `
  .custom-btn-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
  }
  .custom-btn-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
  }
  .custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1.25rem !important;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07) !important;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .glass-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.12) !important;
  }
  .pill-input {
    border-radius: 15px !important;
    padding: 0.8rem 1.5rem 0.8rem 3.5rem !important;
    border: 1px solid #f0f0f0 !important;
    background: #ffffff !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    color: #333;
  }
  .pill-input:focus {
    border-color: #1ea8e7 !important;
    box-shadow: 0 6px 20px rgba(30, 168, 231, 0.12) !important;
    outline: none;
  }
  .search-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }
  .search-icon-wrapper {
    position: absolute;
    left: 1.5rem;
    color: #1ea8e7;
    z-index: 10;
    pointer-events: none;
    display: flex;
    align-items: center;
  }
  .pill-input::placeholder {
    color: #9ca3af;
    font-weight: 400;
  }
  .category-title {
    color: #1ea8e7;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .badge-meal {
    padding: 0.5rem 1rem;
    border-radius: 50px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.65rem;
    letter-spacing: 0.05em;
  }
  .custom-icon-btn {
    transition: all 0.2s ease !important;
    opacity: 0.7;
    border: none !important;
    text-decoration: none !important;
  }
  .custom-icon-btn:hover {
    transform: scale(1.2);
    opacity: 1;
    text-decoration: none !important;
  }
  .custom-icon-btn.text-muted:hover {
    color: #1ea8e7 !important;
  }
  .custom-icon-btn.text-danger:hover {
    color: #cf2637 !important;
  }
  .bg-soft-success { background-color: rgba(5, 150, 105, 0.1) !important; }
  .bg-soft-warning { background-color: rgba(217, 119, 6, 0.1) !important; }
  .bg-soft-danger { background-color: rgba(207, 38, 55, 0.1) !important; }
  .bg-soft-warning-star { background-color: rgba(246, 195, 67, 0.15) !important; }
`;

const customStyles = `
  .custom-btn-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
  }
  .custom-btn-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
  }
  .custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1.25rem !important;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07) !important;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .glass-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.12) !important;
  }
  .pill-input {
    border-radius: 15px !important;
    padding: 0.8rem 1.5rem 0.8rem 3.5rem !important;
    border: 1px solid #f0f0f0 !important;
    background: #ffffff !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    color: #333;
  }
  .pill-input:focus {
    border-color: #1ea8e7 !important;
    box-shadow: 0 6px 20px rgba(30, 168, 231, 0.12) !important;
    outline: none;
  }
  .search-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }
  .search-icon-wrapper {
    position: absolute;
    left: 1.5rem;
    color: #1ea8e7;
    z-index: 10;
    pointer-events: none;
    display: flex;
    align-items: center;
  }
  .pill-input::placeholder {
    color: #9ca3af;
    font-weight: 400;
  }
  .category-title {
    color: #1ea8e7;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .badge-meal {
    padding: 0.5rem 1rem;
    border-radius: 50px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.65rem;
    letter-spacing: 0.05em;
  }
  .custom-icon-btn {
    transition: all 0.2s ease !important;
    opacity: 0.7;
    border: none !important;
    text-decoration: none !important;
  }
  .custom-icon-btn:hover {
    transform: scale(1.2);
    opacity: 1;
    text-decoration: none !important;
  }
  .custom-icon-btn.text-muted:hover {
    color: #1ea8e7 !important;
  }
  .custom-icon-btn.text-danger:hover {
    color: #cf2637 !important;
  }
  .bg-soft-success { background-color: rgba(5, 150, 105, 0.1) !important; }
  .bg-soft-warning { background-color: rgba(217, 119, 6, 0.1) !important; }
  .bg-soft-danger { background-color: rgba(207, 38, 55, 0.1) !important; }
  .bg-soft-warning-star { background-color: rgba(246, 195, 67, 0.15) !important; }
`;

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

    if (key === 'meal_type') {
      newFilters.category = '';
      if (value === '') {
        const allCategories = Array.from(new Set(menuData.map((item) => item.category)));
        setCategoryOptions(allCategories);
      } else {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API}/menu/get-categories?meal_type=${value}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
      <div className="container-fluid pb-5">
        <HtmlHead title={title} description={description} />
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
          <p className="text-muted fw-bold">Curating your menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      
      <div className="page-title-container mb-4">
        <Row className="g-3 align-items-center">
          <Col xs="12" md="7">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2">
            <Button 
              href="/operations/qr-for-menu"
              className="px-4 py-2 rounded-pill d-flex align-items-center custom-btn-outline"
            >
              <CsLineIcons icon="bookmark" className="me-2" size="18" stroke="currentColor" />
              QR for Menu
            </Button>
            <Button 
              href="/operations/add-dish"
              className="px-4 py-2 rounded-pill d-flex align-items-center custom-btn-outline"
            >
              <CsLineIcons icon="plus" className="me-2" size="18" stroke="currentColor" />
              Add New Dish
            </Button>
          </Col>
        </Row>
      </div>

      <Card className="border-0 shadow-sm mb-5" style={{ borderRadius: '1.25rem' }}>
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={6}>
              <div className="search-container">
                <Form.Control 
                  type="text" 
                  placeholder="Search dishes by name..." 
                  className="pill-input ps-5"
                  onChange={(e) => handleSearch(e.target.value)} 
                />
                <div className="search-icon-wrapper">
                  <CsLineIcons icon="search" size="18" />
                </div>
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
        <Card className="border-0 glass-card text-center py-5">
          <Card.Body>
            <div className="mb-3 text-muted">
              <CsLineIcons icon="inbox" size="48" stroke="#1ea8e7" />
            </div>
            <h5 className="fw-bold">No Dishes Found</h5>
            <p className="text-muted">Try adjusting your filters or search terms.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {filteredMenuData.map((category) => {
            const columns = [
              {
                Header: 'Dish Name',
                accessor: 'dish_name',
                sortable: true,
                headerClassName: 'text-muted text-small text-uppercase',
                Cell: ({ row }) => (
                  <div className="d-flex align-items-center">
                    <span className="fw-bold text-dark">{row.original.dish_name}</span>
                    {row.original.is_special && (
                      <Badge bg="soft-warning" className="ms-2 rounded-pill p-1">
                        <CsLineIcons icon="star" size="12" fill="#f6c343" stroke="#f6c343" />
                      </Badge>
                    )}
                  </div>
                ),
              },
              {
                Header: 'Price',
                accessor: 'dish_price',
                sortable: true,
                headerClassName: 'text-muted text-small text-uppercase',
                Cell: ({ value }) => <span className="fw-bold text-alternate">₹{value}</span>,
              },
              {
                Header: 'Actions',
                id: 'actions',
                headerClassName: 'text-muted text-small text-uppercase text-end',
                Cell: ({ row }) => (
                  <div className="d-flex justify-content-end gap-1">
                    <Button
                      variant="link"
                      size="sm"
                      className="p-1 text-muted custom-icon-btn"
                      onClick={() => {
                        setSelectedDish(row.original);
                        setEditMenuModalShow(true);
                      }}
                      title="Edit"
                    >
                      <CsLineIcons icon="edit" size="15" />
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-1 text-danger custom-icon-btn"
                      onClick={() => {
                        setDishToDelete(row.original);
                        setDeleteDishModalShow(true);
                      }}
                      title="Delete"
                    >
                      <CsLineIcons icon="bin" size="15" />
                    </Button>
                  </div>
                ),
              },
            ];

            return (
              <Col md={6} lg={6} key={category.id}>
                <Card className="border-0 glass-card h-100">
                  <Card.Body className="p-4">
                    <BoxedVariationsStripe
                      columns={columns}
                      data={category.dishes}
                      category={category}
                      setEditCategoryModalShow={setEditCategoryModalShow}
                      setSelectedCategory={setSelectedCategory}
                    />
                  </Card.Body>
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
    </div>
  );
};

export default ManageMenu;
