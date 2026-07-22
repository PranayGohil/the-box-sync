const PayingEntity = require("../models/payingEntityModel");
const Staff = require("../models/staffModel");

// Create a new paying entity
exports.createEntity = async (req, res) => {
  try {
    const { company_name, bank_name, account_number, ifsc_code, branch_name, address, logo_url, is_default } = req.body;
    const user_id = req.user._id;

    if (!company_name) {
      return res.status(400).json({ success: false, message: "Company name is required" });
    }

    if (is_default) {
      await PayingEntity.updateMany({ user_id }, { is_default: false });
    }

    const newEntity = new PayingEntity({
      user_id,
      company_name,
      bank_name,
      account_number,
      ifsc_code,
      branch_name,
      address,
      logo_url,
      is_default: !!is_default,
    });

    await newEntity.save();

    res.status(201).json({ success: true, message: "Paying entity created successfully", data: newEntity });
  } catch (error) {
    console.error("Error creating paying entity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get all paying entities for logged in user
exports.getEntities = async (req, res) => {
  try {
    const user_id = req.user._id;
    const entities = await PayingEntity.find({ user_id }).sort({ is_default: -1, createdAt: 1 });
    res.status(200).json({ success: true, data: entities });
  } catch (error) {
    console.error("Error fetching paying entities:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update a paying entity
exports.updateEntity = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user._id;
    const { company_name, bank_name, account_number, ifsc_code, branch_name, address, logo_url, is_default } = req.body;

    if (is_default) {
      await PayingEntity.updateMany({ user_id }, { is_default: false });
    }

    const entity = await PayingEntity.findOneAndUpdate(
      { _id: id, user_id },
      { company_name, bank_name, account_number, ifsc_code, branch_name, address, logo_url, is_default: !!is_default },
      { new: true }
    );

    if (!entity) {
      return res.status(404).json({ success: false, message: "Paying entity not found" });
    }

    res.status(200).json({ success: true, message: "Paying entity updated successfully", data: entity });
  } catch (error) {
    console.error("Error updating paying entity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete a paying entity
exports.deleteEntity = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user._id;

    const entity = await PayingEntity.findOneAndDelete({ _id: id, user_id });
    if (!entity) {
      return res.status(404).json({ success: false, message: "Paying entity not found" });
    }

    // Unassign staff referencing this paying entity
    await Staff.updateMany({ paying_entity_id: id }, { $unset: { paying_entity_id: 1 } });

    res.status(200).json({ success: true, message: "Paying entity deleted successfully" });
  } catch (error) {
    console.error("Error deleting paying entity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
