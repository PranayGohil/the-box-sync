const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const assetSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    asset_type: {
      type: String,
      default: "other",
    },
    serial_number: {
      type: String,
      default: "",
    },
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: "staff",
      default: null,
    },
    assigned_date: {
      type: Date,
      default: null,
    },
    return_date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["available", "assigned", "damaged", "lost"],
      default: "available",
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
assetSchema.index({ user_id: 1, status: 1 });

const Asset = mongoose.model("asset", assetSchema);
module.exports = Asset;
