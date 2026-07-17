const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const cashierSchema = new Schema({
  user_id: {
    type: String,
  },
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  cashier_type: {
    type: String,
    enum: ['qsr', 'dine-in'],
    default: 'qsr',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

cashierSchema.pre("save", async function (next) {
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

const Cashier = mongoose.model("cashier", cashierSchema);
module.exports = Cashier;
