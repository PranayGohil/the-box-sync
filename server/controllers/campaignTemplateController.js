const CampaignTemplate = require("../models/campaignTemplateModel");

// Create/Add a new campaign template
const saveTemplate = async (req, res) => {
  try {
    const user_id = req.user._id ? req.user._id.toString() : req.user.toString();
    const { name, campaignName, messageText } = req.body;

    if (!name || !messageText) {
      return res.status(400).json({ success: false, message: "Template name and message content are required" });
    }

    const newTemplate = new CampaignTemplate({
      user_id,
      name,
      campaignName,
      messageText,
    });

    await newTemplate.save();
    return res.status(201).json({ success: true, data: newTemplate, message: "Template saved successfully" });
  } catch (error) {
    console.error("Error saving campaign template:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get all campaign templates for the tenant
const getTemplates = async (req, res) => {
  try {
    const user_id = req.user._id ? req.user._id.toString() : req.user.toString();
    const templates = await CampaignTemplate.find({ user_id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: templates });
  } catch (error) {
    console.error("Error fetching campaign templates:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete a campaign template
const deleteTemplate = async (req, res) => {
  try {
    const user_id = req.user._id ? req.user._id.toString() : req.user.toString();
    const { id } = req.params;

    const template = await CampaignTemplate.findOneAndDelete({ _id: id, user_id });
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    return res.status(200).json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign template:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  saveTemplate,
  getTemplates,
  deleteTemplate,
};
