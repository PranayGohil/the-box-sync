const Inventory = require("../models/inventoryModel");
const Notification = require("../models/notificationModel");

const getInventoryData = async (req, res) => {
  try {
    const userId = req.user;
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const projection = {
      request_date: 1,
      bill_date: 1,
      bill_number: 1,
      vendor_name: 1,
      category: 1,
      total_amount: 1,
      paid_amount: 1,
      unpaid_amount: 1,
      status: 1,
      items: 1,
      bill_files: 1,
      // omit items & bill_files if listing table doesn’t need them
    };

    const [data, total] = await Promise.all([
      Inventory.find({ user_id: userId })
        .select(projection)
        .sort({ request_date: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Inventory.countDocuments({ user_id: userId }),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getInventoryDataByStatus = async (req, res) => {
  try {
    const userId = req.user;
    const { status } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      request_from,  // NEW: Request date from
      request_to,    // NEW: Request date to
      bill_from,     // NEW: Bill date from
      bill_to        // NEW: Bill date to
    } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const query = { user_id: userId, status };

    // NEW: Request Date Range Filter
    if (request_from || request_to) {
      query.request_date = {};
      if (request_from) {
        query.request_date.$gte = new Date(request_from);
      }
      if (request_to) {
        const toDate = new Date(request_to);
        toDate.setHours(23, 59, 59, 999); // Include entire day
        query.request_date.$lte = toDate;
      }
    }

    // NEW: Bill Date Range Filter
    if (bill_from || bill_to) {
      query.bill_date = {};
      if (bill_from) {
        query.bill_date.$gte = new Date(bill_from);
      }
      if (bill_to) {
        const toDate = new Date(bill_to);
        toDate.setHours(23, 59, 59, 999); // Include entire day
        query.bill_date.$lte = toDate;
      }
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp("^" + search, "i"); // Prefix search for better index usage

      if (status === "Requested" || status === "Rejected") {
        // For Requested status, search in items array as well
        query.$or = [
          { bill_number: searchRegex },
          { vendor_name: searchRegex },
          { category: searchRegex },
          { "items.item_name": searchRegex }, // Search in item names
        ];
      } else {
        // For Completed and Rejected status
        query.$or = [
          { bill_number: searchRegex },
          { vendor_name: searchRegex },
          { category: searchRegex },
        ];
      }
    }

    const projection = {
      request_date: 1,
      bill_date: 1,
      bill_number: 1,
      vendor_name: 1,
      category: 1,
      total_amount: 1,
      paid_amount: 1,
      unpaid_amount: 1,
      status: 1,
      items: 1,
      reject_reason: 1,
    };

    const [data, total] = await Promise.all([
      Inventory.find(query)
        .select(projection)
        .sort({ request_date: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Inventory.countDocuments(query),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getInventoryDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;

    const data = await Inventory.findOne({ _id: id, user_id: userId }).lean();

    if (!data) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getInventorySuggestions = async (req, res) => {
  try {
    const userId = req.user;
    const { types } = req.query;

    if (!types) {
      return res.status(400).json({
        success: false,
        message: "types query param is required",
      });
    }

    const typeList = types.split(","); // vendor,item,category

    const tasks = {};
    const promises = [];

    if (typeList.includes("vendor")) {
      promises.push(
        Inventory.distinct("vendor_name", {
          user_id: userId,
          vendor_name: { $nin: [null, ""] },
        }).then((data) => (tasks.vendors = data.sort()))
      );
    }

    if (typeList.includes("category")) {
      promises.push(
        Inventory.distinct("category", {
          user_id: userId,
          category: { $nin: [null, ""] },
        }).then((data) => (tasks.categories = data.sort()))
      );
    }

    if (typeList.includes("item")) {
      promises.push(
        Inventory.distinct("items.item_name", {
          user_id: userId,
          "items.item_name": { $nin: [null, ""] },
        }).then((data) => (tasks.items = data.sort()))
      );
    }

    await Promise.all(promises);

    res.json(tasks);
  } catch (error) {
    console.error("Suggestion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load suggestions",
    });
  }
};

const addInventory = async (req, res) => {
  try {
    const userId = req.user;
    const fileNames = (req.files || []).map(
      (file) => `/inventory/bills/${file.filename}`
    );

    let items = req.body.items;
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (err) {
        return res.status(400).json({ error: "Invalid items format" });
      }
    }

    const inventoryData = {
      ...req.body,
      user_id: userId,
      bill_files: fileNames,
      items,
      // Ensure numeric fields are properly converted
      sub_total: Number(req.body.sub_total) || 0,
      tax: Number(req.body.tax) || 0,
      discount: Number(req.body.discount) || 0,
      total_amount: Number(req.body.total_amount) || 0,
      paid_amount: Number(req.body.paid_amount) || 0,
      unpaid_amount: Number(req.body.unpaid_amount) || 0,
    };

    const data = await Inventory.create(inventoryData);
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const addInventoryRequest = async (req, res) => {
  try {
    let { items, ...rest } = req.body;
    const user = req.user; // assuming auth middleware attaches user object

    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (err) {
        console.error("Error parsing items:", err);
        return res.status(400).json({ error: "Invalid items format" });
      }
    }

    const inventoryData = {
      ...rest,
      user_id: user._id || user,
      items,
      status: "Requested",
    };

    const data = await Inventory.create(inventoryData);

    const io = req.app.get("io");
    const connectedUsers = req.app.get("connectedUsers");

    const adminKey = `${user._id}_Admin`; // or however you store admin socket
    if (io && connectedUsers && connectedUsers[adminKey]) {
      const notification = await Notification.create({
        restaurant_id: user._id,
        sender: "Manager",
        receiver: "Admin",
        type: "new_inventory_request",
        data: {
          _id: data._id,
          category: data.category,
          total_amount: data.total_amount,
          request_date: data.request_date,
        },
      });
      io.to(connectedUsers[adminKey]).emit(
        "new_inventory_request",
        notification
      );
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const updateInventory = async (req, res) => {
  const { id } = req.params;
  const userId = req.user;
  const updatedData = { ...req.body };

  try {
    if (typeof updatedData.items === "string") {
      updatedData.items = JSON.parse(updatedData.items);
    }

    if (req.files && req.files.length > 0) {
      updatedData.bill_files = req.files.map(
        (file) => `/inventory/bills/${file.filename}`
      );
    }

    // 🔥 NEW: Added sub_total, tax, and discount to allowed fields
    const allowedFields = [
      "bill_date",
      "bill_number",
      "vendor_name",
      "category",
      "sub_total",
      "tax",
      "discount",
      "total_amount",
      "paid_amount",
      "unpaid_amount",
      "items",
      "status",
      "bill_files",
    ];

    const safeUpdate = {};
    allowedFields.forEach((field) => {
      if (updatedData[field] !== undefined) {
        // 🔥 Ensure numeric fields are properly converted
        if (["sub_total", "tax", "discount", "total_amount", "paid_amount", "unpaid_amount"].includes(field)) {
          safeUpdate[field] = Number(updatedData[field]) || 0;
        } else {
          safeUpdate[field] = updatedData[field];
        }
      }
    });

    const updatedInventory = await Inventory.findOneAndUpdate(
      { _id: id, user_id: userId },
      safeUpdate,
      { new: true, runValidators: true }
    );

    if (!updatedInventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: updatedInventory,
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update inventory",
      error,
    });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const userId = req.user;

    const result = await Inventory.deleteOne({
      _id: inventoryId,
      user_id: userId,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found" });
    }

    res.json({ success: true, message: "Inventory deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const completeInventoryRequest = async (req, res) => {
  try {
    const {
      _id,
      request_date,
      bill_date,
      bill_number,
      vendor_name,
      category,
      sub_total,
      tax,
      discount,
      total_amount,
      paid_amount,
      unpaid_amount,
    } = req.body;

    let items = req.body.items;
    let remainingItems = req.body.remainingItems;

    if (typeof items === "string") items = JSON.parse(items);
    if (typeof remainingItems === "string")
      remainingItems = JSON.parse(remainingItems);

    const bill_files = (req.files || []).map(
      (file) => `/inventory/bills/${file.filename}`
    );

    const inventory = await Inventory.findById(_id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    if (remainingItems.length === 0) {
      await Inventory.findByIdAndDelete(_id);
    } else {
      inventory.items = remainingItems;
      await inventory.save();
    }

    const completedItems = {
      request_date,
      bill_date,
      bill_number,
      vendor_name,
      category,
      bill_files,
      sub_total: Number(sub_total) || 0,
      tax: Number(tax) || 0,
      discount: Number(discount) || 0,
      total_amount: Number(total_amount) || 0,
      paid_amount: Number(paid_amount) || 0,
      unpaid_amount: Number(unpaid_amount) || 0,
      items,
      status: "Completed",
      user_id: inventory.user_id,
    };

    await Inventory.create(completedItems);

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating inventory", error });
  }
};

const rejectInventoryRequest = async (req, res) => {
  const id = req.params.id;
  const userId = req.user;
  const { reject_reason } = req.body;

  try {
    const inventory = await Inventory.findOneAndUpdate(
      { _id: id, user_id: userId },
      { status: "Rejected", reject_reason },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Inventory updated successfully" });
  } catch (error) {
    console.error("Error updating inventory:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating inventory", error });
  }
};

module.exports = {
  getInventoryData,
  getInventoryDataByStatus,
  getInventoryDataById,
  getInventorySuggestions,
  addInventory,
  addInventoryRequest,
  updateInventory,
  deleteInventory,
  completeInventoryRequest,
  rejectInventoryRequest,
};
