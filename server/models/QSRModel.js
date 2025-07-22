const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const qsrSchema = new Schema({
  restaurant_id: {
    type: String,
  },
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

qsrSchema.pre("save", async function (next) {
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

const QSR = mongoose.model("qsr", qsrSchema);
module.exports = QSR;
