import React, { useMemo, useState, useEffect } from 'react';
import { Card, Col, Row, Form, Spinner, Alert, Button, Badge, Dropdown, Collapse } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import axios from 'axios';
import Select from 'react-select';
import { useHistory } from 'react-router-dom';
import EditItemModal from './EditItemModal';
import EditItemCategoryModal from './EditItemCategoryModal';
import DeleteItemModal from './DeleteItemModal';


const ManageCatalog = () => {
  const title = 'Manage Items';
  const description = 'Dynamic item catalog with search and pagination';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/manage-items', title: 'Manage Items' },
  ];

  const history = useHistory();
  const uploadDir = process.env.REACT_APP_UPLOAD_DIR || 'http://localhost:5001/uploads';

  const [editMenuModalShow, setEditMenuModalShow] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editCategoryModalShow, setEditCategoryModalShow] = useState(false);
  const [storePreferences, setStorePreferences] = useState('optional');
  const [shopType, setShopType] = useState('Other');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteItemModalShow, setDeleteItemModalShow] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [catalogData, setCatalogData] = useState([]);
  const [filteredCatalogData, setFilteredCatalogData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };



  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      const [res, userRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/catalog/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`${process.env.REACT_APP_API}/user/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
      ]);

      const transformedMenu = res.data.data.map(({ _id, ...rest }) => ({
        ...rest,
        id: _id,
      }));

      setCatalogData(transformedMenu);
      setFilteredCatalogData(transformedMenu);
      setStorePreferences(userRes.data?.user?.item_type_setting || userRes.data?.item_type_setting || 'optional');
      setShopType(userRes.data?.user?.shop_type || 'Other');

      // Expand first category by default
      if (transformedMenu.length > 0) {
        setExpandedCategories({ [transformedMenu[0].id || transformedMenu[0]._id]: true });
      }
    } catch (error) {
      console.error('Error fetching catalog data:', error);
      toast.error('Failed to fetch catalog data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const applyFilters = ({ status, category, searchText }) => {
    let filtered = [...catalogData];

    if (status) {
      filtered = filtered
        .map((item) => ({
          ...item,
          items: item.items.filter((childItem) => status === 'available' ? childItem.is_available : !childItem.is_available),
        }))
        .filter((item) => item.items.length > 0);
    }

    if (category) {
      filtered = filtered.filter((item) => item.category === category);
    }

    if (searchText) {
      filtered = filtered
        .map((item) => ({
          ...item,
          items: item.items.filter((childItem) => childItem.item_name.toLowerCase().includes(searchText.toLowerCase())),
        }))
        .filter((item) => item.items.length > 0);

      // Expand all matching categories when searching
      const expanded = {};
      filtered.forEach((item) => {
        expanded[item.id || item._id] = true;
      });
      setExpandedCategories(expanded);
    }

    setFilteredCatalogData(filtered);
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    applyFilters({ ...filters, searchText: text });
  };

  const handleFilter = async (key, value) => {
    const newFilters = { ...filters, [key]: value };



    setFilters(newFilters);
    applyFilters({ ...newFilters, searchText: searchTerm });
  };

  if (loading) {
    return (
      <div className="container-fluid pb-5">
        <HtmlHead title={title} description={description} />
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: '#23b3f4' }} className="mb-3" />
          <p className="text-muted manage-catalog-text-muted fw-bold">Curating your catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid qsr-page-container">
      <HtmlHead title={title} description={description} />
      <style>{`
        .hover-elevate {
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .hover-elevate:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
        }
        .hover-light {
          transition: background-color 0.2s ease;
        }
        .hover-light:hover {
          background-color: #f8fafc !important;
        }
      `}</style>
      <div className="qsr-page-title-container text-start">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto text-start">
            <h1 className="qsr-page-title">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="5" className="d-flex flex-column flex-sm-row justify-content-md-end gap-2 mt-3 mt-md-0">
            <Button
              onClick={() => history.push('/operations/add-item')}
              className="manage-catalog-custom-btn-outline shadow-sm border-0"
            >
              <CsLineIcons icon="plus" size="18" className="me-2" style={{ color: '#23b3f4' }} />
              Add New Item
            </Button>
          </Col>
        </Row>
      </div>

      <div className="inventory-history-search-filter-hub border-0 shadow-sm mb-4">
        <Row className="g-2 g-md-3 align-items-center">
          <Col xs={12} md={6}>
            <div className="inventory-history-search-input-container">
              <span style={{ paddingLeft: '14px', paddingRight: '8px', display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                <CsLineIcons icon="search" size="16" />
              </span>
              <Form.Control
                type="text"
                placeholder="Search items by name..."
                className="border-0 bg-transparent shadow-none flex-grow-1"
                style={{ fontSize: '14px', outline: 'none', height: '38px' }}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              classNamePrefix="react-select"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'available', label: 'Available' },
                { value: 'unavailable', label: 'Out of Stock' },
              ]}
              value={filters.status ? { value: filters.status, label: filters.status === 'available' ? 'Available' : 'Out of Stock' } : { value: '', label: 'All Statuses' }}
              onChange={(selected) => handleFilter('status', selected ? selected.value : '')}
              placeholder="Status"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '50px',
                  height: '40px',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#23b3f4' },
                }),
                catalog: (base) => ({
                  ...base,
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.12)',
                  zIndex: 9999,
                }),
                placeholder: (base) => ({ ...base, color: '#23b3f4', fontWeight: '600' }),
                singleValue: (base) => ({ ...base, color: '#23b3f4', fontWeight: '600' }),
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
                control: (base) => ({
                  ...base,
                  borderRadius: '50px',
                  height: '40px',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#23b3f4' },
                }),
                catalog: (base) => ({
                  ...base,
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.12)',
                  zIndex: 9999,
                }),
                placeholder: (base) => ({ ...base, color: '#23b3f4', fontWeight: '600' }),
                singleValue: (base) => ({ ...base, color: '#23b3f4', fontWeight: '600' }),
              }}
            />
          </Col>
        </Row>
      </div>

      {filteredCatalogData.length === 0 ? (
        <Card className="border-0 manage-catalog-glass-card text-center py-5">
          <Card.Body>
            <div className="mb-3 text-muted manage-catalog-text-muted">
              <CsLineIcons icon="inbox" size="48" style={{ color: '#23b3f4' }} />
            </div>
            <h5 className="fw-bold">No Items Found</h5>
            <p className="text-muted manage-catalog-text-muted">Try adjusting your filters or search terms.</p>
          </Card.Body>
        </Card>
      ) : (
        <div className="manage-catalog-grid-wrapper">
          {filteredCatalogData.map((category) => (
            <div key={category.id || category._id} className="mb-4 text-start">
              {/* Category Header — ManageTable style: white pill card */}
              <div
                className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 gap-sm-3 mb-3 px-3 py-3 bg-white shadow-sm cursor-pointer hover-light"
                style={{ borderRadius: '15px', border: '1px solid rgba(0,0,0,0.03)' }}
                onClick={() => toggleCategory(category.id || category._id)}
              >
                <div className="d-flex align-items-center gap-2 gap-sm-3 min-width-0 w-100 w-sm-auto">
                  <div
                    className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: 'rgba(35, 179, 244, 0.1)',
                      color: '#23b3f4',
                    }}
                  >
                    <CsLineIcons icon="folder" size="16" />
                  </div>
                  <h2 className="h5 mb-0 fw-bold text-dark text-truncate" style={{ maxWidth: '100%' }}>{category.category}</h2>
                </div>
                <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-2 w-100 w-sm-auto mt-2 mt-sm-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Badge
                    bg="none"
                    className="rounded-pill px-2 px-sm-3 py-2 flex-shrink-0"
                    style={{ backgroundColor: 'rgba(35,179,244,0.1)', color: '#23b3f4', fontSize: '0.82rem', fontWeight: '700' }}
                  >
                    {category.items.length} {category.items.length === 1 ? 'Item' : 'Items'}
                  </Badge>
                  <div className="d-flex align-items-center gap-2 ms-auto ms-sm-0 flex-shrink-0">
                    <Button
                      variant="light"
                      size="sm"
                      className="btn-icon btn-icon-only shadow-sm rounded-circle border-0 flex-shrink-0"
                      onClick={() => { setSelectedCategory(category); setEditCategoryModalShow(true); }}
                      title="Edit Category"
                    >
                      <CsLineIcons icon="edit" size="15" />
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      className="btn-icon btn-icon-only shadow-sm rounded-circle border-0 text-primary flex-shrink-0"
                      onClick={() => history.push('/operations/add-item', { category: category.category, counter: category.counter, hide_on_kot: category.hide_on_kot, fromManageCatalog: true })}
                      title="Add Item to Category"
                    >
                      <CsLineIcons icon="plus" size="15" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Items Grid — pos-catalog-card style from CatalogGrid - Collapsible */}
              <Collapse in={expandedCategories[category.id || category._id]}>
                <div className="pt-1 pb-2 px-1">
                  <Row className="g-3">
                    {category.items.map((item) => (
                      <Col xs={12} sm={6} md={4} lg={3} xxl={2} key={item.id || item._id}>
                        <div className="pos-catalog-card h-100 position-relative">
                          {/* Type-type dot — identical to CatalogGrid */}
                          <div className={`pos-type-dot ${(item.type || 'veg') === 'veg' ? 'veg-dot' : (item.type || 'veg') === 'egg' ? 'egg-dot' : 'nonveg-dot'}`} style={{ left: '8px' }} />

                          {/* Management buttons — absolute top-right overlay, icon-only, ManageTable link style */}
                          <div
                            className="position-absolute d-flex gap-1"
                            style={{ top: '6px', right: '6px', zIndex: 2 }}
                          >
                            <Button
                              variant="link"
                              size="sm"
                              className="btn-icon btn-icon-only shadow-sm rounded-circle border-0"
                              style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '7px', lineHeight: 1 }}
                              onClick={() => { setSelectedItem(item); setEditMenuModalShow(true); }}
                              title="Edit Item"
                            >
                              <CsLineIcons icon="edit" size="14" />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="btn-icon btn-icon-only shadow-sm rounded-circle border-0 text-danger"
                              style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '7px', lineHeight: 1 }}
                              onClick={() => { setItemToDelete(item); setDeleteItemModalShow(true); }}
                              title="Delete Item"
                            >
                              <CsLineIcons icon="bin" size="14" />
                            </Button>
                          </div>

                          {/* Image — square crop */}
                          <div className="pos-catalog-img-wrap" style={{ aspectRatio: '1 / 1', overflow: 'hidden' }}>
                            {item.item_img ? (
                              <img
                                src={`${uploadDir}/${item.item_img}`}
                                alt={item.item_name}
                                className="pos-catalog-img"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                <CsLineIcons icon="cupcake" size="30" opacity="0.3" />
                              </div>
                            )}
                          </div>

                          {/* Details — identical to CatalogGrid */}
                          <div className="pos-catalog-details">
                            {item.is_special && (
                              <div className="pos-special-star">
                                <span role="img" aria-label="special">⭐</span>
                              </div>
                            )}
                            <div className="pos-item-name">
                              {item.item_name}
                            </div>

                            {/* Price: range for variants, flat otherwise */}
                            <div className="pos-item-price">
                              {item.has_variants && Array.isArray(item.variants) && item.variants.length > 0
                                ? (() => {
                                  const prices = item.variants.map((v) => Number(v.price) || 0);
                                  const min = Math.min(...prices);
                                  const max = Math.max(...prices);
                                  return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
                                })()
                                : `₹${item.item_price || 0}`}
                            </div>

                            {/* Variant details (size / extra) */}
                            {item.has_variants && Array.isArray(item.variants) && item.variants.length > 0 && (
                              <div className="text-muted mt-1" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                                {item.variants.map((v, idx) => (
                                  <div key={idx} className="d-flex gap-1 align-items-baseline flex-wrap">
                                    {v.size_name && <span className="fw-semibold" style={{ color: '#334155' }}>{v.size_name}:</span>}
                                    <span style={{ color: '#23b3f4', fontWeight: 700 }}>₹{v.price}</span>
                                    {v.extra && <span style={{ fontStyle: 'italic', fontSize: '9px', color: '#94a3b8' }}>({v.extra})</span>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Customizable label (matches CatalogGrid) */}
                            {(item.has_variants || (Array.isArray(item.addons) && item.addons.length > 0)) && (
                              <div className="text-primary fw-bold" style={{ fontSize: '9px', marginTop: '2px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                                Customizable
                              </div>
                            )}

                            {/* Stock Badge */}
                            <div className="mt-2">
                              {item.has_variants && Array.isArray(item.variants) && item.variants.length > 0 ? (
                                <div className="d-flex flex-wrap gap-1">
                                  {item.variants.map((v, vIdx) => (
                                    <span key={vIdx} className={`badge ${v.stock_quantity === 0 ? 'bg-danger text-white' : v.stock_quantity != null ? 'bg-info text-white' : 'bg-light text-secondary border'}`} style={{ fontSize: '9px' }}>
                                      {v.size_name ? `${v.size_name}: ` : ''}{v.stock_quantity != null ? `${v.stock_quantity} in stock` : 'Unlimited'}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className={`badge ${item.stock_quantity === 0 ? 'bg-danger text-white' : item.stock_quantity != null ? 'bg-info text-white' : 'bg-light text-secondary border'}`} style={{ fontSize: '9px' }}>
                                  Stock: {item.stock_quantity != null ? `${item.stock_quantity} in stock` : 'Unlimited'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Collapse>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <EditItemModal show={editMenuModalShow} handleClose={() => setEditMenuModalShow(false)} data={selectedItem} fetchCatalogData={fetchCatalogData} catalogData={catalogData} storePreferences={storePreferences} shopType={shopType} />
      )}

      {selectedCategory && (
        <EditItemCategoryModal
          show={editCategoryModalShow}
          handleClose={() => setEditCategoryModalShow(false)}
          data={selectedCategory}
          fetchCatalogData={fetchCatalogData}
          storePreferences={storePreferences}
        />
      )}

      {itemToDelete && (
        <DeleteItemModal show={deleteItemModalShow} handleClose={() => setDeleteItemModalShow(false)} data={itemToDelete} fetchCatalogData={fetchCatalogData} />
      )}
    </div>
  );
};

export default ManageCatalog;
