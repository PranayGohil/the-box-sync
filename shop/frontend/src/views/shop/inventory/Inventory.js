import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Form, Spinner, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';

const breadcrumbs = [
  { to: '', text: 'Home' },
  { to: 'inventory', text: 'Inventory Management' },
];

const styles = `
  .inv-search-input {
    border-radius: 10px !important;
    border: 1.5px solid #e5e7eb !important;
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    color: #334155 !important;
    height: 38px !important;
    padding: 0.375rem 0.75rem !important;
    transition: all 0.2s ease !important;
  }
  .inv-search-input:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 3px rgba(35,179,244,0.12) !important;
  }
  .inv-icon-btn {
    width: 38px !important;
    height: 38px !important;
    min-width: 38px !important;
    border-radius: 50% !important;
    border: 1.5px solid #23b3f4 !important;
    background: transparent !important;
    color: #23b3f4 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    line-height: 1 !important;
  }
  .inv-icon-btn:hover {
    background: #23b3f4 !important;
    color: #ffffff !important;
    transform: rotate(90deg);
  }

  /* Table styling */
  .inv-table {
    width: 100%;
    border-collapse: collapse;
  }
  .inv-table thead tr {
    background: #f8fafc;
    border-bottom: 2px solid #e5e7eb;
  }
  .inv-table thead th {
    padding: 10px 14px;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    white-space: nowrap;
  }
  .inv-table tbody tr {
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.12s;
  }
  .inv-table tbody tr:hover { background: #f8fafc; }
  .inv-table tbody td {
    padding: 12px 14px;
    font-size: 0.85rem;
    color: #334155;
    vertical-align: middle;
  }

  /* Mobile Card List */
  .inv-item-card {
    border-radius: 14px;
    border: 1.5px solid #e5e7eb;
    background: #ffffff;
    padding: 14px;
    margin-bottom: 10px;
    transition: box-shadow 0.15s;
  }
  .inv-item-card:hover {
    box-shadow: 0 4px 16px rgba(35,179,244,0.08);
  }
  .inv-card-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 12px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #f1f5f9;
  }
  .inv-card-stat-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .inv-card-stat-val {
    font-size: 0.88rem;
    font-weight: 800;
    color: #334155;
    margin-top: 2px;
  }
`;

const Inventory = () => {
  const [stockStatement, setStockStatement] = useState([]);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [statementSearch, setStatementSearch] = useState('');

  const fetchStockStatement = useCallback(async () => {
    try {
      setLoadingStatement(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/catalog/stock-sales-statement`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setStockStatement(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching stock sales statement:', err);
    } finally {
      setLoadingStatement(false);
    }
  }, []);

  useEffect(() => {
    fetchStockStatement();
  }, [fetchStockStatement]);

  const filteredItems = stockStatement.filter((row) =>
    !statementSearch ||
    row.item_name.toLowerCase().includes(statementSearch.toLowerCase()) ||
    (row.category && row.category.toLowerCase().includes(statementSearch.toLowerCase()))
  );

  return (
    <>
      <style>{styles}</style>
      <HtmlHead title="Inventory Management" description="Track item stock levels and sales statements." />

      {/* Header */}
      <div className="qsr-page-title-container">
        <Row className="align-items-center g-3">
          <Col xs="12" md="auto" className="me-auto">
            <h1 className="qsr-page-title">Inventory Management</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      <Card className="border-0 shadow-sm mb-4 mt-4" style={{ borderRadius: 16 }}>
        <Card.Body className="p-3 p-md-4">

          {/* Top Controls */}
          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-3">
            <div>
              <h5 className="fw-bold mb-1 text-primary">Item Stock &amp; Sales Statement</h5>
              <p className="text-muted small mb-0">Overview of initial stock, total sold quantity, and current available stock.</p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-sm-grow-0">
              <Form.Control
                type="text"
                placeholder="Search item or category..."
                className="inv-search-input flex-grow-1"
                style={{ minWidth: 180, maxWidth: 280 }}
                value={statementSearch}
                onChange={(e) => setStatementSearch(e.target.value)}
              />
              <button
                type="button"
                className="inv-icon-btn"
                onClick={fetchStockStatement}
                title="Refresh Stock Data"
              >
                <CsLineIcons icon="refresh-horizontal" size="16" />
              </button>
            </div>
          </div>

          {/* Loading */}
          {loadingStatement ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <Alert variant="light" className="text-center py-4 border-dashed rounded-3">
              {statementSearch ? 'No matching items found.' : 'No catalog items with stock tracking found. Set stock quantity on items in Add/Edit Catalog to start tracking.'}
            </Alert>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="d-none d-md-block">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th className="text-center">Total Stock</th>
                      <th className="text-center">PO Stock</th>
                      <th className="text-center">Total Sold</th>
                      <th className="text-center">Available Stock</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((row) => (
                      <tr key={row._id}>
                        <td>
                          <div className="fw-bold text-dark">{row.item_name}</div>
                          {row.variant_name && <div className="text-muted small">Variant: {row.variant_name}</div>}
                        </td>
                        <td><Badge bg="light" text="dark" className="border">{row.category || 'General'}</Badge></td>
                        <td className="text-center fw-semibold text-secondary">{row.total_stock != null ? row.total_stock : row.initial_stock}</td>
                        <td className="text-center fw-bold text-warning">{row.purchase_order_stock || 0}</td>
                        <td className="text-center fw-bold text-primary">{row.total_sold}</td>
                        <td className="text-center">
                          <span className={`fw-extrabold fs-6 ${row.current_stock === 0 ? 'text-danger' : row.current_stock <= 5 && row.current_stock !== 'Unlimited' ? 'text-warning' : 'text-success'}`}>
                            {row.current_stock}
                          </span>
                        </td>
                        <td className="text-center">
                          <Badge bg={row.status === 'Out of Stock' ? 'danger' : row.status === 'Low Stock' ? 'warning' : 'success'} className="px-3 py-2 rounded-pill">
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="d-md-none">
                {filteredItems.map((row) => (
                  <div className="inv-item-card" key={row._id}>
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>{row.item_name}</div>
                        {row.variant_name && <div className="text-muted small">Variant: {row.variant_name}</div>}
                        <Badge bg="light" text="dark" className="border mt-1">{row.category || 'General'}</Badge>
                      </div>
                      <Badge bg={row.status === 'Out of Stock' ? 'danger' : row.status === 'Low Stock' ? 'warning' : 'success'} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.68rem' }}>
                        {row.status}
                      </Badge>
                    </div>

                    <div className="inv-card-grid">
                      <div>
                        <div className="inv-card-stat-label">Total Stock</div>
                        <div className="inv-card-stat-val text-secondary">{row.total_stock != null ? row.total_stock : row.initial_stock}</div>
                      </div>
                      <div>
                        <div className="inv-card-stat-label">PO Stock</div>
                        <div className="inv-card-stat-val text-warning">{row.purchase_order_stock || 0}</div>
                      </div>
                      <div>
                        <div className="inv-card-stat-label">Total Sold</div>
                        <div className="inv-card-stat-val text-primary">{row.total_sold}</div>
                      </div>
                      <div>
                        <div className="inv-card-stat-label">Available</div>
                        <div className={`inv-card-stat-val ${row.current_stock === 0 ? 'text-danger' : row.current_stock <= 5 && row.current_stock !== 'Unlimited' ? 'text-warning' : 'text-success'}`}>
                          {row.current_stock}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </Card.Body>
      </Card>
    </>
  );
};

export default Inventory;
