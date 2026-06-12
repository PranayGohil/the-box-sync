const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const assetRequestSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    staff_id: {
      type: Schema.Types.ObjectId,
      ref: "staff",
      required: true,
      index: true,
    },
    asset_name: {
      type: String,
      required: true,
    },
    asset_type: {
      type: String,
      default: "other",
    },
    reason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
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
assetRequestSchema.index({ user_id: 1, staff_id: 1 });

const AssetRequest = mongoose.model("assetRequest", assetRequestSchema);
module.exports = AssetRequest;
