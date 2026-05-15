import React from 'react';
import { Form } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const MenuGrid = ({
  filteredMenuData,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchText,
  setSearchText,
  showSpecial,
  setShowSpecial,
  showCategories,
  setShowCategories,
  showParcelCharge,
  setShowParcelCharge,
  containerCharges,
  addParcelCharge,
  addItemToOrder,
  orderItems = [], // Added orderItems
}) => {
  const totalItems = filteredMenuData.reduce((acc, cat) => acc + cat.dishes.length, 0);
  const activeLabel = selectedCategory || (showSpecial ? 'Specials' : showParcelCharge ? 'Parcel' : 'All Items');
  const uploadDir = process.env.REACT_APP_UPLOAD_DIR || 'http://localhost:5001/uploads';

  // Helper to get added quantity for a dish
  const getAddedQty = (dishName) => {
    const item = orderItems.find((oi) => oi.dish_name === dishName);
    return item ? item.quantity : 0;
  };

  return (
    <>
      {/* Drawer Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        className={`pos-drawer-backdrop ${showCategories ? 'open' : ''}`}
        onClick={() => setShowCategories(false)}
        onKeyDown={(e) => e.key === 'Escape' && setShowCategories(false)}
        aria-label="Close categories"
      />

      {/* Category Drawer */}
      <div className={`pos-category-drawer ${showCategories ? 'open' : ''}`}>
        <div className="pos-drawer-header">
          <div className="d-flex align-items-center gap-2">
            <CsLineIcons icon="grid-1" size="16" stroke="#23b3f4" />
            <span className="fw-bold" style={{ color: '#0f172a', fontSize: '14px' }}>Categories</span>
          </div>
          <button type="button" className="pos-drawer-close" onClick={() => setShowCategories(false)}>
            <CsLineIcons icon="close" size="13" />
          </button>
        </div>

        <div className="pos-drawer-body">
          <button
            type="button"
            className={`pos-category-item ${selectedCategory === '' && !showSpecial && !showParcelCharge ? 'active' : ''}`}
            onClick={() => { setSelectedCategory(''); setShowSpecial(false); if (setShowParcelCharge) setShowParcelCharge(false); setShowCategories(false); }}
          >
            <span>🍽️</span> All Items
          </button>

          {setShowParcelCharge && (
            <button
              type="button"
              className={`pos-category-item ${showParcelCharge ? 'active' : ''}`}
              onClick={() => { setShowParcelCharge(true); setShowSpecial(false); setSelectedCategory(''); setShowCategories(false); }}
            >
              <span>📦</span> Parcel Charges
            </button>
          )}

          <button
            type="button"
            className={`pos-category-item ${showSpecial && !showParcelCharge ? 'active' : ''}`}
            onClick={() => { setShowSpecial(true); setSelectedCategory(''); if (setShowParcelCharge) setShowParcelCharge(false); setShowCategories(false); }}
          >
            <span>⭐</span> Specials
          </button>

          <div className="pos-drawer-divider"><span>Menu</span></div>

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`pos-category-item ${selectedCategory === category && !showSpecial && !showParcelCharge ? 'active' : ''}`}
              onClick={() => { setSelectedCategory(category); setShowSpecial(false); if (setShowParcelCharge) setShowParcelCharge(false); setShowCategories(false); }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Main Menu Area */}
      <div className="pos-menu-area">
        <div className="pos-menu-filters">
          <button
            type="button"
            className="pos-categories-btn"
            onClick={() => setShowCategories(true)}
          >
            <CsLineIcons icon="menu" size="14" />
            {activeLabel}
          </button>

          <div className="pos-search-wrap">
            <span className="search-icon">
              <CsLineIcons icon="search" size="14" stroke="#94a3b8" />
            </span>
            <Form.Control
              className="pos-search-input"
              placeholder="Search dishes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button type="button" className="pos-search-clear" onClick={() => setSearchText('')}>
                <CsLineIcons icon="close" size="11" />
              </button>
            )}
          </div>

          <span className="pos-item-count">{totalItems} items</span>
        </div>

        <div className="pos-menu-grid">
          {!showParcelCharge ? (
            filteredMenuData.length === 0 ? (
              <div className="pos-empty-state">
                <div className="pos-empty-icon">🔍</div>
                <p className="pos-empty-text">No items found</p>
                <p className="pos-empty-sub">Try a different search or category</p>
              </div>
            ) : (
              filteredMenuData.map((category) => (
                <div key={category._id} className="mb-4">
                  <div className="pos-section-header">
                    <div
                      className="pos-section-dot"
                      style={{
                        background: category.meal_type === 'veg' ? '#10b981'
                          : category.meal_type === 'egg' ? '#f59e0b'
                          : '#ef4444'
                      }}
                    />
                    <span>{category.category}</span>
                    <div className="pos-section-line" />
                    <span className="pos-section-count">{category.dishes.length}</span>
                  </div>
                  <div className="pos-grid-5">
                    {category.dishes.map((dish) => {
                      const addedQty = getAddedQty(dish.dish_name);
                      return (
                        <div className="pos-grid-item" key={dish._id}>
                          <div className="pos-menu-card" onClick={() => addItemToOrder(dish)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && addItemToOrder(dish)}>
                            {/* Qty Badge */}
                            {addedQty > 0 && <div className="pos-added-badge">{addedQty} Added</div>}
                            
                            {/* Type Indicator */}
                            <div className={`pos-type-dot ${category.meal_type === 'veg' ? 'veg' : category.meal_type === 'egg' ? 'egg' : 'nonveg'}`} />
                            
                            {/* Image */}
                            <div className="pos-menu-img-wrap">
                              {dish.dish_image ? (
                                <img src={`${uploadDir}/${dish.dish_image}`} alt={dish.dish_name} className="pos-menu-img" />
                              ) : (
                                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                  <CsLineIcons icon="cupcake" size="30" opacity="0.3" />
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="pos-menu-details">
                              {dish.is_special && <div className="pos-special-star">⭐</div>}
                              <div className="pos-dish-name">{dish.dish_name}</div>
                              <div className="pos-dish-price">₹{dish.dish_price}</div>
                              <div className="pos-add-hint">+ Add</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )
          ) : (
            <div>
              <div className="pos-section-header">
                <div className="pos-section-dot" style={{ background: '#8b5cf6' }} />
                <span>Parcel Charges</span>
                <div className="pos-section-line" />
              </div>
              <div className="pos-grid-5">
                {containerCharges?.map((charge) => {
                  const addedQty = getAddedQty(`${charge.name} — ${charge.size}`);
                  return (
                    <div className="pos-grid-item" key={charge._id}>
                      <div className="pos-menu-card" onClick={() => addParcelCharge(charge)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && addParcelCharge(charge)}>
                        {addedQty > 0 && <div className="pos-added-badge">{addedQty} Added</div>}
                        <div className="pos-menu-details">
                          <div className="pos-dish-name">{charge.name} — {charge.size}</div>
                          <div className="pos-dish-price">₹{charge.price}</div>
                          <div className="pos-add-hint">+ Add</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MenuGrid;
