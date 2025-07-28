const Inventory = require("../models/inventoryModel");

const getInventoryData = (req, res) => {
  try {
    Inventory.find({ restaurant_id: req.user })
      .then((data) => {
        res.json(data);
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
    console.log(req.body);
    const inventoryData = { ...req.body, restaurant_id: req.user };
    Inventory.create(inventoryData)
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const updateInventory = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    // Find the inventory item by ID and update it with the new data
    const updatedInventory = await Inventory.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validators for updated fields
      }
    );

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
  const { _id, bill_images, items, remainingItems, ...updateData } = req.body;
  console.log("Completed inventory request", req.body);

  try {
    const inventory = await Inventory.findById(_id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    if (remainingItems.length === 0) {
      // All items completed → delete inventory
      await Inventory.findByIdAndDelete(_id);
      console.log("Inventory deleted because no remaining items");
    } else {
      // Some items remaining → update inventory
      inventory.items = remainingItems;
      console.log("Updating inventory with remaining items:", remainingItems);
      await inventory.save();
    }

    // Always add completed items as a new completed record
    const completedItems = {
      ...updateData,
      bill_images,
      items,
      status: "Completed",
    };
    console.log("Creating completed inventory record:", completedItems);
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
  getInventoryDataById,
  addInventory,
  updateInventory,
  deleteInventory,
  completeInventoryRequest,
  rejectInventoryRequest,
};
