import React from 'react';
import { Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
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
  addItemToOrder,
  // Optional props for Takeaway Parcel Charges
  showParcelCharge,
  setShowParcelCharge,
  containerCharges,
  addParcelCharge,
}) => {
  return (
    <>
      <style>{`
        .menu-content-transition {
            margin-left: 0 !important;
          }
        .menu-sidebar {
          position: fixed !important;
          top: 0;
          left: 0;
          bottom: 0;
          height: 100vh !important;
          z-index: 1050 !important;
          box-shadow: ${showCategories ? '4px 0 15px rgba(0,0,0,0.15)' : 'none'};
        }
      `}</style>

      {/* Mobile Backdrop */}
      {showCategories && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
          style={{ opacity: 0.5, zIndex: 1045 }}
          onClick={() => setShowCategories(false)}
        />
      )}

      {/* 🔥 SIDEBAR */}
      <div
        className={`bg-light border-end position-absolute h-100 menu-sidebar ${showCategories ? 'start-0' : ''}`}
        style={{
          width: '220px',
          transform: showCategories ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          zIndex: 10,
          overflowY: 'auto',
        }}
      >
        <div className="p-2">
          <div className="d-flex justify-content-between align-items-center mb-2 px-2 pt-1 pb-2 border-bottom">
            <span className="fw-bold text-muted">Categories</span>
            <Button variant="link" className="p-0 text-dark" onClick={() => setShowCategories(false)}>
              <CsLineIcons icon="close" />
            </Button>
          </div>

          <div
            onClick={() => {
              setSelectedCategory('');
              setShowCategories(false);
            }}
            className={`py-2 px-2 mb-1 rounded ${selectedCategory === '' ? 'bg-primary text-white' : 'bg-white'}`}
            style={{ cursor: 'pointer', fontSize: '13px' }}
          >
            All
          </div>

          {categories.map((category) => (
            <div
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setShowCategories(false);
              }}
              className={`py-2 px-2 mb-1 rounded ${selectedCategory === category ? 'bg-primary text-white' : 'bg-white'}`}
              style={{ cursor: 'pointer', fontSize: '13px' }}
            >
              {category}
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 MAIN CONTENT */}
      <div className="flex-grow-1 p-2 menu-content-transition">
        {/* FILTERS */}
        <Row className="mb-2 g-1 align-items-center">
          <Col xs="2" md="1">
            <Button variant="outline-primary" size="sm" onClick={() => setShowCategories((prev) => !prev)}>
              {showCategories ? <i className="bi bi-x" /> : <i className="bi bi-list" />}
            </Button>
          </Col>
          <Col xs="10" md="6">
            <Form.Control size="sm" placeholder="Search items..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </Col>
          <Col xs="12" md="5" className="d-flex gap-3 align-items-center mt-2 mt-md-0">
            <Form.Check type="checkbox" label="Special" checked={showSpecial} onChange={(e) => setShowSpecial(e.target.checked)} disabled={showParcelCharge} />
            {setShowParcelCharge && (
              <Form.Check type="checkbox" label="Parcel Charges" checked={showParcelCharge} onChange={(e) => setShowParcelCharge(e.target.checked)} />
            )}
          </Col>
        </Row>

        {/* MENU ITEMS / PARCEL CHARGES */}
        <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
          {!showParcelCharge ? (
            filteredMenuData.map((category) => (
              <div key={category._id} className="mb-4">
                <h6 className="text-muted mb-3">{category.category}</h6>
                <Row className="g-2">
                  {category.dishes.map((dish) => (
                    <Col xs="6" md="4" lg="3" xl="2" key={dish._id}>
                      <Card className="sh-14 hover-border-primary mb-2" onClick={() => addItemToOrder(dish)}>
                        <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                          <p className="cta-8 mb-2 lh-1">{dish.dish_name}</p>
                          <p className="mb-0" style={{ fontWeight: 'bold' }}>
                            ₹{dish.dish_price}
                          </p>
                        </Card.Body>
                        <Badge
                          variant="outline"
                          className={`text-white mb-2 ${category.meal_type === 'veg' ? 'bg-success' : category.meal_type === 'egg' ? 'bg-warning' : 'bg-danger'
                            }`}
                          style={{ position: 'absolute', top: '3px', right: '5px' }}
                        >
                          {category.meal_type === 'veg' ? 'Veg' : category.meal_type === 'egg' ? 'Egg' : 'Non-Veg'}
                        </Badge>
                        {dish.is_special && (
                          <i className="bi bi-stars text-warning" style={{ fontSize: '20px', position: 'absolute', top: '0px', left: '2px' }} />
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ))
          ) : (
            <Row className="g-2">
              {containerCharges?.map((charge) => (
                <Col xs="6" md="4" lg="3" xl="2" key={charge._id}>
                  <Card className="sh-14 hover-border-primary mb-2" onClick={() => addParcelCharge(charge)}>
                    <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                      <p className="cta-8 mb-2 lh-1">
                        {charge.name} - {charge.size}
                      </p>
                      <p className="mb-0" style={{ fontWeight: 'bold' }}>
                        ₹{charge.price}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
    </>
  );
};

export default MenuGrid;
