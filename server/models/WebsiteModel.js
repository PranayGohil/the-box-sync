const mongoose = require("mongoose");

const websiteSchema = new mongoose.Schema({
  restaurant_id: { type: String, required: true, unique: true },
  restaurant_name: String,
  restaurant_address: String,
  logo: String,
  open_days: String, 
  open_time_from: String, 
  open_time_to: String,
  contact_email: String,
  contact_phone: String,
  featured_dish_ids: [String],
});

const Website = mongoose.model("website", websiteSchema);
module.exports = Website;
