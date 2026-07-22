const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payingEntitySchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    company_name: {
      type: String,
      required: true,
      trim: true,
    },
    bank_name: {
      type: String,
      default: "",
      trim: true,
    },
    account_number: {
      type: String,
      default: "",
      trim: true,
    },
    ifsc_code: {
      type: String,
      default: "",
      trim: true,
    },
    branch_name: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    logo_url: {
      type: String,
      default: "",
    },
    is_default: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

payingEntitySchema.index({ user_id: 1 });

const PayingEntity = mongoose.model("payingEntity", payingEntitySchema);
module.exports = PayingEntity;
