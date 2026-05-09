const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const superAdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["Owner", "Staff"],
      default: "Staff",
    },
  },
  { timestamps: true }
);

// Hash password before saving
superAdminSchema.pre("save", async function (next) {
  const admin = this;
  if (!admin.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(admin.password, salt);
    admin.password = hash;
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
superAdminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const SuperAdmin = mongoose.model("superAdmin", superAdminSchema);
module.exports = SuperAdmin;
