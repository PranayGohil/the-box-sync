const {
  Product,
  Category,
  Brand,
  Unit,
  HSNMaster,
  TaxRate,
  PriceList,
  ProductBatch,
  StockBalance
} = require('../models');
const StockService = require('../services/StockService');

// @desc    Get all products with category, brand, stock and barcode filters
// @route   GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const { search, categoryId, brandId, itemType, lowStock, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId, isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { hsnSacCode: { $regex: search, $options: 'i' } }
      ];
    }

    if (categoryId) query.categoryId = categoryId;
    if (brandId) query.brandId = brandId;
    if (itemType) query.itemType = itemType;

    const total = await Product.countDocuments(query);
    let products = await Product.find(query)
      .populate('categoryId', 'name')
      .populate('brandId', 'name')
      .populate('unitId', 'name symbol')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (lowStock === 'true') {
      products = products.filter(p => p.currentStock <= (p.minStockAlert || 5));
    }

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID with warehouse stock breakdown & batches
// @route   GET /api/products/:id
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, businessId: req.businessId })
      .populate('categoryId')
      .populate('brandId')
      .populate('unitId');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const warehouseBalances = await StockBalance.find({ businessId: req.businessId, productId: product._id })
      .populate('warehouseId', 'name code')
      .populate('batchId', 'batchNumber expiryDate');

    const batches = await ProductBatch.find({ businessId: req.businessId, productId: product._id, isActive: true });

    res.status(200).json({
      success: true,
      data: {
        product,
        warehouseBalances,
        batches
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Product
// @route   POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const { openingStock, purchasePrice, warehouseId } = req.body;

    const product = await Product.create({
      ...req.body,
      businessId: req.businessId,
      currentStock: openingStock || 0
    });

    // If opening stock is specified, record stock balance and stock movement
    if (openingStock && Number(openingStock) > 0) {
      const { Warehouse } = require('../models');
      let targetWarehouseId = warehouseId;
      if (!targetWarehouseId) {
        const defaultWh = await Warehouse.findOne({ businessId: req.businessId, isDefault: true });
        targetWarehouseId = defaultWh?._id;
      }

      if (targetWarehouseId) {
        await StockService.addStock({
          businessId: req.businessId,
          warehouseId: targetWarehouseId,
          items: [{
            productId: product._id,
            name: product.name,
            quantity: Number(openingStock),
            rate: Number(purchasePrice) || 0
          }],
          voucherType: 'opening_stock',
          voucherNo: `OPN-${product.sku || product._id}`,
          referenceId: product._id,
          userId: req.user._id
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (soft-delete)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      { isDeleted: true },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get master options (Categories, Brands, Units, HSN, TaxRates)
// @route   GET /api/products/masters/options
exports.getMasterOptions = async (req, res, next) => {
  try {
    const categories = await Category.find({ businessId: req.businessId, isActive: true });
    const brands = await Brand.find({ businessId: req.businessId, isActive: true });
    const units = await Unit.find({ businessId: req.businessId, isActive: true });
    const taxRates = await TaxRate.find({ businessId: req.businessId, isActive: true });
    const priceLists = await PriceList.find({ businessId: req.businessId, isActive: true });
    const hsnCodes = await HSNMaster.find({ $or: [{ businessId: req.businessId }, { businessId: null }] }).limit(100);

    res.status(200).json({
      success: true,
      data: {
        categories,
        brands,
        units,
        taxRates,
        priceLists,
        hsnCodes
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Category
// @route   POST /api/products/masters/categories
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create({ ...req.body, businessId: req.businessId });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Brand
// @route   POST /api/products/masters/brands
exports.createBrand = async (req, res, next) => {
  try {
    const brand = await Brand.create({ ...req.body, businessId: req.businessId });
    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Unit
// @route   POST /api/products/masters/units
exports.createUnit = async (req, res, next) => {
  try {
    const unit = await Unit.create({ ...req.body, businessId: req.businessId });
    res.status(201).json({ success: true, data: unit });
  } catch (error) {
    next(error);
  }
};
