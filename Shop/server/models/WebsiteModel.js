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
  featured_item_ids: [String],
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
  legacy_layout: { type: String, default: 'image-right' },
  legacy_bullets: [{
    icon: String,
    label: String
  }],
  contact_details: String,
  contact_title: String,
  contact_subtitle: String,
  map_location: String,
  place_id: String,
  formatted_address: String,
  latitude: Number,
  longitude: Number,
  city: String,
  state: String,
  country: String,
  postal_code: String,
  locality: String,
  sublocality: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  delivery: {
    enabled: { type: Boolean, default: false },
    max_distance: { type: Number, default: 0 },
    minimum_order: { type: Number, default: 0 },
    free_radius: { type: Number, default: 0 },
    charge_type: { type: String, enum: ['free', 'fixed', 'distance_based'], default: 'free' },
    fixed_charge: { type: Number, default: 0 },
    slabs: [{
      from_km: Number,
      to_km: Number,
      charge: Number
    }]
  },
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
  show_reservation: { type: Boolean, default: true },
});

websiteSchema.index({ location: "2dsphere" });

const Website = mongoose.model("website", websiteSchema);
module.exports = Website;
