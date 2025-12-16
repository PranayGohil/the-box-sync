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
    const { page = 1, limit = 20 } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const query = { user_id: userId, status };

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

    // Only allow these fields to be updated
    const allowedFields = [
      "bill_date",
      "bill_number",
      "vendor_name",
      "category",
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
        safeUpdate[field] = updatedData[field];
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
      bill_date,
      bill_number,
      vendor_name,
      category,
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
      request_date: new Date(),
      bill_date,
      bill_number,
      vendor_name,
      category,
      bill_files,
      total_amount,
      paid_amount,
      unpaid_amount,
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
  addInventory,
  addInventoryRequest,
  updateInventory,
  deleteInventory,
  completeInventoryRequest,
  rejectInventoryRequest,
};
