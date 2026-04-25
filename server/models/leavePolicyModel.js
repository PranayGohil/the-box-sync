const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const leavePolicySchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true, // One policy per tenant
    },
    leave_types: [
      {
        leave_type_id: { type: String, required: true }, // e.g. "casual", "sick"
        name: { type: String, required: true }, // e.g. "Casual Leave"
        short_code: { type: String, required: true }, // e.g. "CL"
        days_per_year: { type: Number, required: true, default: 0 },
        is_paid: { type: Boolean, default: true },
        
        // Accrual rules
        accrual_type: { type: String, enum: ["upfront", "monthly", "quarterly"], default: "upfront" },
        
        // Carry forward rules
        carry_forward: { type: Boolean, default: false },
        max_carry_forward: { type: Number, default: 0 },
        
        // Applicability
        applicable_gender: { type: String, enum: ["all", "male", "female"], default: "all" },
        min_service_months: { type: Number, default: 0 }, // Months before eligible
        
        // Application rules
        requires_approval: { type: Boolean, default: true },
        min_notice_days: { type: Number, default: 0 },
        allow_half_day: { type: Boolean, default: true },
        color: { type: String, default: "#007bff" }, // For calendar UI
        
        is_active: { type: Boolean, default: true }
      }
    ]
  },
  {
    timestamps: true,
  }
);

const LeavePolicy = mongoose.model("leavePolicy", leavePolicySchema);
module.exports = LeavePolicy;
