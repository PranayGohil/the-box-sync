import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';
import { ExportButtons } from '../../components/ExportButtons';

export const Products = () => {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    hsnSacCode: '',
    categoryId: '',
    brandId: '',
    unitId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    taxRate: 18,
    minStockAlert: 10,
    openingStock: 0
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/products?search=${encodeURIComponent(search)}`;
      if (lowStockOnly) url += '&lowStock=true';
      if (categoryFilter) url += `&category=${categoryFilter}`;

      const res = await api.get(url);
      if (res.data.success) setProducts(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, lowStockOnly, categoryFilter]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const res = await api.get('/products/masters/options');
        if (res.data.success) {
          setCategories(res.data.data.categories || []);
          setBrands(res.data.data.brands || []);
          setUnits(res.data.data.units || []);
        }
      } catch (e) {}
    };
    loadMasters();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `${Math.floor(8900000000000 + Math.random() * 9999999999)}`,
      hsnSacCode: '85183000',
      categoryId: categories[0]?._id || '',
      brandId: brands[0]?._id || '',
      unitId: units[0]?._id || '',
      purchasePrice: 100,
      sellingPrice: 150,
      taxRate: 18,
      minStockAlert: 10,
      openingStock: 20
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      hsnSacCode: product.hsnSacCode || '',
      categoryId: product.categoryId?._id || product.categoryId || '',
      brandId: product.brandId?._id || product.brandId || '',
      unitId: product.unitId?._id || product.unitId || '',
      purchasePrice: product.purchasePrice || 0,
      sellingPrice: product.sellingPrice || 0,
      taxRate: product.taxRate || 18,
      minStockAlert: product.minStockAlert || 5,
      openingStock: product.openingStock || 0
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, formData);
        if (res.data.success) {
          addToast('Product updated successfully!', 'success');
          setShowModal(false);
          fetchProducts();
        }
      } else {
        const res = await api.post('/products', formData);
        if (res.data.success) {
          addToast('Product created with opening inventory!', 'success');
          setShowModal(false);
          fetchProducts();
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save product', 'error');
    }
  };

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Top Metrics Calculation
  const totalProductsCount = products.length;
  const totalStockQuantity = products.reduce((sum, p) => sum + (Number(p.currentStock) || 0), 0);
  const totalStockValuation = products.reduce(
    (sum, p) => sum + ((Number(p.currentStock) || 0) * (Number(p.purchasePrice || p.sellingPrice) || 0)),
    0
  );
  const lowStockCount = products.filter((p) => (Number(p.currentStock) || 0) <= (Number(p.minStockAlert) || 5)).length;

  const columns = [
    {
      header: 'Product Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.name}</div>
          <div className="d-flex gap-2 small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
            <span>SKU: {row.sku || '-'}</span>
            <span>• Barcode: {row.barcode || '-'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Category & Brand',
      accessor: 'categoryId',
      render: (row) => (
        <div className="small">
          <span className="badge bg-light text-dark border me-1">{row.categoryId?.name || 'General'}</span>
          {row.brandId?.name && <span className="text-muted font-mono" style={{ fontSize: '0.72rem' }}>{row.brandId.name}</span>}
        </div>
      )
    },
    {
      header: 'HSN/SAC',
      accessor: 'hsnSacCode',
      render: (row) => <span className="font-mono text-muted">{row.hsnSacCode || '-'}</span>
    },
    {
      header: 'Selling Price (₹)',
      accessor: 'sellingPrice',
      align: 'right',
      render: (row) => <span className="fw-bold font-mono text-primary">₹{fmt(row.sellingPrice)}</span>
    },
    {
      header: 'GST Rate',
      accessor: 'taxRate',
      align: 'center',
      render: (row) => <span className="badge bg-light text-dark border">{row.taxRate}%</span>
    },
    {
      header: 'Stock Status',
      accessor: 'currentStock',
      align: 'center',
      render: (row) => {
        const isLow = (Number(row.currentStock) || 0) <= (Number(row.minStockAlert) || 5);
        return (
          <span
            className={`badge ${
              isLow
                ? 'bg-danger-subtle text-danger border border-danger-subtle'
                : 'bg-success-subtle text-success border border-success-subtle'
            } fw-bold`}
          >
            {row.currentStock} {row.unitId?.symbol || 'PCS'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <button
          className="btn btn-sm btn-outline-secondary py-1 px-2"
          title="Edit Product"
          onClick={() => handleOpenEditModal(row)}
        >
          <i className="bi bi-pencil"></i>
        </button>
      )
    }
  ];

  return (
    <div className="products-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Products & Catalog Master
          </h4>
          <p className="text-muted small mb-0">
            Manage SKU barcodes, pricing, HSN tax rates, and warehouse reorder thresholds
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end align-items-center flex-wrap">
          <ExportButtons
            filename="Products_Inventory"
            title="Products & Inventory Catalog"
            headers={['Product Name', 'SKU', 'Barcode', 'HSN/SAC', 'Category', 'Brand', 'Purchase Price (Rs)', 'Selling Price (Rs)', 'GST Rate %', 'Stock Qty', 'Unit']}
            data={products.map((p) => [
              p.name,
              p.sku || '-',
              p.barcode || '-',
              p.hsnSacCode || '-',
              p.categoryId?.name || '-',
              p.brandId?.name || '-',
              p.purchasePrice || 0,
              p.sellingPrice || 0,
              p.taxRate || 0,
              p.currentStock || 0,
              p.unitId?.shortName || p.unit || 'unit'
            ])}
          />
          <button className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0 text-nowrap" onClick={handleOpenAddModal}>
            <i className="bi bi-plus-lg me-1"></i> Add New Product
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL PRODUCTS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalProductsCount} Items
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-boxes"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>STOCK QUANTITY</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                {totalStockQuantity} Units
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>STOCK VALUATION</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalStockValuation)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>LOW STOCK ALERT</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                {lowStockCount} Low Items
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search products by name, SKU, or Barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="btn btn-sm btn-link text-muted position-absolute end-0 top-0 p-1"
                  onClick={() => setSearch('')}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm fw-semibold"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3 d-flex align-items-center">
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="lowStockCheck"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label className="form-check-label small fw-bold text-danger ms-1 text-nowrap" htmlFor="lowStockCheck">
                Low Stock Only
              </label>
            </div>
          </div>

          <div className="col-12 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={fetchProducts}
              title="Refresh Products"
            >
              <i className="bi bi-arrow-clockwise"></i> <span className="d-md-none ms-1">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Desktop & Tablet View (DataTable, hidden on mobile <768px) */}
      <div className="card-zenith d-none d-md-block">
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          emptyMessage="No products found in catalog"
          emptyIcon="bi-box-seam"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-box-seam fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Products Found</div>
            <div className="small">Click "Add New Product" to create your first catalog item.</div>
          </div>
        ) : (
          products.map((prod) => {
            const isLow = (Number(prod.currentStock) || 0) <= (Number(prod.minStockAlert) || 5);

            return (
              <div key={prod._id} className="invoice-card-mobile">
                {/* Header */}
                <div className="invoice-card-mobile-header">
                  <div className="fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '65%' }}>
                    {prod.name}
                  </div>
                  <div className="fw-extrabold font-mono fs-6 text-primary">
                    ₹{fmt(prod.sellingPrice)}
                  </div>
                </div>

                {/* SKU, Barcode & Category */}
                <div className="mb-2">
                  <div className="d-flex gap-2 small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                    <span>SKU: {prod.sku || '-'}</span>
                    <span>• {prod.categoryId?.name || 'General'}</span>
                  </div>
                </div>

                {/* Price and GST strip */}
                <div className="d-flex justify-content-between font-mono small text-muted py-1 px-2 mb-2 bg-light rounded border" style={{ fontSize: '0.75rem' }}>
                  <span>Cost: <strong className="text-dark">₹{fmt(prod.purchasePrice)}</strong></span>
                  <span>GST: <strong className="text-dark">{prod.taxRate}%</strong></span>
                </div>

                {/* Stock & Action */}
                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span
                    className={`badge ${
                      isLow
                        ? 'bg-danger-subtle text-danger border border-danger-subtle'
                        : 'bg-success-subtle text-success border border-success-subtle'
                    } fw-bold`}
                    style={{ fontSize: '0.72rem' }}
                  >
                    Stock: {prod.currentStock} {prod.unitId?.symbol || 'PCS'} {isLow && '(Low)'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm py-1 px-3 d-flex align-items-center gap-1"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => handleOpenEditModal(prod)}
                  >
                    <i className="bi bi-pencil"></i> Edit
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
              <div className="modal-header bg-light px-3 px-sm-4 py-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h5 className="modal-title fw-bold mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-box-seam text-primary"></i>
                    {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
                  </h5>
                  <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    {editingProduct ? `Updating SKU #${formData.sku || 'N/A'}` : 'Configure pricing, tax slabs, and warehouse reorder threshold'}
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-3 p-sm-4" style={{ background: '#f8fafc', maxHeight: 'calc(80vh - 120px)' }}>
                  {/* Section 1: Basic Info */}
                  <div className="card p-3 mb-3 border bg-white rounded-3 shadow-none">
                    <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      1. Product Identification
                    </div>
                    <div className="row g-2 g-sm-3">
                      <div className="col-12">
                        <label className="form-label small fw-bold mb-1">Product Name*</label>
                        <input
                          type="text"
                          className="form-control form-control-sm fw-bold"
                          placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>SKU Code</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Barcode (EAN-13)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono"
                          value={formData.barcode}
                          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>HSN / SAC Code</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono"
                          placeholder="e.g. 85183000"
                          value={formData.hsnSacCode}
                          onChange={(e) => setFormData({ ...formData, hsnSacCode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Classification & Units */}
                  <div className="card p-3 mb-3 border bg-white rounded-3 shadow-none">
                    <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      2. Classification & Measurement
                    </div>
                    <div className="row g-2 g-sm-3">
                      <div className="col-12 col-sm-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Category</label>
                        <select
                          className="form-select form-select-sm fw-semibold"
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        >
                          <option value="">-- Choose Category --</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-6 col-sm-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Brand</label>
                        <select
                          className="form-select form-select-sm fw-semibold"
                          value={formData.brandId}
                          onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                        >
                          <option value="">-- Choose Brand --</option>
                          {brands.map((b) => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-6 col-sm-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Measurement Unit</label>
                        <select
                          className="form-select form-select-sm fw-semibold"
                          value={formData.unitId}
                          onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                        >
                          <option value="">-- Unit (e.g. PCS) --</option>
                          {units.map((u) => (
                            <option key={u._id} value={u._id}>{u.name} ({u.symbol})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Pricing & Tax */}
                  <div className="card p-3 mb-3 border bg-white rounded-3 shadow-none">
                    <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      3. Pricing & GST Slab
                    </div>
                    <div className="row g-2 g-sm-3">
                      <div className="col-6 col-sm-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Purchase Cost (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm font-mono"
                          value={formData.purchasePrice}
                          onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-6 col-sm-4">
                        <label className="form-label small fw-bold mb-1" style={{ fontSize: '0.75rem' }}>Selling Price (₹)*</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm font-mono fw-bold text-primary"
                          value={formData.sellingPrice}
                          onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="col-12 col-sm-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>GST Tax Rate*</label>
                        <select
                          className="form-select form-select-sm fw-semibold"
                          value={formData.taxRate}
                          onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                        >
                          <option value="0">0% (Nil)</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                    </div>
                    {formData.sellingPrice > 0 && formData.purchasePrice > 0 && (
                      <div className="mt-2 text-muted small font-mono" style={{ fontSize: '0.72rem' }}>
                        Gross Margin: <strong className="text-success">₹{(formData.sellingPrice - formData.purchasePrice).toFixed(2)}</strong> ({(((formData.sellingPrice - formData.purchasePrice) / formData.purchasePrice) * 100).toFixed(1)}%)
                      </div>
                    )}
                  </div>

                  {/* Section 4: Inventory Thresholds */}
                  {!editingProduct && (
                    <div className="card p-3 border bg-white rounded-3 shadow-none">
                      <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                        4. Opening Stock & Reorder Threshold
                      </div>
                      <div className="row g-2 g-sm-3">
                        <div className="col-6">
                          <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Opening Stock Qty</label>
                          <input
                            type="number"
                            className="form-control form-control-sm font-mono fw-bold text-success"
                            value={formData.openingStock}
                            onChange={(e) => setFormData({ ...formData, openingStock: Number(e.target.value) })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Min Stock Alert</label>
                          <input
                            type="number"
                            className="form-control form-control-sm font-mono text-danger fw-bold"
                            value={formData.minStockAlert}
                            onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer bg-white d-flex flex-column-reverse flex-sm-row justify-content-end gap-2 p-3 border-top">
                  <button type="button" className="btn btn-outline-secondary btn-sm w-100 w-sm-auto text-nowrap" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-zenith btn-sm w-100 w-sm-auto text-nowrap fw-bold">
                    {editingProduct ? 'Update Product' : 'Save Product & Add Inventory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
