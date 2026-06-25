const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "staff",
    },
    user_id: {
      type: String, // Or ObjectId depending on how it's stored in other models, keeping String to match other schemas
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: String, // Storing as string format YYYY-MM-DD
      required: true,
    },
    description: {
      type: String,
    },
    receipt: {
      type: String, // Path to uploaded file
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Expense", expenseSchema);
