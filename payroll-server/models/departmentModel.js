const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const departmentSchema = new Schema(
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
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "branch",
      default: null,
    },
    is_global: {
      type: Boolean,
      default: false,
    },
    structure: {
      type: [{
        node_id: { type: String, required: true },
        name: { type: String, required: true },
        parent_id: { type: String, default: null }
      }],
      default: []
    }
  },
  { timestamps: true }
);

// Indexes for faster lookups
departmentSchema.index({ user_id: 1 });
departmentSchema.index({ user_id: 1, name: 1 });

const Department = mongoose.model("department", departmentSchema);
module.exports = Department;
