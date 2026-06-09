import React, { useState } from 'react';
import { Form, Modal, Button } from 'react-bootstrap';
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

  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedCustomizeDish, setSelectedCustomizeDish] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const handleDishClick = (dish) => {
    const hasVariants = !!dish.has_variants;
    const hasAddons = Array.isArray(dish.addons) && dish.addons.length > 0;

    if (hasVariants || hasAddons) {
      setSelectedCustomizeDish(dish);
      if (hasVariants && Array.isArray(dish.variants) && dish.variants.length > 0) {
        const firstAvailable = dish.variants.find((v) => v.is_available !== false) || dish.variants[0];
        setSelectedVariant(firstAvailable);
      } else {
        setSelectedVariant(null);
      }
      setSelectedAddons([]);
      setShowCustomizeModal(true);
    } else {
      addItemToOrder(dish);
    }
  };

  // Helper to get added quantity for a dish (sums quantities of all customized versions too)
  const getAddedQty = (dishName) => {
    return orderItems.filter((oi) => oi.dish_name === dishName).reduce((sum, oi) => sum + oi.quantity, 0);
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
            <span className="fw-bold" style={{ color: '#0f172a', fontSize: '14px' }}>
              Categories
            </span>
          </div>
          <button type="button" className="pos-drawer-close" onClick={() => setShowCategories(false)}>
            <CsLineIcons icon="close" size="13" />
          </button>
        </div>

        <div className="pos-drawer-body">
          <button
            type="button"
            className={`pos-category-item ${selectedCategory === '' && !showSpecial && !showParcelCharge ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('');
              setShowSpecial(false);
              if (setShowParcelCharge) setShowParcelCharge(false);
              setShowCategories(false);
            }}
          >
            <span role="img" aria-label="all items">
              🍽️
            </span>{' '}
            All Items
          </button>

          {setShowParcelCharge && (
            <button
              type="button"
              className={`pos-category-item ${showParcelCharge ? 'active' : ''}`}
              onClick={() => {
                setShowParcelCharge(true);
                setShowSpecial(false);
                setSelectedCategory('');
                setShowCategories(false);
              }}
            >
              <span role="img" aria-label="parcel">
                📦
              </span>{' '}
              Parcel Charges
            </button>
          )}

          <button
            type="button"
            className={`pos-category-item ${showSpecial && !showParcelCharge ? 'active' : ''}`}
            onClick={() => {
              setShowSpecial(true);
              setSelectedCategory('');
              if (setShowParcelCharge) setShowParcelCharge(false);
              setShowCategories(false);
            }}
          >
            <span role="img" aria-label="specials">
              ⭐
            </span>{' '}
            Specials
          </button>

          <div className="pos-drawer-divider">
            <span>Menu</span>
          </div>

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`pos-category-item ${selectedCategory === category && !showSpecial && !showParcelCharge ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(category);
                setShowSpecial(false);
                if (setShowParcelCharge) setShowParcelCharge(false);
                setShowCategories(false);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Main Menu Area */}
      <div className="pos-menu-area">
        <div className="pos-menu-filters">
          <button type="button" className="pos-categories-btn" onClick={() => setShowCategories(true)}>
            <CsLineIcons icon="menu" size="14" />
            {activeLabel}
          </button>

          <div className="pos-search-wrap">
            <span className="search-icon">
              <CsLineIcons icon="search" size="14" stroke="#94a3b8" />
            </span>
            <Form.Control className="pos-search-input" placeholder="Search dishes..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
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
                <div className="pos-empty-icon">
                  <span role="img" aria-label="search">
                    🔍
                  </span>
                </div>
                <p className="pos-empty-text">No items found</p>
                <p className="pos-empty-sub">Try a different search or category</p>
              </div>
            ) : (
              filteredMenuData.map((category) => (
                <div key={category._id} className="mb-4">
                  <div className="pos-section-header">
                    <span>{category.category}</span>
                    <div className="pos-section-line" />
                    <span className="pos-section-count">{category.dishes.length}</span>
                  </div>
                  <div className="pos-grid-5">
                    {category.dishes.map((dish) => {
                      const addedQty = getAddedQty(dish.dish_name);
                      return (
                        <div className="pos-grid-item" key={dish._id}>
                          <div
                            className="pos-menu-card"
                            onClick={() => handleDishClick(dish)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleDishClick(dish)}
                          >
                            {/* Qty Badge */}
                            {addedQty > 0 && <div className="pos-added-badge">{addedQty} Added</div>}

                            {/* Type Indicator */}
                            <div className={`pos-type-dot ${(dish.meal_type || 'veg') === 'veg' ? 'veg-dot' : (dish.meal_type || 'veg') === 'egg' ? 'egg-dot' : 'nonveg-dot'}`} />

                            {/* Image */}
                            <div className="pos-menu-img-wrap">
                              {dish.dish_img ? (
                                <img src={`${uploadDir}/${dish.dish_img}`} alt={dish.dish_name} className="pos-menu-img" />
                              ) : (
                                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                  <CsLineIcons icon="cupcake" size="30" opacity="0.3" />
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="pos-menu-details">
                              {dish.is_special && (
                                <div className="pos-special-star">
                                  <span role="img" aria-label="special">
                                    ⭐
                                  </span>
                                </div>
                              )}
                              <div className="pos-dish-name">
                                {dish.dish_name}
                                {(dish.has_variants || (Array.isArray(dish.addons) && dish.addons.length > 0)) && (
                                  <span className="ms-1 text-primary" style={{ fontSize: '10px', fontWeight: '700' }} title="Customizable (Sizes/Add-ons)">
                                    *
                                  </span>
                                )}
                              </div>
                              <div className="pos-dish-price">
                                {dish.has_variants && Array.isArray(dish.variants) && dish.variants.length > 0 ? (
                                  (() => {
                                    const prices = dish.variants.map((v) => Number(v.price) || 0);
                                    const min = Math.min(...prices);
                                    const max = Math.max(...prices);
                                    return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
                                  })()
                                ) : (
                                  `₹${dish.dish_price || 0}`
                                )}
                              </div>
                              {(dish.has_variants || (Array.isArray(dish.addons) && dish.addons.length > 0)) && (
                                <div className="text-primary fw-bold" style={{ fontSize: '9px', marginTop: '2px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                                  Customizable
                                </div>
                              )}
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
                      <div
                        className="pos-menu-card"
                        onClick={() => addParcelCharge(charge)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && addParcelCharge(charge)}
                      >
                        {addedQty > 0 && <div className="pos-added-badge">{addedQty} Added</div>}
                        <div className="pos-menu-details">
                          <div className="pos-dish-name">
                            {charge.name} — {charge.size}
                          </div>
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

      {/* Customize Dish Modal */}
      {selectedCustomizeDish && (
        <Modal show={showCustomizeModal} onHide={() => setShowCustomizeModal(false)} centered className="customize-modal" size="md">
          <style>{`
            .customize-modal .modal-content {
              background: rgba(255, 255, 255, 0.9) !important;
              backdrop-filter: blur(20px) !important;
              -webkit-backdrop-filter: blur(20px) !important;
              border: 1px solid rgba(255, 255, 255, 0.5) !important;
              border-radius: 24px !important;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
              overflow: hidden;
            }
            .customize-modal .modal-header {
              border-bottom: 1px solid rgba(226, 232, 240, 0.8);
              padding: 20px 24px;
            }
            .customize-modal .modal-body {
              padding: 24px;
              max-height: 60vh;
              overflow-y: auto;
            }
            .customize-modal .modal-footer {
              border-top: 1px solid rgba(226, 232, 240, 0.8);
              padding: 20px 24px;
              background: #f8fafc;
            }
            .customize-option-card {
              background: #ffffff;
              border: 1.5px solid #e2e8f0;
              border-radius: 14px;
              padding: 14px 18px;
              margin-bottom: 10px;
              cursor: pointer;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              display: flex;
              align-items: center;
              justify-content: space-between;
              box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            }
            .customize-option-card:hover {
              border-color: #23b3f4;
              background: rgba(35, 179, 244, 0.02);
              transform: translateY(-1px);
            }
            .customize-option-card.active {
              border-color: #23b3f4;
              background: rgba(35, 179, 244, 0.06);
              box-shadow: 0 4px 12px rgba(35, 179, 244, 0.1);
            }
            .custom-radio-circle {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 2px solid #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
            }
            .customize-option-card.active .custom-radio-circle {
              border-color: #23b3f4;
            }
            .custom-radio-inner {
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: #23b3f4;
              transform: scale(0);
              transition: all 0.2s;
            }
            .customize-option-card.active .custom-radio-inner {
              transform: scale(1);
            }
            .custom-checkbox-box {
              width: 18px;
              height: 18px;
              border-radius: 4px;
              border: 2px solid #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
            }
            .customize-option-card.active .custom-checkbox-box {
              border-color: #23b3f4;
              background: #23b3f4;
            }
          `}</style>
          <Modal.Header closeButton className="border-0">
            <div>
              <Modal.Title className="fw-bold mb-1" style={{ color: '#0f172a', fontSize: '1.25rem' }}>
                Customize Dish
              </Modal.Title>
              <div className="text-muted small fw-semibold">{selectedCustomizeDish.dish_name}</div>
            </div>
          </Modal.Header>
          <Modal.Body>
            {/* Sizes / Variants Section */}
            {selectedCustomizeDish.has_variants && Array.isArray(selectedCustomizeDish.variants) && selectedCustomizeDish.variants.length > 0 && (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold text-uppercase tracking-wider text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    Select Size <span className="text-danger">*</span>
                  </span>
                  <span className="badge bg-light text-dark rounded-pill py-1 px-2.5 small fw-bold">Required</span>
                </div>
                <div>
                  {selectedCustomizeDish.variants
                    .filter((v) => v.is_available !== false)
                    .map((v, idx) => {
                      const isActive = selectedVariant && (
                        (selectedVariant._id && v._id && selectedVariant._id === v._id) ||
                        (selectedVariant.size_name === v.size_name && Number(selectedVariant.price) === Number(v.price) && selectedVariant.extra === v.extra)
                      );
                      return (
                        <div key={v._id || idx} className={`customize-option-card ${isActive ? 'active' : ''}`} onClick={() => setSelectedVariant(v)}>
                          <div className="d-flex align-items-center gap-3">
                            <div className="custom-radio-circle">
                              <div className="custom-radio-inner" />
                            </div>
                            <div>
                              <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                                {v.size_name}
                              </div>
                              {v.extra && (
                                <div className="text-muted small" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                                  {v.extra}
                                </div>
                              )}
                              {v.quantity && (
                                <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                  Qty: {v.quantity} {v.unit || ''}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="fw-bold text-primary" style={{ fontSize: '0.95rem' }}>
                            ₹{v.price}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Addons Section */}
            {Array.isArray(selectedCustomizeDish.addons) && selectedCustomizeDish.addons.length > 0 && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold text-uppercase tracking-wider text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    Select Add-ons
                  </span>
                  <span className="badge bg-light text-muted rounded-pill py-1 px-2.5 small fw-bold">Optional</span>
                </div>
                <div>
                  {selectedCustomizeDish.addons
                    .filter((a) => a.is_available !== false)
                    .map((a) => {
                      const isChecked = selectedAddons.some((addon) => addon.addon_name === a.addon_name);
                      return (
                        <div
                          key={a.addon_name}
                          className={`customize-option-card ${isChecked ? 'active' : ''}`}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedAddons(selectedAddons.filter((addon) => addon.addon_name !== a.addon_name));
                            } else {
                              setSelectedAddons([...selectedAddons, a]);
                            }
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="custom-checkbox-box">{isChecked && <CsLineIcons icon="check" size="10" className="text-white" />}</div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                              {a.addon_name}
                            </div>
                          </div>
                          <div className="fw-bold text-muted small" style={{ fontSize: '0.9rem' }}>
                            +₹{a.price}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button
              variant="outline-light"
              onClick={() => setShowCustomizeModal(false)}
              className="rounded-pill px-4 fw-bold custom-btn-outline btn btn-outline-primary"
            >
              Cancel
            </Button>
            <Button
              disabled={selectedCustomizeDish.has_variants && !selectedVariant}
              onClick={() => {
                const basePrice = selectedVariant ? Number(selectedVariant.price) : Number(selectedCustomizeDish.dish_price);
                const addonsPrice = selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0);
                const finalItemPrice = basePrice + addonsPrice;

                const customizedItem = {
                  ...selectedCustomizeDish,
                  dish_price: finalItemPrice,
                  selected_variant: selectedVariant
                    ? {
                      size_name: selectedVariant.size_name,
                      price: Number(selectedVariant.price),
                      extra: selectedVariant.extra || '',
                    }
                    : undefined,
                  selected_addons: selectedAddons.map((addon) => ({
                    addon_name: addon.addon_name,
                    price: Number(addon.price),
                  })),
                };

                addItemToOrder(customizedItem);
                setShowCustomizeModal(false);
              }}
              className="px-5 py-2 custom-btn-outline d-flex align-items-center gap-2"
              style={{ background: '#23b3f4', border: 'none', borderRadius: '50px', color: '#fff', fontWeight: 700 }}
            >
              <CsLineIcons icon="plus" size="18" />
              Add to Cart • ₹
              {(
                (selectedVariant ? Number(selectedVariant.price) : Number(selectedCustomizeDish.dish_price)) +
                selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0)
              ).toFixed(0)}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default MenuGrid;
