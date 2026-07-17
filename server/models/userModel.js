const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new Schema({
  restaurant_code: {
    type: String,
  },
  name: {
    type: String,
  },
  logo: {
    type: String,
  },
  gst_no: {
    type: String,
  },
  fssai_no: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
      type: String,
      select: false,
    },
    passwordChangedAt: Date,
  mobile: {
    type: Number,
  },
  address: {
    type: String,
  },
  country: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  pincode: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  otp: {
    type: Number,
  },
  otpExpiry: {
    type: Date,
  },
  taxInfo: {
    cgst: {
      type: Number,
      required: true,
      default: 0,
    },
    sgst: {
      type: Number,
      required: true,
      default: 0,
    },
    vat: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  containerCharges: [
    {
      name: { type: String, default: "", required: true },
      size: { type: String, default: "", required: true }, // e.g., "500ml", "1kg", "10 pieces"
      price: { type: Number, default: 0, required: true },
    },
  ],
  restaurant_token: {
    type: String,
    default: null,
  },
  feedbacks: [
    {
      customer_name: { type: String },
      customer_email: { type: String },
      customer_phone: { type: String },
      rating: { type: Number },
      feedback: { type: String },
      date: { type: Date, default: Date.now },
      order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'order', default: null },
    },
  ],
  purchasedPlan: {
    type: String,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  approvalDetails: {
    price: { type: Number },
    discount: { type: Number },
    paymentMode: { type: String }, // e.g., Cash, Bank Transfer, UPI
    paymentDetails: { type: String }, // e.g., Transaction ID
    approvedAt: { type: Date }
  },
  is_street_food: {
    type: Boolean,
    default: false,
  },
  printSettings: {
    showLogo: {
      type: Boolean,
      default: true,
    },
    showGst: {
      type: Boolean,
      default: true,
    },
    showCustomerDetails: {
      type: Boolean,
      default: true,
    },
    footerNote: {
      type: String,
      default: "Thanks, Visit Again",
    },
    headerNote: {
      type: String,
      default: "",
    },
    paperWidth: {
      type: String,
      default: "58mm",
    },
    addQrCode: {
      type: Boolean,
      default: false,
    },
    qrTargetType: {
      type: String,
      default: "feedback",
    },
    qrUrl: {
      type: String,
      default: "",
    },
    qrTitle: {
      type: String,
      default: "",
    },
    showFssai: {
      type: Boolean,
      default: true,
    },
  },
});

// userModel.js

// Email: used in emailCheck, login, OTP, reset, etc.
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// Restaurant code: used in getUserDataByCode + should be unique
userSchema.index({ restaurant_code: 1 }, { unique: true, sparse: true });

// For register: you query by country + state and sort by createdAt
userSchema.index({ country: 1, state: 1, createdAt: -1 });

// Optional: if you search by mobile anywhere
// userSchema.index({ mobile: 1 }, { sparse: true });

// Optional: if you use restaurant_token in links
userSchema.index({ restaurant_token: 1 }, { unique: true, sparse: true });

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
    user.passwordChangedAt = new Date(Date.now() - 1000);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.generateAuthToken = async function (role) {
  try {
    const user = this;
    const token = jwt.sign(
      { _id: user._id.toString(), Role: role },
      process.env.JWT_SECRETKEY,
      { expiresIn: "30d" }
    );
    return token;
  } catch (error) {
    console.error("Error in generateAuthToken:", error);
  }
};

const User = mongoose.model("users", userSchema);
module.exports = User;
