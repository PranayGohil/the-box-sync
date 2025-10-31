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
  email: {
    type: String,
  },
  password: {
    type: String,
  },
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
  feedbackToken: {
    type: String,
  },
  feedbacks: [
    {
      customer_name: { type: String },
      customer_email: { type: String },
      customer_phone: { type: String },
      rating: { type: Number },
      feedback: { type: String },
      date: { type: Date, default: Date.now },
    },
  ],
  purchasedPlan: {
    type: String,
  },
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) {
    next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
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
  } catch (error) {}
};

const User = mongoose.model("users", userSchema);
module.exports = User;
