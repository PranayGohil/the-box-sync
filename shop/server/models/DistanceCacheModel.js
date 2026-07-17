const mongoose = require("mongoose");

const distanceCacheSchema = new mongoose.Schema({
  restaurant_id: { 
    type: String, 
    required: true 
  },
  customer_place_id: { 
    type: String, 
    required: true 
  },
  road_distance: { 
    type: Number, 
    required: true 
  }, // in km
  duration: { 
    type: String 
  }, // human-readable duration description
  calculated_at: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound unique index to make queries extremely fast
distanceCacheSchema.index({ restaurant_id: 1, customer_place_id: 1 }, { unique: true });

const DistanceCache = mongoose.model("DistanceCache", distanceCacheSchema);
module.exports = DistanceCache;
