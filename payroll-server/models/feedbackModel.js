const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "staff",
      required: true,
    },
    user_id: {
      type: String, // Company / Tenant ID
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    is_anonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["open", "reviewed", "resolved"],
      default: "open",
    },
    hr_reply: {
      type: String,
      default: "",
    },
    replied_at: {
      type: Date,
      default: null,
    },
    replied_by: {
      type: String,
      default: "",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
