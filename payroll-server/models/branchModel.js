const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const branchSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

// Indexes for faster lookups
branchSchema.index({ user_id: 1 });
branchSchema.index({ user_id: 1, name: 1 });

const Branch = mongoose.model("branch", branchSchema);
module.exports = Branch;
