const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMasterOptions,
  createCategory,
  createBrand,
  createUnit
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);
router.use(tenantContext);

router.get('/', requirePermission('products', 'view'), getProducts);
router.get('/masters/options', getMasterOptions);
router.post('/masters/categories', createCategory);
router.post('/masters/brands', createBrand);
router.post('/masters/units', createUnit);
router.get('/:id', requirePermission('products', 'view'), getProductById);
router.post('/', requirePermission('products', 'create'), createProduct);
router.put('/:id', requirePermission('products', 'edit'), updateProduct);
router.delete('/:id', requirePermission('products', 'delete'), deleteProduct);

module.exports = router;
