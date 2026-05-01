const mongoose = require("mongoose");

const websiteSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  restaurant_name: String,
  restaurant_address: String,
  logo: String,
  open_days: String, 
  open_time_from: String, 
  open_time_to: String,
  opening_hours: [{
    day: String,
    from: String,
    to: String
  }],
  contact_email: String,
  contact_phone: String,
  featured_dish_ids: [String],
  hero_title: String,
  hero_details: String,
  about_title: String,
  about_details: String,
  about_image: String,
  legacy_years: String,
  contact_details: String,
  testimonials: [{
    name: String,
    text: String,
    role: String,
    rating: Number
  }],
  social_links: [{
    platform: String,
    url: String,
    logo: String
  }],
});

const Website = mongoose.model("website", websiteSchema);
module.exports = Website;
