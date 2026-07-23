const fs = require("fs");
const path = require("path");
const Catalog = require("../models/catalogModel");
const User = require("../models/userModel");
const { count } = require("console");

const addCatalog = async (req, res) => {
  try {
    const user_id = req.user._id;
    let { category, counter, hide_on_kot, items, is_food_category } = req.body;

    let parsedDishes;

    if (typeof items === "string") {
      try {
        parsedDishes = JSON.parse(items);
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid items JSON" });
      }
    } else if (Array.isArray(items)) {
      parsedDishes = items;
    } else {
      return res.status(400).json({
        success: false,
        message: "items must be an array or JSON string",
      });
    }

    if (
      !category ||
      !Array.isArray(parsedDishes) ||
      parsedDishes.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const uploadedImages = req.files?.item_img || [];
    uploadedImages.forEach((file, index) => {
      if (parsedDishes[index]) {
        parsedDishes[index].item_img = "/catalog/items/" + file.filename;
      }
    });

    parsedDishes = parsedDishes.map((item) => {
      let parsedVariants;
      if (item.variants) {
        if (typeof item.variants === "string") {
          try {
            parsedVariants = JSON.parse(item.variants);
          } catch (e) {
            // ignore invalid
          }
        } else if (Array.isArray(item.variants)) {
          parsedVariants = item.variants;
        }
      }

      let parsedAddons;
      if (item.addons) {
        if (typeof item.addons === "string") {
          try {
            parsedAddons = JSON.parse(item.addons);
          } catch (e) {
            // ignore invalid
          }
        } else if (Array.isArray(item.addons)) {
          parsedAddons = item.addons;
        }
      }

      return {
        ...item,
        type: item.type || "veg",
        barcode: item.barcode || (Array.isArray(parsedVariants) && parsedVariants[0] ? parsedVariants[0].barcode : null),
        item_price:
          Array.isArray(parsedVariants) && parsedVariants[0]
            ? Number(parsedVariants[0].price)
            : Number(item.item_price || 0),
        stock_quantity: item.stock_quantity != null && item.stock_quantity !== "" ? Number(item.stock_quantity) : null,
        initial_stock: item.stock_quantity != null && item.stock_quantity !== "" ? Number(item.stock_quantity) : 0,
        has_variants:
          Array.isArray(parsedVariants) ? parsedVariants.length > 1 : false,
        variants: Array.isArray(parsedVariants)
          ? parsedVariants.map((v) => ({
            size_name: v.size_name,
            price: v.price != null && v.price !== "" ? Number(v.price) : 0,
            extra: v.extra,
            barcode: v.barcode || null,
            is_available: v.is_available !== false,
            stock_quantity: v.stock_quantity != null && v.stock_quantity !== "" ? Number(v.stock_quantity) : null,
            initial_stock: v.stock_quantity != null && v.stock_quantity !== "" ? Number(v.stock_quantity) : 0,
          }))
          : undefined,
        addons: Array.isArray(parsedAddons)
          ? parsedAddons.map((a) => ({
            addon_name: a.addon_name,
            price: a.price != null && a.price !== "" ? Number(a.price) : 0,
            is_available: a.is_available !== false,
          }))
          : undefined,
      };
    });

    const isHideOnKot = typeof hide_on_kot === "string" ? hide_on_kot === "true" : !!hide_on_kot;

    const filter = { user_id, category };
    const existingCatalog = await Catalog.findOne(filter);

    let resultMenu;
    if (existingCatalog) {
      const updatedDishes = [...existingCatalog.items];

      parsedDishes.forEach((newDish) => {
        const existingIndex = updatedDishes.findIndex((d) =>
          (newDish._id && d._id.toString() === newDish._id.toString()) ||
          (d.item_name.toLowerCase() === newDish.item_name.toLowerCase())
        );

        if (existingIndex !== -1) {
          const existingDish = updatedDishes[existingIndex];
          updatedDishes[existingIndex] = {
            ...existingDish.toObject ? existingDish.toObject() : existingDish,
            ...newDish,
            _id: existingDish._id,
            item_img: newDish.item_img || existingDish.item_img,
          };
        } else {
          updatedDishes.push(newDish);
        }
      });

      existingCatalog.items = updatedDishes;
      existingCatalog.counter = counter || existingCatalog.counter;
      existingCatalog.hide_on_kot = isHideOnKot;
      if (is_food_category !== undefined) {
        existingCatalog.is_food_category = typeof is_food_category === "string" ? is_food_category === "true" : !!is_food_category;
      }

      resultMenu = await existingCatalog.save();
    } else {
      resultMenu = new Catalog({
        user_id,
        category,
        counter: counter || null,
        hide_on_kot: isHideOnKot,
        is_food_category: typeof is_food_category === "string" ? is_food_category === "true" : !!is_food_category,
        items: parsedDishes,
      });
      await resultMenu.save();
    }

    res.status(200).json({
      success: true,
      message: "Catalog saved",
      data: [resultMenu],
    });
  } catch (error) {
    console.error("Error adding catalog:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getCatalogData = async (req, res) => {
  try {
    const query = { user_id: req.user._id };

    const projection = {
      category: 1,
      counter: 1,
      hide_on_kot: 1,
      items: 1,
      show_on_website: 1,
    };

    const catalogData = await Catalog.find(query).select(projection).lean();

    res.json({ success: true, data: catalogData });
  } catch (error) {
    console.error("Error fetching catalog data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getCatalogDataByResCode = async (req, res) => {
  try {
    const restaurant_code = req.params.res_code;

    const restaurant = await User.findOne({ restaurant_code })
      .select("_id, name")
      .lean();
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, error: "Restaurant not found" });
    }
    const user_id = restaurant._id;
    const restaurant_name = restaurant.name;

    const catalogData = await Catalog.find({ user_id }).lean();

    res.json({ success: true, data: catalogData, restaurant_name });
  } catch (error) {
    console.error("Error fetching catalog data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getCatalogDataByToken = async (req, res) => {
  try {
    const restaurant_token = req.params.token;

    const restaurant = await User.findOne({ restaurant_token })
      .select("_id name city logo")  // ← fix: space not comma, add city & logo for branding
      .lean();

    if (!restaurant) {
      return res.status(404).json({ success: false, error: "Restaurant not found" });
    }

    const catalogData = await Catalog.find({
      user_id: restaurant._id,
    }).lean();

    res.json({
      success: true,
      data: catalogData,
      restaurant_name: restaurant.name,
      restaurant_city: restaurant.city || "",
      restaurant_logo: restaurant.logo || "",
    });

  } catch (error) {
    console.error("Error fetching catalog data by token:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getCatalogCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.query;
    const filter = { user_id: userId };

    if (type) {
      filter["items.type"] = type;
    }

    const categories = await Catalog.distinct("category", filter);

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getCatalogCounterOptions = async (req, res) => {
  try {
    const userId = req.user._id;

    const counters = await Catalog.distinct("counter", {
      user_id: userId,
      counter: { $nin: [null, ""] },
    });

    res.json({ success: true, data: counters });
  } catch (error) {
    console.error("Error fetching counters:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getMenuSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { types } = req.query;

    if (!types) {
      return res.status(400).json({
        success: false,
        message: "types query param is required",
      });
    }

    const typeList = types.split(",");
    const result = {};

    const promises = [];

    // CATEGORY suggestions
    if (typeList.includes("category")) {
      promises.push(
        Catalog.distinct("category", {
          user_id: userId,
          category: { $nin: [null, ""] },
        }).then((data) => {
          result.categories = data.sort();
        }),
      );
    }

    // ITEM NAME suggestions
    if (typeList.includes("item")) {
      promises.push(
        Catalog.distinct("items.item_name", {
          user_id: userId,
          "items.item_name": { $nin: [null, ""] },
        }).then((data) => {
          result.items = data.sort();
        }),
      );
    }

    await Promise.all(promises);

    res.json(result);
  } catch (error) {
    console.error("Catalog suggestion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load catalog suggestions",
    });
  }
};

const getItemsByCategory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "category query param is required",
      });
    }

    const items = await Catalog.distinct("items.item_name", {
      user_id: userId,
      category: category,
      "items.item_name": { $nin: [null, ""] },
    });

    res.json({
      success: true,
      data: items.sort(),
    });
  } catch (error) {
    console.error("Get items by category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load items",
    });
  }
};

const getCatalogDataById = async (req, res) => {
  try {
    const dishId = req.params.id;
    const userId = req.user._id;

    const catalog = await Catalog.findOne(
      { user_id: userId, "items._id": dishId },
      { "items.$": 1 }, // only the matched item
    ).lean();

    if (!catalog || !catalog.items || catalog.items.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, data: catalog.items[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateCatalogCategoryAndType = async (req, res) => {
  try {
    const id = req.params.id;

    let { category, counter, hide_on_kot, is_food_category } = req.body;
    const userId = req.user;

    if (counter === "") {
      counter = null;
    }

    if (!hide_on_kot) {
      hide_on_kot = false;
    }

    const updateData = { category, counter, hide_on_kot };
    if (is_food_category !== undefined) {
      updateData.is_food_category = typeof is_food_category === "string" ? is_food_category === "true" : !!is_food_category;
    }

    const updatedMenu = await Catalog.findOneAndUpdate(
      { user_id: userId, _id: id },
      updateData,
      { new: true },
    );

    res.json({ success: true, data: updatedMenu });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A catalog category with this name already exists."
      });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateCatalog = async (req, res) => {
  try {
    const {
      _id,
      item_name,
      item_price,
      description,
      quantity,
      unit,
      is_special,
      is_available,
      hide_on_kot,
      has_variants,
      variants,
      addons,
      type,
      barcode,
    } = req.body;

    const userId = req.user._id;

    let parsedVariants;
    if (variants) {
      if (typeof variants === "string") {
        try {
          parsedVariants = JSON.parse(variants);
        } catch (e) {
          // ignore
        }
      } else if (Array.isArray(variants)) {
        parsedVariants = variants;
      }
    }

    let parsedAddons;
    if (addons) {
      if (typeof addons === "string") {
        try {
          parsedAddons = JSON.parse(addons);
        } catch (e) {
          // ignore
        }
      } else if (Array.isArray(addons)) {
        parsedAddons = addons;
      }
    }

    // Find the current catalog document containing this item
    const currentCatalog = await Catalog.findOne({ user_id: userId, "items._id": _id });
    if (!currentCatalog) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Find the item inside the current catalog
    const currentDishIndex = currentCatalog.items.findIndex(d => d._id.toString() === _id.toString());
    if (currentDishIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found in catalog" });
    }

    const currentDishObj = currentCatalog.items[currentDishIndex].toObject ? currentCatalog.items[currentDishIndex].toObject() : currentCatalog.items[currentDishIndex];

    const updatedDishObj = {
      ...currentDishObj,
      item_name: item_name !== undefined ? item_name : currentDishObj.item_name,
      item_price:
        Array.isArray(parsedVariants) && parsedVariants[0]
          ? Number(parsedVariants[0].price)
          : item_price !== "" && item_price != null
            ? Number(item_price)
            : currentDishObj.item_price,
      barcode: barcode !== undefined ? barcode : (Array.isArray(parsedVariants) && parsedVariants[0] ? parsedVariants[0].barcode : currentDishObj.barcode),
      description: description !== undefined ? description : currentDishObj.description,
      is_special:
        is_special !== undefined
          ? typeof is_special === "string" ? is_special === "true" : !!is_special
          : currentDishObj.is_special,
      is_available:
        is_available !== undefined
          ? typeof is_available === "string" ? is_available === "true" : !!is_available
          : currentDishObj.is_available,
      stock_quantity:
        req.body.stock_quantity !== undefined && req.body.stock_quantity !== "" && req.body.stock_quantity !== null
          ? Number(req.body.stock_quantity)
          : currentDishObj.stock_quantity,
      has_variants:
        Array.isArray(parsedVariants) ? parsedVariants.length > 1 : currentDishObj.has_variants,
      variants: Array.isArray(parsedVariants)
        ? parsedVariants.map((v) => ({
          size_name: v.size_name,
          price: v.price != null && v.price !== "" ? Number(v.price) : 0,
          extra: v.extra,
          barcode: v.barcode || null,
          is_available: v.is_available !== false,
          stock_quantity: v.stock_quantity != null && v.stock_quantity !== "" ? Number(v.stock_quantity) : null,
          initial_stock: v.initial_stock != null ? Number(v.initial_stock) : 0,
        }))
        : currentDishObj.variants,
      addons: Array.isArray(parsedAddons)
        ? parsedAddons.map((a) => ({
          addon_name: a.addon_name,
          price: a.price != null && a.price !== "" ? Number(a.price) : 0,
          is_available: a.is_available !== false,
        }))
        : currentDishObj.addons,
      type: type !== undefined ? type : currentDishObj.type || "veg",
    };

    if (req.file) {
      updatedDishObj.item_img = "/catalog/items/" + req.file.filename;
    }

    const updateFields = {};
    Object.keys(updatedDishObj).forEach(key => {
      if (key !== "_id") {
        updateFields[`items.$.${key}`] = updatedDishObj[key];
      }
    });

    const result = await Catalog.updateOne(
      { user_id: userId, "items._id": _id },
      { $set: updateFields }
    );

    // Update hide_on_kot at the catalog (category) level if provided
    if (hide_on_kot !== undefined && hide_on_kot !== null) {
      const isHideOnKot = typeof hide_on_kot === "string" ? hide_on_kot === "true" : !!hide_on_kot;
      await Catalog.updateOne(
        { user_id: userId, "items._id": _id },
        { $set: { hide_on_kot: isHideOnKot } },
      );
    }

    res.json({ success: true, message: "Item updated", result });
  } catch (error) {
    console.error("Error updating catalog:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const deleteCatalog = async (req, res) => {
  try {
    const userId = req.user._id;
    const dishId = req.params.id;

    const catalog = await Catalog.findOne(
      { user_id: userId, "items._id": dishId },
      { category: 1, items: 1 }, // projection
    );

    if (!catalog) {
      return res.status(404).json({ message: "Item not found" });
    }

    const itemToDelete = catalog.items.find(
      (item) => item._id.toString() === dishId,
    );
    if (!itemToDelete) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Delete item image if exists
    if (itemToDelete.item_img) {
      // item_img = "/catalog/items/filename"
      const filename = path.basename(itemToDelete.item_img);
      const imagePath = path.join(
        __dirname,
        "../uploads/catalog/items",
        filename,
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Deleted image file:", imagePath);
      }
    }

    const updateResult = await Catalog.updateOne(
      { user_id: userId, "items._id": dishId },
      { $pull: { items: { _id: dishId } } },
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Item not found or already deleted" });
    }

    // Delete empty catalog documents for that category
    const updatedMenu = await Catalog.findOne({
      user_id: userId,
      category: catalog.category,
    }).select("items");

    if (updatedMenu && updatedMenu.items.length === 0) {
      await Catalog.deleteOne({
        user_id: userId,
        category: catalog.category,
      });
    }

    res.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error in delete Catalog:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const StockSalesLog = require("../models/stockSalesLogModel");

const deductStockForOrderItems = async (userId, orderItems, orderId, orderType = "Sale") => {
  if (!userId || !Array.isArray(orderItems) || orderItems.length === 0) return;

  try {
    const catalogs = await Catalog.find({ user_id: userId });

    for (const orderItem of orderItems) {
      const itemName = orderItem.item_name || orderItem.name;
      const orderedQty = Number(orderItem.quantity || orderItem.qty || 1);
      const selectedVariant = orderItem.selected_variant ? (orderItem.selected_variant.size_name || orderItem.selected_variant.name || orderItem.selected_variant) : null;

      if (!itemName || orderedQty <= 0) continue;

      for (const catalogDoc of catalogs) {
        let modified = false;
        for (const item of catalogDoc.items) {
          if (item.item_name?.trim().toLowerCase() === itemName.trim().toLowerCase()) {
            if (selectedVariant && Array.isArray(item.variants) && item.variants.length > 0) {
              const variant = item.variants.find(
                (v) => v.size_name?.trim().toLowerCase() === String(selectedVariant).trim().toLowerCase()
              );
              if (variant && variant.stock_quantity !== null && variant.stock_quantity !== undefined) {
                variant.stock_quantity = Math.max(0, variant.stock_quantity - orderedQty);
                if (variant.stock_quantity === 0) {
                  variant.is_available = false;
                }
                modified = true;

                await StockSalesLog.create({
                  user_id: String(userId),
                  item_id: String(item._id),
                  item_name: item.item_name,
                  variant_name: variant.size_name,
                  category: catalogDoc.category,
                  type: 'Sale',
                  quantity_changed: -orderedQty,
                  balance_stock: variant.stock_quantity,
                  order_id: orderId || null,
                  order_type: orderType,
                  remarks: `Sold via ${orderType}`
                });
              }
            } else if (item.stock_quantity !== null && item.stock_quantity !== undefined) {
              item.stock_quantity = Math.max(0, item.stock_quantity - orderedQty);
              if (item.stock_quantity === 0) {
                item.is_available = false;
              }
              modified = true;

              await StockSalesLog.create({
                user_id: String(userId),
                item_id: String(item._id),
                item_name: item.item_name,
                variant_name: '',
                category: catalogDoc.category,
                type: 'Sale',
                quantity_changed: -orderedQty,
                balance_stock: item.stock_quantity,
                order_id: orderId || null,
                order_type: orderType,
                remarks: `Sold via ${orderType}`
              });
            }
          }
        }

        if (modified) {
          await catalogDoc.save();
        }
      }
    }
  } catch (err) {
    console.error("Error deducting stock for order items:", err);
  }
};

const getStockSalesStatement = async (req, res) => {
  try {
    const userId = req.user._id;
    const catalogs = await Catalog.find({ user_id: userId }).lean();
    const logs = await StockSalesLog.find({ user_id: userId }).sort({ createdAt: -1 }).lean();

    const statement = [];

    catalogs.forEach((cat) => {
      (cat.items || []).forEach((item) => {
        if (item.has_variants && Array.isArray(item.variants) && item.variants.length > 0) {
          item.variants.forEach((v) => {
            const itemLogs = logs.filter(
              (l) => l.item_name === item.item_name && l.variant_name === v.size_name
            );
            const totalSold = itemLogs
              .filter((l) => l.type === 'Sale')
              .reduce((sum, l) => sum + Math.abs(l.quantity_changed), 0);

            statement.push({
              _id: `${item._id}_${v.size_name}`,
              item_id: item._id,
              item_name: item.item_name,
              variant_name: v.size_name,
              category: cat.category,
              initial_stock: v.initial_stock || (v.stock_quantity != null ? v.stock_quantity + totalSold : 'Unlimited'),
              current_stock: v.stock_quantity != null ? v.stock_quantity : 'Unlimited',
              total_sold: totalSold,
              status: v.stock_quantity === 0 ? 'Out of Stock' : (v.stock_quantity != null && v.stock_quantity <= 5 ? 'Low Stock' : 'In Stock')
            });
          });
        } else {
          const itemLogs = logs.filter(
            (l) => l.item_name === item.item_name && (!l.variant_name || l.variant_name === '')
          );
          const totalSold = itemLogs
            .filter((l) => l.type === 'Sale')
            .reduce((sum, l) => sum + Math.abs(l.quantity_changed), 0);

          statement.push({
            _id: String(item._id),
            item_id: item._id,
            item_name: item.item_name,
            variant_name: '',
            category: cat.category,
            initial_stock: item.initial_stock || (item.stock_quantity != null ? item.stock_quantity + totalSold : 'Unlimited'),
            current_stock: item.stock_quantity != null ? item.stock_quantity : 'Unlimited',
            total_sold: totalSold,
            status: item.stock_quantity === 0 ? 'Out of Stock' : (item.stock_quantity != null && item.stock_quantity <= 5 ? 'Low Stock' : 'In Stock')
          });
        }
      });
    });

    res.status(200).json({ success: true, data: statement, logs });
  } catch (err) {
    console.error("Error fetching stock sales statement:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  addCatalog,
  getCatalogData,
  getCatalogDataById,
  getCatalogDataByResCode,
  getCatalogDataByToken,
  getCatalogCategories,
  getCatalogCounterOptions,
  getMenuSuggestions,
  getItemsByCategory,
  updateCatalogCategoryAndType,
  updateCatalog,
  deleteCatalog,
  deductStockForOrderItems,
  getStockSalesStatement,
};
