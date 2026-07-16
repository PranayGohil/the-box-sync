const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const campaignTemplateSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  campaignName: { type: String, default: "" },
  messageText: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("campaign_template", campaignTemplateSchema);
