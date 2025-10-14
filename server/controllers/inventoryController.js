const Inventory = require("../models/inventoryModel");

const getInventoryData = (req, res) => {
  try {
    Inventory.find({ user_id: req.user })
      .then((data) => {
        res.json(data);
      })
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getInventoryDataByStatus = (req, res) => {
  try {
    const status = req.params.status;
    Inventory.find({ user_id: req.user, status: status })
      .then((data) => {
        res.json({ data, success: true });
      })
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getInventoryDataById = (req, res) => {
  try {
    const inventoryId = req.params.id;
    Inventory.findOne({ _id: inventoryId })
      .then((data) => {
        res.json(data);
      })
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const addInventory = (req, res) => {
  try {
    const fileNames = req.files.map(file => file.filename); // or originalname if needed

    const inventoryData = {
      ...req.body,
      user_id: req.user, // from verifyToken middleware
      bill_files: "/inventory/bills/" + fileNames,
      items: JSON.parse(req.body.items), // convert string back to array
    };

    Inventory.create(inventoryData)
      .then((data) => res.json(data))
      .catch((err) => res.status(500).json(err));
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const addInventoryRequest = async (req, res) => {
  try {
    let { items, ...rest } = req.body;

    // Handle case where items is sent as a JSON string inside FormData
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
      user_id: req.user, // assuming req.user contains restaurant id
      items,
    };

    const data = await Inventory.create(inventoryData);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const editInventoryRequest = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;

    const data = await Inventory.findByIdAndUpdate(id, updatedData, { new: true });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}


const updateInventory = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    // ✅ Parse items from string to array (only if it's a string)
    if (typeof updatedData.items === 'string') {
      updatedData.items = JSON.parse(updatedData.items);
    }

    // ✅ Optionally handle new file uploads
    if (req.files && req.files.length > 0) {
      updatedData.bill_files = "/inventory/bills/" + req.files.map(file => file.filename); // Normalize paths
    }

    const updatedInventory = await Inventory.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedInventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({
      message: "Inventory updated successfully",
      data: updatedInventory,
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).json({ message: "Failed to update inventory", error });
  }
};


const deleteInventory = (req, res) => {
  try {
    const inventoryId = req.params.id; // This is the inventory ID you want to delete
    Inventory.deleteOne({ _id: inventoryId })
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred");
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

    // ✅ Parse JSON arrays
    const items = JSON.parse(req.body.items);
    const remainingItems = JSON.parse(req.body.remainingItems);

    // ✅ File names
    const bill_files = req.files.map(file => "/inventory/bills/" + file.filename);

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

    // ✅ Create completed inventory
    const completedItems = {
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

    res.status(200).json({ message: "Inventory updated successfully" });
  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).json({ message: "Error updating inventory", error });
  }
};


const rejectInventoryRequest = async (req, res) => {
  const id = req.params.id;
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      id,
      { status: "Rejected" },
      { new: true }
    );
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }
    res.status(200).json({ message: "Inventory updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating inventory", error });
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
