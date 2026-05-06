const mongoose = require("mongoose");

const websiteSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  restaurant_id: { type: String, unique: true },
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
  hero_subtitle: String,
  hero_details: String,
  hero_image: String,
  about_title: String,
  about_details: String,
  about_image: String,
  legacy_title: String,
  legacy_details: String,
  legacy_image: String,
  legacy_years: String,
  contact_details: String,
  map_location: String,
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
